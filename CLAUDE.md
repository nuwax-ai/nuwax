# Claude AI Agent Platform Frontend

## 项目概述

这是一个基于 React + Umi.js 的 AI Agent 平台前端项目，提供 Web 集成开发环境（IDE）功能，包括文件管理、代码编辑、实时预览和 AI 助手聊天功能。

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Umi.js 4.x
- **UI 库**: Ant Design 5.x
- **代码编辑器**: Monaco Editor
- **样式**: Less + CSS Modules
- **状态管理**: Zustand
- **网络请求**: 封装的 axios 服务

## 项目结构

```
src/
├── components/          # 公共组件
│   └── WebIDE/          # Web IDE 相关组件
│       ├── FileTree/    # 文件树组件
│       ├── MonacoEditor/# Monaco 编辑器组件
│       └── Preview/     # 预览组件
├── models/              # 数据模型
│   └── appDev.ts        # 应用开发相关状态
├── pages/               # 页面组件
│   └── AppDev/          # 应用开发页面
├── services/            # API 服务
│   └── appDev.ts        # 应用开发相关 API
├── types/               # TypeScript 类型定义
│   └── interfaces/      # 接口类型定义
├── utils/               # 工具函数
│   ├── monacoConfig.ts  # Monaco Editor 配置
│   └── sseManager.ts    # SSE 连接管理
└── styles/              # 全局样式
```

## 核心功能

### 1. 文件树管理

- 支持文件夹展开/折叠
- 文件选择和编辑
- 文件创建、删除操作
- 文件内容实时预览

### 2. 代码编辑器

- 集成 Monaco Editor
- 支持多种编程语言语法高亮
- TypeScript/JavaScript 智能提示
- 实时保存和自动保存功能

### 3. 实时预览

- 支持网页实时预览
- 图片文件预览
- 响应式布局适配

### 4. AI 助手聊天

- SSE 实时连接
- 聊天消息流式显示
- AI 思考过程展示
- 工具调用状态显示

### 5. 项目管理

- 项目上传和导入
- 开发服务器管理
- 保活机制

## 开发环境

### 环境要求

- Node.js >= 16.0.0
- npm 或 pnpm

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 启动开发服务器

```bash
npm run dev
# 或
pnpm dev
```

### 构建生产版本

```bash
npm run build
# 或
pnpm build
```

## 核心组件说明

### AppDev 页面

主应用开发页面，包含：

- 左侧 AI 助手面板
- 右侧代码编辑器和预览区域
- 文件树侧边栏（可折叠）

### MonacoEditor 组件

基于 Monaco Editor 的代码编辑器组件：

- 支持动态语言切换
- 自定义主题和配置
- 实时内容同步

### FileTree 组件

文件树展示组件：

- 支持拖拽操作
- 文件/文件夹图标显示
- 右键菜单操作

### Preview 组件

项目预览组件：

- iframe 嵌入式预览
- 自动刷新功能
- 全屏预览支持

## 状态管理

使用 Zustand 进行状态管理，主要状态包括：

- `workspace`: 工作区信息
- `activeFile`: 当前活跃文件
- `fileContents`: 文件内容缓存
- `devServerUrl`: 开发服务器地址

## API 服务

### 核心接口

- `getProjectContent`: 获取项目内容
- `getFileContent`: 获取文件内容
- `startDev`: 启动开发环境
- `sendChatMessage`: 发送聊天消息
- `uploadAndStartProject`: 上传项目

## 开发指南

### 添加新的文件类型支持

1. 在 `utils/monacoConfig.ts` 中添加语言映射
2. 在 MonacoEditor 组件中添加对应的语言支持

### 自定义主题

在 `styles/` 目录下修改 Less 变量，支持亮色/暗色主题切换。

### 添加新的 AI 功能

1. 在 `services/appDev.ts` 中添加对应的 API 接口
2. 在 SSE Manager 中处理新的消息类型
3. 在组件中添加相应的 UI 交互

## Mock 模式开发指南

### 概述

AppDev 支持 Mock 模式，可以在后端服务不可用时进行前端开发和调试。在开发环境下，Mock 模式默认启用。

### Mock 模式控制

#### 自动启用（推荐）

开发环境下 Mock 模式默认启用，无需额外操作。

#### URL 参数控制

- `?mock=true`：强制启用 Mock 模式
- `?mock=false`：强制禁用 Mock 模式

#### localStorage 控制

```javascript
// 启用Mock模式
localStorage.setItem('appdev-mock-mode', 'true');
window.location.reload();

// 禁用Mock模式
localStorage.setItem('appdev-mock-mode', 'false');
window.location.reload();

// 重置到默认状态（开发环境默认启用）
localStorage.removeItem('appdev-mock-mode');
window.location.reload();
```

### Mock 功能特性

1. **开发服务器管理**：启动、停止、重启开发服务器
2. **项目上传**：模拟文件上传和项目创建
3. **项目构建**：模拟构建过程和状态
4. **数据持久化**：内存存储，会话保持

### Mock API 端点

- `POST /api/custom-page/start-dev` - 启动开发环境
- `POST /api/custom-page/stop-dev` - 停止开发环境
- `POST /api/custom-page/restart-dev` - 重启开发环境
- `POST /api/custom-page/build` - 构建项目
- `POST /api/custom-page/upload-and-start` - 上传并启动项目

### 开发调试技巧

- Mock 模式会模拟 300ms 的网络延迟
- 开发服务器端口在 3000-4000 范围内随机生成
- 控制台会输出详细的调试信息

## 开发服务器管理

### 功能特性

1. **启动服务**：自动分配端口并启动开发服务器
2. **停止服务**：停止服务器并清空预览 URL
3. **重启服务**：重启服务器并自动刷新预览
4. **状态监控**：实时显示服务器运行状态

### API 接口

```typescript
// 启动开发环境
POST /api/custom-page/start-dev
{ projectId: string }

// 停止开发环境
POST /api/custom-page/stop-dev
{ projectId: string }

// 重启开发环境
POST /api/custom-page/restart-dev
{ projectId: string }

// 检查服务状态
GET /api/custom-page/dev-status?projectId=xxx
```

### 自动刷新机制

Preview 组件通过 useEffect 监听 `devServerUrl` 状态变化，自动刷新预览内容：

- 停止服务后自动清空预览
- 重启服务后自动加载新 URL
- 无需手动刷新操作

## 部署说明

### 环境变量配置

- `UMI_ENV`: 环境标识（development/production）
- `NODE_ENV`: Node.js 环境标识
- 其他自定义环境变量

### 构建优化

- 代码分割和懒加载
- 资源压缩和缓存
- Monaco Editor 按需加载

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码变更
4. 创建 Pull Request

## 许可证

MIT License
