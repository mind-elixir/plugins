import type { MindElixirData } from 'mind-elixir'

const FALLBACK_URL = 'https://desktop.mind-elixir.com/'
const DEFAULT_APP_URL = 'mind-elixir://open'
const DEFAULT_SERVICE_URL = 'http://127.0.0.1:6595/create-mindmap'
const DEFAULT_PING_URL = 'http://127.0.0.1:6595/ping'
const DEFAULT_SERVICE_TIMEOUT = 10000
const DEFAULT_LAUNCH_TIMEOUT = 8000
const DEFAULT_SETTLE_DELAY = 1000
const PING_INTERVAL = 100

/**
 * 唤起 App。
 * 使用顶层导航到自定义协议（必须在用户手势中调用），
 * 已注册的协议会启动 App 且不会使页面跳转或卸载。
 */
const openApp = (url: string) => {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/**
 * 打开下载页面
 */
const openDownloadPage = () => {
  const win = window.open(FALLBACK_URL, '_blank')
  if (!win) {
    window.location.href = FALLBACK_URL
  }
}

/**
 * 延迟指定毫秒
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 快速检查服务当前是否可用（应用是否已在运行）
 */
const isServiceUp = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url)
    return response.ok
  } catch (error) {
    return false
  }
}

/**
 * 等待服务可用
 * @param url 服务URL
 * @param timeout 超时时间（毫秒）
 */
const waitForService = (url: string, timeout: number = DEFAULT_SERVICE_TIMEOUT): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const checkService = async () => {
      try {
        const response = await fetch(url)
        if (response.ok) {
          resolve()
          return
        }
      } catch (error) {
        // 服务还未启动，继续等待
      }

      // 检查是否超时
      if (Date.now() - startTime > timeout) {
        reject(new Error('服务启动超时'))
        return
      }

      // 100ms后再次检查
      setTimeout(checkService, PING_INTERVAL)
    }

    checkService()
  })
}

/**
 * 启动 Mind Elixir 并发送思维导图数据
 * @param mindmapData 思维导图数据
 * @param source 数据来源URL
 * @param options 配置选项
 */
export const launchMindElixir = async (
  mindmapData: MindElixirData,
  source?: string,
  options: {
    appUrl?: string
    serviceUrl?: string
    pingUrl?: string
    timeout?: number
    settleDelay?: number
  } = {}
): Promise<void> => {
  const {
    appUrl = DEFAULT_APP_URL,
    serviceUrl = DEFAULT_SERVICE_URL,
    pingUrl = DEFAULT_PING_URL,
    timeout = DEFAULT_LAUNCH_TIMEOUT,
    settleDelay = DEFAULT_SETTLE_DELAY,
  } = options

  // 先检测应用是否已在运行
  const appWasRunning = await isServiceUp(pingUrl)

  // 唤起 Mind Elixir 应用
  openApp(appUrl)

  if (!appWasRunning) {
    // 应用刚启动：等待本地服务可用，超时则判定未安装并打开下载页
    try {
      await waitForService(pingUrl, timeout)
    } catch (error) {
      openDownloadPage()
      throw new Error('未安装 Mind Elixir Desktop')
    }

    // 服务已就绪但前端 WebView 可能仍在加载事件监听器，
    // 等待片刻再发送，避免首次数据被丢弃
    await delay(settleDelay)
  }

  // 发送思维导图数据
  const response = await fetch(serviceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mindmap: JSON.stringify(mindmapData),
      source: source || window.location.href,
    }),
  })

  if (!response.ok) {
    throw new Error('发送思维导图数据失败')
  }

  console.log('思维导图已成功发送到 Mind Elixir')
}

export const launchAndCreateMindmap = launchMindElixir
