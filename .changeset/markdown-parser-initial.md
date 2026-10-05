---
'@mind-elixir/import-markdown': minor
---

首个版本：Markdown → MindElixir 转换。

抽自 `mark-elixir`（VSCode）与 `obsidian-mindmap`（Obsidian）两份重复实现，宿主差异改为选项与钩子：

- `parseMarkdown(text, options)`：字符串入口
- `importMarkdownFile(file, options)`：与 `import-xmind` / `import-freemind` 对称的 `File` 入口
- 选项 `h1AsRoot` / `frontmatter` / `imageSize` 与钩子 `transformHtml` 承载宿主差异

相对原实现修复两处：`h1AsRoot` 下根标题取自 heading 的 `children`（原 Obsidian 实现读 `heading.value` 得到 `undefined`）；`transformHtml` 改为按次解析持有，不再是模块级单例。