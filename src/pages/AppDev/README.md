# AppDev 页面组件

## 功能概述

AppDev 是一个完整的 Web IDE 页面组件，提供了以下核心功能：

### 🚀 主要功能

1. **文件管理**

   - 文件树导航
   - 文件创建、删除、重命名
   - 文件夹管理
   - 文件内容编辑

2. **代码编辑**

   - 基于 Monaco Editor 的代码编辑器
   - 支持多种编程语言（TypeScript、JavaScript、React、CSS 等）
   - 语法高亮、代码补全、错误提示
   - 自动保存功能

3. **实时预览**

   - 开发服务器集成
   - 实时预览页面效果
   - 支持热重载

4. **项目管理**
   - 项目上传和导入
   - 开发服务器启动/停止/重启
   - 项目构建和部署

### 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **UI 组件库**: Ant Design 5.x
- **代码编辑器**: Monaco Editor
- **状态管理**: React Hooks + 自定义状态管理
- **编译服务**: Babel Standalone
- **构建工具**: UmiJS Max

### 📁 文件结构

```
src/pages/AppDev/
├── index.tsx              # 主页面组件
├── index.less             # 页面样式
└── README.md              # 说明文档

src/components/WebIDE/
├── FileTree/              # 文件树组件
│   ├── index.tsx
│   └── index.less
├── CodeEditor/            # 代码编辑器组件
│   ├── index.tsx
│   └── index.less
├── MonacoEditor/          # Monaco编辑器组件
│   ├── index.tsx
│   └── index.less
└── Preview/               # 预览组件
    ├── index.tsx
    └── index.less

src/models/
└── appDev.ts              # AppDev 状态管理

src/services/
├── appDev.ts              # AppDev API 服务
└── compiler.ts            # 编译服务
```

### 🚀 使用方法

1. **访问页面**

   ```
   /app-dev?projectId=your-project-id
   ```

2. **上传项目**

   - 点击"导入项目"按钮
   - 选择项目压缩包文件
   - 输入项目名称
   - 系统会自动启动开发服务器

3. **编辑代码**

   - 在左侧文件树中选择文件
   - 在代码编辑器中修改代码
   - 代码会自动保存

4. **预览效果**
   - 切换到"页面预览"标签
   - 查看实时预览效果

### 🔧 API 接口

AppDev 集成了以下后端 API：

- `POST /api/custom-page/start-dev` - 启动开发环境
- `POST /api/custom-page/stop-dev` - 停止开发环境
- `POST /api/custom-page/restart-dev` - 重启开发环境
- `POST /api/custom-page/build` - 构建项目
- `POST /api/custom-page/upload-and-start` - 上传并启动项目

### 🎨 主题支持

AppDev 完全支持 Ant Design 的主题系统，包括：

- 亮色/暗色主题切换
- 自定义主题色彩
- 响应式设计

### 📱 响应式设计

- 桌面端：完整的三栏布局（文件树 + 编辑器/预览 + 工具栏）
- 移动端：垂直堆叠布局，优化触摸操作

### 🔄 状态管理

使用自定义的 React Hooks 进行状态管理：

- `useAppDevStore()` - 主要状态管理 Hook
- 支持文件操作、项目设置、编译器状态等

### 🚀 性能优化

- 代码分割和懒加载
- Monaco Editor 按需加载
- 文件内容增量更新
- 防抖保存机制

### 🐛 错误处理

- 完善的错误边界
- 用户友好的错误提示
- 自动重试机制
- 详细的日志记录

### 🔮 未来规划

- [ ] 支持更多编程语言
- [ ] 集成 Git 版本控制
- [ ] 添加调试功能
- [ ] 支持插件系统
- [ ] 团队协作功能
