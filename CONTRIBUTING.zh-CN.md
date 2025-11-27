# Contributing to @nuwax-ai/nuwax

## Development Setup

1. Install Dependencies

```bash
# Use pnpm (recommended)
pnpm install

# Or use npm
npm install
```

2. Start Development Server

```bash
# Use pnpm
pnpm dev

# Or use npm
npm run dev
```

3. Access Application

Open browser and visit `http://localhost:3000`

## Project Structure

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

## Building

#### Development Environment Build

```bash
pnpm build:dev
```

### Production Environment Build

```bash
pnpm build:prod
```

#### Local Preview of Build Results

```bash
pnpm serve
```

### Code Standards

- **TypeScript**: All new files must use TypeScript, component Props and State must have type annotations
- **Component Development**: Use functional components and Hooks, component file naming uses PascalCase
- **Styling Solution**: Use CSS Modules to avoid global pollution, Less variables managed uniformly
- **State Management**: Use UmiJS model for global state, useState/useReducer for local state
- **Performance Optimization**: Use `useMemo` and `useCallback` to optimize rendering, routes and components must be lazy loaded
- **Code Quality**: Follow ESLint and Prettier standards, each component must have detailed JSDoc comments

#### Performance Optimization

- **Route Lazy Loading**: Use React.lazy and UmiJS dynamic loading
- **Component Lazy Loading**: Monaco Editor on-demand loading to reduce first-screen size
- **State Optimization**: Use `useMemo` and `useCallback` to avoid unnecessary rendering
- **Resource Optimization**: Image lazy loading and compression, static resource caching
- **Code Splitting**: Reasonably split business modules to avoid single files being too large
