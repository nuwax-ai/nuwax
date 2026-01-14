# Nuwax

Nuwax AI - Easily build and deploy your private Agentic AI solutions.

Official Website: https://nuwax.com

Demo: https://agent.nuwax.com

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

### Agent Platform Frontend

[中文文档](docs/ch/front-project.md) |[English Doc](docs/en/front-project.md)

##### Contributing Guide

1. Fork the project
2. Create feature branch
3. Submit code changes
4. Create Pull Request

## License

Apache 2.0 License - see [LICENSE](LICENSE) for details.
