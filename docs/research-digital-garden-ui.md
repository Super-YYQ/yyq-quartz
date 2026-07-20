# Digital Garden / Second-Brain UI Research

**Date:** 2026-07-20  
**Scope:** Layout patterns, tag chips, 2024–2026 visual trends, reference sites, and Quartz polish customizations for knowledge-base sites (Quartz, Obsidian Publish, Chinese personal KBs).  
**Audience:** `yyq-quartz` (Quartz 5 fork with Chinese content).

---

## Executive summary

Polished knowledge sites converge on a **three-column desktop shell** (explorer / article / TOC+context), **semantic color tokens** with light/dark parity, **chip-style tags that never mid-word wrap**, and **card-based home/recent surfaces**. Quartz already encodes the grid and component slots; polish comes from `custom.scss`, theme tokens, sticky sidebars, and careful flex rules on tags and tree labels.

**Top 5 design recommendations** (for yyq-quartz):

1. **Keep the 3-column knowledge shell** — left explorer tree, centered article (~720–860px measure), right sticky TOC; collapse right below ~1200px, stack on mobile.
2. **Treat tags as atomic chips** — `flex-wrap` on the list, `white-space: nowrap` + `inline-block`/`inline-flex` on each chip; never allow letter-level wrap inside a tag.
3. **Use a closed color system** — ink / muted / line / panel / brand tokens for light and dark; soft surfaces + thin borders beat heavy shadows.
4. **Card home + list density elsewhere** — category/recent cards on index; date+title+tags rows on folder/tag listings; ellipsis long tree labels.
5. **Polish via Quartz slots + CSS** — `beforeBody` for title/meta/tags/properties; left for search/explorer/recent; right for TOC/graph/backlinks; put all visual overrides in `quartz/styles/custom.scss`.

---

## 1. Layout patterns

### 1.1 Canonical desktop shell (Quartz model)

Quartz documents a sectioned page model (`head`, `header`, `beforeBody`, `pageBody`, `afterBody`, `left`, `right`, `footer`) and a CSS grid that maps to sidebars + center content.

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | `< 800px` | Single column: left → header → center → right → footer |
| Tablet | `800–1200px` | Left sticky + center; right stacks under center (TOC often hidden) |
| Desktop | `> 1200px` | **Left \| Center \| Right** equal side panels (~320px default) |

**Primary sources (in-repo / official):**

- Layout model: `docs/layout.md`, upstream [quartz.jzhao.xyz/layout](https://quartz.jzhao.xyz/layout) (v4 docs still describe the same sections; v5 moves placement into `quartz.config.yaml` + plugin `layout.position`).
- Grid tokens: `quartz/styles/variables.scss` — `$sidePanelWidth: 320px`, breakpoints 800 / 1200.
- Live CSS from [quartz.jzhao.xyz](https://quartz.jzhao.xyz/): `#quartz-body` grid  
  `"left header right" / "left center right" / "left footer right"` with `320px auto 320px`.

**Recommended slot assignment for a second-brain site:**

| Region | Typical components | Notes |
|---|---|---|
| **Left** | Page title, search + darkmode (toolbar group), **Explorer**, optional Recent Notes | Sticky; tree is primary navigation |
| **beforeBody** | Article title, content meta (dates), **TagList**, **NoteProperties** (aliases / custom frontmatter) | Vertical stack under header |
| **pageBody** | Markdown article | Max-width ~720–860px for reading comfort |
| **Right** | **TOC** (sticky, scroll-spy), Graph, Backlinks | Hide or demote below 1200px |
| **afterBody** | Comments, related notes | Optional |
| **Footer** | Links, license | Narrow measure matching article |

yyq-quartz already follows this pattern in `quartz.config.yaml` (explorer left; TOC right; tag-list + note-properties + article-title/meta in `beforeBody`; recent-notes left).

### 1.2 Explorer (left tree)

From Quartz Explorer plugin docs (`docs/features/explorer.md` / `quartz-community/explorer`):

- Nested folder tree; folder titles from `folder/index.md` frontmatter `title`.
- Options: `folderClickBehavior: collapse | link`, `folderDefaultState`, `useSavedState` (localStorage `fileTree`).
- Mobile: dedicated mobile explorer control; body scroll lock while open (see `explorer.scss`).

**UI polish patterns:**

- Section headers: small, heavy weight (~0.86rem, 700–800), muted top border.
- Active note: brand color + bolder weight.
- Long titles: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` on links (yyq `custom.scss` already does this).
- Prefer scrolling the **whole left sidebar** (or explorer content) rather than nested max-heights that clip mid-tree.

### 1.3 Article + frontmatter properties

**Standard article chrome (top → bottom):**

1. Breadcrumbs (optional)
2. **H1 article title** — large, tight line-height (`clamp(1.9rem, 2.35vw, 2.55rem)` works well)
3. **Content meta** — reading time / created / modified, muted ~0.78–0.85rem
4. **Tag chips**
5. **Note properties** panel (aliases, custom keys) — collapsible `<details>` table
6. Body prose

**NoteProperties** (`quartz-community/note-properties`) ships Obsidian-like styling:

- Bordered, 5px radius panel; chevron on summary.
- Fixed table layout; key column ~35%; `word-break: break-word` on values.
- Nested tags as small chips with hover invert (background ↔ brand).

Aliases belong in properties (or redirects via `alias-redirects` plugin), not as free text in the title.

### 1.4 Right TOC

From TOC feature docs + plugin SCSS:

- Auto from H1–H3 (configurable); hide with `enableToc: false`.
- Scroll-spy class `in-view` dims non-active headings.
- Layout modes: `modern` (default) vs `legacy`.
- Depth indentation via `.depth-N { padding-left: calc(1rem * N) }`.

**Polish:**

- Sticky within right column: `position: sticky; top: ~1.4rem; max-height: calc(100vh - …)`.
- Active item: left border accent + higher opacity/weight (yyq pattern).
- Ellipsis long heading labels; hide TOC on tablet/mobile or collapse to top-of-page.

### 1.5 Recent notes cards / lists

Recent Notes plugin (`docs/features/recent notes.md`):

- Not in default layout; add via config (`limit`, `showTags`, `hideTagPages`, `hideFolderPages`, `linkToMore`).
- Default presentation is a **compact list** (date meta + title + optional tags), not large media cards.

**When to use cards vs lists:**

| Surface | Pattern |
|---|---|
| Home / index | **Cards** — category tiles, hero, recent update rows in a panel |
| Left sidebar Recent | **Compact list** — 3–7 titles, optional dates |
| Tag/folder listing | **Date \| title / tags** grid rows (see yyq tag-page CSS) |

yyq home already uses category cards + a “recent panel” of update rows — aligned with 2024–2026 product marketing patterns applied to personal gardens.

### 1.6 Alternative layouts (non-Quartz)

| Pattern | Example | When it shines |
|---|---|---|
| **Stacked notes** (horizontal columns) | [Andy Matuschak’s notes](https://notes.andymatuschak.org/) | Deep link-chasing; no global tree |
| **Long-form essay index** | [Gwern](https://gwern.net/) | Research archive, not daily Zettelkasten |
| **Publish-style tree + reading pane** | Obsidian Publish help | Familiar to Obsidian users |
| **Minimal blog + tags** | [ellie.wtf](https://ellie.wtf), [owenyoung.com](https://www.owenyoung.com/) | Writing-first, weaker folder explorer |

For a Chinese **personal knowledge base**, the Quartz three-column shell matches user mental models from Obsidian better than stacked notes.

---

## 2. Tag chips — avoiding mid-word wrap / truncation bugs

### 2.1 Root cause of common bugs

1. **Word wrap inside the chip** — tag is a normal inline link; browser wraps at arbitrary points for CJK or long `kebab-case` tokens.
2. **Truncation of the whole chip row** — parent has `overflow: hidden` + fixed height without wrap.
3. **Flex item min-width** — default `min-width: auto` prevents shrinking; combined with `nowrap` on the *container*, chips overflow the article.
4. **Conflicting rules** — page-list tags right-aligned with `justify-content: flex-end` while title column is narrow.

### 2.2 Canonical fix (upstream TagList)

From installed `quartz-community/tag-list` (`TagList.tsx` CSS):

```css
.tags {
  list-style: none;
  display: flex;
  padding-left: 0;
  gap: 0.4rem;
  margin: 1rem 0;
  flex-wrap: wrap;          /* wrap BETWEEN chips */
}

.tags > li {
  display: inline-block;
  white-space: nowrap;      /* never wrap INSIDE a chip */
  margin: 0;
  overflow-wrap: normal;
}

a.internal.tag-link {
  border-radius: 8px;
  background-color: var(--highlight);
  padding: 0.2rem 0.4rem;
  margin: 0 0.1rem;
}
```

Base styles also prefix tags with `#` via `a.internal.tag-link::before { content: "#" }`.

Theme tokens (`quartz/util/theme.ts`):

- `--tag-background: var(--highlight)`
- `--tag-color: var(--secondary)`
- `--tag-background-hover: var(--lightgray)`

### 2.3 Hardened chip recipe (recommended)

```css
ul.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.4rem;
  align-items: center;
  padding: 0;
  margin: 0.5rem 0 0;
  list-style: none;
  min-width: 0;              /* allow flex parent shrink */
}

ul.tags > li {
  display: inline-flex;
  margin: 0;
  max-width: 100%;           /* long single tag can still shrink */
  min-width: 0;
}

a.tag-link,
ul.tags a.internal.tag-link {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 1.35rem;
  padding: 0.1rem 0.5rem;
  border-radius: 5px;        /* 5–8px; full pill optional */
  background: var(--tag-background, #eaf0f7);
  color: var(--tag-color, #527192);
  font-size: 0.72rem;
  font-weight: 650;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;   /* only if a single tag > container */
}
```

**Rules of thumb:**

| Do | Don’t |
|---|---|
| Wrap the **list** (`flex-wrap: wrap`) | Put `white-space: nowrap` on `ul.tags` |
| Nowrap **each chip** | Rely on `word-break: break-all` inside chips |
| `min-width: 0` on flex ancestors | Nest tags inside `overflow: hidden` without wrap |
| Ellipsis only for pathological long tags | Truncate every tag to a fixed character count |
| Prefer full tag text (wrap to next line as whole chip) | Mid-glyph wrap for CJK tags |

NoteProperties embeds tags with `inline-flex` chips but **does not** set `white-space: nowrap` on `.note-properties-tags .tag-link` — worth aligning with TagList if multi-character CJK tags appear there.

### 2.4 Listing pages

On tag/folder listings, put tags on their own grid row under the title (yyq `body[data-slug^="tags"]` styles): date column | title + tags. Avoid cramming chips into a narrow meta column.

---

## 3. Visual design trends (2024–2026) for knowledge sites

### 3.1 Typography

| Role | Trend | Quartz default / practice |
|---|---|---|
| Headers | Geometric or neo-grotesk sans | **Schibsted Grotesk** |
| Body | Highly readable humanist sans | **Source Sans Pro** |
| Code | Clear monospace | **IBM Plex Mono** |
| Chinese body | System CJK stack after Latin | Inter / system-ui + **Microsoft YaHei**, PingFang SC, Noto Sans SC |
| Literary CN blogs | Serif headings + sans body | Owen Young: New York / Charter + Songti / Noto Serif SC fallbacks |

**Reading measure:** ~65–80 characters; article `max-width` ≈ **720–860px**.  
**Line-height:** body **1.7–1.9** for CJK+Latin mixed content (Latin-only often 1.6).  
**Features:** `text-wrap: pretty` / `balance` on titles; `overflow-wrap: break-word` on prose (Quartz base already sets these).

### 3.2 Spacing & density

- Side panel padding ~1.25–2rem; top spacing historically large (`$topSpacing: 6rem` default) — many gardens reduce this for a denser “app shell”.
- Section separators: 1px `--line` / `--lightgray` rather than heavy rules.
- Component blocks (explorer, TOC, recent): shared top border + consistent title scale.

### 3.3 Card design

2024–2026 product/docs aesthetic applied to gardens:

- **Soft panel**: `rgba` white/dark glass, **1px** border, **8–12px** radius.
- Shadow: large soft ambient (`0 22px 55px rgba(…, 0.12)`) optional on outer shell; small shadow on cards.
- Hover: `translateY(-2px ~ -3px)` + slightly stronger border brand tint.
- Category cards: icon → title → blurb → affordance arrow; equal min-height grid.

Avoid skeuomorphic heavy drop shadows and neon glassmorphism; knowledge sites favor **calm, paper-adjacent** surfaces.

### 3.4 Light / dark

Quartz pattern:

- Light: warm off-white `--light: #faf8f8`, ink `--dark: #2b2b2b`, accent `--secondary: #284b63`, sage tertiary `#84a59d`.
- Dark: near-black `#161618`, inverted gray scale, lighter blue-gray secondary `#7b97aa`.
- Toggle via `saved-theme` attribute; mermaid/comments should listen to theme change (be-far.com pattern).

**Trends:**

- Semantic tokens (`--background-primary`, `--text-muted`, `--tag-background`) bridging Obsidian CSS variables (Quartz `theme.ts` already maps these).
- Optional **tinted dark** (blue-slate) rather than pure neutral — yyq custom dark gradients.
- Respect `prefers-color-scheme` with explicit override (Owen Young uses `data-theme-mode` + OKLCH tokens).

### 3.5 Color systems for knowledge sites

Keep a **small palette**:

| Token | Role |
|---|---|
| `ink` / `dark` | Primary text |
| `ink-2` / `darkgray` | Body secondary |
| `muted` / `gray` | Meta, dates |
| `line` / `lightgray` | Borders, rules |
| `panel` / `light` | Surfaces |
| `brand` / `secondary` | Links, active nav, TOC accent |
| `soft` / `tertiary` | Secondary accent (callouts, hover) |
| `highlight` | Tag/link wash (low alpha) |

OKLCH (Owen Young, modern design systems) improves dark-mode perceptual uniformity; Quartz still uses hex + CSS variables — either works if light/dark pairs are tuned together.

**Chinese KB note:** Brand blue + warm paper background remains popular (docs/wiki feel); pure Material purple is less common than calm slate/teal.

---

## 4. Concrete reference sites & repos

### 4.1 Quartz showcase (official list)

Source: [quartz.jzhao.xyz showcase](https://quartz.jzhao.xyz/) / in-repo `docs/showcase.md`.

| Site | URL | Why it looks good |
|---|---|---|
| Quartz docs | https://quartz.jzhao.xyz/ | Reference implementation of 3-column layout, default type, callouts |
| Jacky Zhao’s garden | https://jzhao.xyz/ | Author’s own hypertext garden; strong internal linking / identity |
| Aaron Pham | https://aarnphm.xyz/ | Clean community garden baseline |
| The Pond (TurnTrout) | https://turntrout.com/welcome | Long-form research garden density |
| Eilleen’s notebook | https://quartz.eilleeenz.com/ | Personal notebook aesthetic |
| Aster’s notebook | https://notes.asterhu.com | Custom fonts (Roboto Slab / Hack); garden structure |
| Data Engineering Vault | https://vault.ssp.sh/ | Second-brain **network** framing; concept graph feel |
| be-far | https://be-far.com | FOSS/tech/law garden; theme-aware mermaid + comments |
| Ellie’s notes | https://ellie.wtf | Minimal, writing-forward |
| Pattern Language | https://patternlanguage.cc/ | Domain handbook polish |
| Brandon Boswell | https://brandonkboswell.com | Personal garden branding |
| Gatekeeper Wiki | https://www.gatekeeper.wiki | Wiki-oriented information architecture |
| Socratica Toolbox | https://toolbox.socratica.info/ | Tooling / learning KB |
| Stanford CME 302 | https://ericdarve.github.io/NLA/ | Course notes as garden |
| Morrowind Modding Wiki | https://morrowind-modding.github.io/ | Community wiki scale |

**Repo:** [github.com/jackyzha0/quartz](https://github.com/jackyzha0/quartz) — SSG for Markdown → digital garden sites.

### 4.2 Classic / parallel references

| Site | URL | Takeaway |
|---|---|---|
| Digital garden ethos | https://maggieappleton.com/garden-history | Philosophy: imperfect, interlinked, growing notes |
| Andy Matuschak notes | https://notes.andymatuschak.org/ | Stacked navigation; system UI type; backlinks as primary |
| Gwern | https://gwern.net/ | Maximal research site; density ≠ garden UI |
| Obsidian Help (Publish) | https://help.obsidian.md/ | Publish styling, light/dark, tree+content; CSS snippets culture |
| AOSC Wiki | https://wiki.aosc.io/ | CN/EN technical wiki; Source Sans + Source Serif |
| Owen Young | https://www.owenyoung.com/ | Excellent **CJK font stacks** + OKLCH theme tokens |
| Xecades Notes | https://note.xecades.xyz/ | Chinese personal notes site (reachable sample) |
| liruifengv | https://liruifengv.com/ | CN modern personal site; self-hosted OPPO Sans |

### 4.3 What “good” shares

1. Clear **information scent** (tree or strong backlinks).
2. **Quiet chrome** — content wins; sidebars support.
3. Consistent **type scale** and spacing rhythm.
4. Tags / links as recognizable interactive chips without visual noise.
5. Working dark mode with non-inverted images and code themes.

---

## 5. Common Quartz customizations for polish

### 5.1 Configuration (`quartz.config.yaml`)

- **Theme:** `typography.header/body/code`, `colors.lightMode/darkMode` (secondary = brand).
- **Locale:** `zh-CN` for Chinese UI strings.
- **Plugin layout.position / priority:** compose left/right/beforeBody without TS.
- **Groups:** e.g. `toolbar` row for search + darkmode + reader mode (`docs/layout-components.md`).
- **byPageType:** drop right sidebar on tag/folder pages; custom frames (`full-width`, `minimal`) for home.
- **SPA + popovers:** `enableSPA`, `enablePopovers` for app-like navigation and link previews.

### 5.2 CSS (`quartz/styles/custom.scss`)

Highest leverage polish work:

1. Outer **app shell** (border-radius page, soft gradient page background).
2. Sticky sidebars + refined scrollbars (hide or thin).
3. Explorer/TOC/recent **section headers** unified.
4. Tag chip system (see §2).
5. Article type measure, heading color, table/code surfaces.
6. Home-only layouts via `body[data-slug="index"]`.
7. Tag listing grids via `body[data-slug^="tags"]`.

yyq already implements a strong custom shell (ink/brand tokens, home hero, category cards, sticky TOC accents).

### 5.3 Components & plugins worth enabling

| Plugin | Polish role |
|---|---|
| explorer | Left tree |
| table-of-contents | Right TOC + scroll spy |
| tag-list | Chip row under title |
| note-properties | Frontmatter / aliases panel |
| content-meta + dates | Human timestamps |
| recent-notes | Sidebar or home feed |
| graph | Optional right/bottom context |
| backlinks | “Linked mentions” |
| breadcrumbs | Hierarchy path |
| search | Command-palette style discovery |
| darkmode | Theme toggle |
| og-image / favicon | Share polish |
| alias-redirects | Alias URLs |
| syntax-highlighting | Light/dark code themes |

### 5.4 Community / issue themes

From Quartz issue search (illustrative): Obsidian theme integration interest, custom font supply, CSS class documentation — i.e. users push **visual identity** beyond defaults. Prefer custom.scss + tokens over forking base.scss.

### 5.5 Mobile polish checklist

- Explorer as overlay/drawer; don’t leave a tall tree above the article forever.
- Hide right TOC; offer optional mini-TOC under title if needed.
- Full-bleed page (drop rounded shell) under 800px.
- Touch targets ≥ ~2.35rem for search/theme buttons.
- Category grids: 4 → 2 → 1 columns.

### 5.6 CJK-specific polish

- Append CJK fallbacks after Latin webfonts (Owen Young pattern).
- Slightly larger body size / line-height than English-only Quartz demos.
- Avoid Schibsted for long Chinese headings if metrics feel off — Inter / system-ui / Noto Sans SC may read better; keep Schibsted for English brand marks if desired.
- Tag chips: nowrap is essential for multi-character Chinese tags so glyphs don’t split vertically.

---

## 6. Suggested layout blueprint for yyq-quartz

```
Desktop (>1200px)
┌─────────────┬──────────────────────────┬─────────────┐
│ Brand       │                          │ TOC         │
│ Search  ☾   │  Title                   │  · h2       │
│─────────────│  meta · tags · props     │  · h3       │
│ Explorer    │                          │─────────────│
│  📁 …       │  Article (max ~860px)    │ Graph?      │
│  📄 …       │                          │ Backlinks?  │
│ Recent      │                          │             │
└─────────────┴──────────────────────────┴─────────────┘

Home (index)
┌──────────────────────────────────────────────────────┐
│ Topbar: brand · nav · search · GitHub                │
│ Hero                                                 │
│ Category cards (2×2 / 4-col)                         │
│ Recent updates panel                                 │
└──────────────────────────────────────────────────────┘
```

---

## 7. Sources

### Primary / first-party

| Source | URL or path |
|---|---|
| Quartz site | https://quartz.jzhao.xyz/ |
| Quartz layout docs (upstream v4 raw + local) | https://raw.githubusercontent.com/jackyzha0/quartz/v4/docs/layout.md ; `docs/layout.md` |
| Quartz showcase | `docs/showcase.md` ; https://quartz.jzhao.xyz/ |
| Quartz repo | https://github.com/jackyzha0/quartz |
| Live Quartz CSS tokens / grid | https://quartz.jzhao.xyz/index-*.css (fetched 2026-07-20) |
| TagList component CSS | `.quartz/plugins/tag-list/src/components/TagList.tsx` |
| NoteProperties styles | `.quartz/plugins/note-properties/src/components/styles/noteProperties.scss` |
| Explorer / TOC / Recent SCSS | `.quartz/plugins/explorer|table-of-contents|recent-notes/...` |
| Theme semantic tokens | `quartz/util/theme.ts` |
| Grid variables | `quartz/styles/variables.scss` |
| Base link/tag rules | `quartz/styles/base.scss` |
| yyq visual system | `quartz/styles/custom.scss` |
| Feature docs | `docs/features/explorer.md`, `table of contents.md`, `recent notes.md` |
| TagList plugin doc | `docs/plugins/TagList.md` |
| Layout components (Flex groups) | `docs/layout-components.md` |

### Reference sites sampled

| Site | URL |
|---|---|
| Jacky Zhao | https://jzhao.xyz/ |
| Maggie Appleton — garden history | https://maggieappleton.com/garden-history |
| Andy Matuschak notes | https://notes.andymatuschak.org/ |
| Gwern | https://gwern.net/ |
| be-far garden | https://be-far.com |
| Ellie | https://ellie.wtf |
| Data Engineering Vault | https://vault.ssp.sh/ |
| Aster | https://notes.asterhu.com |
| Owen Young | https://www.owenyoung.com/ |
| AOSC Wiki | https://wiki.aosc.io/ |
| Xecades Notes | https://note.xecades.xyz/ |
| liruifengv | https://liruifengv.com/ |
| Obsidian Help (Publish stack) | https://help.obsidian.md/ |

### Community signals

| Item | URL |
|---|---|
| CSS classes documentation request | https://github.com/jackyzha0/quartz/issues/1811 |
| Obsidian themes integration | https://github.com/jackyzha0/quartz/issues/1451 |
| Supply own font | https://github.com/jackyzha0/quartz/issues/1970 |

---

## 8. Confidence & gaps

| Claim area | Confidence | Notes |
|---|---|---|
| Quartz layout grid & components | High | Local docs + live CSS + plugin source |
| Tag chip CSS recipe | High | Upstream TagList source + common flex bugs |
| Visual trends 2024–2026 | Medium–High | Synthesized from live gardens + product patterns; not a formal design survey |
| Chinese KB landscape | Medium | Several CN URLs timed out from this environment; Owen Young / AOSC / Xecades / liruifengv used as anchors |
| Obsidian Publish deep CSS API | Medium | Publish is SPA-driven; styling is theme + CSS snippets rather than Quartz’s open SCSS |

---

*End of report.*
