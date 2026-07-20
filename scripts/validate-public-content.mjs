#!/usr/bin/env node
/**
 * Validate that published content does not reference private paths or secrets.
 * Also ensures homepage internal links resolve to published markdown pages.
 */
import fs from "node:fs"
import path from "node:path"

const contentRoot = path.join(process.cwd(), "content")
const errors = []
const warnings = []

const PRIVATE_REF =
  /(?:^|[\s("'`\[])(?:_assets-private|_private\/|(?:\.\/)?tmp\/|(?:\.\/)?\.planning\/|(?:\.\/)?\.obsidian\/)/i
const ABS_PATH = /(?:[A-Za-z]:\\|\/Users\/|\/home\/)[^\s"'`)]+/g
const SECRETish = /\b(?:sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g

const ALLOWED_ROUTES = new Set(["/", "/tags"])

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, out)
      continue
    }
    if (entry.isFile()) out.push(full)
  }
  return out
}

function publishedSlugs() {
  const slugs = new Set()
  for (const file of walk(contentRoot)) {
    if (!file.endsWith(".md")) continue
    const rel = path.relative(contentRoot, file).replaceAll("\\", "/")
    slugs.add(rel.replace(/\.md$/, ""))
  }
  return slugs
}

const slugs = publishedSlugs()
const files = walk(contentRoot)

// Non-markdown under content is currently unexpected (attachments not synced)
for (const file of files) {
  const rel = path.relative(process.cwd(), file).replaceAll("\\", "/")
  if (!file.endsWith(".md")) {
    warnings.push(`${rel}: non-markdown asset present under content/`)
  }
}

for (const file of files.filter((f) => f.endsWith(".md"))) {
  const rel = path.relative(process.cwd(), file).replaceAll("\\", "/")
  const text = fs.readFileSync(file, "utf8")
  const lines = text.split(/\r?\n/)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (PRIVATE_REF.test(line)) {
      errors.push(`${rel}:${i + 1}: references private path pattern`)
    }
    SECRETish.lastIndex = 0
    if (SECRETish.test(line)) {
      errors.push(`${rel}:${i + 1}: possible secret token`)
    }
    ABS_PATH.lastIndex = 0
    if (ABS_PATH.test(line)) {
      // Tutorial placeholders often include drive letters; warn only.
      if (!/Path\\To|<用户名>|<GITHUB_USER>|D:\\\\notes|C:\\\\Path/i.test(line)) {
        warnings.push(`${rel}:${i + 1}: absolute path-like text`)
      }
    }
  }

  // Homepage hard-coded links
  if (path.basename(file) === "index.md") {
    const hrefs = [...text.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
    for (const href of hrefs) {
      if (!href.startsWith("/")) continue
      if (ALLOWED_ROUTES.has(href)) continue
      if (href.startsWith("http")) continue
      const key = decodeURIComponent(href.replace(/^\//, ""))
      if (!slugs.has(key)) {
        errors.push(`content/index.md: dead internal link ${href}`)
      }
    }
  }
}

for (const w of warnings) console.warn(`WARN ${w}`)
for (const e of errors) console.error(`ERROR ${e}`)
if (errors.length > 0) {
  console.error(`validate-public-content: ${errors.length} error(s).`)
  process.exit(1)
}
console.log(`validate-public-content: ok (${warnings.length} warning(s), 0 errors).`)
