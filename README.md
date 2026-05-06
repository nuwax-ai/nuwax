# Nuwax

Nuwax AI - Easily build and deploy your private Agentic AI solutions.

Official Website: [https://nuwax.com](https://nuwax.com)

Demo: [https://agent.nuwax.com](https://agent.nuwax.com)

[中文文档](README.zh-CN.md)|[English Doc](README.md) | [Contributing](CONTRIBUTING.md) | [Documentation](docs/)

## Installation & Deployment

Use the official nuwax-cli command tool to quickly deploy services locally.

### Quick Start

#### Environment Preparation

##### System Requirements

- **System Requirements**: Ubuntu 22.04 LTS or later (other Linux versions not fully tested), macOS 10.15+, Windows 10/11 (support coming soon)
- **Hardware Requirements**: 4 cores 8GB RAM or higher
- **Environment Requirements**: docker, docker-compose V2 environment [Docker Installation Guide](#docker-environment-installation)

##### Supported Platforms

- **Linux**: x86_64, ARM64
  - Ubuntu 22.04 LTS (recommended)
  - Current user needs Docker permissions, verify with `docker ps`. If you encounter permission issues, you can run with sudo privileges.
  - Alibaba Cloud mirror acceleration is recommended
- **macOS**: Intel, Apple Silicon (M1/M2), Universal
  - macOS 10.15 (Catalina) and later versions
  - OrbStack is recommended (free for personal use, better performance)
  - Ensure OrbStack or Docker Desktop is started
  - First-time use may require allowing unknown developers: System Preferences → Security & Privacy

#### Local Deployment Service Guide

There are 2 deployment services:

- Main project service (required)
- Agent Computer (Sandbox) deployment guide (optional)

In the main local service, configure one or more Agent Computer deployment addresses to use the Agent Computer (Sandbox). Since the "Agent Computer (Sandbox)" includes a personal computer (sandbox) which requires more resources, it supports separate deployment across multiple servers.

#### Deploy Main Service

[Installation Documentation](https://nuwax.com/deploy.html)

#### Agent Computer (Sandbox) Deployment Guide

You can deploy Agent Computer services on multiple different servers, achieving distributed agent sandbox capabilities through configuration.

> **Environment Requirements**: Each server needs Docker and Docker Compose environment installed, refer to [Docker Installation Documentation](https://nuwax.com/deploy.html#%E6%8E%A8%E8%8D%90%E6%96%B9%E6%A1%88-%E4%B8%80%E9%94%AE%E5%AE%89%E8%A3%85%E9%85%8D%E7%BD%AE-docker-%E8%84%9A%E6%9C%AC).

[Installation Documentation](https://nuwax.com/agent-computer-deploy.html)

### Common Management Commands

#### Service Management

- Start service: `./nuwax-cli docker-service start`
- Stop service: `./nuwax-cli docker-service stop`
- Restart service: `./nuwax-cli docker-service restart`
- Check status: `./nuwax-cli docker-service status`

#### Backup Management

> Backup service requires stopping Docker application servers, it's recommended to operate during business low-peak periods

- **One-click Backup (Recommended):**
  - Manual backup execution: `./nuwax-cli auto-backup run`
  - List all backups: `./nuwax-cli list-backups`
  - Restore from backup: `./nuwax-cli rollback [BACKUP_ID]`

#### Upgrade Management

**Application service upgrade, using command `./nuwax-cli auto-upgrade-deploy run` will automatically detect and download new versions for deployment.**

Complete upgrade process:

```bash
# Check if deployment client has new version and update
./nuwax-cli check-update install
# Update application service
./nuwax-cli auto-upgrade-deploy run
```

### Docker Environment Installation

> **Important Note**: Docker and Docker Compose are core dependencies for running this service and must be installed correctly.

If your system doesn't have Docker environment installed yet, please refer to the detailed **[Docker Environment Installation Guide](docs/en/docker-install.md)**.

This installation guide includes detailed installation steps for the following platforms:

- **Ubuntu 24.04.3 LTS** (recommended Linux distribution)
- **macOS** (supports OrbStack and Docker Desktop)
- **Mirror acceleration configuration** (for mainland China users)

### Recommended: One-Click Docker Installation Script

> Community one-click Docker installation script

This script supports 13 Linux distributions, including domestic operating systems (openEuler, Anolis OS, OpenCloudOS, Alinux, Kylin Linux), one-click installation of docker, docker-compose with automatic configuration of Xuanyuan mirror acceleration.

```shell
bash <(wget -qO- https://xuanyuan.cloud/docker.sh)
```

#### Script Features and Advantages

✅ Supports 13 mainstream distributions: openEuler, OpenCloudOS, Anolis OS, Alinux (Alibaba Cloud), Kylin Linux, Fedora, Rocky Linux, AlmaLinux, Ubuntu, Debian, CentOS, RHEL, Oracle Linux

✅ Complete support for domestic operating systems: Deep adaptation for domestic OS (openEuler, Anolis OS, OpenCloudOS, Alinux, Kylin Linux), supports automatic version detection and optimal configuration

✅ Intelligent multi-mirror source switching: Built-in 6+ domestic mirror sources including Alibaba Cloud, Tencent Cloud, Huawei Cloud, USTC, Tsinghua, etc., automatically detects and selects the fastest source

✅ Special handling for older systems: Supports expired systems like Ubuntu 16.04, Debian 9/10, automatically configures compatible installation solutions

✅ Dual installation guarantee: Automatically switches to binary installation if package manager installation fails, ensuring installation success rate

✅ macOS/Windows friendly prompts: Automatically detects macOS and Windows systems, provides appropriate Docker Desktop installation guidance

**Quick Docker Installation Verification:**

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version

# Run test container
docker run hello-world
```

If the above commands all run successfully, your Docker environment is ready and you can proceed with Nuwax service deployment.

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           Frontend Layer                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────────────┐  │
│  │  PC Web  │  │   H5     │  │ Mini App │  │  IM (Feishu/DingTalk/  │  │
│  │          │  │          │  │          │  │   WeCom/Slack)         │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        Access Layer                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐   │
│  │  REST API    │  │  Long        │  │       WebSocket             │   │
│  │              │  │ Connection   │  │                             │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                      Application Layer                                     │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │              Component Library                                       │  │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │  │
│  │  │ Model│ │Know- │ │ Data │ │Plugin│ │ Work-│ │  MCP │ │ Skill│ │  │
│  │  │      │ │ ledge│ │ Table│ │      │ │ flow │ │      │ │      │ │  │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │              Management Portal                                        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │  User    │ │  Audit   │ │  Public  │ │ Content  │ │   Task   │ │  │
│  │  │Management│ │Management│ │  Model   │ │Management│ │Management│ │  │
│  │  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ │  │
│  │  │   Log    │ │   Menu   │ │ System   │ │          │ │          │ │  │
│  │  │  Query   │ │Permission│ │  Config  │ │          │ │          │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │              Product Applications                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │  │
│  │  │   Web App    │  │   Q&A        │  │    General Agent         │  │  │
│  │  │              │  │   Agent      │  │                          │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                                    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Lower-level Components                            │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │  │
│  │  │   Cloud     │  │  nuwaclaw   │  │   General Agent Engine     │ │  │
│  │  │   Sandbox   │  │   PC Client │  │                            │ │  │
│  │  │             │  │ (mac/win/   │  │  ┌───────────────────────┐ │  │
│  │  │             │  │  docker)    │  │  │  MCP Integration      │ │  │
│  │  │             │  │             │  │  ├───────────────────────┤ │  │
│  │  │             │  │             │  │  │  File Management     │ │  │
│  │  │             │  │             │  │  │  Skill Management     │ │  │
│  │  │             │  │             │  │  │  ACP Adapter Layer    │ │  │
│  │  │             │  │             │  │  │  ┌─────────────────┐ │ │  │
│  │  │             │  │             │  │  │  │ Supported Agent:│ │ │  │
│  │  │             │  │             │  │  │  │ claudecode      │ │ │  │
│  │  │             │  │             │  │  │  │ opencode        │ │ │  │
│  │  │             │  │             │  │  │  │ codex           │ │ │  │
│  │  │             │  │             │  │  │  │ openclaw        │ │ │  │
│  │  │             │  │             │  │  │  │ kimicli         │ │ │  │
│  │  │             │  │             │  │  │  └─────────────────┘ │ │  │
│  │  │             │  │             │  │  ├───────────────────────┤ │  │
│  │  │             │  │             │  │  │  Browser             │ │  │
│  │  │             │  │             │  │  │  Automation          │ │  │
│  │  │             │  │             │  │  │  GUI Automation      │ │  │
│  │  │             │  │             │  │  │  Network Channel     │ │  │
│  │  │             │  │             │  │  │  Runtime Integration │ │  │
│  │  │             │  │             │  │  └───────────────────────┘ │  │
│  │  │             │  │             │  └─────────────────────────────┘ │  │
│  │  └─────────────┘  └─────────────┘                                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Core Infrastructure                                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐  │  │
│  │  │ Database │ │  Cache   │ │  Vector  │ │  Search  │ │ Model │  │  │
│  │  │  MySQL   │ │  Redis   │ │  Milvus  │ │ Elastic  │ │ Proxy│  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Project Repository Overview

The Nuwax AI Agent Platform consists of multiple interconnected repositories:

#### **Frontend & Mobile**

| Repository | Description | URL |
| --- | --- | --- |
| **nuwax** | Frontend Web | [https://github.com/nuwax-ai/nuwax](https://github.com/nuwax-ai/nuwax) |
| **nuwax-mobile** | Mobile Application | [https://github.com/nuwax-ai/nuwax-mobile](https://github.com/nuwax-ai/nuwax-mobile) |
| **noVNC** | Web-based VNC Client | [https://github.com/nuwax-ai/noVNC](https://github.com/nuwax-ai/noVNC) |

#### **Backend & Application Layer**

| Repository | Description | URL |
| --- | --- | --- |
| **nuwax-backend** | Application Layer (Backend) | [https://github.com/nuwax-ai/nuwax-backend](https://github.com/nuwax-ai/nuwax-backend) |

#### **Agent Engine & Clients**

| Repository | Description | URL |
| --- | --- | --- |
| **nuwaclaw** | Agent PC Client (mac/win/docker) | [https://github.com/nuwax-ai/nuwaclaw](https://github.com/nuwax-ai/nuwaclaw) |
| **nuwaxcode** | Nuwa Agent Engine (based on open-source opencode) | [https://github.com/nuwax-ai/nuwaxcode](https://github.com/nuwax-ai/nuwaxcode) |
| **claude-code-acp-ts** | Claude Code ACP based on Zed | [https://github.com/nuwax-ai/claude-code-acp-ts](https://github.com/nuwax-ai/claude-code-acp-ts) |

#### **Infrastructure & Services**

| Repository | Description | URL |
| --- | --- | --- |
| **rcoder** | Sandbox & Container Scheduling (includes General Agent Engine) | [https://github.com/nuwax-ai/rcoder](https://github.com/nuwax-ai/rcoder) |
| **mcp-proxy** | MCP Service (used by sandbox) | [https://github.com/nuwax-ai/mcp-proxy](https://github.com/nuwax-ai/mcp-proxy) |
| **nuwax-file-server** | File Service (used by sandbox and nuwaclaw, includes skill sync) | [https://github.com/nuwax-ai/nuwax-file-server](https://github.com/nuwax-ai/nuwax-file-server) |

#### **Web Application Development**

| Repository | Description | URL |
| --- | --- | --- |
| **xagi-frontend-templates** | Web Application Development Templates | [https://github.com/nuwax-ai/xagi-frontend-templates](https://github.com/nuwax-ai/xagi-frontend-templates) |
| **vite-plugin-design-mode** | Visual Editor Vite Plugin | [https://github.com/nuwax-ai/vite-plugin-design-mode](https://github.com/nuwax-ai/vite-plugin-design-mode) |
| **dev-inject** | Web Application Smart Script Injection | [https://github.com/nuwax-ai/dev-inject](https://github.com/nuwax-ai/dev-inject) |

#### **Plugin & Script Execution**

| Repository | Description | URL |
| --- | --- | --- |
| **run_code_rmcp** | Plugin Script Execution (TypeScript/JavaScript/Python) | [https://github.com/nuwax-ai/run_code_rmcp](https://github.com/nuwax-ai/run_code_rmcp) |

#### **Network & Utilities**

| Repository | Description | URL |
| --- | --- | --- |
| **lanproxy-go-client** | Network Tunnel Client (used by nuwaclaw) | [https://github.com/ffay/lanproxy-go-client](https://github.com/ffay/lanproxy-go-client) |

### Agent Platform Frontend

[中文文档](docs/ch/front-project.md) |[English Doc](docs/en/front-project.md)

##### Contributing Guide

1. Fork the project
2. Create feature branch
3. Submit code changes
4. Create Pull Request

## Community & Support

Join the Nuwax AI Agent Platform community for technical support and latest updates!

### Official Links

- **Website**: https://nuwax.com
- **Demo**: https://agent.nuwax.com

### Community Channels

| Channel | Description |
|---------|-------------|
| **GitHub Issues** | [Submit issues](https://github.com/nuwax-ai/nuwax/issues) |
| **WeChat Group** | Add assistant `nuwax-ai` |
| **QQ Group** | Group ID: `1041169423` |
| **WeChat Official Account** | Follow "女娲智能体" for feedback |
| **Douyin/Video Account** | Follow for latest video content |

> 📱 For **WeChat Group, Official Account, and Douyin QR codes**, please visit [User Manual](https://nuwax.com/user-manual.html)

## License

Apache 2.0 License - see [LICENSE](LICENSE) for details.

---

## ❓ FAQ

### 平台概念

**Nuwax 是什么？**
Nuwax 是一个通用的 Agent 操作系统（Agent OS），用于轻松构建和部署私有的 Agentic AI 解决方案。它提供 Agent Computer（沙箱）能力，支持分布式部署和多服务器扩展。

**Nuwax 与 LangChain / AutoGen 有什么区别？**
- **LangChain** 侧重 LLM 应用开发框架，需要自行构建 UI 和部署架构；Nuwax 提供完整的开箱即用平台
- **AutoGen** 专注多 Agent 对话编排；Nuwax 提供 Agent 操作系统级别的完整解决方案，包括部署、管理和沙箱执行
- Nuwax 更适合需要快速部署私有 Agent 解决方案的团队

### 安装配置

**系统要求是什么？**
- **Linux**：Ubuntu 22.04 LTS 或更高版本（推荐），x86_64 / ARM64
- **macOS**：10.15+（Catalina），Intel / Apple Silicon（M1/M2）
- **硬件**：4 核 8GB RAM 或以上
- **环境**：Docker 和 Docker Compose V2

**如何快速部署？**
```bash
# 使用 nuwax-cli 一键部署
./nuwax-cli docker-service start
```
详细部署文档：https://nuwax.com/deploy.html

**支持哪些平台？**
- Linux：Ubuntu 22.04 LTS（推荐）、openEuler、Anolis OS、OpenCloudOS、Alinux、Kylin Linux 等 13 种发行版
- macOS：Intel 和 Apple Silicon 均支持（推荐 OrbStack）

### Agent Computer（沙箱）

**什么是 Agent Computer？**
Agent Computer 是 Nuwax 的沙箱执行环境，提供安全的 Agent 运行时隔离。支持：
- 本地沙箱：适合开发测试
- 远程沙箱：生产级隔离执行
- 分布式部署：可在多台服务器上部署 Agent Computer

**如何部署 Agent Computer？**
```bash
# 参考独立部署指南
# https://nuwax.com/agent-computer-deploy.html
```
每个服务器需要 Docker 和 Docker Compose 环境，支持跨服务器分布式部署。

### 服务管理

**常用管理命令有哪些？**
```bash
# 服务管理
./nuwax-cli docker-service start    # 启动
./nuwax-cli docker-service stop     # 停止
./nuwax-cli docker-service restart  # 重启
./nuwax-cli docker-service status   # 状态

# 备份管理
./nuwax-cli auto-backup run         # 一键备份
./nuwax-cli list-backups            # 列出备份
./nuwax-cli rollback [BACKUP_ID]    # 恢复

# 升级管理
./nuwax-cli check-update install    # 检查更新
./nuwax-cli auto-upgrade-deploy run # 自动升级部署
```

### 故障排查

**Docker 权限问题？**
当前用户需要 Docker 权限，验证命令：`docker ps`。如遇权限问题，可运行：
```bash
sudo usermod -aG docker $USER
newgrp docker
```

**macOS 提示未知开发者？**
前往 系统偏好设置 → 安全性与隐私 → 允许未知开发者。推荐使用 OrbStack（个人免费使用，性能更好）。

**镜像加速配置？**
中国大陆用户推荐使用阿里云镜像加速。一键安装脚本已内置轩辕镜像加速配置。

**如何获取更多帮助？**
- 官方网站：https://nuwax.com
- 在线演示：https://agent.nuwax.com
- 部署文档：https://nuwax.com/deploy.html
- GitHub Issues：https://github.com/nuwax-ai/nuwax/issues
