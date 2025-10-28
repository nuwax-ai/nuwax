# Docker Environment Installation Guide

> **Important Note:** This document provides detailed steps for Docker environment installation, only for users who need to install Docker. If you already have Docker environment, you can skip this document.

Docker and Docker Compose are core dependencies for running Nuwax services and must be installed correctly. The following provides detailed installation steps for various mainstream operating systems.

## Pre-installation Considerations

- Ensure sufficient disk space (at least 10GB available space)
- **Linux recommends using Ubuntu 22.04 LTS**
- System restart may be required during installation
- Mainland China users are recommended to configure mirror accelerators

## Ubuntu 22.04 LTS (Recommended)

You can refer to the official Docker installation documentation ([Install Docker](https://docs.docker.com/engine/install/) and [Install Docker Compose](https://docs.docker.com/compose/install/)), or you can directly use the following commands to try the installation.

### 1. Update package index
```bash
sudo apt update
```

### 2. Install necessary packages
```bash
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
```

### 3. Add Docker official GPG key
```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

### 4. Set up stable repository
```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 5. Install Docker Engine
```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### 6. Start Docker service
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### 7. Add user to docker group
```bash
sudo usermod -aG docker $USER
```

### 8. Verify installation
```bash
# Need to re-login or run the following command
newgrp docker
docker --version
docker compose version
```

## macOS

You can refer to the official Docker installation documentation ([Install Docker Desktop on Mac](https://docs.docker.com/desktop/install/mac-install/)), or you can directly use the following methods.

### Method 1: Use OrbStack (Recommended)

OrbStack is a lightweight Docker alternative, free for personal use, with better performance and lower resource usage.

1. Visit [OrbStack official website](https://orbstack.dev/)
2. Download and install OrbStack
3. After starting OrbStack, it automatically supports `docker` and `docker compose` commands
4. Verify installation:
   ```bash
   docker --version
   docker compose version
   ```

### Method 2: Use Docker Desktop

1. Visit [Docker Desktop official website](https://www.docker.com/products/docker-desktop/)
2. Download the version suitable for your Mac (Intel or Apple Silicon)
3. Double-click the installer to install
4. Start Docker Desktop
5. Verify installation:
   ```bash
   docker --version
   docker compose version
   ```

### Method 3: Install OrbStack using Homebrew
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install OrbStack
brew install orbstack

# Start OrbStack
open /Applications/OrbStack.app
```

## Windows 10/11

### Use Docker Desktop (Recommended)

1. Visit [Docker Desktop official website](https://www.docker.com/products/docker-desktop/)
2. Download the version suitable for your Windows
3. Run the installer and follow the prompts to complete the installation
4. Start Docker Desktop
5. Verify installation:
   ```powershell
   docker --version
   docker compose version
   ```

## Docker Mirror Acceleration (Optional)

**Mainland China users are recommended to configure mirror accelerators**

### Linux System
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

#### OrbStack (macOS Recommended)
1. Open OrbStack
2. Go to Settings
3. Select Docker
4. Add to Registry Mirrors:
   ```
   https://docker.mirrors.ustc.edu.cn
   https://hub-mirror.c.163.com
   https://mirror.baidubce.com
   ```
5. Click save and restart

#### Docker Desktop
1. Open Docker Desktop
2. Go to Settings/Preferences
3. Select Docker Engine
4. Add to configuration:
   ```json
   {
     "registry-mirrors": [
       "https://docker.mirrors.ustc.edu.cn",
       "https://hub-mirror.c.163.com",
       "https://mirror.baidubce.com"
     ]
   }
   ```
5. Click Apply & Restart

## Verify Docker Installation

Run the following commands to verify Docker is installed correctly:

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version

# Run hello-world test
docker run hello-world

# Check Docker service status
docker info
```

If all commands run successfully, it means Docker environment has been installed successfully.

## Docker Installation Common Issues

### Q1: "permission denied" error
```
A: User doesn't have Docker permissions, need to add user to docker group:
sudo usermod -aG docker $USER
Then re-login or execute: newgrp docker
```

### Q2: Docker service startup failed
```
A: Check system logs: sudo journalctl -u docker.service
   Common solutions:
   - Clean Docker data: sudo rm -rf /var/lib/docker
   - Reinstall Docker
```

### Q3: Network connection issues
```
A: Check firewall settings:
   - Ubuntu: sudo ufw status
   - Temporarily disable firewall for testing: sudo ufw disable
```

### Q4: Insufficient disk space
```
A: Clean Docker data:
   - Clean unused images: docker system prune
   - Clean all data: docker system prune -a
   - Check disk usage: docker system df
```

### Q5: Container cannot start
```
A: Check container logs:
   - Check container status: docker ps -a
   - Check container logs: docker logs <container_name>
   - Check port usage: netstat -tlnp | grep :80
```

## Next Steps

After Docker environment installation is complete, please return to [Nuwax Installation & Deployment Documentation](../README.md#installation-deployment) to continue deploying Nuwax services.