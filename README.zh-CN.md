# Nuwax
Nuwax AI - Easily build and deploy your private Agentic AI solutions.

官网地址：https://nuwax.com

体验地址：https://agent.nuwax.com

## 安装部署

借助于官方提供的 nuwax-cli 命令工具，来快速本地部署服务。

### 快速开始

#### 环境准备

##### 系统要求
- **系统要求：** Ubuntu22.04LTS或以上版本（其他linux版本未充分测试），macOS 10.15+，Windows 10/11（后续支持）
- **配置要求：** 4核8G或以上
- **环境要求：** docker、docker-compose V2 环境 [docker安装指南](#docker环境安装)

##### 支持的平台
- **Linux**: x86_64, ARM64
    - Ubuntu 22.04 LTS（推荐）
    - 当前用户需要有 Docker 权限，验证方式`docker ps`，查看是否有权限问题， 碰到权限问题，可以使用 sudo 权限运行。
    - 推荐使用阿里云镜像加速
- **macOS**: Intel, Apple Silicon (M1/M2), Universal
    - macOS 10.15 (Catalina) 及以上版本
    - 推荐使用OrbStack（个人免费，性能更佳）
    - 确保 OrbStack 或 Docker Desktop 已启动
    - 首次运行可能需要允许未知开发者：系统偏好设置 → 安全性与隐私

##### 客户端下载
> 客户端仅作为运维工具，不包含平台软件包
- [nuwax-cli-linux-amd64.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.55/nuwax-cli-linux-amd64.tar.gz)
- [nuwax-cli-linux-arm64.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.55/nuwax-cli-linux-arm64.tar.gz)
- [nuwax-cli-macos-universal.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.55/nuwax-cli-macos-universal.tar.gz)（amd64&arm64）

##### 执行命令完成部署

执行以下命令需要有docker权限，或者使用sudo运行

#### Linux / macOS
```bash
# 示例工作目录
mkdir nuwax_deploy
cd nuwax_deploy

# 下载客户端运维工具
# Linux下载命令（amd64）
wget https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.55/nuwax-cli-linux-amd64.tar.gz
# Linux下载命令（arm64）
wget https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.55/nuwax-cli-linux-arm64.tar.gz
# macOS下载命令
wget https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.55/nuwax-cli-macos-universal.tar.gz

# 将下载的客户端文件解压到工作目录
tar -xzf nuwax-cli-*.tar.gz

# 添加执行权限
chmod +x nuwax-cli

# 初始化
./nuwax-cli init

# 开始部署，如需指定 project name 或访问端口(默认80)，可以使用以下命令：
# ./nuwax-cli auto-upgrade-deploy run --port 8099 -p nuwax
./nuwax-cli auto-upgrade-deploy run
```

> **重要提示：** 建议定期升级命令行工具，在工作目录下执行：
> ```bash
> ./nuwax-cli check-update install
> ```

正常情况下，执行完命令后，服务就已经部署好了。

##### 访问服务

部署完成后，在浏览器访问：`http://localhost`

使用默认管理员账号登录：`admin@nuwax.com` 密码：`123456`

> 注：如果80端口被占用，可以指定端口部署，比如：`./nuwax-cli auto-upgrade-deploy run --port 8099`

##### 重要配置
登录后请及时修改：
- 管理员密码
- 站点信息配置

  ![alt text](https://nuwax.com/images/image-101.png)

- 邮件服务配置，用于用户登录注册收取验证码。

  ![alt text](https://nuwax.com/images/image-91.png)

### 常见问题排查

#### 1. 服务启动失败
- 检查 Docker 是否正常运行
- 使用 `./nuwax-cli status` 查看详细状态
- 检查端口是否被占用

#### 2. 无法访问服务
- 确认服务已正常启动，可以执行 `docker ps` 或 `./nuwax-cli ducker` 查看容器状态
- 检查防火墙设置
- 确认端口配置正确

#### 3. 权限问题 - Permission denied
- **Linux（Ubuntu 22.04 LTS）**: 确保用户在 docker 组中
- **macOS**: 允许未知开发者运行，确保OrbStack或Docker Desktop已启动

使用 `sudo` 来执行命令：`sudo ./nuwax-cli auto-upgrade-deploy run`

#### 4. 解压失败 - Directory not empty(os error 39)
先停止Docker服务：`./nuwax-cli docker-service stop`，然后手动删除工作目录下的 `docker` 目录，重新执行部署命令。

#### 5. 进入界面但提示系统异常
查看后台日志：`./docker/logs/agent/app.log`，通常重启服务可解决：
```bash
./nuwax-cli docker-service restart
```

#### 6. 下载失败 - error decoding response body
网络问题导致，重新执行部署命令即可，支持断点续传。

### 常用管理命令

#### 服务管理
- 启动服务：`./nuwax-cli docker-service start`
- 停止服务：`./nuwax-cli docker-service stop`
- 重启服务：`./nuwax-cli docker-service restart`
- 检查状态：`./nuwax-cli docker-service status`

#### 备份管理
> 备份服务需要停止Docker应用服务器，建议业务低谷时操作

- **一键备份（推荐）：**
    - 手动执行备份：`./nuwax-cli auto-backup run`
    - 列出所有备份：`./nuwax-cli list-backups`
    - 从备份恢复：`./nuwax-cli rollback [BACKUP_ID]`

#### 升级管理

**应用服务升级，使用命令`./nuwax-cli auto-upgrade-deploy run` 会自动检测下载新版本，自动部署。**

完整升级流程：
```bash
# 检查运维客户端是否有新版本并更新
./nuwax-cli check-update install
# 更新应用服务
./nuwax-cli auto-upgrade-deploy run
```

### Docker环境安装

> **重要说明：** Docker 和 Docker Compose 是运行本服务的核心依赖，必须正确安装。

如果您的系统中还没有安装 Docker 环境，请参考详细的 **[Docker 环境安装指南](docs/ch/docker-install.md)**。

该安装指南包含以下平台的详细安装步骤：

- **Ubuntu 22.04 LTS**（推荐 Linux 发行版）
- **macOS**（支持 OrbStack 和 Docker Desktop）
- **Windows 10/11**（Docker Desktop）
- **镜像加速配置**（中国大陆用户专用）
- **安装验证和故障排除**

**快速验证 Docker 安装：**
```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker compose version

# 运行测试容器
docker run hello-world
```

如果上述命令都能正常运行，说明您的 Docker 环境已准备就绪，可以继续部署 Nuwax 服务。

### Agent Platform Front

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

##### 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码变更
4. 创建 Pull Request


## 许可证

Apache 2.0 许可证 - 详见 [LICENSE](LICENSE)。
