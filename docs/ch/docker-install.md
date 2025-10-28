# Docker 环境安装指南

> **重要说明：** 本文档为 Docker 环境安装的详细步骤，仅供需要安装 Docker 的用户参考。如果您已经有 Docker 环境，可以跳过本文档。

Docker 和 Docker Compose 是运行 Nuwax 服务的核心依赖，必须正确安装。以下提供了各主流操作系统的详细安装步骤。

## 安装前注意事项

- 确保有足够的磁盘空间（至少10GB可用空间）
- **Linux 推荐使用 Ubuntu 22.04 LTS**
- 安装过程中可能需要重启系统
- 中国大陆用户建议配置镜像加速器

## Ubuntu 22.04 LTS（推荐）

可以参考 Docker 官方安装文档（[安装 Docker](https://docs.docker.com/engine/install/)和[安装 Docker Compose](https://docs.docker.com/compose/install/)），也可以直接使用下面的命令尝试安装。

### 1. 更新软件包索引
```bash
sudo apt update
```

### 2. 安装必要的软件包
```bash
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
```

### 3. 添加 Docker 官方 GPG 密钥
```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

### 4. 设置稳定版仓库
```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 5. 安装 Docker Engine
```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### 6. 启动 Docker 服务
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### 7. 将用户添加到 docker 组
```bash
sudo usermod -aG docker $USER
```

### 8. 验证安装
```bash
# 需要重新登录或运行以下命令
newgrp docker
docker --version
docker compose version
```

## macOS

可以参考 Docker 官方安装文档（[在 Mac 内安装 Docker 桌面端](https://docs.docker.com/desktop/install/mac-install/)），也可以直接使用下面的方法。

### 方法一：使用 OrbStack（推荐）

OrbStack 是一个轻量级的 Docker 替代方案，个人使用免费，性能更好，资源占用更少。

1. 访问 [OrbStack官网](https://orbstack.dev/)
2. 下载并安装 OrbStack
3. 启动 OrbStack 后，自动支持 `docker` 和 `docker compose` 命令
4. 验证安装：
   ```bash
   docker --version
   docker compose version
   ```

### 方法二：使用 Docker Desktop

1. 访问 [Docker Desktop官网](https://www.docker.com/products/docker-desktop/)
2. 下载适合你 Mac 的版本（Intel 或 Apple Silicon）
3. 双击安装包进行安装
4. 启动 Docker Desktop
5. 验证安装：
   ```bash
   docker --version
   docker compose version
   ```

### 方法三：使用 Homebrew 安装 OrbStack
```bash
# 安装 Homebrew（如果尚未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 OrbStack
brew install orbstack

# 启动 OrbStack
open /Applications/OrbStack.app
```

## Windows 10/11

### 使用 Docker Desktop（推荐）

1. 访问 [Docker Desktop官网](https://www.docker.com/products/docker-desktop/)
2. 下载适合你 Windows 的版本
3. 运行安装程序并按照提示完成安装
4. 启动 Docker Desktop
5. 验证安装：
   ```powershell
   docker --version
   docker compose version
   ```

## Docker 镜像加速（可选）

**中国大陆用户建议配置镜像加速器**

### Linux 系统
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

### macOS/Windows

#### OrbStack (macOS 推荐)
1. 打开 OrbStack
2. 进入 Settings
3. 选择 Docker
4. 在 Registry Mirrors 中添加：
   ```
   https://docker.mirrors.ustc.edu.cn
   https://hub-mirror.c.163.com
   https://mirror.baidubce.com
   ```
5. 点击保存并重启

#### Docker Desktop
1. 打开 Docker Desktop
2. 进入 Settings/Preferences
3. 选择 Docker Engine
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
5. 点击 Apply & Restart

## 验证 Docker 安装

运行以下命令验证 Docker 是否正确安装：

```bash
# 检查 Docker 版本
docker --version

# 检查 Docker Compose 版本
docker compose version

# 运行 hello-world 测试
docker run hello-world

# 检查 Docker 服务状态
docker info
```

如果所有命令都能正常运行，说明 Docker 环境已经安装成功。

## Docker 安装常见问题

### Q1: 提示 "permission denied" 错误
```
A: 用户没有Docker权限，需要将用户添加到docker组：
sudo usermod -aG docker $USER
然后重新登录或执行：newgrp docker
```

### Q2: Docker 服务启动失败
```
A: 检查系统日志：sudo journalctl -u docker.service
   常见解决方案：
   - 清理Docker数据：sudo rm -rf /var/lib/docker
   - 重新安装Docker
```

### Q3: 网络连接问题
```
A: 检查防火墙设置：
   - Ubuntu: sudo ufw status
   - 临时关闭防火墙测试：sudo ufw disable
```

### Q4: 磁盘空间不足
```
A: 清理Docker数据：
   - 清理未使用的镜像：docker system prune
   - 清理所有数据：docker system prune -a
   - 查看磁盘使用：docker system df
```

### Q5: 容器无法启动
```
A: 检查容器日志：
   - 查看容器状态：docker ps -a
   - 查看容器日志：docker logs <container_name>
   - 检查端口占用：netstat -tlnp | grep :80
```

## 下一步

Docker 环境安装完成后，请返回 [Nuwax 安装部署文档](../README.md#安装部署) 继续部署 Nuwax 服务。