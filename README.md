# MindElixir Plugins Monorepo

一个基于 pnpm workspace 的 monorepo，提供 MindElixir 思维导图的扩展功能包，包括文件导入、导出和桌面应用支持。

## 📦 包概览

| 包名 | 版本 | 描述 |
|------|------|------|
| [@mind-elixir/import-xmind](./packages/import-xmind) | ![npm](https://img.shields.io/npm/v/@mind-elixir/import-xmind) | XMind 文件导入功能 |
| [@mind-elixir/import-freemind](./packages/import-freemind) | ![npm](https://img.shields.io/npm/v/@mind-elixir/import-freemind) | FreeMind 文件导入功能 |
| [@mind-elixir/export-mindmap](./packages/export-mindmap) | ![npm](https://img.shields.io/npm/v/@mind-elixir/export-mindmap) | 思维导图导出功能 |
| [@mind-elixir/open-desktop](./packages/open-desktop) | ![npm](https://img.shields.io/npm/v/@mind-elixir/open-desktop) | 桌面应用支持 |
| [test-app](./packages/test-app) | - | 功能测试应用 |

## 🏗️ 项目结构

```
├── .changeset/                # 版本管理配置
├── packages/
│   ├── import-xmind/          # XMind 导入包
│   ├── import-freemind/       # FreeMind 导入包
│   ├── export-mindmap/        # 导出功能包
│   ├── open-desktop/          # 桌面应用包
│   ├── test-app/              # 测试应用
│   └── typescript-config/     # 共享 TS 配置
├── sample/                    # 示例文件
├── package.json               # 根配置
├── pnpm-workspace.yaml        # workspace 配置
├── turbo.json                 # 构建配置
└── tsconfig.json              # TS 项目引用
```

## 🚀 快速开始

### 安装依赖

```bash
# 克隆仓库
git clone <repository-url>
cd plugins

# 安装所有依赖
pnpm install
```

### 开发工作流

```bash
# 构建所有包
pnpm build

# 开发模式（监听文件变化）
pnpm dev

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 启动测试应用
pnpm --filter test-app dev
```

### 包管理

```bash
# 为特定包添加依赖
pnpm --filter @mind-elixir/import-xmind add <dependency>

# 构建特定包
pnpm --filter @mind-elixir/import-xmind build

# 发布包（使用 changeset）
pnpm changeset
pnpm changeset version
pnpm publish -r
```

## 📖 使用包

```bash
# 安装 XMind 导入包
npm install @mind-elixir/import-xmind

# 安装 FreeMind 导入包
npm install @mind-elixir/import-freemind

# 安装导出功能包
npm install @mind-elixir/export-mindmap
```

## 📚 文档

详细的使用说明请参考各个包的 README 文件：

- [XMind 导入包](./packages/import-xmind/README.md) - XMind 文件导入功能
- [FreeMind 导入包](./packages/import-freemind/README.md) - FreeMind 文件导入功能
- [导出功能包](./packages/export-mindmap/README.md) - 思维导图导出功能
- [桌面应用包](./packages/open-desktop/README.md) - 桌面应用支持
- [测试应用](./packages/test-app/README.md) - 功能测试和演示

## 🛠️ 技术栈

- **构建工具**: Vite + TypeScript
- **包管理**: pnpm workspace
- **版本管理**: Changeset
- **构建系统**: Turbo
- **代码规范**: ESLint + Prettier

### 开发规范

- 遵循现有的代码风格
- 为新功能添加测试
- 更新相关文档
- 使用 `pnpm changeset` 记录变更

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 🔗 相关项目

- [MindElixir](https://github.com/ssshooter/mind-elixir-core) - 核心思维导图库
- [XMind](https://www.xmind.net/) - XMind 思维导图软件
- [FreeMind](http://freemind.sourceforge.net/) - FreeMind 思维导图软件
