# Nuwax

Nuwax AI - Easily build and deploy your private Agentic AI solutions.

官方网站：https://nuwax.com

在线演示：https://agent.nuwax.com

[中文文档](README.zh-CN.md)|[English Doc](README.md) | [Contributing](CONTRIBUTING.zh-CN.md) | [Documentation](docs/)

## 安装部署

借助于官方提供的 nuwax-cli 命令工具，来快速本地部署服务。

### 快速开始

#### 环境准备

##### 系统要求

- **系统要求：** Ubuntu22.04LTS 或以上版本（其他 linux 版本未充分测试），macOS 10.15+，Windows 10/11（后续支持）
- **配置要求：** 4 核 8G 或以上
- **环境要求：** docker、docker-compose V2 环境 [docker 安装指南](#docker环境安装)

##### 支持的平台

- **Linux**: x86_64, ARM64
  - Ubuntu 22.04 LTS（推荐）
  - 当前用户需要有 Docker 权限，验证方式`docker ps`，查看是否有权限问题， 碰到权限问题，可以使用 sudo 权限运行。
  - 推荐使用阿里云镜像加速
- **macOS**: Intel, Apple Silicon (M1/M2), Universal
  - macOS 10.15 (Catalina) 及以上版本
  - 推荐使用 OrbStack（个人免费，性能更佳）
  - 确保 OrbStack 或 Docker Desktop 已启动
  - 首次运行可能需要允许未知开发者：系统偏好设置 → 安全性与隐私

#### 本地部署服务指南

有 2 个部署服务:

- 主体工程服务(必选)
- 智能体电脑(沙箱)部署指南(可选)。

在主体本地服务中，配置一个或多个智能体电脑部署的部署地址等，就可以使用智能体电脑(沙箱)。因 "智能体电脑(沙箱)"有个人电脑(沙箱)可用，所需资源更多，因此支持分开部署多个服务器上。

#### 部署主体服务

[安装文档](https://nuwax.com/deploy.html)

#### 智能体电脑(沙箱)部署指南

可以在多个不同的服务器部署智能体电脑服务，通过配置实现分布式智能体沙箱能力。

> **环境要求**：每台服务器需要安装 Docker 和 Docker Compose 环境，参考 [Docker 安装文档](https://nuwax.com/deploy.html#%E6%8E%A8%E8%8D%90%E6%96%B9%E6%A1%88-%E4%B8%80%E9%94%AE%E5%AE%89%E8%A3%85%E9%85%8D%E7%BD%AE-docker-%E8%84%9A%E6%9C%AC)。

[安装文档](https://nuwax.com/agent-computer-deploy.html)

### 常用管理命令

#### 服务管理

- 启动服务：`./nuwax-cli docker-service start`
- 停止服务：`./nuwax-cli docker-service stop`
- 重启服务：`./nuwax-cli docker-service restart`
- 检查状态：`./nuwax-cli docker-service status`

#### 备份管理

> 备份服务需要停止 Docker 应用服务器，建议业务低谷时操作

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

### Docker 环境安装

> **重要说明：** Docker 和 Docker Compose 是运行本服务的核心依赖，必须正确安装。

如果你的系统中还没有安装 Docker 环境，请参考详细的 **[Docker 环境安装指南](docs/ch/docker-install.md)**。

该安装指南包含以下平台的详细安装步骤：

- **Ubuntu 24.04.3 LTS**（推荐 Linux 发行版）
- **macOS**（支持 OrbStack 和 Docker Desktop）
- **镜像加速配置**（中国大陆用户专用）

### 推荐方案：一键安装配置 Docker 脚本

> 社区一键安装配置 Docker 脚本

该脚本支持 13 种 Linux 发行版，包括国产操作系统（openEuler、Anolis OS、OpenCloudOS、Alinux、Kylin Linux），一键安装 docker、docker-compose 并自动配置轩辕镜像加速源。

```shell
bash <(wget -qO- https://xuanyuan.cloud/docker.sh)
```

#### 脚本特性与优势

✅ 支持 13 种主流发行版：openEuler (欧拉)、OpenCloudOS、Anolis OS (龙蜥)、Alinux (阿里云)、Kylin Linux (银河麒麟)、Fedora、Rocky Linux、AlmaLinux、Ubuntu、Debian、CentOS、RHEL、Oracle Linux

✅ 国产操作系统完整支持：深度适配国产操作系统（openEuler、Anolis OS、OpenCloudOS、Alinux、Kylin Linux），支持版本自动识别和最优配置

✅ 多镜像源智能切换：内置阿里云、腾讯云、华为云、中科大、清华等 6+ 国内镜像源，自动检测并选择最快源

✅ 老版本系统特殊处理：支持 Ubuntu 16.04、Debian 9/10 等已过期系统，自动配置兼容的安装方案

✅ 双重安装保障：包管理器安装失败时自动切换到二进制安装，确保安装成功率

✅ macOS/Windows 友好提示：自动检测 macOS 和 Windows 系统，提供适合的 Docker Desktop 安装指引

**快速验证 Docker 安装：**

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker compose version

# 运行测试容器
docker run hello-world
```

如果上述命令都能正常运行，说明你的 Docker 环境已准备就绪，可以继续部署 Nuwax 服务。

## 架构图

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           前端层 (Frontend Layer)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────────────┐  │
│  │   PC端    │  │   H5     │  │  小程序   │  │  IM (飞书/钉钉/企微)    │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        接入层 (Access Layer)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐   │
│  │  REST API    │  │  长连接        │  │       WebSocket             │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        应用层 (Application Layer)                         │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    组件库 (Component Library)                       │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │  │
│  │  │ 模型  │ │知识库 │ │数据表 │ │ 插件  │ │工作流 │ │  MCP │ │ 技能  │ │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    管理端 (Management Portal)                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐   │  │
│  │  │ 用户管理 │ │ 审核管理 │ │公共模型  │ │ 内容管理 │ │任务管理│   │  │
│  │  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────┤   │  │
│  │  │ 日志查询 │ │ 菜单权限 │ │ 系统配置 │ │          │ │      │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    产品应用 (Product Applications)                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │  │
│  │  │   网页应用     │  │ 问答型智能体  │  │    通用型智能体          │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                      基础设施层 (Infrastructure Layer)                      │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      下层组件 (Lower-level Components)                │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │  │
│  │  │  云端沙箱    │  │ nuwaclaw    │  │    通用智能体引擎            │ │  │
│  │  │             │  │ 个人电脑     │  │                             │  │
│  │  │             │  │ 客户端       │  │  ┌───────────────────────┐ │  │
│  │  │             │  │ (mac/win/    │  │  │  MCP 集成             │ │  │
│  │  │             │  │  docker)     │  │  ├───────────────────────┤ │  │
│  │  │             │  │             │  │  │  文件管理             │ │  │
│  │  │             │  │             │  │  │  SKILL 管理           │ │  │
│  │  │             │  │             │  │  │  ACP 适配层           │ │  │
│  │  │             │  │             │  │  │  ┌─────────────────┐ │ │  │
│  │  │             │  │             │  │  │  │ 支持 Agent:    │ │ │  │
│  │  │             │  │             │  │  │  │ claudecode      │ │ │  │
│  │  │             │  │             │  │  │  │ opencode        │ │ │  │
│  │  │             │  │             │  │  │  │ codex           │ │ │  │
│  │  │             │  │             │  │  │  │ openclaw        │ │ │  │
│  │  │             │  │             │  │  │  │ kimicli         │ │ │  │
│  │  │             │  │             │  │  │  └─────────────────┘ │ │  │
│  │  │             │  │             │  │  ├───────────────────────┤ │  │
│  │  │             │  │             │  │  │  浏览器操作           │ │  │
│  │  │             │  │             │  │  │  GUI 操作             │ │  │
│  │  │             │  │             │  │  │  网络通道             │ │  │
│  │  │             │  │             │  │  │  基础运行环境集成      │ │  │
│  │  │             │  │             │  │  └───────────────────────┘ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    核心基础设施 (Core Infrastructure)                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐  │  │
│  │  │ Database │ │  Cache   │ │  Vector  │ │  Search  │ │ Model │  │  │
│  │  │  MySQL   │ │  Redis   │ │  Milvus  │ │ Elastic  │ │ Proxy│  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### 项目仓库纵览

Nuwax AI 智能体平台由多个相互关联的仓库组成：

#### **前端与移动端**

| 仓库名称 | 描述 | 地址 |
| --- | --- | --- |
| **nuwax** | 前端 Web | [https://github.com/nuwax-ai/nuwax](https://github.com/nuwax-ai/nuwax) |
| **nuwax-mobile** | 移动端应用 | [https://github.com/nuwax-ai/nuwax-mobile](https://github.com/nuwax-ai/nuwax-mobile) |
| **noVNC** | 基于网页的 VNC 客户端 | [https://github.com/nuwax-ai/noVNC](https://github.com/nuwax-ai/noVNC) |

#### **后端与应用层**

| 仓库名称 | 描述 | 地址 |
| --- | --- | --- |
| **nuwax-backend** | 应用层（后端） | [https://github.com/nuwax-ai/nuwax-backend](https://github.com/nuwax-ai/nuwax-backend) |

#### **智能体引擎与客户端**

| 仓库名称 | 描述 | 地址 |
| --- | --- | --- |
| **nuwaclaw** | 智能体电脑客户端（mac/win/docker） | [https://github.com/nuwax-ai/nuwaclaw](https://github.com/nuwax-ai/nuwaclaw) |
| **nuwaxcode** | 女娲智能体引擎（基于开源 opencode） | [https://github.com/nuwax-ai/nuwaxcode](https://github.com/nuwax-ai/nuwaxcode) |
| **claude-code-acp-ts** | 基于 Zed 的 Claude Code ACP | [https://github.com/nuwax-ai/claude-code-acp-ts](https://github.com/nuwax-ai/claude-code-acp-ts) |

#### **基础设施与服务**

| 仓库名称 | 描述 | 地址 |
| --- | --- | --- |
| **rcoder** | 沙箱与容器调度（含通用智能体引擎） | [https://github.com/nuwax-ai/rcoder](https://github.com/nuwax-ai/rcoder) |
| **mcp-proxy** | MCP 服务（沙箱使用） | [https://github.com/nuwax-ai/mcp-proxy](https://github.com/nuwax-ai/mcp-proxy) |
| **nuwax-file-server** | 文件服务（沙箱和 nuwaclaw 使用，含 skill 同步） | [https://github.com/nuwax-ai/nuwax-file-server](https://github.com/nuwax-ai/nuwax-file-server) |

#### **网页应用开发**

| 仓库名称 | 描述 | 地址 |
| --- | --- | --- |
| **xagi-frontend-templates** | 网页应用开发模版 | [https://github.com/nuwax-ai/xagi-frontend-templates](https://github.com/nuwax-ai/xagi-frontend-templates) |
| **vite-plugin-design-mode** | 可视化编辑 Vite 插件 | [https://github.com/nuwax-ai/vite-plugin-design-mode](https://github.com/nuwax-ai/vite-plugin-design-mode) |
| **dev-inject** | 网页应用智能脚本注入 | [https://github.com/nuwax-ai/dev-inject](https://github.com/nuwax-ai/dev-inject) |

#### **插件与脚本执行**

| 仓库名称 | 描述 | 地址 |
| --- | --- | --- |
| **run_code_rmcp** | 插件脚本执行（TS/JS/Python） | [https://github.com/nuwax-ai/run_code_rmcp](https://github.com/nuwax-ai/run_code_rmcp) |

#### **网络与工具**

| 仓库名称 | 描述 | 地址 |
| --- | --- | --- |
| **lanproxy-go-client** | 网络穿透客户端（nuwaclaw 使用） | [https://github.com/ffay/lanproxy-go-client](https://github.com/ffay/lanproxy-go-client) |

### Agent Platform Frontend

[中文文档](docs/ch/front-project.md) |[English Doc](docs/en/front-project.md)

##### 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码变更
4. 创建 Pull Request

## 许可证

Apache 2.0 许可证 - 详见 [LICENSE](LICENSE)。
