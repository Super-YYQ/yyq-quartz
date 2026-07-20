# yyq-quartz UI Redesign & Bugfix Implementation Plan

> **For agentic workers:** Execute inline in this session (user requested: implement, commit, push). Steps use checkbox syntax for tracking.

**Goal:** Apply the approved dark-first engineer design system site-wide, fix mid-word tag chips, and dedupe Properties tags — then commit and push.

**Architecture:** Token reskin in `quartz/styles/custom.scss` + theme/config in `quartz.config.yaml` + small `plugins/ui-fixes` runtime (explorer + default dark). No forks of `.quartz/plugins/*`.

**Tech Stack:** Quartz 5, SCSS, local ui-fixes component plugin, Cloudflare Pages deploy via git push.

## Global Constraints

- Brand accent dark: `#8b9cff`; light brand: `#4f5fd6`
- Implementation only: `custom.scss`, `quartz.config.yaml`, `plugins/ui-fixes`
- Properties: remove `tags` from `includedProperties`; TagList remains primary tags UI
- Home hero: dark + subtle warm radial (not full warm paper wash)
- Do not edit vendored `.quartz/plugins/**`

---

### Task 1: Config + default dark + note-properties

**Files:**
- Modify: `quartz.config.yaml`
- Modify: `plugins/ui-fixes/dist/components/index.js`

- [x] Map theme colors to design tokens
- [x] Remove `tags` from note-properties `includedProperties`
- [x] ui-fixes: default theme dark when no `localStorage.theme`; keep explorer patch

### Task 2: Rewrite custom.scss design system

**Files:**
- Modify: `quartz/styles/custom.scss`

- [x] Tokens (dark default, light via `[saved-theme="light"]`)
- [x] Shell, sidebars, explorer, recent cards, TOC
- [x] Atomic tag chips + Properties overrides
- [x] Article chrome, callouts, code, tables
- [x] Home (warm hero accent), tag/folder listings, mobile

### Task 3: Build, verify, commit, push

- [x] `npx quartz build` (or project build script)
- [x] Spot-check DNSHE page CSS contracts in built output
- [x] Commit + push branch

---

## Spec coverage

| Spec item | Task |
|---|---|
| Dark engineer tokens | 1–2 |
| Tag chip nowrap | 2 |
| Properties hide tags | 1 (+ CSS backup in 2) |
| Recent cards | 2 |
| Home warm accent | 2 |
| Light parity | 2 |
| ui-fixes only for JS | 1 |
