# Nuwax
Nuwax AI - Easily build and deploy your private Agentic AI solutions.

官网地址：https://nuwax.com

体验地址：https://agent.nuwax.com

[中文文档](README.zh-CN.md)|[English Doc](README.md) | [Contributing](CONTRIBUTING.zh-CN.md) | [Documentation](docs/)

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


### Agent Platform Frontend

[中文文档](docs/ch/front-project.md) |[English Doc](docs/en/front-project.md) | [Contributing](CONTRIBUTING.md) | [Documentation](docs/)

##### 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码变更
4. 创建 Pull Request


## 许可证

Apache 2.0 许可证 - 详见 [LICENSE](LICENSE)。
