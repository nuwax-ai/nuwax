# ChatArea 组件

## 概述

ChatArea 组件是 AppDev 页面中的聊天会话区域，负责处理 AI 助手的交互界面。

## 功能特性

- 聊天模式切换（Chat/Design）
- 版本选择器
- 聊天消息显示
- 消息输入和发送
- 加载状态显示
- 流式传输状态显示（正在输出中）
- 取消 AI 任务（调用 cancelAgentTask API）

## Props 接口

```typescript
interface ChatAreaProps {
  chatMode: 'chat' | 'design';
  setChatMode: (mode: 'chat' | 'design') => void;
  chat: ReturnType<typeof useAppDevChat>;
  projectInfo: ReturnType<typeof useAppDevProjectInfo>;
  projectId: string; // 项目ID，用于 cancelAgentTask API
  onVersionSelect: (version: number) => void;
}
```

### 属性说明

- `chatMode`: 当前聊天模式
- `setChatMode`: 切换聊天模式的回调函数
- `chat`: useAppDevChat hook 的返回值
- `projectInfo`: useAppDevProjectInfo hook 的返回值
- `projectId`: 项目 ID，用于 cancelAgentTask API 调用
- `onVersionSelect`: 版本选择回调函数

## 使用示例

```tsx
import ChatArea from './components/ChatArea';

const AppDev: React.FC = () => {
  const [chatMode, setChatMode] = useState<'chat' | 'design'>('chat');
  const chat = useAppDevChat({ projectId });
  const projectInfo = useAppDevProjectInfo(projectId);

  const handleVersionSelect = (version: number) => {
    // 处理版本选择逻辑
  };

  return (
    <ChatArea
      chatMode={chatMode}
      setChatMode={setChatMode}
      chat={chat}
      projectInfo={projectInfo}
      projectId={projectId}
      onVersionSelect={handleVersionSelect}
    />
  );
};
```

## 样式

组件使用 Less 样式文件 `index.less`，包含以下主要样式类：

- `.chatCard`: 主容器卡片样式
- `.chatModeContainer`: 聊天模式切换容器
- `.chatMessages`: 消息显示区域
- `.chatInput`: 输入区域
- `.message`: 单条消息样式
- `.inputField`: 输入框样式

## SSE 会话数据示例

### 消息类型

ChatArea 组件通过 SSE (Server-Sent Events) 接收实时消息，支持以下消息类型：

#### 1. 会话开始

```json
{
  "event": "prompt_start",
  "data": {
    "sessionId": "0199dc90-465c-76c9-8962-5db74decfa40",
    "messageType": "sessionPromptStart",
    "subType": "prompt_start",
    "data": {
      "request_id": "req_1760342066426_yhyb56b"
    },
    "timestamp": "2025-10-13T08:20:23.295844952Z"
  }
}
```

#### 2. AI 消息流

```json
{
  "event": "agent_message_chunk",
  "data": {
    "sessionId": "0199dc90-465c-76c9-8962-5db74decfa40",
    "messageType": "agentSessionUpdate",
    "subType": "agent_message_chunk",
    "data": {
      "request_id": "req_1760342066426_yhyb56b",
      "text": "I see you're continuing to provide numbers...",
      "type": "text"
    },
    "timestamp": "2025-10-13T08:20:33.078737908Z"
  }
}
```

#### 3. 执行计划

```json
{
  "event": "plan",
  "data": {
    "sessionId": "0199dc90-465c-76c9-8962-5db74decfa40",
    "messageType": "agentSessionUpdate",
    "subType": "plan",
    "data": {
      "entries": [
        {
          "content": "Analyze the existing Vue.js web-crawler-monitor project structure",
          "priority": "medium",
          "status": "pending"
        },
        {
          "content": "Plan the React conversion approach and architecture",
          "priority": "medium",
          "status": "pending"
        }
      ],
      "request_id": "req_1760342066426_yhyb56b"
    },
    "timestamp": "2025-10-13T08:20:33.153923405Z"
  }
}
```

#### 4. 工具调用

```json
{
  "event": "tool_call",
  "data": {
    "sessionId": "0199dc90-465c-76c9-8962-5db74decfa40",
    "messageType": "agentSessionUpdate",
    "subType": "tool_call",
    "data": {
      "kind": "read",
      "locations": [
        {
          "line": 0,
          "path": "/home/swufe/workspace/rcoder-server/project_workspace/1976620100358377472/index.html",
          "type": "ToolCallLocation"
        }
      ],
      "rawInput": {
        "file_path": "/home/swufe/workspace/rcoder-server/project_workspace/1976620100358377472/index.html"
      },
      "request_id": "req_1760342066426_yhyb56b",
      "title": "Read File",
      "toolCallId": "call_obduyf43cyr"
    },
    "timestamp": "2025-10-13T08:20:41.045914680Z"
  }
}
```

#### 5. 工具调用结果

````json
{
  "event": "tool_call_update",
  "data": {
    "sessionId": "0199dc90-465c-76c9-8962-5db74decfa40",
    "messageType": "agentSessionUpdate",
    "subType": "tool_call_update",
    "data": {
      "content": [
        {
          "content": {
            "text": "```\n<!DOCTYPE html>\n<html lang=\"zh-CN\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <title>网页爬虫监控</title>\n  </head>\n  <body>\n    <div id=\"app\"></div>\n    <script type=\"module\" src=\"/src/main.js\"></script>\n  </body>\n</html>\n```",
            "type": "text"
          },
          "type": "content"
        }
      ],
      "request_id": "req_1760342066426_yhyb56b",
      "status": "completed",
      "toolCallId": "call_obduyf43cyr"
    },
    "timestamp": "2025-10-13T08:20:41.063926773Z"
  }
}
````

#### 6. 心跳保持

```json
{
  "event": "heartbeat",
  "data": {
    "sessionId": "0199dc90-465c-76c9-8962-5db74decfa40",
    "messageType": "heartbeat",
    "subType": "ping",
    "data": {
      "message": "keep-alive",
      "timestamp": "2025-10-13T08:21:53.682147035+00:00",
      "type": "heartbeat"
    },
    "timestamp": "2025-10-13T08:21:53.682148500Z"
  }
}
```

#### 7. 会话结束

```json
{
  "event": "prompt_end",
  "data": {
    "sessionId": "0199dc90-465c-76c9-8962-5db74decfa40",
    "messageType": "sessionPromptEnd",
    "subType": "end_turn",
    "data": {
      "description": "正常结束",
      "reason": "EndTurn",
      "request_id": "req_1760342066426_yhyb56b"
    },
    "timestamp": "2025-10-13T08:21:55.442307102Z"
  }
}
```

### 消息处理流程

1. **连接建立**: 组件初始化时建立 SSE 连接
2. **消息接收**: 实时接收服务器推送的消息
3. **消息解析**: 根据 `event` 类型解析不同的消息数据
4. **状态更新**: 更新聊天状态、消息列表、加载状态等
5. **UI 渲染**: 根据消息类型渲染不同的 UI 组件
6. **错误处理**: 处理连接中断、消息解析错误等异常情况

### 消息状态管理

- **pending**: 消息等待处理
- **in_progress**: 消息正在处理中
- **completed**: 消息处理完成
- **failed**: 消息处理失败

## 依赖

- React
- Ant Design 组件
- useAppDevChat Hook
- useAppDevProjectInfo Hook
- TypeScript 类型定义
- SSE (Server-Sent Events) 连接管理
