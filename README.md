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

##### Client Download
> The client is only a deployment tool and does not include the platform software package
- [nuwax-cli-linux-amd64.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.58/nuwax-cli-linux-amd64.tar.gz)
- [nuwax-cli-linux-arm64.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.58/nuwax-cli-linux-arm64.tar.gz)
- [nuwax-cli-macos-universal.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.58/nuwax-cli-macos-universal.tar.gz) (amd64&arm64)

##### Execute Commands to Complete Deployment

The following commands require Docker permissions or can be run with sudo

#### Linux / macOS
```bash
# Example working directory
mkdir nuwax_deploy
cd nuwax_deploy

# Download client deployment tool
# Linux download command (amd64)
wget https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.58/nuwax-cli-linux-amd64.tar.gz
# Linux download command (arm64)
wget https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.58/nuwax-cli-linux-arm64.tar.gz
# macOS download command
wget https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.58/nuwax-cli-macos-universal.tar.gz

# Extract downloaded client files to working directory
tar -xzf nuwax-cli-*.tar.gz

# Add execute permission
chmod +x nuwax-cli

# Initialize
./nuwax-cli init

# Start deployment, if you need to specify project name or access port (default 80), you can use the following command:
# ./nuwax-cli auto-upgrade-deploy run --port 8099 -p nuwax
./nuwax-cli auto-upgrade-deploy run
```

> **Important Note**: It is recommended to regularly upgrade the command line tool by executing in the working directory:
> ```bash
> ./nuwax-cli check-update install
> ```

Normally, after executing the commands, the service should be deployed successfully.

##### Access Service

After deployment is complete, access in browser: `http://localhost`

Login with default administrator account: `admin@nuwax.com` password: `123456`

> Note: If port 80 is occupied, you can specify a port for deployment, such as: `./nuwax-cli auto-upgrade-deploy run --port 8099`

##### Important Configuration
Please modify promptly after login:
- Administrator password
- Site information configuration
- Email service configuration for user registration and login verification codes.

### Troubleshooting

#### 1. Service Startup Failed
- Check if Docker is running properly
- Use `./nuwax-cli status` to view detailed status
- Check if ports are occupied

#### 2. Unable to Access Service
- Confirm service has started properly, you can execute `docker ps` or `./nuwax-cli ducker` to view container status
- Check firewall settings
- Confirm port configuration is correct

#### 3. Permission Issues - Permission denied
- **Linux (Ubuntu 22.04 LTS)**: Ensure user is in docker group
- **macOS**: Allow unknown developers to run, ensure OrbStack or Docker Desktop is started

Use `sudo` to execute commands: `sudo ./nuwax-cli auto-upgrade-deploy run`

#### 4. Extraction Failed - Directory not empty(os error 39)
First stop Docker service: `./nuwax-cli docker-service stop`, then manually delete the `docker` directory in the working directory and re-execute the deployment command.

#### 5. Interface Shows System Exception
Check backend logs: `./docker/logs/agent/app.log`, usually restarting the service can resolve:
```bash
./nuwax-cli docker-service restart
```

#### 6. Download Failed - error decoding response body
Network issues cause this, re-executing the deployment command will work, supports resumable downloads.

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

- **Ubuntu 22.04 LTS** (recommended Linux distribution)
- **macOS** (supports OrbStack and Docker Desktop)
- **Windows 10/11** (Docker Desktop)
- **Mirror acceleration configuration** (for mainland China users)
- **Installation verification and troubleshooting**

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
