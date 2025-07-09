# Nuwax
Nuwax AI - Easily build and deploy your private Agentic AI solutions.

官网地址：https://nuwax.com

体验地址：https://agent.nuwax.com

# 安装部署

借助于官方提供的 nuwax-cli 命令工具，来快速本地部署服务。

## 🚀 快速开始

### 环境准备

#### 系统要求
* 需要有 docker，docker-compose 环境 [docker安装指南](deploy#docker环境安装)
* 系统内存: 推荐 16G 或以上
* 系统: **Linux推荐使用Ubuntu 22.04 LTS**，macOS 10.15+，Windows 10/11（后续支持）

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

- [nuwax-cli-linux-amd64.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.22/nuwax-cli-linux-amd64.tar.gz)

- [nuwax-cli-linux-arm64.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.22/nuwax-cli-linux-arm64.tar.gz)
- [nuwax-cli-macos-universal.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.22/nuwax-cli-macos-universal.tar.gz)（amd64&arm64）


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

> 注: 如果80端口被占用，可以成功部署，但访问页面会有问题，可以部署指定端口，比如： ./nuwax-cli auto-upgrade-deploy run --port 8099

### 重要配置
登录后请及时修改：
- 管理员密码
- 站点访问地址（菜单：系统管理 → 系统配置 → 站点访问地址）
设置成电脑的ip和端口，或者绑定的域名。

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
检查或者提前下载最新的应用服务。

- 检查更新：`./nuwax-cli upgrade --check`
- 全量下载：`./nuwax-cli upgrade --full`
- 强制重新下载：`./nuwax-cli upgrade --force`

**应用服务升级，需要使用命令`./nuwax-cli auto-upgrade-deploy run` 部署才能生效。**

如果之前下载过应用服务，但认为下载的文件有损坏，可以强制使用重新下载。
> upgrade 命令不会自动安装，只是用于想提前下载，或者检查有无最新版本应用文件使用，因为文件比较大，可以考虑提前下载应用文件。

## 常见问题

#### 1. 服务启动失败
- 检查 Docker 是否正常运行
- 使用 `./nuwax-cli status` 查看详细状态
- 检查端口是否被占用

#### 2. 无法访问服务
- 确认服务已正常启动
可以输入 docker ps命令查看，或者 ./nuwax-cli ducker 查看，或者带界面的桌面应用来查看容器启动情况。
- 检查防火墙设置
- 确认端口配置正确

#### 3. 权限问题
- **Linux（Ubuntu 22.04 LTS）**: 确保用户在 docker 组中
- **macOS**: 允许未知开发者运行，确保OrbStack或Docker Desktop已启动

#### 4. 配置文件问题
- 使用 `./nuwax-cli init --force` 重新初始化
- 检查 config.toml 文件是否存在

## 参考命令

### 全局选项

nuwax-cli支持以下全局选项：

| 选项 | 说明 | 默认值 |
|------|------|---------|
| `-v, --verbose` | 详细输出 | - |
| `-h, --help` | 显示帮助信息 | - |
| `-V, --version` | 显示版本信息 | - |

### 主要命令

#### 获取帮助

使用 `-h` 参数查看任何命令的帮助信息：

```bash
./nuwax-cli -h                    # 查看主要命令
./nuwax-cli docker-service -h    # 查看Docker服务命令
./nuwax-cli upgrade -h           # 查看升级命令
```

#### 日志查看
```bash
./nuwax-cli status              # 查看服务状态
./nuwax-cli docker-service status  # 查看详细Docker状态
```


#### 系统管理命令

**`status`** - 显示服务状态和版本信息
```bash
./nuwax-cli status
```

**`init`** - 首次使用时初始化客户端，创建配置文件和数据库
```bash
./nuwax-cli init [OPTIONS]
```
- `--force`: 如果配置文件已存在，强制覆盖

**`api-info`** - 显示当前API配置信息
```bash
./nuwax-cli api-info
```

#### 更新管理

**`check-update`** - 检查客户端更新
```bash
./nuwax-cli check-update <COMMAND>
```

子命令：
- `check`: 检查最新版本信息
- `install [OPTIONS]`: 安装指定版本或最新版本
  - `--version <VERSION>`: 指定版本号（如不指定则安装最新版本）
  - `--force`: 强制重新安装（即使当前已是最新版本）

**`upgrade`** - 下载Docker服务文件
```bash
./nuwax-cli upgrade [OPTIONS]
```
- `--full`: 全量下载（下载完整的服务包）
- `--force`: 强制重新下载（用于文件损坏时）
- `--check`: 只检查是否有可用的升级版本，不执行下载

#### 部署管理

**`auto-upgrade-deploy`** - 自动升级部署
```bash
./nuwax-cli auto-upgrade-deploy <COMMAND>
```

子命令：
- `run [OPTIONS]`: 立即执行自动升级部署
  - `--port <PORT>`: 指定frontend服务的端口号，对应docker-compose.yml中的FRONTEND_HOST_PORT变量（默认: 80端口）
- `delay-time-deploy [OPTIONS] <TIME>`: 延迟执行自动升级部署
  - `<TIME>`: 延迟时间数值，例如 2
  - `--unit <UNIT>`: 时间单位：hours(小时), minutes(分钟), days(天) [default: hours]
- `status`: 显示当前自动升级配置

#### Docker服务管理

**`docker-service`** - Docker服务相关命令
```bash
./nuwax-cli docker-service <COMMAND>
```

子命令：
- `start`: 启动Docker服务
- `stop`: 停止Docker服务
- `restart`: 重启Docker服务
- `status`: 检查服务状态
- `restart-container <CONTAINER_NAME>`: 重启指定容器
- `extract [OPTIONS]`: 解压Docker服务包
  - `--file <FILE>`: 指定docker.zip文件路径（可选，默认使用当前版本的下载文件）
  - `--version <VERSION>`: 目标版本（可选，默认使用当前配置版本）
- `load-images`: 加载Docker镜像
- `setup-tags`: 设置镜像标签
- `arch-info`: 显示架构信息
- `list-images`: 列出Docker镜像（使用ducker）

**`ducker`** - 一个用于管理Docker容器的终端应用

```bash
./nuwax-cli ducker
```

#### 备份管理

**`auto-backup`** - 一键备份（推荐）
```bash
./nuwax-cli auto-backup <COMMAND>
```

子命令：
- `status`: 显示当前备份配置
- `run`: 立即执行一次备份

**`backup`** - 手动创建备份
需要容器全部停止，才会备份
```bash
./nuwax-cli backup
```

**`list-backups`** - 列出所有备份
```bash
./nuwax-cli list-backups
```

**`rollback`** - 从备份恢复
```bash
./nuwax-cli rollback [OPTIONS] [BACKUP_ID]
```
- `[BACKUP_ID]`: 备份ID（可选，不提供时将显示交互式选择界面）
- `--force`: 强制覆盖
- `--list-json`: 输出JSON格式的备份列表（用于GUI集成）

#### 缓存管理

**`cache`** - 缓存管理
```bash
./nuwax-cli cache <COMMAND>
```

子命令：
- `clear`: 清理所有缓存文件
- `status`: 显示缓存使用情况
- `clean-downloads [OPTIONS]`: 清理下载缓存（保留最新版本）
  - `--keep <KEEP>`: 保留的版本数量 [default: 3]

#### 开发工具

**`diff-sql`** - 对比两个SQL文件并生成差异SQL
```bash
./nuwax-cli diff-sql [OPTIONS] <OLD_SQL> <NEW_SQL>
```
- `<OLD_SQL>`: 旧版本SQL文件路径
- `<NEW_SQL>`: 新版本SQL文件路径
- `--old-version <OLD_VERSION>`: 旧版本号，用于生成差异描述
- `--new-version <NEW_VERSION>`: 新版本号，用于生成差异描述
- `--output <OUTPUT>`: 差异SQL输出文件名 [default: upgrade_diff.sql]

### 常用命令组合

#### 完整部署流程
```bash
# 1. 初始化
./nuwax-cli init

# 2. 一键部署
./nuwax-cli auto-upgrade-deploy run

# 3. 检查状态
./nuwax-cli status
```

#### 手动部署流程
```bash
# 1. 初始化
./nuwax-cli init

# 2. 下载服务文件
./nuwax-cli upgrade

# 3. 启动服务
./nuwax-cli docker-service start

# 4. 检查状态
./nuwax-cli status
```

#### 备份与恢复（推荐使用一键备份）
```bash
# 推荐：查看备份状态
./nuwax-cli auto-backup status

# 推荐：手动执行一次备份
./nuwax-cli auto-backup run

# 或者手动创建备份，需要容器全部停止
./nuwax-cli backup

# 查看备份列表 ，第一列是 BACKUP_ID 
./nuwax-cli list-backups

# 从备份恢复，看自己需要恢复的时间版本，然后输入第一列的 BACKUP_ID
./nuwax-cli rollback [BACKUP_ID]
```

#### 一键备份设置（推荐）
一键备份数据(./docker/data,./docker/app 这2个核心数据目录)。

**重要提示：** 备份的时候，必须完全停止服务，备份完毕后，会自动重新启动服务，大约需要几分钟。

```bash

# 手动执行一次备份
./nuwax-cli auto-backup run
```

#### 命令行工具的更新管理(Beta)
升级命令行工具，等后续完善升级流程。
```bash
# 检查更新
./nuwax-cli check-update check

# 安装最新版本
./nuwax-cli check-update install

# 强制重新安装
./nuwax-cli check-update install --force
```

### 日志级别

使用`-v`或`--verbose`参数可以获得更详细的输出信息，用于调试和故障排除。

### 退出码

| 退出码 | 说明 |
|--------|------|
| `0` | 成功 |
| `1` | 一般错误 |
| `2` | 配置错误 |
| `3` | 网络错误 |
| `4` | 文件系统错误 |
| `5` | Docker相关错误 |

---

## Docker环境安装

> **补充说明：** 本章节为Docker环境安装的详细步骤，仅供需要安装Docker的用户参考。如果您已经有Docker环境，可以跳过此章节。

### 重要说明

Docker和Docker Compose是运行本服务的核心依赖，必须正确安装。以下提供了各主流操作系统的详细安装步骤。

**安装前注意事项：**
- 确保有足够的磁盘空间（至少10GB可用空间）
- **Linux推荐使用Ubuntu 22.04 LTS**
- 安装过程中可能需要重启系统
- 中国大陆用户建议配置镜像加速器

### Ubuntu 22.04 LTS（推荐）

可以参考docker官方安装文档（[安装 Docker](https://docs.docker.com/engine/install/)和[安装 Docker Compose](https://docs.docker.com/compose/install/)），也可以直接使用下面的命令尝试安装。

**1. 更新软件包索引**
```bash
sudo apt update
```

**2. 安装必要的软件包**
```bash
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
```

**3. 添加Docker官方GPG密钥**
```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

**4. 设置稳定版仓库**
```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

**5. 安装Docker Engine**
```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

**6. 启动Docker服务**
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

**7. 将用户添加到docker组**
```bash
sudo usermod -aG docker $USER
```

**8. 验证安装**
```bash
# 需要重新登录或运行以下命令
newgrp docker
docker --version
docker compose version
```

### macOS

可以参考docker官方安装文档（[在 Mac 内安装 Docker 桌面端](https://docs.docker.com/desktop/install/mac-install/)），也可以直接使用下面的命令尝试安装。

**方法一：使用OrbStack（推荐）**

OrbStack是一个轻量级的Docker替代方案，个人使用免费，性能更好，资源占用更少。

1. 访问 [OrbStack官网](https://orbstack.dev/)
2. 下载并安装OrbStack
3. 启动OrbStack后，自动支持`docker`和`docker compose`命令
4. 验证安装：
   ```bash
   docker --version
   docker compose version
   ```

**方法二：使用Docker Desktop**

1. 访问 [Docker Desktop官网](https://www.docker.com/products/docker-desktop/)
2. 下载适合你Mac的版本（Intel或Apple Silicon）
3. 双击安装包进行安装
4. 启动Docker Desktop
5. 验证安装：
   ```bash
   docker --version
   docker compose version
   ```

**方法三：使用Homebrew安装OrbStack**
```bash
# 安装Homebrew（如果尚未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装OrbStack
brew install orbstack

# 启动OrbStack
open /Applications/OrbStack.app
```

### Docker镜像加速（可选）

**中国大陆用户建议配置镜像加速器**

**Linux系统：**
```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

**macOS/Windows：**

**OrbStack (macOS推荐)：**
1. 打开OrbStack
2. 进入Settings
3. 选择Docker
4. 在Registry Mirrors中添加：
   ```
   https://docker.mirrors.ustc.edu.cn
   https://hub-mirror.c.163.com
   https://mirror.baidubce.com
   ```
5. 点击保存并重启

**Docker Desktop：**
1. 打开Docker Desktop
2. 进入Settings/Preferences
3. 选择Docker Engine
4. 在配置中添加：
   ```json
   {
     "registry-mirrors": [
       "https://docker.mirrors.ustc.edu.cn",
       "https://hub-mirror.c.163.com",
       "https://mirror.baidubce.com"
     ]
   }
   ```
5. 点击Apply & Restart

### 验证Docker安装

运行以下命令验证Docker是否正确安装：

```bash
# 检查Docker版本
docker --version

# 检查Docker Compose版本
docker compose version

# 运行hello-world测试
docker run hello-world

# 检查Docker服务状态
docker info
```

如果所有命令都能正常运行，说明Docker环境已经安装成功。

### Docker安装常见问题

**Q1: 提示 "permission denied" 错误**
```
A: 用户没有Docker权限，需要将用户添加到docker组：
sudo usermod -aG docker $USER
然后重新登录或执行：newgrp docker
```

**Q2: Docker服务启动失败**
```
A: 检查系统日志：sudo journalctl -u docker.service
   常见解决方案：
   - 清理Docker数据：sudo rm -rf /var/lib/docker
   - 重新安装Docker
```

**Q3: 网络连接问题**
```
A: 检查防火墙设置：
   - Ubuntu: sudo ufw status
   - 临时关闭防火墙测试：sudo ufw disable
```

**Q4: 磁盘空间不足**
```
A: 清理Docker数据：
   - 清理未使用的镜像：docker system prune
   - 清理所有数据：docker system prune -a
   - 查看磁盘使用：docker system df
```

**Q5: 容器无法启动**
```
A: 检查容器日志：
   - 查看容器状态：docker ps -a
   - 查看容器日志：docker logs <container_name>
   - 检查端口占用：netstat -tlnp | grep :80
```




# 问题反馈方式
- 直接提issues https://github.com/nuwax-ai/nuwax/issues
- 关注公众号，发送你的问题

![](wechat.png)
