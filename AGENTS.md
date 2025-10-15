# AI Agent System Documentation

## 系统概述

本项目集成了先进的 AI Agent 系统，为用户提供智能化的代码开发辅助功能。系统通过 SSE (Server-Sent Events) 实现实时通信，支持流式对话和工具调用。

## AI Agent 架构

### 核心组件

#### 1. SSE 连接管理器 (`utils/sseManager.ts`)

负责管理与服务器的实时连接：

- 自动重连机制
- 连接状态监控
- 消息分发和处理
- 错误恢复策略

#### 2. AppDev Web IDE 系统

**文件管理 Hook (`hooks/useAppDevFileManagement.ts`)**

- 项目文件树管理
- 文件内容缓存和同步
- 文件修改状态跟踪
- 自动保存机制

**开发服务器 Hook (`hooks/useAppDevServer.ts`)**

- 开发环境自动启动
- 服务器状态监控
- 保活机制
- 端口自动分配

**聊天系统 Hook (`hooks/useAppDevChat.ts`)**

- SSE 实时连接管理
- 消息流式处理
- AI 思考过程展示
- 工具调用状态管理

#### 3. 消息处理器 (`pages/AppDev/index.tsx`)

处理不同类型的 AI 消息：

- `agent_thought_chunk`: AI 思考过程
- `agent_message_chunk`: AI 回复内容
- `tool_call`: 工具调用通知
- `prompt_end`: 会话结束

#### 4. 会话管理

- 会话 ID 生成和管理
- 多会话并发支持
- 会话状态持久化

## AI 功能特性

### 1. 智能对话

```typescript
interface ChatMessage {
  id: string;
  type: 'ai' | 'user' | 'button' | 'section' | 'thinking' | 'tool_call';
  content?: string;
  sessionId?: string;
  isStreaming?: boolean;
}
```

### 2. 思考过程可视化

- 实时显示 AI 思考过程
- 上下文理解展示
- 推理路径可视化

### 3. 工具调用支持

- 自动执行开发任务
- 文件操作自动化
- 代码生成和修改

### 4. 流式响应

- 实时文本流显示
- 打字机效果
- 增量内容更新

## AppDev Web IDE 功能

### 1. 文件管理系统

**文件树组件 (`pages/AppDev/components/FileTree/index.tsx`)**

- 支持文件夹展开/折叠
- 文件选择和编辑
- 文件创建、删除操作
- 拖拽操作支持
- 右键菜单功能

**文件内容管理**

- 文件内容缓存机制
- 修改状态实时跟踪
- 自动保存功能
- 文件类型识别

### 2. 代码编辑器

**Monaco Editor 集成 (`pages/AppDev/components/MonacoEditor/index.tsx`)**

- 支持多种编程语言语法高亮
- TypeScript/JavaScript 智能提示
- 自定义主题配置
- 实时内容同步
- 代码折叠和格式化

### 3. 实时预览系统

**预览组件 (`pages/AppDev/components/Preview/index.tsx`)**

- iframe 嵌入式预览
- 自动刷新功能
- 全屏预览支持
- 错误状态处理
- 加载状态显示

### 4. 开发服务器管理

**服务器生命周期管理**

- 自动启动开发环境
- 自动端口分配 (3000-4000 范围)
- 服务器状态实时监控
- 保活机制防止服务中断
- 错误恢复和重试机制

### 5. 错误恢复机制

**开发环境错误处理**

- 后端服务不可用时的前端开发支持
- URL 参数控制 (`?mock=true/false`)
- localStorage 持久化配置
- 模拟网络延迟 (300ms)
- 完整的 API 端点模拟

## 集成接口

### 核心服务接口

#### 发送聊天消息

```typescript
const response = await sendChatMessage({
  user_id: 'app-dev-user',
  prompt: userInput,
  project_id: workspace.projectId,
  session_id: sessionId,
  request_id: generateRequestId(),
});
```

#### 取消 AI 任务

```typescript
await cancelAgentTask(workspace.projectId, sessionId);
```

### 消息类型定义

#### Agent 思考数据

```typescript
interface AgentThoughtData {
  thinking: string;
  timestamp: string;
  context?: string;
}
```

#### Agent 消息数据

```typescript
interface AgentMessageData {
  content: {
    text: string;
    reasoning?: string;
    suggestions?: string[];
  };
  is_final: boolean;
}
```

## 使用场景

### 1. 代码开发辅助

- 代码生成和补全
- Bug 修复建议
- 代码重构指导

### 2. 项目管理

- 项目结构分析
- 技术选型建议
- 最佳实践推荐

### 3. 学习指导

- 概念解释
- 实例演示
- 渐进式学习路径

### 4. 问题解决

- 错误诊断
- 性能优化
- 架构设计

### 5. AppDev Web IDE 使用场景

**前端项目开发**

- React/Next.js 项目快速搭建
- 组件开发和调试
- 样式和布局调整
- 实时预览和测试

**全栈应用开发**

- 前后端联调
- API 接口测试
- 数据库操作
- 部署和发布

**教学和演示**

- 代码示例展示
- 交互式编程教学
- 技术概念验证
- 原型快速开发

**团队协作**

- 代码审查和讨论
- 问题排查和解决
- 知识分享和传递
- 最佳实践推广

## 配置选项

### AI 模型配置

```typescript
const aiConfig = {
  model: 'deepseek-v3',
  temperature: 0.7,
  maxTokens: 4000,
  streamEnabled: true,
};
```

### 连接配置

```typescript
const sseConfig = {
  baseUrl: 'http://localhost:8000',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};
```

### AppDev Web IDE 配置

**开发服务器配置**

```typescript
const devServerConfig = {
  portRange: [3000, 4000],
  keepAliveInterval: 30000,
  maxRetryAttempts: 3,
  startupTimeout: 60000,
};
```

**文件管理配置**

```typescript
const fileManagementConfig = {
  autoSaveDelay: 2000,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFileTypes: ['.js', '.ts', '.jsx', '.tsx', '.css', '.less', '.html'],
  cacheExpiration: 300000, // 5分钟
};
```

**Monaco Editor 配置**

```typescript
const monacoConfig = {
  theme: 'vs-dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on',
  minimap: { enabled: true },
  automaticLayout: true,
};
```

**错误恢复配置**

```typescript
const errorRecoveryConfig = {
  enabled: process.env.NODE_ENV === 'development',
  networkDelay: 300,
  retryAttempts: 3,
  persistentStorage: true,
};
```

## 最佳实践

### 1. 提示词优化

- 明确具体的任务描述
- 提供充分的上下文信息
- 使用结构化的输入格式

### 2. 会话管理

- 保持会话的连续性
- 适时创建新的会话
- 及时清理无用会话

### 3. 错误处理

- 优雅处理网络中断
- 提供用户友好的错误信息
- 实现自动重试机制

### 4. 性能优化

- 合理控制消息频率
- 避免过长的对话历史
- 及时清理无用数据

### 5. AppDev Web IDE 最佳实践

**文件管理**

- 合理组织项目文件结构
- 及时保存文件修改
- 使用有意义的文件名
- 避免过大的文件

**开发服务器**

- 定期重启服务器释放资源
- 监控服务器运行状态
- 合理配置端口范围
- 及时处理服务器错误

**代码编辑**

- 使用 TypeScript 提高代码质量
- 合理配置编辑器主题和字体
- 利用代码提示和自动补全
- 定期格式化代码

**预览调试**

- 充分利用实时预览功能
- 及时处理预览错误
- 使用浏览器开发者工具
- 测试不同设备和屏幕尺寸

**错误恢复开发**

- 在开发环境优先使用错误恢复机制
- 合理配置错误处理策略
- 定期同步真实 API 接口
- 注意错误恢复和真实环境的差异

## 安全考虑

### 1. 数据保护

- 敏感信息脱敏
- 数据传输加密
- 访问权限控制

### 2. 输入验证

- 恶意输入检测
- 内容长度限制
- 格式规范验证

### 3. 输出过滤

- 有害内容过滤
- 代码安全检查
- 版权合规验证

## 扩展开发

### 添加新的 AI 功能

1. 在 `services/appDev.ts` 中添加新的 API 接口
2. 在 SSE Manager 中注册新的消息类型
3. 在组件中添加对应的处理逻辑
4. 更新 TypeScript 类型定义

### 自定义 AI 行为

```typescript
const customAgentConfig = {
  personality: 'professional',
  responseStyle: 'detailed',
  specializedDomain: 'web-development',
};
```

### 集成第三方 AI 服务

```typescript
interface ExternalAIService {
  sendMessage(prompt: string): Promise<AIResponse>;
  cancelRequest(requestId: string): Promise<void>;
  streamResponse(prompt: string): AsyncGenerator<StreamChunk>;
}
```

### AppDev Web IDE 扩展开发

**添加新的文件类型支持**

1. 在 `utils/appDevUtils.ts` 中添加文件类型识别逻辑
2. 在 `utils/monacoConfig.ts` 中添加语言映射
3. 在 MonacoEditor 组件中添加对应的语言支持
4. 更新文件图标和预览逻辑

**自定义编辑器主题**

```typescript
const customTheme = {
  name: 'custom-dark',
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955' },
    { token: 'keyword', foreground: '569CD6' },
  ],
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
  },
};
```

**扩展文件操作功能**

1. 在 `hooks/useAppDevFileManagement.ts` 中添加新的文件操作
2. 在 `services/appDev.ts` 中添加对应的 API 接口
3. 在 FileTree 组件中添加 UI 交互
4. 更新文件状态管理逻辑

**自定义预览组件**

```typescript
interface CustomPreviewProps {
  fileType: string;
  content: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
}

const CustomPreview: React.FC<CustomPreviewProps> = ({
  fileType,
  content,
  onError,
  onLoad,
}) => {
  // 自定义预览逻辑
};
```

**添加新的开发服务器类型**

1. 在 `services/appDev.ts` 中添加新的服务器启动逻辑
2. 在 `hooks/useAppDevServer.ts` 中添加服务器类型支持
3. 更新服务器配置和状态管理
4. 添加对应的错误处理和重试机制

## 监控和日志

### 性能监控

- 响应时间统计
- 成功率监控
- 资源使用情况

### 日志记录

- 请求/响应日志
- 错误日志记录
- 用户行为分析

### 调试工具

- 消息流可视化
- 连接状态监控
- 性能分析工具

## 故障排除

### 常见问题

1. **连接中断**: 检查网络连接和服务器状态
2. **响应超时**: 调整超时配置或检查服务器负载
3. **消息丢失**: 验证会话 ID 和消息格式
4. **性能问题**: 优化消息处理逻辑和数据结构

### AppDev Web IDE 故障排除

**开发服务器问题**

1. **服务器启动失败**: 检查端口占用情况，尝试手动指定端口
2. **服务器无响应**: 重启服务器，检查服务器日志
3. **端口冲突**: 修改端口范围配置，清理占用端口的进程
4. **保活失败**: 检查网络连接，调整保活间隔时间

**文件管理问题**

1. **文件保存失败**: 检查文件权限，验证文件路径
2. **文件内容丢失**: 检查自动保存配置，恢复缓存内容
3. **文件树不更新**: 刷新页面，检查文件系统状态
4. **文件上传失败**: 检查文件大小限制，验证文件格式

**编辑器问题**

1. **语法高亮异常**: 检查语言配置，重新加载编辑器
2. **代码提示不工作**: 验证 TypeScript 配置，重启编辑器
3. **主题显示异常**: 重置编辑器主题，检查 CSS 样式
4. **编辑器卡顿**: 检查文件大小，优化编辑器配置

**预览问题**

1. **预览无法加载**: 检查开发服务器状态，验证 URL 配置
2. **预览内容错误**: 检查文件内容，重新构建项目
3. **预览样式异常**: 检查 CSS 文件，验证样式加载
4. **预览响应慢**: 优化项目构建，检查网络延迟

### 调试技巧

- 使用浏览器开发者工具
- 启用详细日志记录
- 监控网络请求状态
- 分析内存使用情况
- 使用浏览器开发者工具
- 检查控制台错误信息
- 验证 API 接口响应
- 监控服务器运行状态

## 未来规划

### 功能增强

- 多模态交互支持
- 代码智能审查
- 自动化测试生成
- 性能优化建议

### AppDev Web IDE 功能规划

**编辑器增强**

- 多文件标签页支持
- 代码折叠和大纲视图
- 智能代码重构
- 实时协作编辑

**项目管理**

- 项目模板和脚手架
- 依赖管理和版本控制
- 项目部署和发布
- 团队协作功能

**调试和测试**

- 集成调试器
- 单元测试运行器
- 性能分析工具
- 错误追踪和报告

**扩展生态**

- 插件系统
- 主题市场
- 代码片段库
- 第三方工具集成

### 技术升级

- 更高效的通信协议
- 更智能的上下文管理
- 更强大的工具集成
- 更好的用户体验

### 性能优化

- WebAssembly 支持
- 虚拟文件系统
- 增量编译
- 智能缓存策略

## 总结

本 AI Agent 系统为用户提供了强大的智能化开发辅助功能，通过实时通信和流式处理，实现了自然、高效的交互体验。系统具备良好的扩展性和可维护性，能够适应不断变化的业务需求。

### AppDev Web IDE 核心价值

**开发效率提升**

- 一站式开发环境，无需本地安装
- 实时预览和调试，快速迭代
- AI 辅助编程，智能代码生成
- 云端协作，团队无缝配合

**技术栈现代化**

- 基于 React 18 + TypeScript 的现代前端架构
- Monaco Editor 提供专业级代码编辑体验
- SSE 实时通信，低延迟交互
- 模块化设计，易于扩展和维护

**用户体验优化**

- 直观的界面设计，降低学习成本
- 响应式布局，适配各种设备
- 完善的错误处理和用户反馈
- 离线开发能力

通过持续的技术创新和功能完善，AppDev Web IDE 将成为开发者进行 Web 应用开发的强大工具，为用户提供更加智能、高效的开发体验。

## 项目命名规范

### 文件命名规范

#### 组件文件

- **组件目录**: 使用 PascalCase，如 `FileTree/`、`MonacoEditor/`
- **组件文件**: `index.tsx` 或 `ComponentName.tsx`
- **样式文件**: `index.less` 或 `ComponentName.less`
- **类型文件**: `type.ts` 或 `ComponentName.types.ts`

#### 页面文件

- **页面目录**: 使用 PascalCase，如 `AppDev/`、`EditAgent/`
- **页面文件**: `index.tsx`
- **页面样式**: `index.less`
- **页面组件**: 放在 `components/` 子目录下

#### Hook 文件

- **Hook 文件**: `useHookName.ts`，如 `useAppDevChat.ts`
- **Hook 类型**: 在同一个文件中定义或单独的 `types.ts`

#### 服务文件

- **服务文件**: `serviceName.ts`，如 `appDev.ts`、`userService.ts`
- **API 接口**: 使用动词开头，如 `getUserInfo`、`createProject`

#### 工具文件

- **工具文件**: `utilityName.ts`，如 `appDevUtils.ts`、`monacoConfig.ts`
- **常量文件**: `constants.ts` 或 `constantName.ts`

### 变量命名规范

#### 组件命名

```typescript
// 组件名使用 PascalCase
const FileTree = () => { ... };
const MonacoEditor = () => { ... };

// 组件 Props 接口
interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
}
```

#### Hook 命名

```typescript
// Hook 名以 use 开头，使用 camelCase
const useAppDevChat = () => { ... };
const useFileManagement = () => { ... };

// Hook 返回值使用描述性命名
const { messages, sendMessage, isLoading } = useAppDevChat();
```

#### 状态命名

```typescript
// 状态变量使用描述性命名
const [isLoading, setIsLoading] = useState(false);
const [activeFile, setActiveFile] = useState<FileNode | null>(null);
const [devServerUrl, setDevServerUrl] = useState<string | null>(null);
```

#### API 函数命名

```typescript
// API 函数使用动词开头
export const getProjectContent = async (projectId: string) => { ... };
export const uploadAndStartProject = async (files: File[]) => { ... };
export const startDev = async (projectId: string) => { ... };
```

## 项目分层规范

### 目录结构分层

#### 1. 页面层 (Pages)

```
src/pages/
├── AppDev/              # 应用开发页面
│   ├── components/      # 页面专用组件
│   ├── index.tsx        # 页面入口
│   └── index.less       # 页面样式
├── EditAgent/           # 编辑智能体页面
└── ...                  # 其他页面
```

**职责**:

- 页面级路由和布局
- 页面级状态管理
- 页面级组件组合

#### 2. 组件层 (Components)

```
src/components/
├── base/                # 基础组件
│   ├── Button/          # 按钮组件
│   ├── Input/           # 输入框组件
│   └── ...              # 其他基础组件
├── business-component/  # 业务组件
│   ├── CardWrapper/     # 卡片包装器
│   └── ...              # 其他业务组件
└── ...                  # 其他通用组件
```

**职责**:

- 可复用的 UI 组件
- 组件级逻辑封装
- 组件级样式定义

#### 3. 业务逻辑层 (Hooks)

```
src/hooks/
├── useAppDevChat.ts         # AI 聊天逻辑
├── useAppDevFileManagement.ts # 文件管理逻辑
├── useAppDevServer.ts       # 开发服务器逻辑
└── ...                      # 其他业务逻辑
```

**职责**:

- 业务逻辑封装
- 状态管理
- 副作用处理

#### 4. 服务层 (Services)

```
src/services/
├── appDev.ts            # 应用开发相关 API
├── userService.ts       # 用户相关 API
├── agentService.ts      # 智能体相关 API
└── ...                  # 其他服务
```

**职责**:

- API 接口封装
- 数据转换
- 错误处理

#### 5. 数据层 (Models)

```
src/models/
├── appDev.ts            # 应用开发状态模型
├── user.ts              # 用户状态模型
└── ...                  # 其他状态模型
```

**职责**:

- 全局状态管理
- 数据模型定义
- 状态持久化

#### 6. 工具层 (Utils)

```
src/utils/
├── appDevUtils.ts       # 应用开发工具函数
├── monacoConfig.ts      # Monaco 编辑器配置
├── sseManager.ts        # SSE 连接管理
└── ...                  # 其他工具函数
```

**职责**:

- 工具函数封装
- 配置管理
- 通用逻辑

#### 7. 类型层 (Types)

```
src/types/
├── interfaces/          # 接口类型定义
│   ├── appDev.ts       # 应用开发接口
│   ├── user.ts         # 用户接口
│   └── ...             # 其他接口
└── ...                 # 其他类型定义
```

**职责**:

- TypeScript 类型定义
- 接口规范
- 类型安全

### 分层依赖规范

#### 依赖方向

```
Pages → Components → Hooks → Services → Utils
  ↓        ↓         ↓        ↓        ↓
Models ← Types ← Constants ← Styles ← Locales
```

#### 依赖规则

1. **页面层** 可以依赖所有其他层
2. **组件层** 可以依赖 Hooks、Services、Utils、Types
3. **业务逻辑层** 可以依赖 Services、Utils、Types
4. **服务层** 可以依赖 Utils、Types
5. **工具层** 只能依赖 Types、Constants
6. **类型层** 不依赖任何其他层

#### 禁止的依赖

- 组件不能直接依赖 Models
- Hooks 不能直接依赖 Components
- Services 不能依赖 Hooks
- Utils 不能依赖 Services

### 代码组织规范

#### 文件内部结构

```typescript
// 1. 导入外部依赖
import React from 'react';
import { Button } from 'antd';

// 2. 导入内部依赖
import { useAppDevChat } from '@/hooks/useAppDevChat';
import type { ChatMessage } from '@/types/interfaces/appDev';

// 3. 类型定义
interface ComponentProps {
  // props 定义
}

// 4. 组件实现
const Component: React.FC<ComponentProps> = ({ ...props }) => {
  // 组件逻辑
  return (
    // JSX
  );
};

// 5. 导出
export default Component;
```

#### 目录结构规范

```
ComponentName/
├── index.tsx           # 组件入口
├── index.less          # 组件样式
├── components/         # 子组件
│   └── SubComponent/
├── hooks/              # 组件专用 hooks
├── types.ts            # 组件类型定义
└── README.md           # 组件文档
```
