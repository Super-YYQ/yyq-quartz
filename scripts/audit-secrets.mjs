#!/usr/bin/env node
/**
 * Scan public content and site scripts for likely secrets (redacted output).
 * Exit 1 on high-confidence secrets.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const SCAN_ROOTS = ["content", "scripts"];
const EXTRA_FILES = [
  "quartz.config.yaml",
  "SETUP.md",
  "MIGRATION_NOTES.md",
  "package.json",
];
const TEXT_EXT = new Set([
  ".md",
  ".yml",
  ".yaml",
  ".json",
  ".js",
  ".mjs",
  ".ts",
  ".ps1",
  ".txt",
  ".html",
  ".css",
]);

const patterns = [
  { id: "openai-sk", re: /\bsk-[A-Za-z0-9]{20,}\b/g, severity: "high" },
  {
    id: "github-pat",
    re: /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/g,
    severity: "high",
  },
  {
    id: "private-key",
    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    severity: "high",
  },
  { id: "aws-access-key", re: /\bAKIA[0-9A-Z]{16}\b/g, severity: "high" },
  {
    id: "bearer-token",
    re: /\bBearer\s+[A-Za-z0-9._\-]{20,}\b/gi,
    severity: "medium",
  },
  {
    id: "assignment-secret",
    re: /(?:api[_-]?key|token|secret|password|passwd|client_secret)\s*[:=]\s*['"][^'"\s]{12,}['"]/gi,
    severity: "medium",
  },
];

function listFiles() {
  const files = [];
  for (const rel of SCAN_ROOTS) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    walk(abs, files);
  }
  for (const rel of EXTRA_FILES) {
    const abs = path.join(root, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) files.push(abs);
  }
  return files;
}

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walk(full, out);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (TEXT_EXT.has(ext)) out.push(full);
  }
}

function redact(value) {
  if (value.length <= 8) return "<REDACTED>";
  return `${value.slice(0, 3)}***${value.slice(-2)} (len=${value.length})`;
}

const findings = [];
for (const file of listFiles()) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const p of patterns) {
      p.re.lastIndex = 0;
      const match = line.match(p.re);
      if (!match) continue;
      if (
        /<QUARTZ_PUBLISH_SECRET>|secrets\.[A-Z0-9_]+|publish:\s*true|password generator|\{PASSWORD\}|zd_token=/i.test(
          line,
        )
      ) {
        continue;
      }
      findings.push({
        file: rel,
        line: i + 1,
        id: p.id,
        severity: p.severity,
        sample: redact(match[0]),
      });
    }
  }
}

if (findings.length === 0) {
  console.log("audit-secrets: no high/medium confidence secrets found.");
  process.exit(0);
}

const high = findings.filter((f) => f.severity === "high");
for (const f of findings) {
  console.log(
    `[${f.severity}] ${f.file}:${f.line} ${f.id} sample=${f.sample}`,
  );
}
if (high.length > 0) {
  console.error(`audit-secrets: ${high.length} high-severity finding(s).`);
  process.exit(1);
}
console.log(
  `audit-secrets: ${findings.length} medium finding(s); review recommended.`,
);
process.exit(0);
