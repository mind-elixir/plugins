import type { PluggableList } from 'unified'

/**
 * How a YAML frontmatter block should be treated.
 *
 * - `strip`: remove the block from the content entirely (no `yaml` node reaches
 *   the tree). This is what Obsidian's plugin does.
 * - `title`: remove it, but lift a `title:` field into the root node topic,
 *   falling back to `filename` when absent. This is what the VSCode extension
 *   does, and it relies on `remark-frontmatter` to parse the block.
 * - `keep`: keep the block as a `yaml` node in the tree.
 */
export type FrontmatterMode = 'strip' | 'title' | 'keep'

export interface ParseOptions {
  /**
   * Fallback root topic when the document has no usable H1 (or `h1AsRoot` is
   * off). Editors pass the note/file basename here.
   */
  filename?: string
  /**
   * Promote the first depth-1 heading to the root topic and lift its siblings
   * to root children.
   */
  h1AsRoot?: boolean
  /** @default 'strip' */
  frontmatter?: FrontmatterMode
  /**
   * Force `width`/`height` attributes onto every `<img>` in the generated
   * HTML. Used by hosts (e.g. the VSCode extension) that want a uniform box
   * regardless of the source image's real dimensions.
   */
  imageSize?: { width: number; height: number }
  /**
   * hast-stage plugins appended to the pipeline, applied after `remark-rehype`
   * and before {@link ParseOptions.imageSize}.
   *
   * This is the seam for behaviour that has to run on the syntax tree rather
   * than on an HTML string: the VSCode extension passes `rehype-highlight` here
   * so fenced code blocks come out with `hljs-*` spans (its webview ships
   * `public/hljs.css` to colour them). `transformHtml` cannot express this —
   * it only ever sees a finished string.
   *
   * The list is attached to a processor built per parse, so callers may reuse
   * one plugin instance across calls without state leaking between documents.
   */
  rehypePlugins?: PluggableList
  /**
   * Host-specific HTML post-processing, applied after remark-rehype produces a
   * node's HTML and before it is assigned to `dangerouslySetInnerHTML`.
   *
   * This is the extension point that absorbs host concerns: Obsidian passes
   * wikilink rewriting + KaTeX + vault attachment resolution here.
   */
  transformHtml?: (html: string, context: TransformContext) => string
  /**
   * When true, nodes will be populated with `topic` instead of
   * `dangerouslySetInnerHTML`, making them editable in Mind Elixir.
   *
   * @default false
   */
  editable?: boolean
}

/**
 * Handed to {@link ParseOptions.transformHtml} so host adapters can resolve
 * path-relative resources without reaching into package internals.
 */
export interface TransformContext {
  /**
   * Path of the document being parsed, when the host has one (Obsidian's vault
   * path). Lets an adapter resolve relative links against a known base.
   */
  sourcePath?: string
  /** The `filename` fallback topic passed via {@link ParseOptions.filename}. */
  filename?: string
}
