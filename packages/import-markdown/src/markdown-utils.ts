import type { MindElixirData, NodeObj } from 'mind-elixir'
import type { Heading, List } from 'mdast'
import type { Root as HastRoot } from 'hast'
import type { Node } from 'unist'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfmToMarkdown } from 'mdast-util-gfm'
import type { ParseOptions, TransformContext } from './types/options'

export type { ParseOptions, TransformContext }

/**
 * A node of the intermediate tree built from the mdast.
 *
 * Mirrors the shape both host plugins used independently, so the traversal
 * below stays comparable with both originals.
 */
interface TreeItem {
  children: TreeItem[]
  object: Node & { depth?: number }
  parent: TreeItem | null
  type: string
}

/**
 * Per-parse state threaded through the conversion helpers.
 *
 * Kept as an explicit argument (rather than module-level mutable state) so that
 * two overlapping `parseMarkdown` calls — which is the normal case, since
 * editors re-parse on a debounce while a previous pass may still be running —
 * cannot observe each other's `transformHtml`.
 */
interface ParseContext extends TransformContext {
  processor: ReturnType<typeof createHtmlProcessor>
  transformHtml?: ParseOptions['transformHtml']
  editable?: boolean
}

const generateId = (): string => Math.random().toString(36).substring(2, 11)

/**
 * Flatten an mdast node to its plain text.
 *
 * NOTE: headings carry no `.value` of their own — their text lives in
 * `children`. Reading `h1.value` yields `undefined` and silently produces an
 * untitled root, so every heading read must go through this.
 */
const extractText = (node: any): string => {
  if (!node) return ''
  if (typeof node.value === 'string') return node.value
  if (Array.isArray(node.children)) return node.children.map(extractText).join('')
  return ''
}

/**
 * Convert an mdast node directly to a Markdown string.
 * For headings, converts only the inline heading content (omits leading '#' symbols).
 */
const toMarkdownNode = (node: any): string => {
  if (!node) return ''
  try {
    if (node.type === 'heading') {
      return toMarkdown({ type: 'paragraph', children: node.children || [] }, { extensions: [gfmToMarkdown()] }).trim()
    }
    if (node.type === 'html') {
      return typeof node.value === 'string' ? node.value.trim() : ''
    }
    return toMarkdown(node, { extensions: [gfmToMarkdown()] }).trim()
  } catch (e) {
    console.error('[import-markdown] Markdown stringify error', e)
    return extractText(node)
  }
}

/**
 * Parse a `key: value` frontmatter block into a flat object.
 *
 * Deliberately naive (first colon wins, no nesting/quotes/escapes) to stay
 * behavior-compatible with the VSCode extension's original `parseFrontmatter`.
 */
const parseFrontmatter = (frontmatter: string): Record<string, string> => {
  const data = frontmatter.split('\n').map(line => line.split(':').map(item => item.trim()))
  return Object.fromEntries(data) as Record<string, string>
}

/**
 * Strip a leading YAML frontmatter block by hand.
 *
 * Used for the `strip` / `title` modes so the block never reaches the tree,
 * which matches how the Obsidian plugin treated frontmatter (as metadata to
 * remove, not content).
 */
const stripFrontmatterBlock = (content: string): string => {
  const clean = content.startsWith('\uFEFF') ? content.slice(1) : content
  if (!clean.startsWith('---')) return content
  return clean.replace(/^---[\s\S]*?\r?\n---\r?\n?/, '')
}

/**
 * Read a `title` out of a leading frontmatter block, if any.
 *
 * Exported because a host often needs the document title for something the
 * parse result cannot carry: the VSCode extension names the webview panel
 * after it, and that name must stay the frontmatter title even when
 * `h1AsRoot` has replaced the root node's topic with the H1 text.
 *
 * Uses the same naive `key: value` split as {@link parseMarkdown}, so the two
 * never disagree about what the title is.
 */
export const readFrontmatterTitle = (content: string): string | undefined => {
  const match = content.match(/^---[\s\S]*?\r?\n---/)
  if (!match) return undefined
  const body = match[0].replace(/^---[\s\S]*?\r?\n/, '').replace(/\r?\n---$/, '')
  return parseFrontmatter(body).title
}

/**
 * Build a hast->html stringifier for a given set of options.
 *
 * NOT cached across calls with different options: `imageSize` and
 * `rehypePlugins` are per-parse inputs, so the single module-level processor
 * both plugins used cannot express them.
 *
 * Plugin order mirrors what the VSCode extension assembled by hand —
 * `remark-rehype` -> host plugins (`rehype-highlight`) -> forced image size ->
 * `rehype-stringify`. Size is applied last so a host plugin that rewrites an
 * `<img>` still gets its dimensions forced afterwards.
 */
const createHtmlProcessor = (options: ParseOptions) => {
  const processor = unified().use(remarkRehype) as any
  if (options.rehypePlugins?.length) {
    processor.use(options.rehypePlugins as any)
  }
  if (options.imageSize) {
    const { width, height } = options.imageSize
    processor.use(() => (tree: HastRoot) => {
      const walk = (node: any) => {
        if (!node || typeof node !== 'object') return
        if (node.type === 'element' && node.tagName === 'img') {
          node.properties = { ...node.properties, width, height }
        }
        if (Array.isArray(node.children)) node.children.forEach(walk)
      }
      walk(tree)
    })
  }
  return processor.use(rehypeStringify)
}

/**
 * Convert one mdast node to an HTML string, then hand it to the host hook.
 *
 * A node that fails to convert yields an empty string rather than throwing, so
 * one bad block cannot take down the whole document.
 */
const toHtml = (node: unknown, context: ParseContext): string => {
  let html = ''
  try {
    const hast = context.processor.runSync(node as any)
    const str = context.processor.stringify(hast)
    if (typeof str === 'string') html = str
  } catch (e) {
    console.error('[import-markdown] HTML conversion error', e)
    return ''
  }
  return context.transformHtml ? context.transformHtml(html, context) : html
}

/**
 * Convert markdown to a nested {@link TreeItem}.
 *
 * Hierarchy comes from heading depth; non-heading blocks (paragraphs, lists,
 * code, tables) attach to the most recent heading.
 */
const markdownAstToTree = (ast: { children: Node[] }): TreeItem => {
  const children = ast.children
  const treeItem: TreeItem = {
    type: 'root',
    children: [],
    object: ast as any,
    parent: null,
  }

  let current = treeItem
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (!child) continue
    if (child.type === 'thematicBreak') continue

    if (child.type === 'heading') {
      const heading = child as Heading
      const data: TreeItem = {
        type: heading.type,
        object: heading as any,
        parent: current,
        children: [],
      }
      if (heading.depth > (current.object.depth || 0)) {
        current.children.push(data)
        current = data
      } else {
        while (heading.depth <= (current.object.depth || 0) && current.parent) {
          current = current.parent
        }
        current.children.push(data)
        current = data
      }
    } else {
      const data: TreeItem = {
        type: (child as any).type,
        object: child as any,
        parent: current,
        children: [],
      }
      current.children.push(data)
    }
  }

  return treeItem
}

/**
 * Convert a markdown list into mind-elixir nodes.
 *
 * A list item's first child holds its text (rendered to HTML) and its second
 * child, if present, is the nested list.
 */
const processList = (list: List, context: ParseContext): NodeObj[] =>
  list.children.map(listItem => {
    const result: NodeObj = { topic: '', id: generateId(), children: [] }

    const contentNode = (listItem as any).children[0]
    const nestedList = (listItem as any).children[1]

    if (contentNode) {
      if (context.editable) {
        result.topic = toMarkdownNode(contentNode)
      } else {
        const html = toHtml(contentNode, context)
        if (html) result.dangerouslySetInnerHTML = html
      }
    }
    if (nestedList && nestedList.type === 'list') {
      result.children = processList(nestedList, context)
    }
    return result
  })

/**
 * Convert the intermediate tree into mind-elixir nodes.
 *
 * Key behaviour, inherited from both originals: a list that immediately follows
 * a block is folded into that block's children (and removed from its sibling
 * run), so `## Heading` + a bullet list renders as heading-with-children rather
 * than two unrelated nodes.
 */
const treeToMindElixir = (items: TreeItem[], context: ParseContext): NodeObj[] => {
  const nodes: NodeObj[] = []
  if (items.length === 1 && items[0]!.type === 'list') {
    return processList(items[0]!.object as List, context)
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!
    const node = {} as NodeObj
    nodes.push(node)

    if (item.type === 'list') {
      node.children = processList(item.object as List, context)
      node.topic = 'List'
      node.id = item.object.position?.start?.offset?.toString() || generateId()
      continue
    }

    if (context.editable) {
      node.topic = toMarkdownNode(item.object)
    } else {
      if (item.type === 'html') {
        node.dangerouslySetInnerHTML = (item.object as any).value
      } else {
        const html = toHtml(item.object, context)
        if (html) node.dangerouslySetInnerHTML = html
      }
    }

    node.id = item.object.position?.start?.offset?.toString() || generateId()

    const next = items[i + 1]
    if (next && next.type === 'list') {
      node.children = processList(next.object as List, context)
      items.splice(i + 1, 1)
    } else {
      node.children = treeToMindElixir(item.children, context)
    }
  }

  return nodes
}

/**
 * Parse markdown into MindElixir's `MindElixirData`.
 *
 * Never throws: a document that cannot be parsed yields an empty root carrying
 * `filename`, matching what both host plugins did on failure.
 */
export const parseMarkdown = (content: string, options: ParseOptions = {}): MindElixirData => {
  const { filename = '', h1AsRoot = false, frontmatter = 'strip', editable = false } = options
  try {
    const source = frontmatter === 'keep' ? content : stripFrontmatterBlock(content)
    const ast = unified().use(remarkParse).use(remarkGfm).parse(source)
    const tree = markdownAstToTree(ast as any)

    const context: ParseContext = {
      filename,
      processor: createHtmlProcessor(options),
      transformHtml: options.transformHtml,
      editable,
    }

    let nodes: NodeObj[]
    let rootTopic = frontmatter === 'title' ? readFrontmatterTitle(content) || filename : filename

    if (h1AsRoot) {
      const h1Index = tree.children.findIndex(child => child.type === 'heading' && child.object.depth === 1)
      if (h1Index !== -1) {
        const h1 = tree.children[h1Index]!
        rootTopic = (editable ? toMarkdownNode(h1.object) : extractText(h1.object)) || rootTopic
        nodes = treeToMindElixir(h1.children, context)
      } else {
        nodes = treeToMindElixir(tree.children, context)
      }
    } else {
      nodes = treeToMindElixir(tree.children, context)
    }

    return {
      nodeData: {
        id: generateId(),
        topic: rootTopic,
        children: nodes,
      },
    }
  } catch (e) {
    console.error('[import-markdown] Markdown parse error', e)
    return { nodeData: { id: generateId(), topic: filename, children: [] } }
  }
}

/**
 * Read a markdown `File` and parse it.
 *
 * The root topic falls back to the file name with its extension removed, which
 * is what both plugins derived from their editor's document path.
 */
export const importMarkdownFile = async (file: File, options: ParseOptions = {}): Promise<MindElixirData> => {
  const text = await file.text()
  const fallbackName = file.name.replace(/\.[^./\\]+$/, '')
  return parseMarkdown(text, { filename: fallbackName, ...options })
}
