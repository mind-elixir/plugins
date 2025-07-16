import { importXMindFile, convertXmindToMindElixir } from '@mind-elixir/import-xmind'
import { importFreeMindFile } from '@mind-elixir/import-freemind'
import MindElixir from 'mind-elixir'

// 创建MindElixir实例
const mindElixir = new MindElixir({
  el: '#map',
  direction: MindElixir.LEFT,
  draggable: true,
  contextMenu: true,
  toolBar: true,
  keypress: true,
})

mindElixir.init(MindElixir.new('测试思维导图'))

// 测试XMind导入
async function testXMindImport() {
  try {
    console.log('测试XMind导入...')
    const response = await fetch('/sample/summary_test.xmind')
    const arrayBuffer = await response.arrayBuffer()

    // 创建File对象
    const file = new File([arrayBuffer], 'test.xmind', { type: 'application/vnd.xmind' })
    const sheets = await importXMindFile(file)

    // 使用第一个sheet的数据
    if (sheets && sheets.length > 0) {
      console.log('XMind导入成功:', sheets[0])
      const mindElixirData = convertXmindToMindElixir(sheets[0])
      mindElixir.refresh(mindElixirData)
    }
  } catch (error) {
    console.error('XMind导入失败:', error)
  }
}

// 测试FreeMind导入
async function testFreeMindImport() {
  try {
    console.log('测试FreeMind导入...')
    const response = await fetch('/sample/freemind.mm')
    const text = await response.text()

    // 创建File对象
    const file = new File([text], 'test.mm', { type: 'application/x-freemind' })
    const data = await importFreeMindFile(file)
    console.log('FreeMind导入成功:', data)
    mindElixir.refresh(data)
  } catch (error) {
    console.error('FreeMind导入失败:', error)
  }
}

// 添加按钮事件
document.addEventListener('DOMContentLoaded', () => {
  const xmindBtn = document.getElementById('test-xmind')
  const freemindBtn = document.getElementById('test-freemind')
  
  xmindBtn?.addEventListener('click', testXMindImport)
  freemindBtn?.addEventListener('click', testFreeMindImport)
})
