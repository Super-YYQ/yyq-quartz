#!/usr/bin/env node
/**
 * Validate frontmatter of published content under content/.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "content");
const errors = [];
const warnings = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  return m ? m[1] : null;
}

for (const file of walk(root)) {
  const rel = path.relative(process.cwd(), file).replaceAll("\\", "/");
  const text = fs.readFileSync(file, "utf8");
  const fm = parseFrontmatter(text);
  if (fm == null) {
    errors.push(`${rel}: missing frontmatter`);
    continue;
  }

  const publishLines = fm
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("publish:"));

  if (publishLines.length === 0) {
    warnings.push(`${rel}: no publish field (explicit-publish may drop it)`);
  }
  for (const line of publishLines) {
    if (!/^publish:\s*(true|false)\s*$/.test(line)) {
      errors.push(`${rel}: publish must be strict boolean (${line})`);
    }
  }
}

for (const w of warnings) console.warn(`WARN ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
if (errors.length > 0) {
  console.error(`validate-frontmatter: ${errors.length} error(s).`);
  process.exit(1);
}
console.log(
  `validate-frontmatter: ok (${warnings.length} warning(s), 0 errors).`,
);
