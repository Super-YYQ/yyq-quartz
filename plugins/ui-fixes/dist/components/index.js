const explorerPatch = `
(() => {
  const patchExplorer = () => {
    document.querySelectorAll(".explorer").forEach((explorer) => {
      if (explorer.dataset.yyqExplorerPatched === "true") return
      explorer.dataset.yyqExplorerPatched = "true"

      explorer.querySelectorAll(".desktop-explorer.explorer-toggle").forEach((button) => {
        button.addEventListener(
          "click",
          (event) => {
            event.stopImmediatePropagation()
            const collapsed = explorer.classList.toggle("collapsed")
            explorer.setAttribute("aria-expanded", collapsed ? "false" : "true")
            button.setAttribute("aria-expanded", collapsed ? "false" : "true")
          },
          true,
        )
      })
    })
  }

  document.addEventListener("nav", patchExplorer)
  document.addEventListener("render", patchExplorer)
  document.addEventListener("DOMContentLoaded", patchExplorer)
  patchExplorer()
})()
`

export const UiFixes = () => {
  const Component = () => null
  Component.afterDOMLoaded = explorerPatch
  return Component
}
