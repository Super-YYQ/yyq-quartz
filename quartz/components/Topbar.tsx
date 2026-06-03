import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Topbar: QuartzComponent = ({ fileData, cfg }: QuartzComponentProps) => {
  const baseDir = pathToRoot(fileData.slug!)

  return (
    <div class="yyq-topbar-main">
      <a class="yyq-brand" href={baseDir} aria-label={cfg.pageTitle}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
          <path
            d="M4 5.4c0-.9.7-1.6 1.6-1.6H10c1.2 0 2.2.7 2.8 1.7.6-1 1.7-1.7 2.9-1.7h2.7c.9 0 1.6.7 1.6 1.6v13.4c0 .5-.4.8-.9.7l-4.7-1.1c-1.1-.3-2.3 0-3.2.6-.9-.6-2-.9-3.1-.6l-4.2 1c-.5.1-.9-.3-.9-.7V5.4Z"
            stroke="currentColor"
            stroke-width="2"
          />
          <path d="M12 5.5v13" stroke="currentColor" stroke-width="2" />
        </svg>
        <span>{cfg.pageTitle}</span>
      </a>
      <nav class="yyq-nav" aria-label="主导航">
        <a href={baseDir}>首页</a>
        <a href={`${baseDir}Java`}>Java</a>
        <a href={`${baseDir}Windows`}>Windows</a>
        <a href={`${baseDir}博客`}>博客</a>
        <a href={`${baseDir}tags`}>标签</a>
      </nav>
    </div>
  )
}

export default (() => Topbar) satisfies QuartzComponentConstructor
