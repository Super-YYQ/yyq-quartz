#!/usr/bin/env node
/**
 * Check markdown and wikilinks inside content/ against the published note set.
 */
import fs from "node:fs";
import path from "node:path";

const contentRoot = path.join(process.cwd(), "content");
const errors = [];
const warnings = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function slugFromFile(file) {
  return path
    .relative(contentRoot, file)
    .replaceAll("\\", "/")
    .replace(/\.md$/, "");
}

const files = walk(contentRoot);
const slugSet = new Set(files.map(slugFromFile));
const byBasename = new Map();
for (const slug of slugSet) {
  const base = slug.split("/").pop();
  if (!byBasename.has(base)) byBasename.set(base, []);
  byBasename.get(base).push(slug);
}

function resolveWiki(target, fromSlug) {
  const clean = target.split("|")[0].split("#")[0].trim();
  if (!clean) return true;
  if (slugSet.has(clean)) return true;
  // shortest-path style: basename match
  const base = clean.split("/").pop();
  const hits = byBasename.get(base) || [];
  if (hits.length === 1) return true;
  if (hits.length > 1) {
    warnings.push(`${fromSlug}: ambiguous wikilink [[${clean}]] -> ${hits.join(", ")}`);
    return true;
  }
  // relative to current folder
  const dir = fromSlug.includes("/")
    ? fromSlug.slice(0, fromSlug.lastIndexOf("/"))
    : "";
  const rel = path.posix.normalize(dir ? `${dir}/${clean}` : clean);
  if (slugSet.has(rel)) return true;
  return false;
}

for (const file of files) {
  const slug = slugFromFile(file);
  const text = fs.readFileSync(file, "utf8");

  for (const m of text.matchAll(/\[\[([^\]]+)\]\]/g)) {
    const target = m[1];
    if (!resolveWiki(target, slug)) {
      // Public notes may intentionally mention private notes; do not fail build.
      warnings.push(
        `${slug}: wikilink target not in published set [[${target.split("|")[0].split("#")[0].trim()}]]`,
      );
    }
  }

  for (const m of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let href = m[1].trim();
    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("#")
    ) {
      continue;
    }
    href = decodeURIComponent(href.split("#")[0].split("?")[0]);
    if (!href) continue;
    if (href.startsWith("/")) {
      const key = href.replace(/^\//, "").replace(/\.md$/, "");
      if (key === "tags" || key === "") continue;
      if (!slugSet.has(key) && !slugSet.has(key.replace(/\/$/, ""))) {
        // allow folder-ish unresolved for now as warning
        warnings.push(`${slug}: markdown link may be missing (${href})`);
      }
      continue;
    }
    // relative .md
    const dir = path.posix.dirname(slug);
    const rel = path.posix
      .normalize(path.posix.join(dir === "." ? "" : dir, href))
      .replace(/^\.\//, "")
      .replace(/\.md$/, "");
    if (!slugSet.has(rel)) {
      warnings.push(`${slug}: relative markdown link may be missing (${href})`);
    }
  }
}

// index hrefs (also covered by validate-public-content, keep consistent)
const index = path.join(contentRoot, "index.md");
if (fs.existsSync(index)) {
  const text = fs.readFileSync(index, "utf8");
  for (const m of text.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (!href.startsWith("/") || href === "/" || href === "/tags") continue;
    const key = decodeURIComponent(href.slice(1));
    if (!slugSet.has(key)) {
      errors.push(`index.md: dead href ${href}`);
    }
  }
}

for (const w of warnings) console.warn(`WARN ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
if (errors.length > 0) {
  console.error(`check-links: ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`check-links: ok (${warnings.length} warning(s), 0 errors).`);
