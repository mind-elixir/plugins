import { NodeObj } from 'mind-elixir'

export const convertToMd = (data: NodeObj, highlight?:NodeObj) => {
  let md = ''
  const walk = (node: NodeObj, level = 0) => {
    if (highlight && node.id === highlight.id) {
      md += '  '.repeat(level) + `- **${node.topic} (You Should Insert Sub-Node Here)**\n`
    } else {
      md += '  '.repeat(level) + `- ${node.topic}\n`
    } 
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => walk(child, level + 1))
    }
  }
  walk(data)
  return md
}
