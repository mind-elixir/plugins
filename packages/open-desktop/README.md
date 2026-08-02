# @mind-elixir/open-desktop

在浏览器中启动 Mind Elixir Desktop 应用并传输思维导图数据的 JavaScript 库。

## 安装

```bash
npm install @mind-elixir/open-desktop
```

## 使用方法

```typescript
import { launchMindElixir } from '@mind-elixir/open-desktop'
import type { MindElixirData } from 'mind-elixir'

const mindmapData: MindElixirData = {
  nodeData: {
    id: 'root',
    topic: '中心主题',
    children: [],
  },
  linkData: [],
}

try {
  await launchMindElixir(mindmapData)
} catch (error) {
  console.error('启动失败:', error)
}
```

### 自定义配置

```typescript
import { launchAndCreateMindmap } from '@mind-elixir/open-desktop'

await launchAndCreateMindmap(mindmapData, source, {
  appUrl: 'mind-elixir://open',
  serviceUrl: 'http://127.0.0.1:6595/create-mindmap',
  pingUrl: 'http://127.0.0.1:6595/ping',
  timeout: 8000, // 应用启动超时（毫秒）
  settleDelay: 1000, // 服务就绪后等待前端加载完成（毫秒）
})
```

## API

### `launchMindElixir(mindmapData, source?, options?)`

启动 Mind Elixir Desktop 应用并传输思维导图数据。`launchAndCreateMindmap` 为其别名。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `mindmapData` | `MindElixirData` | 思维导图数据 |
| `source` | `string` | 数据来源 URL，默认当前页面 URL |
| `options.appUrl` | `string` | 应用协议 URL |
| `options.serviceUrl` | `string` | 服务端点 URL |
| `options.pingUrl` | `string` | 健康检查端点 URL |
| `options.timeout` | `number` | 应用启动超时，默认 `8000` |
| `options.settleDelay` | `number` | 服务就绪后等待时间，默认 `1000` |

返回 `Promise<void>`。未安装应用时，会自动打开下载页面，并抛出错误 `"未安装 Mind Elixir Desktop"`；其他失败场景分别抛出 `"服务启动超时"` 或 `"发送思维导图数据失败"`。

## 系统要求

- 现代浏览器（支持 ES2017+）
- Mind Elixir Desktop 应用（[下载地址](https://desktop.mind-elixir.com/)）

## 许可证

MIT License

## 相关链接

- [Mind Elixir](https://github.com/ssshooter/mind-elixir-core) - 核心思维导图库
