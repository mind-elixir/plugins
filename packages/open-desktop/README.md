# @mind-elixir/open-desktop

一个用于在浏览器中启动 Mind Elixir Desktop 应用并传输思维导图数据的 JavaScript 库。

## 功能特性

- 🚀 自动检测并启动 Mind Elixir Desktop 应用
- 📡 通过本地服务传输思维导图数据
- 🔄 智能回退机制：未安装应用时自动跳转到下载页面
- ⏱️ 可配置的超时和重试机制
- 📦 TypeScript 支持

## 安装

```bash
npm install @mind-elixir/open-desktop
```

或者使用 yarn：

```bash
yarn add @mind-elixir/open-desktop
```

## 使用方法

### 基本用法

```typescript
import { launchMindElixir } from '@mind-elixir/open-desktop'
import type { MindElixirData } from 'mind-elixir'

// 准备思维导图数据
const mindmapData: MindElixirData = {
  nodeData: {
    id: 'root',
    topic: '中心主题',
    children: [
      {
        id: 'node1',
        topic: '分支1',
        children: []
      },
      {
        id: 'node2',
        topic: '分支2',
        children: []
      }
    ]
  },
  linkData: []
}

// 启动 Mind Elixir 并传输数据
try {
  await launchMindElixir(mindmapData)
  console.log('思维导图已成功发送到 Mind Elixir Desktop')
} catch (error) {
  console.error('启动失败:', error)
}
```

### 高级配置

```typescript
import { launchMindElixir } from '@mind-elixir/open-desktop'

const mindmapData = { /* 你的思维导图数据 */ }
const source = 'https://your-website.com' // 可选：数据来源URL

const options = {
  appUrl: 'mind-elixir://open',                    // 应用协议URL
  serviceUrl: 'http://127.0.0.1:6595/create-mindmap', // 服务端点
  pingUrl: 'http://127.0.0.1:6595/ping',           // 健康检查端点
  timeout: 10000                                   // 超时时间（毫秒）
}

try {
  await launchMindElixir(mindmapData, source, options)
} catch (error) {
  if (error.message === '未安装 Mind Elixir Desktop') {
    // 用户将被自动重定向到下载页面
    console.log('请安装 Mind Elixir Desktop 应用')
  } else {
    console.error('其他错误:', error)
  }
}
```

## API 文档

### `launchMindElixir(mindmapData, source?, options?)`

启动 Mind Elixir Desktop 应用并传输思维导图数据。

#### 参数

- **mindmapData** (`MindElixirData`): 思维导图数据对象
- **source** (`string`, 可选): 数据来源URL，默认为当前页面URL
- **options** (`object`, 可选): 配置选项
  - **appUrl** (`string`): 应用协议URL，默认 `'mind-elixir://open'`
  - **serviceUrl** (`string`): 服务端点URL，默认 `'http://127.0.0.1:6595/create-mindmap'`
  - **pingUrl** (`string`): 健康检查端点URL，默认 `'http://127.0.0.1:6595/ping'`
  - **timeout** (`number`): 服务启动超时时间（毫秒），默认 `8000`

#### 返回值

返回一个 `Promise<void>`，成功时解析，失败时抛出错误。

#### 错误处理

- `"未安装 Mind Elixir Desktop"`: 检测到用户未安装应用，会自动打开下载页面
- `"服务启动超时"`: 应用启动超时
- `"发送思维导图数据失败"`: 数据传输失败

## 工作原理

1. **应用检测**: 使用自定义协议 `mind-elixir://` 尝试启动桌面应用
2. **回退机制**: 如果应用未安装，自动重定向到 Mind Elixir Desktop 下载页面
3. **服务等待**: 等待本地服务 (端口 6595) 启动并可用
4. **数据传输**: 通过 HTTP POST 请求将思维导图数据发送到本地服务

## 系统要求

- 现代浏览器（支持 ES2017+）
- Mind Elixir Desktop 应用（用于完整功能）

## 开发

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建
npm run build

# 类型检查
npm run check-types

# 清理构建文件
npm run clean
```

## 许可证

MIT License

## 相关链接

- [Mind Elixir](https://github.com/ssshooter/mind-elixir-core) - 核心思维导图库
- [Mind Elixir Desktop](https://desktop.mind-elixir.com/) - 桌面应用下载

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### 0.0.1

- 初始版本
- 支持启动 Mind Elixir Desktop 应用
- 支持传输思维导图数据
- 智能回退机制

### 0.0.2

- 导出 openAppWithFallback 方法，可以直接打开地址（无其他操作）
- launchMindElixir 重命名为 launchAndCreateMindmap
