# Quartz A+C Hybrid Layout Design

Date: 2026-06-03

## Goal

Turn the site from the default Quartz three-column feel into a stable hybrid layout:

- Homepage: a portal-style landing page with a short introduction, category cards, recent updates, and a graph entry.
- Article pages: a technical documentation reading layout with left navigation, centered article content, and a right-side table of contents only.
- Graph View: preserved as an exploration tool, but removed from the always-visible right sidebar.

## Scope

This first version should be practical and low-risk. It will not replace Quartz internals wholesale.

Included:

- Customize the homepage content and styling.
- Move Graph View out of the article right sidebar.
- Keep Search, Explorer, Recent Notes, dark mode, reader mode, and Table of Contents.
- Add a visible graph entry on the homepage and/or a collapsible article-bottom knowledge section.
- Keep existing Quartz 5 build and Cloudflare deployment flow.

Excluded for this version:

- Full custom routing.
- Replacing Quartz with a different frontend framework.
- Complex animation systems.
- Per-category generated landing pages beyond what Quartz already supports.

## Layout

### Homepage

The homepage should feel like a personal knowledge portal:

- Top area: site title and one short description.
- Category cards:
  - Java
  - Windows
  - 博客
  - 工具运维
- Recent updates section.
- Knowledge graph entry card that explains the graph is available for exploration.

The homepage should not depend on the left file tree as the primary way to understand the site.

### Article Pages

Article pages should prioritize reading:

- Left sidebar: Search, Explorer, Recent Notes, theme/reader controls.
- Center: article body.
- Right sidebar: Table of Contents only.
- No always-visible Graph View on the right.

Long TOC entries remain single-line with ellipsis, matching the previous UI fix.

### Graph

Graph View remains available, but is no longer permanent chrome on every article page.

Preferred first implementation:

- Add a homepage card linking to a graph-oriented area or explaining where graph exploration appears.
- Add a bottom article section placeholder called "知识关联" for related notes and graph exploration.

If Quartz 5 makes a standalone graph page awkward in the first pass, keep the graph component available for a later focused iteration instead of blocking the layout work.

## Implementation Approach

Use the smallest stable Quartz 5 surface:

- `quartz.config.yaml` for layout placement and plugin visibility.
- `content/index.md` for homepage copy and card structure.
- `quartz/styles/custom.scss` for portal cards, article spacing, and component visibility.
- Existing local `plugins/ui-fixes` only if page behavior needs small client-side glue.

Avoid editing ignored `.quartz/plugins` contents because those are generated during plugin install.

## Verification

Before publishing:

- Run plugin install from config.
- Run Quartz build.
- Check generated homepage includes category cards.
- Check generated article pages do not show Graph View in the right sidebar.
- Check right sidebar TOC still renders.
- Scan for private paths or secrets in committed config and docs.

## Success Criteria

- Homepage visually reads as a portal, not a default file index.
- Article pages feel like technical documentation.
- Graph View is not lost, but it no longer competes with the article TOC.
- Build succeeds locally and Cloudflare can deploy from `v5`.
