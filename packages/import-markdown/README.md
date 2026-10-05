# @mind-elixir/import-markdown

Markdown 文档导入功能包，将 Markdown 转换为 MindElixir 的 `MindElixirData`。本包抽自 `mark-elixir`（VSCode）与 `obsidian-mindmap`（Obsidian）两份重复实现，宿主相关的差异通过选项与钩子注入。

## 特性

- 基于 `remark` AST，标题层级自然映射为思维导图层级
- 列表自动折叠进前一个内容块（`## 标题` + 其下列表 → 标题的子节点）
- GFM 表格、强调、行内代码、链接均渲染为 HTML
- 宿主差异通过选项（`h1AsRoot` / `frontmatter` / `imageSize`）与钩子（`transformHtml`）表达，不侵入核心逻辑
- TypeScript 支持

## 安装

```bash
npm install @mind-elixir/import-markdown
# 或
pnpm add @mind-elixir/import-markdown
# 或
yarn add @mind-elixir/import-markdown
```

## 使用方法

### 从字符串解析

```typescript
import { parseMarkdown } from '@mind-elixir/import-markdown'

const data = parseMarkdown('# 标题\n\n正文\n\n## 子节点\n\n- 条目一\n- 条目二\n', {
  filename: '笔记',
  h1AsRoot: true,
})

mindElixir.init(data)
```

### 从文件解析

与 `import-xmind` / `import-freemind` 对称的入口，接受 `File` 对象，文件名（去扩展名）作为根节点标题的兜底：

```typescript
import { importMarkdownFile } from '@mind-elixir/import-markdown'

const file = fileInput.files[0]
const data = await importMarkdownFile(file, { h1AsRoot: true })
mindElixir.init(data)
```

## 选项

| 选项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `filename` | `string` | `''` | 无可用 H1 时的根节点标题兜底 |
| `h1AsRoot` | `boolean` | `false` | 把第一个一级标题提升为根节点 |
| `frontmatter` | `'strip' \| 'title' \| 'keep'` | `'strip'` | 如何处理 YAML frontmatter：`strip` 移除、`title` 移除并把`title:`提为根标题、`keep` 保留为节点 |
| `imageSize` | `{ width: number; height: number }` | — | 强制覆盖所有 `<img>` 的宽高 |
| `transformHtml` | `(html, ctx) => string` | — | 生成 HTML 后的宿主后处理钩子 |

### `transformHtml`：宿主差异的接入口

生成的 HTML 在写入 `dangerouslySetInnerHTML` 之前会交给这个钩子。Obsidian 的 wikilink 改写、KaTeX 公式渲染、vault 附件路径解析都应在这里实现——核心包不需要知道任何宿主概念。

```typescript
import { parseMarkdown } from '@mind-elixir/import-markdown'
import katex from 'katex'

const data = parseMarkdown(text, {
  filename: 'note',
  transformHtml: (html, { sourcePath }) => renderHostSpecificHtml(html, sourcePath),
})
```

`ctx` 提供 `sourcePath`（宿主传入的文档路径，用于解析相对链接）与 `filename`。

## 与宿主迁移相关的行为说明

以下语义在两个原实现中一致，本包予以保留：

1. **列表折叠**：紧跟在某个块之后的列表会成为该块的子节点，而不是并列兄弟。
2. **孤立列表**：整篇文档只有一个列表时，列表项直接成为根的子节点，不产生 `List` 包装节点。
3. **ID 稳定性**：节点的 `id` 取自 `position.start.offset`（解析失败时回退为随机 id），因此同一份文档两次解析的 id 可比对；仅有列表项等无offset 的节点使用随机 id。

### 已知差异（相对原实现）

- **修复**：Obsidian 原实现在 `h1AsRoot` 下用`heading.value` 取标题，而 mdast 的 heading 没有 `value` 字段（文本在 `children` 中），导致根标题为 `undefined`。本包统一走 `extractText`。
- **修复**：`transformHtml` 为每次解析独立持有，不再是模块级单例，两个并发解析不会互相串味。
- `rehype-highlight`（VSCode 侧的代码高亮）与 Obsidian 的 wikilink / KaTeX / 附件处理均**不在**本包内，需要的话经由 `transformHtml` 或调用方自己的 rehype 插件链传入。

## 许可

MIT