# Quartz A+C Hybrid Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the stable A+C hybrid layout: portal-style homepage, documentation-style article pages, and Graph moved out of the always-visible right sidebar.

**Architecture:** Use Quartz 5 configuration and Markdown/CSS surfaces only. `quartz.config.yaml` controls component placement; `content/index.md` provides homepage structure; `quartz/styles/custom.scss` provides the portal card and article layout polish. The existing local `plugins/ui-fixes` remains only for small client-side Explorer behavior.

**Tech Stack:** Quartz 5, YAML config, Obsidian/Quartz Markdown, SCSS, local Quartz build command.

---

## File Structure

- Modify `quartz.config.yaml`: move Graph out of the global right sidebar and keep article pages focused on TOC.
- Modify `content/index.md`: replace the generated plain homepage with a portal homepage using semantic Markdown and class hooks.
- Modify `quartz/styles/custom.scss`: style the portal homepage, category cards, graph entry, article reading layout, and keep previous sidebar/TOC fixes.
- Verify generated `public/` output only; do not commit `public/`.

## Task 1: Layout Configuration

**Files:**
- Modify: `quartz.config.yaml`

- [ ] **Step 1: Remove always-visible Graph from the right sidebar**

Change the Graph plugin layout from right sidebar to no default layout:

```yaml
  - source: github:quartz-community/graph
    enabled: true
```

Expected result: Article pages no longer include Graph in the right sidebar by default.

- [ ] **Step 2: Keep right sidebar article-focused**

Leave `table-of-contents` in the right sidebar and keep `backlinks` disabled from the right sidebar for this version:

```yaml
  - source: github:quartz-community/backlinks
    enabled: true
```

Expected result: the right sidebar has TOC only on article pages.

- [ ] **Step 3: Run config build check**

Run:

```powershell
node .\quartz\bootstrap-cli.mjs build
```

Expected: `Done processing 11 files` and no YAML/layout errors.

## Task 2: Portal Homepage Content

**Files:**
- Modify: `content/index.md`

- [ ] **Step 1: Replace homepage Markdown**

Use this full homepage content:

```markdown
---
title: YYQ 的知识库
publish: true
---

<section class="home-hero">

# YYQ 的知识库

技术、工具与知识管理的公开笔记入口。这里整理 Java 开发、Windows 效率配置、博客维护和 Obsidian 自动发布实践。

</section>

<section class="home-card-grid">

<a class="home-card" href="/Java/Java索引">
  <span class="home-card-kicker">开发实践</span>
  <strong>Java</strong>
  <span>诊断工具、框架经验与后端开发笔记。</span>
</a>

<a class="home-card" href="/windows/Windows索引">
  <span class="home-card-kicker">效率配置</span>
  <strong>Windows</strong>
  <span>系统配置、软件清单、网络环境与自动化记录。</span>
</a>

<a class="home-card" href="/blog/博客索引">
  <span class="home-card-kicker">站点维护</span>
  <strong>博客</strong>
  <span>博客搭建、发布链路与内容整理实践。</span>
</a>

<a class="home-card" href="/windows/Obsidian 私人知识库自动发布 Quartz 与 Cloudflare Pages">
  <span class="home-card-kicker">工具运维</span>
  <strong>工具运维</strong>
  <span>Obsidian、Quartz、Cloudflare Pages 与 GitHub Actions。</span>
</a>

</section>

## 最近更新

- [[windows/Quartz 4 升级 Quartz 5 复盘|Quartz 4 升级 Quartz 5 复盘]]
- [[windows/Obsidian 私人知识库自动发布 Quartz 与 Cloudflare Pages|Obsidian 私人知识库自动发布 Quartz 与 Cloudflare Pages]]
- [[windows/Windows 公司网络下 FlyingBird TUN 与 Codex 共存配置|Windows 公司网络下 FlyingBird TUN 与 Codex 共存配置]]

<section class="home-graph-card">

## 知识图谱

Graph View 会保留为探索工具，但不再常驻在每篇文章右侧。先从分类卡片和最近更新进入内容，后续会补一个更完整的知识图谱入口页。

</section>
```

Expected result: homepage has hero, four cards, recent updates, and graph explanation.

- [ ] **Step 2: Verify internal links**

Run:

```powershell
rg -n "\[\[windows/Quartz 4 升级 Quartz 5 复盘|windows/Obsidian 私人知识库自动发布 Quartz 与 Cloudflare Pages|windows/Windows 公司网络下 FlyingBird TUN 与 Codex 共存配置|Java/Java索引|blog/博客索引" content
```

Expected: each linked note exists in `content/`.

## Task 3: Styling And Verification

**Files:**
- Modify: `quartz/styles/custom.scss`

- [ ] **Step 1: Add portal homepage styles**

Append these styles after the existing TOC rules:

```scss
.home-hero {
  padding: 2.5rem 2rem;
  border: 1px solid var(--lightgray);
  border-radius: 1.25rem;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--tertiary) 24%, transparent), transparent 35%),
    color-mix(in srgb, var(--light) 92%, white);

  h1 {
    margin-top: 0;
    font-size: clamp(2rem, 5vw, 3.2rem);
  }

  p {
    max-width: 46rem;
    font-size: 1.05rem;
  }
}

.home-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 1.5rem 0 2rem;
}

.home-card {
  display: flex;
  min-height: 8rem;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1.25rem;
  border: 1px solid var(--lightgray);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--light) 94%, white);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04);

  strong {
    color: var(--dark);
    font-family: var(--headerFont);
    font-size: 1.3rem;
  }

  span:last-child {
    color: var(--darkgray);
    font-weight: 400;
  }
}

.home-card:hover {
  border-color: var(--tertiary);
  transform: translateY(-2px);
}

.home-card-kicker {
  color: var(--secondary);
  font-size: 0.85rem;
  font-weight: 700;
}

.home-graph-card {
  margin-top: 2rem;
  padding: 1.25rem 1.5rem;
  border: 1px dashed var(--gray);
  border-radius: 1rem;
  background: var(--highlight);

  h2 {
    margin-top: 0;
  }
}

@media all and ($mobile) {
  .home-hero {
    padding: 1.5rem;
  }

  .home-card-grid {
    grid-template-columns: 1fr;
  }
}
```

Expected result: homepage visually reads as a portal.

- [ ] **Step 2: Build the site**

Run:

```powershell
node .\quartz\bootstrap-cli.mjs plugin install --from-config --clean
node .\quartz\bootstrap-cli.mjs build
```

Expected: plugin install succeeds and Quartz build emits `public`.

- [ ] **Step 3: Verify generated output**

Run:

```powershell
rg -n "home-card-grid|home-graph-card|Graph View" public
```

Expected:

- `home-card-grid` and `home-graph-card` appear in generated homepage output.
- `Graph View` does not appear in article page right-sidebar markup.

- [ ] **Step 4: Scan for sensitive paths**

Run:

```powershell
rg -n "obsidian-private|QUARTZ_PUBLISH_TOKEN|PRIVATE_VAULT|LOCAL_WORKTREE" quartz.config.yaml quartz.lock.json content plugins
```

Expected: no matches.

- [ ] **Step 5: Commit and push**

Run:

```powershell
git status --short
git add quartz.config.yaml quartz/styles/custom.scss content/index.md docs/superpowers/plans/2026-06-03-quartz-ac-hybrid-layout.md
git commit -m "feat: add hybrid Quartz portal layout"
git push origin codex/quartz-v5-migration:v5
```

Expected: commit succeeds and push updates `v5`.
