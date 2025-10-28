### Front project

智能体平台前端项目

#### 项目概述

这是一个基于 React 18 + UmiJS Max + Ant Design 的智能体平台前端项目，提供智能体开发、管理和使用的完整解决方案。项目集成了先进的 AI Agent 系统，支持文件管理、代码编辑、实时预览和 AI 助手聊天功能。

##### 技术栈

- **前端框架**: React 18 + TypeScript 5.0
- **UI 组件库**: Ant Design 5.4 + ProComponents
- **代码编辑器**: Monaco Editor 0.53.0
- **图形引擎**: AntV X6 2.18.1
- **框架工具**: UmiJS Max 4.x
- **状态管理**: UmiJS 内置 model
- **样式方案**: CSS Modules + Less
- **包管理**: pnpm 10.17.1
- **SSE 通信**: @microsoft/fetch-event-source 2.0.1

##### 主要功能

- **智能体开发与管理**：完整的智能体创建、配置和管理功能
- **AppDev Web IDE**：集成开发环境，支持文件管理、代码编辑和实时预览
- **AI 助手聊天**：基于新的 OpenAPI 规范的实时 AI 对话功能，支持流式响应和工具调用
- **工作空间管理**：项目文件树管理、文件上传和版本控制
- **知识库管理**：智能体知识库的创建和维护
- **组件库管理**：可复用组件的管理和发布
- **MCP 服务管理**：Model Context Protocol 服务集成
- **生态系统管理**：插件、模板和服务的生态系统
- **🎨 动态主题背景切换**：支持 8 种预设背景图片，实时切换，状态持久化

##### AI 聊天接口更新

###### 🔄 接口变更说明

项目已更新为基于新的 OpenAPI 规范的 AI 聊天接口：

##### 主题背景切换功能

###### ✨ 主要特性

- **8 种预设背景**：提供多种风格的背景图片选择
- **实时切换**：背景图片切换即时生效，无需刷新页面
- **状态持久化**：用户选择的背景图片会保存到本地存储
- **主题适配**：支持明暗主题，背景图片在不同主题下都有良好的显示效果
- **响应式设计**：背景图片自适应不同屏幕尺寸
- **多语言支持**：支持中英文界面

###### 🚀 使用方法

1. **通过主题控制面板**：在页面右下角点击"背景"按钮选择背景图片
2. **在主题演示页面**：访问 `/examples` 路由下的主题演示页面进行测试

###### 📁 相关文件

- `src/hooks/useGlobalSettings.ts` - 背景状态管理
- `src/components/ThemeControlPanel/` - 背景选择器组件
- `src/layouts/index.tsx` - 背景应用逻辑
- `docs/background-switching.md` - 详细功能文档

##### 项目结构

```text
src/
├── components/          # 通用组件库
│   ├── base/           # 基础组件
│   ├── business-component/ # 业务组件
│   └── custom/         # 自定义组件
├── pages/              # 页面组件
│   ├── AppDev/         # 应用开发页面
│   │   ├── components/  # AppDev 专用组件
│   │   │   ├── FileTree/    # 文件树组件
│   │   │   ├── MonacoEditor/# Monaco 编辑器组件
│   │   │   ├── Preview/     # 预览组件
│   │   │   └── AppDevHeader.tsx # 页面头部组件
│   │   ├── index.tsx   # 主页面
│   │   └── index.less  # 页面样式
│   └── ...             # 其他页面
├── hooks/              # 自定义 Hooks
│   ├── useAppDevChat.ts      # AI 聊天功能
│   ├── useAppDevFileManagement.ts # 文件管理
│   ├── useAppDevServer.ts    # 开发服务器管理
│   └── ...             # 其他业务 Hooks
├── models/             # 数据模型和状态管理
│   └── appDev.ts       # 应用开发相关状态
├── services/           # API 服务层
│   ├── appDev.ts       # 应用开发相关 API
│   └── ...             # 其他业务 API
├── types/              # TypeScript 类型定义
│   ├── interfaces/     # 接口类型定义
│   └── ...             # 其他类型定义
├── utils/              # 工具函数
│   ├── monacoConfig.ts # Monaco Editor 配置
│   ├── sseManager.ts   # SSE 连接管理
│   └── ...             # 其他工具函数
├── constants/          # 常量定义
├── styles/             # 全局样式
└── examples/           # 功能演示页面

public/
└── bg/                 # 背景图片资源
```

##### 开发指南

###### 环境要求

- **Node.js**: >= 18.0.0 (推荐使用 LTS 版本)
- **包管理器**: pnpm >= 8.0.0 (推荐) 或 npm >= 8.0.0
- **操作系统**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

###### 快速开始

####### 1. 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

####### 2. 启动开发服务器

```bash
# 使用 pnpm
pnpm dev

# 或使用 npm
npm run dev
```

####### 4. 访问应用

打开浏览器访问 `http://localhost:8000`

###### 构建和部署

####### 开发环境构建

```bash
pnpm build:dev
```

####### 生产环境构建

```bash
pnpm build:prod
```

####### 本地预览构建结果

```bash
pnpm serve
```

###### 代码规范

- **TypeScript**: 所有新文件必须使用 TypeScript，组件 Props 和 State 必须有类型注解
- **组件开发**: 使用函数式组件和 Hooks，组件文件命名采用 PascalCase
- **样式方案**: 使用 CSS Modules 避免全局污染，Less 变量统一管理
- **状态管理**: 全局状态使用 UmiJS model，局部状态使用 useState/useReducer
- **性能优化**: 使用 `useMemo` 和 `useCallback` 优化渲染，路由和组件必须懒加载
- **代码质量**: 遵循 ESLint 和 Prettier 规范，每个组件必须有详细的 JSDoc 注释

##### 性能优化

- **路由懒加载**: 使用 React.lazy 和 UmiJS 的动态加载
- **组件懒加载**: Monaco Editor 按需加载，减少首屏体积
- **状态优化**: 使用 `useMemo` 和 `useCallback` 避免不必要的渲染
- **资源优化**: 图片懒加载和压缩，静态资源缓存
- **代码分割**: 合理拆分业务模块，避免单文件过大

##### 部署说明

###### 环境变量配置

- `UMI_ENV`: 环境标识（development/production）
- `NODE_ENV`: Node.js 环境标识
- 其他自定义环境变量

###### 构建优化

- 代码分割和懒加载
- 资源压缩和缓存
- Monaco Editor 按需加载
