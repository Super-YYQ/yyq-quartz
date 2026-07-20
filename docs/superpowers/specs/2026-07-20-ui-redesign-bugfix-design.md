# yyq-quartz UI Redesign & Bugfix Design

**Date:** 2026-07-20  
**Status:** Approved for implementation planning  
**Site:** YYQ 的知识库 (Quartz 5, `yyq-quartz.pages.dev`)  
**Approach:** Scheme 1 — design-token reskin + component-level CSS overrides  

## 1. Problem statement

The deployed Quartz site looks unfinished and has visible layout bugs (screenshot, 2026-07-20):

1. **Tag chips split mid-word** inside Note Properties (and crowded recent-note tags in the left rail) — e.g. `#域`/`名`, `#cloudflar`/`e`, `#quart`/`z`.
2. **Redundant tags** — frontmatter Properties table shows `tags` and TagList under the title shows them again.
3. **Left “最近更新” cards** feel cramped; tags wrap poorly in a narrow column.
4. **Overall visual system** is inconsistent: warm paper gradients + default Quartz chrome + partial custom polish, not a coherent engineer-facing knowledge base.

## 2. Goals & non-goals

### Goals

- Dark-first **engineer / tools** aesthetic (high contrast, compact, thin borders, minimal shadow).
- Full light-mode parity via the same token set.
- Site-wide consistency: article, home, tag listings, folder listings.
- Fix mid-word tag breaks, sidebar density, and tag duplication.
- Prefer maintainable overrides over forking upstream plugins.

### Non-goals

- Forking or rewriting `.quartz/plugins/*` sources.
- Changing note markdown content or information architecture of the vault.
- Full product shell rewrite (Scheme 2) or minimal color-only patch (Scheme 3).
- Removing Properties or TagList entirely.

## 3. Confirmed product decisions

| Decision | Choice |
|---|---|
| Visual direction | D — dark engineer / docs tooling |
| Light mode | A — dark default, light fully polished |
| Properties + TagList | A — keep both; **hide `tags` row in Properties** so TagList is the primary tags UI |
| Properties default | Expanded (open) |
| Scope | C — full site design system |
| Implementation boundary | B — `custom.scss` + config + `plugins/ui-fixes` |
| Approach | Scheme 1 — tokens + CSS overrides |
| Brand accent | Violet-blue **`#8b9cff`** |
| Home hero | Dark shell + **subtle warm accent** (not large warm paper wash) |

## 4. Design system

### 4.1 Color tokens

CSS custom properties on `:root` / `[saved-theme="dark"]` (and mirror into `quartz.config.yaml` theme colors where Quartz base vars are used).

| Token | Dark | Light | Role |
|---|---|---|---|
| `--yyq-surface` | `#0b1220` | `#f4f7fb` | Page background |
| `--yyq-panel` | `#0f1724` | `#ffffff` | Cards, sidebars, properties |
| `--yyq-ink` | `#e8eef6` | `#0b1220` | Primary text |
| `--yyq-ink-2` | `#b7c4d4` | `#2a3a4f` | Body secondary |
| `--yyq-muted` | `#7f8fa3` | `#6b7a8c` | Meta, dates, hints |
| `--yyq-line` | `#243244` | `#d7e0ea` | Borders, dividers |
| `--yyq-brand` | `#8b9cff` | `#4f5fd6` | Links, active, accents |
| `--yyq-brand-dim` | `rgba(139,156,255,0.14)` | `rgba(79,95,214,0.10)` | Chip / hover fill |
| `--yyq-code-bg` | `#121c2b` | `#eef2f7` | Inline code / blocks |
| `--yyq-warm` (hero only) | `rgba(232,196,150,0.14)` | optional soft sand | Home hero accent only |

**Rules**

- Replace current warm multi-stop page gradients with near-flat surface + optional very soft brand/warm radial **only on home hero**.
- Prefer `1px solid var(--yyq-line)` over large box-shadows.
- Map Quartz `theme.colors.lightMode` / `darkMode` (light, lightgray, gray, darkgray, dark, secondary, tertiary, highlight) to the token table so base components inherit the system.

### 4.2 Typography

- UI / body: system UI stack + `"Microsoft YaHei"` / `"PingFang SC"` for CJK.
- Optional Google font: neutral sans (e.g. Inter) — avoid magazine display fonts.
- Code: `IBM Plex Mono` or `ui-monospace`.
- Article measure: ~760–820px max width.
- Density: compact (section gaps ~0.75–1.25rem); section titles ~0.75–0.86rem, weight 700–800, brand-colored in chrome.

### 4.3 Shape & motion

- Radius: 6–8px panels; 4–6px chips/buttons.
- Hover: background `brand-dim` or border lighten; **no** large lift/shadow animation.
- Focus: thin brand outline for keyboard users.

## 5. Layout (keep Quartz grid)

Retain three-column desktop shell from Quartz / existing config:

| Region | Components |
|---|---|
| Left | Page title, search + darkmode toolbar, Explorer, Recent Notes |
| beforeBody | Breadcrumbs → NoteProperties → ArticleTitle → ContentMeta → TagList (reorder via plugin `layout.priority` if current config differs) |
| Center | Article body |
| Right | TOC (sticky); hide below ~1200px |
| Home | Custom index: topbar, hero, category grid, recent panel (no sidebars) |

Side panel width: target **~280–300px** (slightly tighter than 320px if easy via CSS).

## 6. Component behaviors

### 6.1 Tag chips (critical bugfix)

**Root cause:** Note Properties uses `table-layout: fixed` and `word-break: break-word` on values; chips are not atomic, so CJK/Latin tags break mid-token.

**Target CSS contract**

```text
.tags / .note-properties-tags / recent note tag containers:
  display: flex;
  flex-wrap: wrap;
  gap: …;

a.tag-link (and equivalents):
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  /* no word-break on the chip itself */
```

- Value cells: allow wrapping **between** chips only (`min-width: 0` on flex/grid children as needed).
- Override plugin SCSS for `.note-properties-value { word-break: break-word }` so it does not split chip text; long free-text (aliases) may use `overflow-wrap: anywhere` without breaking chips.

### 6.2 Note Properties

- Keep collapsible panel; **default open**.
- **Do not show `tags` inside Properties** (dedupe with TagList):
  - Prefer config: `includedProperties` without `tags` (e.g. `aliases`, optional `description`).
  - CSS backup: hide the tags row if it still appears.
- Style panel with panel/line tokens; brand-tinted count badge optional.
- Aliases remain multi-value text with normal wrapping.

### 6.3 TagList (under title)

- Sole primary display of note tags on articles.
- Same chip styles as above.
- Keep current beforeBody order after content-meta.

### 6.4 Explorer

- Long labels: ellipsis (already largely present).
- Active item: brand color + brand-dim background.
- Section chrome: top border line + brand-colored heading.
- Keep whole left sidebar scrollable; avoid nested max-height traps that clip the tree.
- Preserve `plugins/ui-fixes` explorer collapse patch behavior.

### 6.5 Recent Notes (left)

- Compact card per item: title (max ~2 lines) → date → tag chips with flex-wrap.
- No mid-word chip breaks; reduce vertical clutter vs current large gaps.

### 6.6 TOC (right)

- Sticky; scroll-spy `in-view` with brand left border + higher weight.
- Long headings ellipsis; hide column under tablet breakpoint as today.

### 6.7 Home

- Keep structural blocks: topbar, hero, category cards, recent panel.
- Restyle to dark tokens; category cards: thin border, panel fill, subtle hover.
- Hero: dark base + **small** warm radial + brand radial (decision W); not the old full warm paper gradient.
- Recent panel: date | title + subtitle rows, aligned with list density.

### 6.8 Tag / folder listings

- Row pattern: `date | title + tag chips`.
- Same chips; do not hide tags on mobile if readable (prefer wrap).
- Unify borders/typography with article chrome.

## 7. Implementation boundary

### Allowed

| Path | Role |
|---|---|
| `quartz/styles/custom.scss` | Primary visual system + bug overrides |
| `quartz.config.yaml` | Theme colors, fonts, note-properties options, defaults |
| `plugins/ui-fixes` | Small runtime patches (explorer, optional DOM cleanup) |

### Disallowed / avoid

- Editing vendored `.quartz/plugins/**` sources (upgrade hazard).
- Large changes to Quartz core frames without need.
- Content rewrites solely for visual effect.

### Config sketch

```yaml
# theme.colors → map to §4.1
# note-properties:
#   includedProperties: [description, aliases]  # tags removed
#   # tags remain via tag-list plugin
```

If the darkmode plugin supports a default theme, set **dark** as default; otherwise document first-visit preference.

## 8. Bug fix checklist (must pass)

1. No mid-word tag breaks in Properties (if tags ever reappear), TagList, recent notes, tag/folder listings — CJK and Latin.
2. Article tags appear **once** under the title; Properties shows aliases (and other non-tag fields), not a tags row.
3. Left recent cards readable; chips wrap as whole units.
4. Dark default + light toggle both usable (contrast, borders, chips visible).
5. Desktop 3-column; right column off under ~1200px; mobile readable; explorer collapse still works.
6. Home hero warm accent is subtle; site is not warm-paper overall.

## 9. File-level plan (for writing-plans)

1. Introduce token block at top of `custom.scss`; replace existing `--yyq-*` and gradient backgrounds.
2. Map `quartz.config.yaml` theme colors + typography; adjust note-properties includes.
3. Tag chip global rules + Note Properties table/value overrides.
4. Sidebar explorer / recent / TOC restyle.
5. Article chrome (title, meta, properties panel, callouts, code, tables).
6. Home (topbar, hero warm accent, cards, recent panel) + mobile rules.
7. Tag/folder listing row styles.
8. Extend `ui-fixes` only if CSS cannot hide Properties tags row or explorer needs patch updates.
9. Build preview (`npx quartz build` / local serve) and walk acceptance checklist on the DNSHE tutorial page and home.

## 10. Out of scope follow-ups

- Graph view visual overhaul.
- New homepage content architecture.
- i18n string changes beyond existing zh-CN.
- Performance work unrelated to CSS size.

## 11. References

- In-repo research: `docs/research-digital-garden-ui.md`
- Brainstorm mockups: `.superpowers/brainstorm/` (session artifacts; may be gitignored)
- Screenshot issues: Properties tags, explorer, recent notes (user 2026-07-20)

## 12. Approval

- Approaches reviewed; Scheme 1 selected.
- Design sections approved interactively (tokens, article+bugs, home+lists with warm hero accent, implementation boundary).
- Ready for **writing-plans** implementation plan after user review of this file.
