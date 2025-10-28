# Nuwax
Nuwax AI - Easily build and deploy your private Agentic AI solutions.

官网地址：https://nuwax.com

体验地址：https://agent.nuwax.com

# 安装部署

借助于官方提供的 nuwax-cli 命令工具，来快速本地部署服务。

## 🚀 快速开始

### 环境准备

#### 系统要求
- **系统要求：** Ubuntu22.04LTS或以上版本（其他linux版本未充分测试），macOS 10.15+，Windows 10/11（后续支持）
- **配置要求：** 4核8G或以上
- **环境要求：** docker、docker-compose 环境 [docker安装指南](deploy#docker环境安装)

#### 支持的平台
- **Linux**: x86_64, ARM64
    - Ubuntu 22.04 LTS（推荐）
    - 当前用户需要有 Docker 权限，验证方式`docker ps`，查看是否有权限问题， 碰到权限问题，可以使用 sudo 权限运行。
- **macOS**: Intel, Apple Silicon (M1/M2), Universal
    - macOS 10.15 (Catalina) 及以上版本
    - 推荐使用OrbStack（个人免费，性能更佳）
    - 确保 OrbStack 或 Docker Desktop 已启动
    - 首次运行可能需要允许未知开发者：系统偏好设置 → 安全性与隐私

### 客户端下载
> 客户端仅作为运维工具，不包含平台软件包
- [nuwax-cli-linux-amd64.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.38/nuwax-cli-linux-amd64.tar.gz)
- [nuwax-cli-linux-arm64.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.38/nuwax-cli-linux-arm64.tar.gz)
- [nuwax-cli-macos-universal.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.38/nuwax-cli-macos-universal.tar.gz)（amd64&arm64）

### 执行命令完成部署

执行以下命令需要有docker权限，或者使用sudo运行

#### Linux / macOS
```bash
# 示例工作目录
mkdir nuwax_deploy
cd nuwax_deploy

# 将下载的客户端端文件解压到工作目录
tar -xzf nuwax-cli-*.tar.gz

# 添加执行权限
chmod +x nuwax-cli

./nuwax-cli init
./nuwax-cli auto-upgrade-deploy run
```

正常情况下，执行完命令后，服务就已经部署好了。

### 访问服务

部署完成后，在浏览器访问：`http://localhost`

使用默认管理员账号登录：`admin@nuwax.com/123456`

> 注：如果80端口被占用，可以成功部署，但访问页面会有问题，可以部署指定端口，比如： ./nuwax-cli auto-upgrade-deploy run --port 8099

### 重要配置
登录后请及时修改：
- 管理员密码
- 站点信息配置

  ![alt text](https://nuwax.com/images/image-101.png)

- 邮件服务配置，用于你的用户登录注册收取验证码。

  ![alt text](https://nuwax.com/images/image-91.png)

### 部署故障排查

如果自动部署失败，可以再尝试一次执行自动部署执行：

1. **初始化配置**
   同一个工作目录下，只需执行一次初始化，如果重复执行了也没关系，不用担心重复初始化导致问题，除非你增加参数: --force 强制重新初始化，会进行覆盖初始化动作。
   ```bash
   # 初始化，第一次使用需要执行
   ./nuwax-cli init
   ```

1. **自动部署**
   会自动检测下载最新的应用服务，然后升级应用服务进行部署。但操作很重，只是重启服务的话，见：`./nuwax-cli docker-service` 相关命令使用。

   ```bash
   # 一键部署命令示例
   ./nuwax-cli  auto-upgrade-deploy run 
   ```


## 常用管理命令

### 服务管理
- 启动服务：`./nuwax-cli docker-service start`
- 停止服务：`./nuwax-cli docker-service stop`
- 重启服务：`./nuwax-cli docker-service restart`
- 检查状态：`./nuwax-cli docker-service status`

### 备份管理
备份服务，需要停止Docker应用服务器，建议业务低谷时，操作备份。

> 停止服务使用: `./nuwax-cli docker-service stop`

- **一键备份：**
    - 手动执行一次备份：`./nuwax-cli auto-backup run`
    - 列出所有备份：`./nuwax-cli list-backups`
    - 从备份恢复：`./nuwax-cli rollback [BACKUP_ID]`

### 升级管理

**应用服务升级，使用命令`./nuwax-cli auto-upgrade-deploy run` 会自动检测下载新版本，自动部署。**

如果之前下载过应用服务，但认为下载的文件有损坏，可以强制使用重新下载。
> upgrade 命令不会自动安装,用于检查有无最新版本应用文件使用，和下载应用服务文件。
- 强制重新下载：`./nuwax-cli upgrade --force`

注：如果之前的数据不想要了，全新部署，可以删除工作目录下的: `docker` 文件夹，然后执行 `./nuwax-cli auto-upgrade-deploy run` 命令自动部署。

一次升级完整命令如下:

```shell
# 检查运维客户端是否有新版本并更新
./nuwax-cli check-update install
# 更新应用服务
./nuwax-cli auto-upgrade-deploy run
```


## Agent Platform Front

智能体平台前端项目

### 项目概述

这是一个基于 React 18 + UmiJS Max + Ant Design 的智能体平台前端项目，提供智能体开发、管理和使用的完整解决方案。项目集成了先进的 AI Agent 系统，支持文件管理、代码编辑、实时预览和 AI 助手聊天功能。

### 技术栈

- **前端框架**: React 18 + TypeScript 5.0
- **UI 组件库**: Ant Design 5.4 + ProComponents
- **代码编辑器**: Monaco Editor 0.53.0
- **图形引擎**: AntV X6 2.18.1
- **框架工具**: UmiJS Max 4.x
- **状态管理**: UmiJS 内置 model
- **样式方案**: CSS Modules + Less
- **包管理**: pnpm 10.17.1
- **SSE 通信**: @microsoft/fetch-event-source 2.0.1

### 主要功能

- **智能体开发与管理**：完整的智能体创建、配置和管理功能
- **AppDev Web IDE**：集成开发环境，支持文件管理、代码编辑和实时预览
- **AI 助手聊天**：基于新的 OpenAPI 规范的实时 AI 对话功能，支持流式响应和工具调用
- **工作空间管理**：项目文件树管理、文件上传和版本控制
- **知识库管理**：智能体知识库的创建和维护
- **组件库管理**：可复用组件的管理和发布
- **MCP 服务管理**：Model Context Protocol 服务集成
- **生态系统管理**：插件、模板和服务的生态系统
- **🎨 动态主题背景切换**：支持 8 种预设背景图片，实时切换，状态持久化

### AI 聊天接口更新

#### 🔄 接口变更说明

项目已更新为基于新的 OpenAPI 规范的 AI 聊天接口：

### 主题背景切换功能

#### ✨ 主要特性

- **8 种预设背景**：提供多种风格的背景图片选择
- **实时切换**：背景图片切换即时生效，无需刷新页面
- **状态持久化**：用户选择的背景图片会保存到本地存储
- **主题适配**：支持明暗主题，背景图片在不同主题下都有良好的显示效果
- **响应式设计**：背景图片自适应不同屏幕尺寸
- **多语言支持**：支持中英文界面

#### 🚀 使用方法

1. **通过主题控制面板**：在页面右下角点击"背景"按钮选择背景图片
2. **在主题演示页面**：访问 `/examples` 路由下的主题演示页面进行测试

#### 📁 相关文件

- `src/hooks/useGlobalSettings.ts` - 背景状态管理
- `src/components/ThemeControlPanel/` - 背景选择器组件
- `src/layouts/index.tsx` - 背景应用逻辑
- `docs/background-switching.md` - 详细功能文档

### 项目结构

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

### 开发指南

#### 环境要求

- **Node.js**: >= 18.0.0 (推荐使用 LTS 版本)
- **包管理器**: pnpm >= 8.0.0 (推荐) 或 npm >= 8.0.0
- **操作系统**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

#### 快速开始

##### 1. 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

#### 2. 启动开发服务器

```bash
# 使用 pnpm
pnpm dev

# 或使用 npm
npm run dev
```

##### 4. 访问应用

打开浏览器访问 `http://localhost:8000`

#### 构建和部署

##### 开发环境构建

```bash
pnpm build:dev
```

##### 生产环境构建

```bash
pnpm build:prod
```

##### 本地预览构建结果

```bash
pnpm serve
```

#### 代码规范

- **TypeScript**: 所有新文件必须使用 TypeScript，组件 Props 和 State 必须有类型注解
- **组件开发**: 使用函数式组件和 Hooks，组件文件命名采用 PascalCase
- **样式方案**: 使用 CSS Modules 避免全局污染，Less 变量统一管理
- **状态管理**: 全局状态使用 UmiJS model，局部状态使用 useState/useReducer
- **性能优化**: 使用 `useMemo` 和 `useCallback` 优化渲染，路由和组件必须懒加载
- **代码质量**: 遵循 ESLint 和 Prettier 规范，每个组件必须有详细的 JSDoc 注释

### 常见问题修复

#### Grid 布局间距问题

**问题描述**: 当列表数据不能占满屏幕时，Grid 布局会产生不均匀的上下间距。

**解决方案**: 为 Grid 容器添加以下 CSS 属性：

```less
.main-container {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  /* 关键修复：确保内容从顶部开始排列，避免不均匀的间距分布 */
  align-content: start;
  /* 设置最小高度，确保容器有足够的高度来容纳内容 */
  min-height: 170px;
}
```

**修复原理**:

1. `align-content: start` 确保 Grid 行从顶部开始排列，而不是均匀分布
2. `min-height: 170px` 设置容器最小高度，与卡片高度保持一致
3. 避免使用默认的 `align-content: stretch` 导致的拉伸问题

### 性能优化

- **路由懒加载**: 使用 React.lazy 和 UmiJS 的动态加载
- **组件懒加载**: Monaco Editor 按需加载，减少首屏体积
- **状态优化**: 使用 `useMemo` 和 `useCallback` 避免不必要的渲染
- **资源优化**: 图片懒加载和压缩，静态资源缓存
- **代码分割**: 合理拆分业务模块，避免单文件过大

### 部署说明

#### 环境变量配置

- `UMI_ENV`: 环境标识（development/production）
- `NODE_ENV`: Node.js 环境标识
- 其他自定义环境变量

#### 构建优化

- 代码分割和懒加载
- 资源压缩和缓存
- Monaco Editor 按需加载

### 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码变更
4. 创建 Pull Request
