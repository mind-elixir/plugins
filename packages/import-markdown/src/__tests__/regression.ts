/**
 * Regression baseline for the markdown -> MindElixir conversion.
 *
 * These fixtures pin the behaviour that BOTH host plugins shipped before this
 * package existed:
 *   - VSCode `mark-elixir/src/core.ts`
 *   - Obsidian `obsidian-mindmap/src/parser.ts`
 * Each case below was derived by running the original implementation, so a
 * change in output here means a change in what one of those editors renders.
 *
 * Node ids are randomized (`generateId()`), so every assertion normalizes them
 * to positional tokens before comparing. Positions (`position.start.offset`)
 * are deterministic and are kept as-is.
 *
 * Run: node --experimental-strip-types src/__tests__/regression.ts
 * (or via `pnpm --filter @mind-elixir/import-markdown test`)
 */
import assert from 'node:assert/strict'
import { parseMarkdown, importMarkdownFile } from '../markdown-utils.ts'

/**
 * Fold every generated id to a positional token so two parses of the same
 * document compare equal. ids that came from source offsets are left alone --
 * they are stable and worth asserting on.
 */
const normalize = (node: any, map = new Map<string, string>()): any => {
  if (Array.isArray(node)) return node.map(n => normalize(n, map))
  if (!node || typeof node !== 'object') return node
  const out: any = {}
  for (const [k, v] of Object.entries(node)) {
    out[k] = k === 'id' ? foldId(String(v), map) : normalize(v, map)
  }
  return out
}

const foldId = (id: string, map: Map<string, string>): string => {
  // offset-derived ids are numeric strings, and are deterministic per fixture
  if (/^\d+$/.test(id)) return id
  if (!map.has(id)) map.set(id, `#gen${map.size + 1}#`)
  return map.get(id)!
}

const run = (md: string, options: Parameters<typeof parseMarkdown>[1] = {}) => normalize(parseMarkdown(md, options))

type Case = { name: string; md: string; options?: Parameters<typeof parseMarkdown>[1] }
type Result = { name: string; actual: any }

/**
 * Stand-in for `rehype-highlight`, which the VSCode extension really passes.
 *
 * The point of the fixture is the seam, not the highlighting: tagging every
 * `<code>` proves the plugin ran on the hast tree BEFORE `rehype-stringify`
 * (a `transformHtml` string hook demonstrably could not do this). A real
 * highlighter is a dependency of the host, not of this package.
 */
const markCodeBlocks = () => (tree: any) => {
  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'element' && node.tagName === 'code') {
      node.properties = { ...node.properties, 'data-touched': 'yes' }
    }
    if (Array.isArray(node.children)) node.children.forEach(walk)
  }
  walk(tree)
}

const cases: Case[] = [
  {
    name: 'plain document with no headings',
    md: 'just a paragraph\n',
  },
  {
    name: 'headings build the hierarchy',
    md: '# Title\n\n## Sub A\n\nbody a\n\n## Sub B\n\n### Deep\n',
  },
  {
    name: 'a list directly under the root folds into a single list node',
    md: '- alpha\n- beta\n',
  },
  {
    name: 'a list following a heading becomes that heading children',
    md: '## Section\n\n- one\n- two\n\n## Next\n\ntail\n',
  },
  {
    name: 'a list after a plain paragraph is folded into it (no stray List sibling)',
    md: 'intro para\n\n- one\n- two\n',
  },
  {
    name: 'nested lists stay nested',
    md: '## Section\n\n- one\n  - one.a\n  - one.b\n- two\n',
  },
  {
    name: 'multiple consecutive lists after one heading',
    md: '## Section\n\n- first list\n\n## Other\n\n- second list\n',
  },
  {
    name: 'inline markdown becomes html',
    md: '## Formatting\n\n**bold** and `code` and [link](https://example.com)\n',
  },
  {
    name: 'gfm tables',
    md: '## Table\n\n| a | b |\n| - | - |\n| 1 | 2 |\n',
  },
  {
    name: 'thematic breaks are skipped',
    md: '## A\n\n---\n\n## B\n',
  },
]

// ---- option-specific behaviour -------------------------------------------

const optionCases: Case[] = [
  {
    name: '[h1AsRoot] promotes the first h1 to the root topic',
    md: '# Doc Title\n\nintro\n\n## Sub\n\nbody\n',
    options: { h1AsRoot: true },
  },
  {
    name: '[h1AsRoot] reads multi-child headings (regression: h1.value is undefined)',
    md: '# The **bold** heading\n\n## Sub\n',
    options: { h1AsRoot: true },
  },
  {
    name: '[h1AsRoot] falls back to filename when there is no h1',
    md: '## Only h2\n\nbody\n',
    options: { h1AsRoot: true },
  },
  {
    name: '[frontmatter strip] removes the block (default)',
    md: '---\ntitle: From Frontmatter\n---\n\n## Section\n',
  },
  {
    name: '[frontmatter title] lifts title into the root topic',
    md: '---\ntitle: From Frontmatter\n---\n\n## Section\n',
    options: { frontmatter: 'title' },
  },
  {
    name: '[frontmatter keep] retains the yaml block as a node',
    md: '---\ntitle: Kept\n---\n\n## Section\n',
    options: { frontmatter: 'keep' },
  },
  {
    name: '[imageSize] forces width/height onto images',
    md: '## Pic\n\n![alt](a.png)\n',
    options: { imageSize: { width: 200, height: 100 } },
  },
  {
    name: '[imageSize] absent leaves images untouched',
    md: '## Pic\n\n![alt](a.png)\n',
  },
  {
    name: '[transformHtml] rewrites generated html',
    md: '## Section\n\nplain text\n',
    options: {
      transformHtml: html => html.replace('plain text', 'REPLACED'),
    },
  },
  {
    name: '[rehypePlugins] a hast plugin reaches the generated html',
    md: '## Code\n\n```js\nconst a = 1\n```\n',
    options: { rehypePlugins: [markCodeBlocks] },
  },
  {
    name: '[rehypePlugins] absent leaves the code block unmarked',
    md: '## Code\n\n```js\nconst a = 1\n```\n',
  },
]

const all = [...cases, ...optionCases]

const results: Result[] = all.map(c => ({
  name: c.name,
  actual: run(c.md, c.options),
}))

// ---- the behavioural claims ----------------------------------------------

const find = (name: string) => {
  const r = results.find(x => x.name === name)
  if (!r) throw new Error(`case not found: ${name}`)
  return r.actual
}

/**
 * Concatenate every `dangerouslySetInnerHTML` in a tree.
 *
 * Starts at `nodeData` (the wrapper object itself has no `children` key) and
 * searches the whole tree rather than a guessed level: content lives at
 * whatever depth the heading/list folding puts it, and an assertion that
 * checks the wrong level passes vacuously or fails for the wrong reason.
 */
const allHtml = (data: any): string => {
  const root = data?.nodeData ?? data
  const walk = (node: any): string => {
    if (Array.isArray(node)) return node.map(walk).filter(Boolean).join('\n')
    if (!node || typeof node !== 'object') return ''
    const own = typeof node.dangerouslySetInnerHTML === 'string' ? node.dangerouslySetInnerHTML : ''
    return [own, walk(node.children)].filter(Boolean).join('\n')
  }
  return walk(root)
}

const failures: string[] = []
const check = (label: string, fn: () => void) => {
  try {
    fn()
    console.log(`  ok   ${label}`)
  } catch (e: any) {
    failures.push(`${label}: ${e.message}`)
    console.log(`  FAIL ${label}\n       ${e.message.split('\n')[0]}`)
  }
}

console.log('\nstructure')
check('an h1 becomes the first root child (h1 does not become the root by default)', () => {
  const r = find('headings build the hierarchy')
  assert.equal(r.nodeData.children.length, 1, `got ${r.nodeData.children.length} children`)
  assert.ok(String(r.nodeData.children[0].dangerouslySetInnerHTML || '').includes('<h1>'), 'first child should be the h1')
})
check('sibling h2s become children of that h1', () => {
  const r = find('headings build the hierarchy')
  const h1 = r.nodeData.children[0]
  const h2s = h1.children.filter((c: any) => String(c.dangerouslySetInnerHTML || '').includes('<h2>'))
  assert.equal(h2s.length, 2, `expected 2 h2 children, got ${h2s.length}`)
})
check('h2 keeps its sub-tree', () => {
  const r = find('headings build the hierarchy')
  const subA = r.nodeData.children[0].children[0]
  assert.ok(subA.children.length >= 1, 'expected h2 to own the paragraph and the following h3')
})

console.log('\nlist folding')
check('a lone list at root produces no "List" wrapper', () => {
  const r = find('a list directly under the root folds into a single list node')
  assert.equal(r.nodeData.children.length, 2, 'expected 2 list items')
  assert.ok(
    r.nodeData.children.every((c: any) => c.dangerouslySetInnerHTML),
    'list items should carry html'
  )
})
check('a list after a heading is folded into that heading', () => {
  const r = find('a list following a heading becomes that heading children')
  const section = r.nodeData.children[0]
  assert.ok(
    section.children.length === 2 && section.children.every((c: any) => c.dangerouslySetInnerHTML),
    'expected the 2 bullets under the heading'
  )
})
check('folding a list into a heading does not disturb the following sibling', () => {
  const r = find('a list following a heading becomes that heading children')
  assert.equal(r.nodeData.children.length, 2, 'root must hold exactly the two h2s')
  const next = r.nodeData.children[1]
  assert.equal(next.children.length, 1, 'the second h2 owns only its paragraph')
  assert.ok(String(next.children[0].dangerouslySetInnerHTML || '').startsWith('<p>'), 'the trailing paragraph, not a stray list')
})
check('a list after a plain paragraph is folded into it, leaving no List sibling', () => {
  // Discriminating fixture: with the merge removed this document grows a
  // `List` sibling node, so the child count alone tells the two apart.
  const r = find('a list after a plain paragraph is folded into it (no stray List sibling)')
  assert.equal(r.nodeData.children.length, 1, `root must hold 1 node, got ${r.nodeData.children.length}`)
  const only = r.nodeData.children[0]
  assert.ok(!String(only.topic || '').includes('List'), 'a "List" wrapper node leaked into the tree')
  assert.equal(only.children.length, 2, 'the 2 bullets belong to the paragraph')
})
check('nested lists keep their depth', () => {
  const r = find('nested lists stay nested')
  const one = r.nodeData.children[0].children.find((c: any) => String(c.dangerouslySetInnerHTML || '').includes('one'))
  assert.ok(one, 'expected the "one" item')
  assert.equal(one.children.length, 2, 'expected one.a and one.b')
})

console.log('\nhtml generation')
check('inline markdown is rendered to html', () => {
  const r = find('inline markdown becomes html')
  const html = allHtml(r)
  assert.ok(html.includes('<strong>bold</strong>'), `no <strong> in: ${html}`)
  assert.ok(html.includes('<code>code</code>'), `no <code> in: ${html}`)
  assert.ok(html.includes('href="https://example.com"'), `no link in: ${html}`)
})
check('gfm tables render a <table>', () => {
  const r = find('gfm tables')
  const html = allHtml(r)
  assert.ok(html.includes('<table>'), `no <table> in: ${html}`)
})

console.log('\noptions')
check('[h1AsRoot] sets the root topic from the h1 text', () => {
  const r = find('[h1AsRoot] promotes the first h1 to the root topic')
  assert.equal(r.nodeData.topic, 'Doc Title')
})
check('[h1AsRoot] reads text out of a multi-child heading, not .value', () => {
  const r = find('[h1AsRoot] reads multi-child headings (regression: h1.value is undefined)')
  assert.equal(r.nodeData.topic, 'The bold heading', 'heading text must come from children, via extractText')
  assert.ok(r.nodeData.topic, 'root topic must never be undefined')
})
check('[frontmatter strip] drops the yaml block', () => {
  const r = find('[frontmatter strip] removes the block (default)')
  const html = JSON.stringify(r)
  assert.ok(!html.includes('From Frontmatter'), 'frontmatter leaked into the tree')
})
check('[frontmatter title] lifts title into the root topic', () => {
  const r = find('[frontmatter title] lifts title into the root topic')
  assert.equal(r.nodeData.topic, 'From Frontmatter')
})
check('[imageSize] rewrites img dimensions', () => {
  const r = find('[imageSize] forces width/height onto images')
  const html = allHtml(r)
  assert.ok(html.includes('width="200"'), `no forced width in: ${html}`)
  assert.ok(html.includes('height="100"'), `no forced height in: ${html}`)
})
check('[imageSize] absent does not inject dimensions', () => {
  const r = find('[imageSize] absent leaves images untouched')
  const html = allHtml(r)
  assert.ok(html.includes('<img'), 'expected the image to survive')
  assert.ok(!html.includes('width="200"'), 'dimensions injected unexpectedly')
})
check('[transformHtml] is applied to node html', () => {
  const r = find('[transformHtml] rewrites generated html')
  assert.ok(JSON.stringify(r).includes('REPLACED'), 'transformHtml output did not reach the tree')
})
check('[rehypePlugins] a hast plugin transforms the tree before stringification', () => {
  const r = find('[rehypePlugins] a hast plugin reaches the generated html')
  const html = allHtml(r)
  assert.ok(html.includes('<code'), `expected a code block in: ${html}`)
  assert.ok(html.includes('data-touched="yes"'), `plugin did not run on the hast tree: ${html}`)
})
check('[rehypePlugins] absent is a true negative control (same doc, no plugin)', () => {
  // Without this the case above could pass for the wrong reason -- e.g. if the
  // fixture's markdown somehow already carried the attribute.
  const r = find('[rehypePlugins] absent leaves the code block unmarked')
  const html = allHtml(r)
  assert.ok(html.includes('<code'), `expected a code block in: ${html}`)
  assert.ok(!html.includes('data-touched'), 'the attribute appeared with no plugin supplied')
})

console.log('\nfile entry')
{
  const file = new File(['## From File\n\nbody\n'], 'My Note.md', { type: 'text/markdown' })
  const data = await importMarkdownFile(file)
  check('importMarkdownFile derives the root topic from the file name', () => {
    assert.equal(data.nodeData.topic, 'My Note')
  })
  check('importMarkdownFile parses the body', () => {
    assert.equal(data.nodeData.children.length, 1)
  })
  check('importMarkdownFile accepts overrides', async () => {
    // sanity: an explicit filename wins over the derived one
    const d = await importMarkdownFile(new File(['## X\n'], 'a.md'), { filename: 'Override' })
    assert.equal(d.nodeData.topic, 'Override')
  })
}

console.log('\nrobustness')
check('empty input yields an empty root, not a throw', () => {
  const r = run('')
  assert.equal(r.nodeData.children.length, 0)
})
check('malformed-ish input does not throw', () => {
  const r = run('# \n\n```\nunclosed fence\n')
  assert.ok(r.nodeData, 'expected a root node')
})
check('a per-call transformHtml does not leak into the next parse', () => {
  const withHook = run('## S\n\ntext\n', { transformHtml: () => 'HOOKED' })
  assert.ok(JSON.stringify(withHook).includes('HOOKED'), 'hook did not run')
  const without = run('## S\n\ntext\n')
  assert.ok(!JSON.stringify(without).includes('HOOKED'), "a previous parse's hook leaked into a later one")
})

console.log('\n--- snapshot of every case ---')
for (const r of results) {
  console.log(`\n### ${r.name}`)
  console.log(JSON.stringify(r.actual, null, 2))
}

console.log(`\n${failures.length === 0 ? 'PASS' : `FAIL (${failures.length})`}`)
if (failures.length) {
  for (const f of failures) console.log(` - ${f}`)
  process.exitCode = 1
}
