# Nuwax
Nuwax AI - Easily build and deploy your private Agentic AI solutions.

Official Website: https://nuwax.com

Demo: https://agent.nuwax.com

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
- [nuwax-cli-linux-amd64.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.55/nuwax-cli-linux-amd64.tar.gz)
- [nuwax-cli-linux-arm64.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.55/nuwax-cli-linux-arm64.tar.gz)
- [nuwax-cli-macos-universal.tar.gz](https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.55/nuwax-cli-macos-universal.tar.gz) (amd64&arm64)

##### Execute Commands to Complete Deployment

The following commands require Docker permissions or can be run with sudo

#### Linux / macOS
```bash
# Example working directory
mkdir nuwax_deploy
cd nuwax_deploy

# Download client deployment tool
# Linux download command (amd64)
wget https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.55/nuwax-cli-linux-amd64.tar.gz
# Linux download command (arm64)
wget https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.55/nuwax-cli-linux-arm64.tar.gz
# macOS download command
wget https://nuwa-packages.oss-rg-china-mainland.aliyuncs.com/duck-client-releases/v1.0.55/nuwax-cli-macos-universal.tar.gz

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

  ![alt text](https://nuwax.com/images/image-101.png)

- Email service configuration for user registration and login verification codes.

  ![alt text](https://nuwax.com/images/image-91.png)

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

Intelligent Agent Platform Frontend Project

#### Project Overview

This is an intelligent agent platform frontend project based on React 18 + UmiJS Max + Ant Design, providing a complete solution for intelligent agent development, management, and usage. The project integrates advanced AI Agent systems, supporting file management, code editing, real-time preview, and AI assistant chat functionality.

##### Tech Stack

- **Frontend Framework**: React 18 + TypeScript 5.0
- **UI Component Library**: Ant Design 5.4 + ProComponents
- **Code Editor**: Monaco Editor 0.53.0
- **Graphics Engine**: AntV X6 2.18.1
- **Framework Tool**: UmiJS Max 4.x
- **State Management**: UmiJS built-in model
- **Styling Solution**: CSS Modules + Less
- **Package Manager**: pnpm 10.17.1
- **SSE Communication**: @microsoft/fetch-event-source 2.0.1

##### Key Features

- **Intelligent Agent Development & Management**: Complete intelligent agent creation, configuration, and management functionality
- **AppDev Web IDE**: Integrated development environment supporting file management, code editing, and real-time preview
- **AI Assistant Chat**: Real-time AI conversation functionality based on new OpenAPI specifications, supporting streaming responses and tool calls
- **Workspace Management**: Project file tree management, file upload, and version control
- **Knowledge Base Management**: Creation and maintenance of intelligent agent knowledge bases
- **Component Library Management**: Management and publishing of reusable components
- **MCP Service Management**: Model Context Protocol service integration
- **Ecosystem Management**: Plugin, template, and service ecosystem
- **🎨 Dynamic Theme Background Switching**: Support for 8 preset background images, real-time switching, persistent state

##### AI Chat Interface Update

###### 🔄 Interface Change Description

The project has been updated to an AI chat interface based on new OpenAPI specifications:

##### Theme Background Switching Feature

###### ✨ Main Features

- **8 Preset Backgrounds**: Provide multiple styles of background image choices
- **Real-time Switching**: Background image switching takes effect immediately without page refresh
- **State Persistence**: User-selected background images are saved to local storage
- **Theme Adaptation**: Support for light/dark themes, background images display well under different themes
- **Responsive Design**: Background images adapt to different screen sizes
- **Multi-language Support**: Support for Chinese and English interfaces

###### 🚀 Usage Methods

1. **Through Theme Control Panel**: Click the "Background" button in the bottom right corner of the page to select background images
2. **In Theme Demo Page**: Visit the theme demo page under the `/examples` route for testing

###### 📁 Related Files

- `src/hooks/useGlobalSettings.ts` - Background state management
- `src/components/ThemeControlPanel/` - Background selector component
- `src/layouts/index.tsx` - Background application logic
- `docs/background-switching.md` - Detailed feature documentation

##### Project Structure

```text
src/
├── components/          # Universal component library
│   ├── base/           # Basic components
│   ├── business-component/ # Business components
│   └── custom/         # Custom components
├── pages/              # Page components
│   ├── AppDev/         # Application development pages
│   │   ├── components/  # AppDev specific components
│   │   │   ├── FileTree/    # File tree component
│   │   │   ├── MonacoEditor/# Monaco editor component
│   │   │   ├── Preview/     # Preview component
│   │   │   └── AppDevHeader.tsx # Page header component
│   │   ├── index.tsx   # Main page
│   │   └── index.less  # Page styles
│   └── ...             # Other pages
├── hooks/              # Custom Hooks
│   ├── useAppDevChat.ts      # AI chat functionality
│   ├── useAppDevFileManagement.ts # File management
│   ├── useAppDevServer.ts    # Development server management
│   └── ...             # Other business Hooks
├── models/             # Data models and state management
│   └── appDev.ts       # Application development related state
├── services/           # API service layer
│   ├── appDev.ts       # Application development related APIs
│   └── ...             # Other business APIs
├── types/              # TypeScript type definitions
│   ├── interfaces/     # Interface type definitions
│   └── ...             # Other type definitions
├── utils/              # Utility functions
│   ├── monacoConfig.ts # Monaco Editor configuration
│   ├── sseManager.ts   # SSE connection management
│   └── ...             # Other utility functions
├── constants/          # Constant definitions
├── styles/             # Global styles
└── examples/           # Feature demo pages

public/
└── bg/                 # Background image resources
```

##### Development Guide

###### Environment Requirements

- **Node.js**: >= 18.0.0 (LTS version recommended)
- **Package Manager**: pnpm >= 8.0.0 (recommended) or npm >= 8.0.0
- **Operating System**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

###### Quick Start

####### 1. Install Dependencies

```bash
# Use pnpm (recommended)
pnpm install

# Or use npm
npm install
```

####### 2. Start Development Server

```bash
# Use pnpm
pnpm dev

# Or use npm
npm run dev
```

####### 4. Access Application

Open browser and visit `http://localhost:8000`

###### Build & Deployment

####### Development Environment Build

```bash
pnpm build:dev
```

####### Production Environment Build

```bash
pnpm build:prod
```

####### Local Preview of Build Results

```bash
pnpm serve
```

###### Code Standards

- **TypeScript**: All new files must use TypeScript, component Props and State must have type annotations
- **Component Development**: Use functional components and Hooks, component file naming uses PascalCase
- **Styling Solution**: Use CSS Modules to avoid global pollution, Less variables managed uniformly
- **State Management**: Use UmiJS model for global state, useState/useReducer for local state
- **Performance Optimization**: Use `useMemo` and `useCallback` to optimize rendering, routes and components must be lazy loaded
- **Code Quality**: Follow ESLint and Prettier standards, each component must have detailed JSDoc comments

##### Performance Optimization

- **Route Lazy Loading**: Use React.lazy and UmiJS dynamic loading
- **Component Lazy Loading**: Monaco Editor on-demand loading to reduce first-screen size
- **State Optimization**: Use `useMemo` and `useCallback` to avoid unnecessary rendering
- **Resource Optimization**: Image lazy loading and compression, static resource caching
- **Code Splitting**: Reasonably split business modules to avoid single files being too large

##### Deployment Instructions

###### Environment Variable Configuration

- `UMI_ENV`: Environment identifier (development/production)
- `NODE_ENV`: Node.js environment identifier
- Other custom environment variables

###### Build Optimization

- Code splitting and lazy loading
- Resource compression and caching
- Monaco Editor on-demand loading

##### Contributing Guide

1. Fork the project
2. Create feature branch
3. Submit code changes
4. Create Pull Request

## License

Apache 2.0 License - see [LICENSE](LICENSE) for details.
