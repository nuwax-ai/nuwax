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

#### 2. 消息处理器 (`pages/AppDev/index.tsx`)

处理不同类型的 AI 消息：

- `agent_thought_chunk`: AI 思考过程
- `agent_message_chunk`: AI 回复内容
- `tool_call`: 工具调用通知
- `prompt_end`: 会话结束

#### 3. 会话管理

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

### 调试技巧

- 使用浏览器开发者工具
- 启用详细日志记录
- 监控网络请求状态
- 分析内存使用情况

## 未来规划

### 功能增强

- 多模态交互支持
- 代码智能审查
- 自动化测试生成
- 性能优化建议

### 技术升级

- 更高效的通信协议
- 更智能的上下文管理
- 更强大的工具集成
- 更好的用户体验

## 总结

本 AI Agent 系统为用户提供了强大的智能化开发辅助功能，通过实时通信和流式处理，实现了自然、高效的交互体验。系统具备良好的扩展性和可维护性，能够适应不断变化的业务需求。
