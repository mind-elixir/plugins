import { importXMindFile, convertXmindToMindElixir } from '@mind-elixir/import-xmind'
import { importFreeMindFile } from '@mind-elixir/import-freemind'
import { launchMindElixir } from '@mind-elixir/open-desktop'
import { downloadMethodList } from '@mind-elixir/export-mindmap'
import MindElixir from 'mind-elixir'
import 'mind-elixir/style.css'
import { plaintextToMindElixir } from 'mind-elixir/plaintextConverter'
import example from 'mind-elixir/example'
import * as modernScreenshot from 'modern-screenshot'
import { domToObjectURL } from '../../export-mindmap/src/scst'
import { snapdom } from '@zumer/snapdom'

// 创建MindElixir实例
const mindElixir = new MindElixir({
  el: '#map',
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

// 测试Plaintext导入
async function testPlaintextImport() {
  try {
    console.log('测试Plaintext导入...')
    const response = await fetch('/sample/plaintext.mept')
    const text = await response.text()

    // 使用导入的plaintextToMindElixir转换数据
    const data = plaintextToMindElixir(text)
    console.log('Plaintext导入成功:', data)
    mindElixir.refresh(data)
  } catch (error) {
    console.error('Plaintext导入失败:', error)
  }
}

// 添加按钮事件
document.addEventListener('DOMContentLoaded', () => {
  const xmindBtn = document.getElementById('test-xmind')
  const freemindBtn = document.getElementById('test-freemind')
  const plaintextBtn = document.getElementById('test-plaintext')
  const exampleBtn = document.getElementById('test-example')

  xmindBtn?.addEventListener('click', testXMindImport)
  freemindBtn?.addEventListener('click', testFreeMindImport)
  plaintextBtn?.addEventListener('click', testPlaintextImport)
  exampleBtn?.addEventListener('click', () => {
    mindElixir.init(example)
  })
})

document.getElementById('test-open-desktop')?.addEventListener('click', () => {
  launchMindElixir(example)
})

// 添加导出功能测试
document.addEventListener('DOMContentLoaded', () => {
  // HTML下载
  document.getElementById('download-html')?.addEventListener('click', () => {
    const htmlMethod = downloadMethodList.find(method => method.type === 'HTML')
    if (htmlMethod) {
      htmlMethod.download(mindElixir)
      console.log('HTML文件下载完成')
    }
  })

  // JSON下载
  document.getElementById('download-json')?.addEventListener('click', () => {
    const jsonMethod = downloadMethodList.find(method => method.type === 'JSON')
    if (jsonMethod) {
      jsonMethod.download(mindElixir)
      console.log('JSON文件下载完成')
    }
  })

  // Markdown下载
  document.getElementById('download-markdown')?.addEventListener('click', () => {
    const markdownMethod = downloadMethodList.find(method => method.type === 'Markdown')
    if (markdownMethod) {
      markdownMethod.download(mindElixir)
      console.log('Markdown文件下载完成')
    }
  })

  // PNG图片下载
  document.getElementById('download-png')?.addEventListener('click', () => {
    const pngMethod = downloadMethodList.find(method => method.type === 'PNG')
    if (pngMethod) {
      pngMethod.download(mindElixir)
      console.log('PNG图片下载完成')
    }
  })

  // JPEG图片下载
  document.getElementById('download-jpeg')?.addEventListener('click', () => {
    const jpegMethod = downloadMethodList.find(method => method.type === 'JPEG')
    if (jpegMethod) {
      jpegMethod.download(mindElixir)
      console.log('JPEG图片下载完成')
    }
  })

  // WEBP图片下载
  document.getElementById('download-webp')?.addEventListener('click', () => {
    const webpMethod = downloadMethodList.find(method => method.type === 'WEBP')
    if (webpMethod) {
      webpMethod.download(mindElixir)
      console.log('WEBP图片下载完成')
    }
  })

  // 性能测试
  document.getElementById('run-benchmark')?.addEventListener('click', async () => {
    const resultsArea = document.getElementById('benchmark-results')!
    const output = document.getElementById('results-output')!
    resultsArea.style.display = 'block'
    output.textContent = 'Running benchmark... Please wait.\n'

    const target = mindElixir.nodes as HTMLElement
    const iterations = 5
    const results = {
      scst: [] as number[],
      modernScreenshot: [] as number[],
      snapdom: [] as number[],
    }

    // Warm up
    await domToObjectURL(target, 'png')
    await modernScreenshot.domToPng(target)
    await snapdom(target)

    // SCST Benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      const url = await domToObjectURL(target, 'png')
      results.scst.push(performance.now() - start)
      URL.revokeObjectURL(url)
    }

    // Modern Screenshot Benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await modernScreenshot.domToPng(target)
      results.modernScreenshot.push(performance.now() - start)
    }

    // Snapdom Benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await snapdom(target)
      results.snapdom.push(performance.now() - start)
    }

    const scstAvg = results.scst.reduce((a, b) => a + b, 0) / iterations
    const modernAvg = results.modernScreenshot.reduce((a, b) => a + b, 0) / iterations
    const snapdomAvg = results.snapdom.reduce((a, b) => a + b, 0) / iterations

    output.textContent = `Iterations: ${iterations}
Target Element Size: ${target.offsetWidth}x${target.offsetHeight}

SCST:
  Average: ${scstAvg.toFixed(2)}ms
  Runs: ${results.scst.map(r => r.toFixed(2) + 'ms').join(', ')}

Modern Screenshot:
  Average: ${modernAvg.toFixed(2)}ms
  Runs: ${results.modernScreenshot.map(r => r.toFixed(2) + 'ms').join(', ')}

Snapdom:
  Average: ${snapdomAvg.toFixed(2)}ms
  Runs: ${results.snapdom.map(r => r.toFixed(2) + 'ms').join(', ')}

Comparison:
  SCST is ${(modernAvg / scstAvg).toFixed(2)}x faster than Modern Screenshot.
  SCST is ${(snapdomAvg / scstAvg).toFixed(2)}x faster than Snapdom.
  Snapdom is ${(modernAvg / snapdomAvg).toFixed(2)}x faster than Modern Screenshot.
`
  })
})
