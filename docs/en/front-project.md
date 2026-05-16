### Frontend Project

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
- **Multi-language Support**: Support for Chinese, English, and Japanese interfaces

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
