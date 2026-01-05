# SSE (Server-Sent Events) 实现方案指南

## 📋 目录

- [概述](#概述)
- [核心架构](#核心架构)
- [快速开始：创建 SSE 连接](#快速开始创建-sse-连接)
- [实现步骤：自定义 SSE 处理逻辑](#实现步骤自定义-sse-处理逻辑)
- [SSE 消息类型详解](#sse-消息类型详解)
- [现有示例](#现有示例)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 概述

本项目使用 SSE (Server-Sent Events) 技术实现服务器到客户端的实时数据推送，主要用于 AI 对话、流式消息传输等场景。通过统一的 SSE 连接管理工具，可以方便地在项目中创建和管理 SSE 连接。

### 核心优势

- ✅ **统一管理**：提供统一的 SSE 连接创建和管理接口
- ✅ **自动重连**：支持连接断开后的自动重连机制
- ✅ **超时控制**：自动检测连接超时并主动断开
- ✅ **生命周期管理**：完善的连接生命周期管理（打开、消息、错误、关闭）
- ✅ **类型安全**：完整的 TypeScript 类型定义
- ✅ **错误处理**：完善的错误处理和恢复机制

## 核心架构

### 技术栈

- **SSE 库**：`@microsoft/fetch-event-source`
- **连接管理**：`src/utils/fetchEventSource.ts`
- **状态管理**：UmiJS Model 或 React Hooks
- **类型定义**：`src/types/interfaces/appDev.ts`

### 架构图

```
┌─────────────────────────────────────────┐
│        业务组件 (Component)               │
│  (ChatArea, ChatTemp, etc.)             │
└──────────────┬──────────────────────────┘
               │
               │ 调用 Hook/Model
               ▼
┌─────────────────────────────────────────┐
│        业务逻辑层 (Hook/Model)            │
│  - useAppDevChat                        │
│  - appDevSseConnection Model            │
│  - conversationInfo Model                │
└──────────────┬──────────────────────────┘
               │
               │ 调用 createSSEConnection
               ▼
┌─────────────────────────────────────────┐
│        SSE 工具层 (Utils)                │
│  - createSSEConnection()                │
│  - clearSSESharedTimeout()              │
│  - generateSSEUrl()                     │
└──────────────┬──────────────────────────┘
               │
               │ 使用 fetchEventSource
               ▼
┌─────────────────────────────────────────┐
│      @microsoft/fetch-event-source      │
│  (底层 SSE 实现)                         │
└─────────────────────────────────────────┘
```

### 核心文件结构

```
src/
├── utils/
│   ├── fetchEventSource.ts          # SSE 连接核心工具
│   └── chatUtils.ts                 # SSE URL 生成工具
├── hooks/
│   └── useAppDevChat.ts             # AppDev 聊天 SSE 使用示例
├── models/
│   ├── appDevSseConnection.ts       # AppDev SSE 连接管理 Model
│   └── conversationInfo.ts         # 会话信息 SSE 使用示例
└── types/
    └── interfaces/
        └── appDev.ts                # SSE 相关类型定义
```

## 快速开始：创建 SSE 连接

### 第一步：导入 SSE 工具函数

```typescript
import { createSSEConnection } from '@/utils/fetchEventSource';
import { generateSSEUrl } from '@/utils/chatUtils';
```

### 第二步：定义消息处理函数

```typescript
// 定义消息数据类型
interface MySSEMessage {
  messageType: string;
  subType?: string;
  data?: any;
  sessionId?: string;
  timestamp?: string;
}

// 处理 SSE 消息
const handleSSEMessage = (data: MySSEMessage, event: EventSourceMessage) => {
  console.log('收到 SSE 消息:', data);

  // 根据消息类型处理
  switch (data.messageType) {
    case 'agentSessionUpdate':
      if (data.subType === 'agent_message_chunk') {
        // 处理 AI 消息流
        const text = data.data?.text || '';
        // 更新 UI 状态
      }
      break;
    case 'sessionPromptStart':
      // 处理会话开始
      break;
    default:
      break;
  }
};
```

### 第三步：创建 SSE 连接

```typescript
// 在组件或 Hook 中创建连接
const abortConnection = await createSSEConnection({
  url: generateSSEUrl(sessionId), // 或直接使用 URL 字符串
  method: 'GET', // 或 'POST'
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json, text/plain, */*',
  },
  onMessage: (data, event) => {
    handleSSEMessage(data, event);
  },
  onOpen: (response) => {
    console.log('SSE 连接已建立');
    // 连接建立后的处理逻辑
  },
  onError: (error) => {
    console.error('SSE 连接错误:', error);
    // 错误处理逻辑
  },
  onClose: () => {
    console.log('SSE 连接已关闭');
    // 连接关闭后的处理逻辑
  },
});

// 保存 abort 函数，用于后续手动关闭连接
abortConnectionRef.current = abortConnection;
```

### 第四步：清理连接

```typescript
// 组件卸载或需要关闭连接时
useEffect(() => {
  return () => {
    if (abortConnectionRef.current) {
      abortConnectionRef.current();
      abortConnectionRef.current = null;
    }
  };
}, []);
```

## 实现步骤：自定义 SSE 处理逻辑

如果你需要在新的业务场景中使用 SSE，请按照以下步骤操作。

### 第一步：创建业务 Hook 或 Model

**方式一：使用 Hook（推荐用于组件级逻辑）**

**文件位置**：`src/hooks/useYourFeature.ts`

```typescript
import { useCallback, useRef } from 'react';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { generateSSEUrl } from '@/utils/chatUtils';

interface UseYourFeatureProps {
  sessionId: string;
  onMessage?: (data: any) => void;
}

export const useYourFeature = ({
  sessionId,
  onMessage,
}: UseYourFeatureProps) => {
  const abortConnectionRef = useRef<(() => void) | null>(null);

  /**
   * 初始化 SSE 连接
   */
  const initializeSSE = useCallback(async () => {
    const sseUrl = generateSSEUrl(sessionId);
    const token = localStorage.getItem('ACCESS_TOKEN') ?? '';

    abortConnectionRef.current = await createSSEConnection({
      url: sseUrl,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json, text/plain, */*',
      },
      onMessage: (data, event) => {
        onMessage?.(data);
      },
      onError: (error) => {
        console.error('SSE 连接错误:', error);
      },
      onClose: () => {
        console.log('SSE 连接已关闭');
      },
    });
  }, [sessionId, onMessage]);

  /**
   * 清理 SSE 连接
   */
  const cleanupSSE = useCallback(() => {
    if (abortConnectionRef.current) {
      abortConnectionRef.current();
      abortConnectionRef.current = null;
    }
  }, []);

  return {
    initializeSSE,
    cleanupSSE,
  };
};
```

**方式二：使用 UmiJS Model（推荐用于全局状态管理）**

**文件位置**：`src/models/yourFeatureSseConnection.ts`

```typescript
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { useCallback } from 'react';

/**
 * YourFeature SSE 管理器配置
 */
export interface YourFeatureSSEManagerConfig {
  sessionId: string;
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * YourFeature SSE 连接管理 Model
 */
export default () => {
  /**
   * 初始化 YourFeature SSE 连接
   */
  const initializeYourFeatureSSEConnection = useCallback(
    (config: YourFeatureSSEManagerConfig) => {
      const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
      const sseUrl = `${process.env.BASE_URL}/api/your-feature/sse?session_id=${config.sessionId}`;

      return createSSEConnection({
        url: sseUrl,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json, text/plain, */*',
        },
        onOpen: () => {
          config.onOpen?.();
        },
        onMessage: (data) => {
          config.onMessage?.(data);
        },
        onError: (error) => {
          config.onError?.(error as any);
        },
        onClose: () => {
          config.onClose?.();
        },
      });
    },
    [],
  );

  return {
    initializeYourFeatureSSEConnection,
  };
};
```

### 第二步：在组件中使用

```typescript
import { useModel } from 'umi';
import { useYourFeature } from '@/hooks/useYourFeature';

const YourComponent: React.FC = () => {
  // 方式一：使用 Hook
  const { initializeSSE, cleanupSSE } = useYourFeature({
    sessionId: 'your-session-id',
    onMessage: (data) => {
      // 处理消息
      console.log('收到消息:', data);
    },
  });

  // 方式二：使用 Model
  // const yourFeatureSseModel = useModel('yourFeatureSseConnection');
  // const initializeSSE = () => {
  //   yourFeatureSseModel.initializeYourFeatureSSEConnection({
  //     sessionId: 'your-session-id',
  //     onMessage: (data) => {
  //       console.log('收到消息:', data);
  //     },
  //   });
  // };

  useEffect(() => {
    initializeSSE();

    return () => {
      cleanupSSE();
    };
  }, []);

  return <div>Your Component</div>;
};
```

### 第三步：处理不同类型的消息

```typescript
const handleSSEMessage = (data: UnifiedSessionMessage, requestId: string) => {
  switch (data.messageType) {
    case SessionMessageType.SESSION_PROMPT_START:
      // 处理会话开始
      console.log('会话开始:', data);
      break;

    case SessionMessageType.AGENT_SESSION_UPDATE:
      const { subType, data: messageData } = data;

      if (subType === AgentSessionUpdateSubType.AGENT_MESSAGE_CHUNK) {
        // 处理 AI 消息流
        const chunkText = messageData?.content?.text || messageData?.text || '';
        const isFinal = messageData?.is_final;

        // 更新消息状态
        updateMessage(chunkText, isFinal);
      } else if (subType === AgentSessionUpdateSubType.PLAN) {
        // 处理执行计划
        const planData = messageData;
        updatePlan(planData);
      } else if (subType === AgentSessionUpdateSubType.TOOL_CALL) {
        // 处理工具调用
        const toolCallData = messageData;
        updateToolCall(toolCallData);
      }
      break;

    default:
      console.warn('未知消息类型:', data.messageType);
  }
};
```

## SSE 消息类型详解

### 消息类型枚举

```typescript
// 会话消息类型
export enum SessionMessageType {
  SESSION_PROMPT_START = 'sessionPromptStart', // 会话开始
  SESSION_PROMPT_END = 'sessionPromptEnd', // 会话结束
  AGENT_SESSION_UPDATE = 'agentSessionUpdate', // Agent 会话更新
  HEARTBEAT = 'heartbeat', // 心跳消息
}

// Agent 会话更新子类型
export enum AgentSessionUpdateSubType {
  AGENT_MESSAGE_CHUNK = 'agent_message_chunk', // AI 消息流
  TOOL_CALL = 'tool_call', // 工具调用
  TOOL_CALL_UPDATE = 'tool_call_update', // 工具调用更新
  PLAN = 'plan', // 执行计划
  ERROR = 'error', // 错误消息
}
```

### 消息数据结构

#### 1. 会话开始消息 (SESSION_PROMPT_START)

```typescript
interface SessionPromptStartMessage {
  messageType: SessionMessageType.SESSION_PROMPT_START;
  subType: 'prompt_start';
  sessionId: string;
  data: {
    request_id: string;
    prompt?: string;
    attachments?: Array<{ type: string; content: string }>;
  };
  timestamp: string;
}

// 处理示例
if (message.messageType === SessionMessageType.SESSION_PROMPT_START) {
  const requestId = message.data?.request_id;
  console.log('会话开始，requestId:', requestId);
}
```

#### 2. AI 消息流 (AGENT_MESSAGE_CHUNK)

```typescript
interface AgentMessageChunkMessage {
  messageType: SessionMessageType.AGENT_SESSION_UPDATE;
  subType: AgentSessionUpdateSubType.AGENT_MESSAGE_CHUNK;
  sessionId: string;
  data: {
    request_id: string;
    text: string; // 消息文本内容
    is_final?: boolean; // 是否为最后一条消息
    type?: 'text';
  };
  timestamp: string;
}

// 处理示例
if (
  message.messageType === SessionMessageType.AGENT_SESSION_UPDATE &&
  message.subType === AgentSessionUpdateSubType.AGENT_MESSAGE_CHUNK
) {
  const text = message.data?.text || '';
  const isFinal = message.data?.is_final || false;

  // 追加文本到消息
  appendTextToMessage(text, isFinal);
}
```

#### 3. 执行计划 (PLAN)

```typescript
interface PlanMessage {
  messageType: SessionMessageType.AGENT_SESSION_UPDATE;
  subType: AgentSessionUpdateSubType.PLAN;
  sessionId: string;
  data: {
    request_id: string;
    planId?: string;
    entries: Array<{
      content: string;
      priority: 'low' | 'medium' | 'high';
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
    }>;
  };
  timestamp: string;
}

// 处理示例
if (
  message.messageType === SessionMessageType.AGENT_SESSION_UPDATE &&
  message.subType === AgentSessionUpdateSubType.PLAN
) {
  const planData = message.data;
  updatePlanDisplay(planData);
}
```

#### 4. 工具调用 (TOOL_CALL)

```typescript
interface ToolCallMessage {
  messageType: SessionMessageType.AGENT_SESSION_UPDATE;
  subType: AgentSessionUpdateSubType.TOOL_CALL;
  sessionId: string;
  data: {
    request_id: string;
    toolCallId: string;
    title: string;
    kind: 'read' | 'edit' | 'write' | 'execute';
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    locations?: Array<{
      line: number;
      path: string;
      type: 'ToolCallLocation';
    }>;
    rawInput?: Record<string, any>;
  };
  timestamp: string;
}

// 处理示例
if (
  message.messageType === SessionMessageType.AGENT_SESSION_UPDATE &&
  message.subType === AgentSessionUpdateSubType.TOOL_CALL
) {
  const toolCallData = message.data;
  displayToolCall(toolCallData);
}
```

#### 5. 工具调用更新 (TOOL_CALL_UPDATE)

```typescript
interface ToolCallUpdateMessage {
  messageType: SessionMessageType.AGENT_SESSION_UPDATE;
  subType: AgentSessionUpdateSubType.TOOL_CALL_UPDATE;
  sessionId: string;
  data: {
    request_id: string;
    toolCallId: string;
    status: 'completed' | 'failed';
    content?: Array<{
      type: 'content';
      content: {
        type: 'text';
        text: string;
      };
    }>;
  };
  timestamp: string;
}

// 处理示例
if (
  message.messageType === SessionMessageType.AGENT_SESSION_UPDATE &&
  message.subType === AgentSessionUpdateSubType.TOOL_CALL_UPDATE
) {
  const updateData = message.data;
  updateToolCallStatus(updateData.toolCallId, updateData);
}
```

#### 6. 会话结束消息 (SESSION_PROMPT_END)

```typescript
interface SessionPromptEndMessage {
  messageType: SessionMessageType.SESSION_PROMPT_END;
  subType: 'prompt_end' | 'end_turn';
  sessionId: string;
  data: {
    stop_reason: 'end_turn' | 'max_tokens' | 'cancelled' | 'error';
    message?: string;
    error_message?: string;
    suggestion?: string;
  };
  timestamp: string;
}

// 处理示例
if (message.messageType === SessionMessageType.SESSION_PROMPT_END) {
  const stopReason = message.data?.stop_reason;
  console.log('会话结束，原因:', stopReason);

  // 标记消息完成
  markMessageComplete();
}
```

#### 7. 心跳消息 (HEARTBEAT)

```typescript
interface HeartbeatMessage {
  messageType: SessionMessageType.HEARTBEAT;
  subType: 'heartbeat';
  sessionId: string;
  data: {
    type: 'heartbeat';
    message: 'keep-alive';
  };
  timestamp: string;
}

// 处理示例
if (message.messageType === SessionMessageType.HEARTBEAT) {
  // 心跳消息通常不需要特殊处理，仅用于保持连接
  console.log('收到心跳消息');
}
```

### 消息处理模板

```typescript
/**
 * 统一消息处理函数
 */
const handleSSEMessage = (
  message: UnifiedSessionMessage,
  requestId: string,
) => {
  // 只处理匹配当前 request_id 的消息
  const messageRequestId = message.data?.request_id;
  if (messageRequestId && messageRequestId !== requestId) {
    return; // 忽略不匹配的消息
  }

  switch (message.messageType) {
    case SessionMessageType.SESSION_PROMPT_START:
      handleSessionStart(message);
      break;

    case SessionMessageType.AGENT_SESSION_UPDATE:
      handleAgentUpdate(message);
      break;

    case SessionMessageType.SESSION_PROMPT_END:
      handleSessionEnd(message);
      break;

    case SessionMessageType.HEARTBEAT:
      // 心跳消息通常不需要处理
      break;

    default:
      console.warn('未知消息类型:', message.messageType);
  }
};

/**
 * 处理 Agent 会话更新
 */
const handleAgentUpdate = (message: UnifiedSessionMessage) => {
  const { subType, data } = message;

  switch (subType) {
    case AgentSessionUpdateSubType.AGENT_MESSAGE_CHUNK:
      // 处理 AI 消息流
      const text = data?.text || data?.content?.text || '';
      const isFinal = data?.is_final || false;
      appendTextToMessage(text, isFinal);
      break;

    case AgentSessionUpdateSubType.PLAN:
      // 处理执行计划
      updatePlan(data);
      break;

    case AgentSessionUpdateSubType.TOOL_CALL:
      // 处理工具调用
      addToolCall(data);
      break;

    case AgentSessionUpdateSubType.TOOL_CALL_UPDATE:
      // 处理工具调用更新
      updateToolCall(data);
      break;

    case AgentSessionUpdateSubType.ERROR:
      // 处理错误消息
      handleError(data);
      break;

    default:
      console.warn('未知子类型:', subType);
  }
};
```

## 现有示例

### 示例 1：AppDev 聊天 SSE 连接

**文件位置**：`src/hooks/useAppDevChat.ts`

```typescript
/**
 * 初始化 AppDev SSE 连接
 */
const initializeAppDevSSEConnection = useCallback(
  async (sessionId: string, requestId: string) => {
    const sseUrl = generateSSEUrl(sessionId);
    const headers = getAuthHeaders();

    abortConnectionRef.current = new AbortController();

    await createSSEConnection({
      url: sseUrl,
      method: 'GET',
      abortController: abortConnectionRef.current,
      headers,
      onMessage: (data: UnifiedSessionMessage) => {
        setTimeout(() => {
          handleSSEMessage(data, requestId);
        }, 100);
      },
      onError: (error: Error) => {
        setChatMessages((prev) =>
          markStreamingMessageError(prev, requestId, error.message),
        );
        setIsChatLoading(false);
        abortConnectionRef.current?.abort();
      },
      onClose: () => {
        setIsChatLoading(false);
        setChatMessages((prev) =>
          markStreamingMessageComplete(prev, requestId),
        );
        abortConnectionRef.current?.abort();
      },
    });
  },
  [handleSSEMessage],
);
```

**使用方式**：

```typescript
const chat = useAppDevChat({
  projectId: 'your-project-id',
  // ... 其他配置
});

// 发送消息并建立 SSE 连接
chat.sendChatMessage();
```

### 示例 2：临时会话 SSE 连接

**文件位置**：`src/pages/ChatTemp/index.tsx`

```typescript
const sendMessage = async (params: any) => {
  abortConnectionRef.current = await createSSEConnection({
    url: TEMP_CONVERSATION_CONNECTION_URL,
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      ...(isDev
        ? { Authorization: `Bearer ${localStorage.getItem(ACCESS_TOKEN)}` }
        : {}),
    },
    body: params,
    onMessage: (res: ConversationChatResponse) => {
      handleChangeMessageList(res, currentMessageId);
      messageViewScrollToBottom();
    },
    onError: () => {
      message.error('网络超时或服务不可用，请稍后再试');
      // 错误处理逻辑
    },
    onClose: () => {
      // 连接关闭处理逻辑
    },
  });
};
```

### 示例 3：使用 Model 管理 SSE 连接

**文件位置**：`src/models/appDevSseConnection.ts`

```typescript
export default () => {
  const initializeAppDevSSEConnection = useCallback(
    (config: AppDevSSEManagerConfig) => {
      const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
      const sseUrl = `${process.env.BASE_URL}/api/custom-page/ai-session-sse?session_id=${config.sessionId}`;

      return createSSEConnection({
        url: sseUrl,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json, text/plain, */*',
        },
        onOpen: () => {
          config.onOpen?.();
        },
        onMessage: (data: UnifiedSessionMessage) => {
          config.onMessage?.(data);
        },
        onError: (error) => {
          config.onError?.(error as any);
        },
        onClose: () => {
          config.onClose?.();
        },
      });
    },
    [],
  );

  return {
    initializeAppDevSSEConnection,
  };
};
```

**使用方式**：

```typescript
const appDevSseModel = useModel('appDevSseConnection');

const abortConnection = appDevSseModel.initializeAppDevSSEConnection({
  sessionId: 'your-session-id',
  onMessage: (data) => {
    // 处理消息
  },
  onError: (error) => {
    // 处理错误
  },
});
```

## 最佳实践

### 1. 连接生命周期管理

**推荐方式**：在 useEffect 中管理连接生命周期

```typescript
useEffect(() => {
  let abortConnection: (() => void) | null = null;

  const initializeConnection = async () => {
    abortConnection = await createSSEConnection({
      // ... 配置
    });
  };

  initializeConnection();

  return () => {
    // 组件卸载时清理连接
    if (abortConnection) {
      abortConnection();
    }
  };
}, [sessionId]); // 依赖项：当 sessionId 变化时重新建立连接
```

**原因**：

- 确保组件卸载时正确清理连接
- 避免内存泄漏
- 支持依赖项变化时自动重建连接

### 2. 错误处理和重试

**推荐方式**：在 onError 回调中实现错误处理

```typescript
const [retryCount, setRetryCount] = useState(0);
const MAX_RETRY = 3;

await createSSEConnection({
  // ... 其他配置
  onError: (error) => {
    console.error('SSE 连接错误:', error);

    if (retryCount < MAX_RETRY) {
      // 延迟重试
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        initializeSSE(); // 重新初始化连接
      }, 1000 * (retryCount + 1)); // 指数退避
    } else {
      // 达到最大重试次数，显示错误提示
      message.error('连接失败，请刷新页面重试');
    }
  },
});
```

**原因**：

- 提高连接稳定性
- 提供用户友好的错误提示
- 避免无限重试导致资源浪费

### 3. 消息去重和状态管理

**推荐方式**：基于 requestId 过滤消息

```typescript
const handleSSEMessage = useCallback(
  (message: UnifiedSessionMessage, activeRequestId: string) => {
    // 只处理匹配当前 request_id 的消息
    const messageRequestId = message.data?.request_id;

    if (messageRequestId !== activeRequestId) {
      return; // 忽略不匹配的消息
    }

    // 处理消息
    switch (
      message.messageType
      // ... 消息处理逻辑
    ) {
    }
  },
  [],
);
```

**原因**：

- 避免处理过期的消息
- 确保消息处理的准确性
- 支持多请求并发场景

### 4. 超时控制

**推荐方式**：使用内置的超时机制

```typescript
// createSSEConnection 内置了超时控制：
// - 每 5 秒检查一次连接状态
// - 超过 60 秒未收到消息则主动断开连接

// 如果需要自定义超时，可以在 onMessage 中实现：
let lastMessageTime = Date.now();
const TIMEOUT = 30000; // 30 秒

await createSSEConnection({
  // ... 其他配置
  onMessage: (data, event) => {
    lastMessageTime = Date.now();
    handleMessage(data);
  },
});

// 定期检查超时
const timeoutCheck = setInterval(() => {
  if (Date.now() - lastMessageTime > TIMEOUT) {
    console.warn('连接超时，主动断开');
    abortConnection?.();
    clearInterval(timeoutCheck);
  }
}, 5000);
```

**原因**：

- 自动检测死连接
- 释放资源
- 提供更好的用户体验

### 5. 共享定时器清理

**推荐方式**：在连接建立前和组件卸载时清理共享定时器

```typescript
import { clearSSESharedTimeout } from '@/utils/fetchEventSource';

// 在建立新连接前清理
useEffect(() => {
  clearSSESharedTimeout(); // 清理可能残留的定时器

  const initializeConnection = async () => {
    // ... 建立连接
  };

  initializeConnection();

  return () => {
    clearSSESharedTimeout(); // 组件卸载时也清理
    // ... 其他清理逻辑
  };
}, []);
```

**原因**：

- 避免定时器泄漏
- 防止旧连接影响新连接
- 确保资源正确释放

### 6. 流式消息处理

**推荐方式**：使用防抖或节流优化频繁的消息更新

```typescript
import { debounce } from '@/utils/appDevUtils';

// 防抖更新消息
const debouncedUpdateMessage = useCallback(
  debounce((text: string) => {
    setMessages((prev) => updateMessage(prev, text));
  }, 100), // 100ms 防抖
  [],
);

await createSSEConnection({
  // ... 其他配置
  onMessage: (data) => {
    if (data.subType === 'agent_message_chunk') {
      const text = data.data?.text || '';
      debouncedUpdateMessage(text); // 使用防抖更新
    }
  },
});
```

**原因**：

- 减少不必要的渲染
- 提升性能
- 改善用户体验

### 7. 连接状态管理

**推荐方式**：使用状态管理连接状态

```typescript
const [connectionState, setConnectionState] = useState<
  'disconnected' | 'connecting' | 'connected' | 'error'
>('disconnected');

await createSSEConnection({
  // ... 其他配置
  onOpen: () => {
    setConnectionState('connected');
  },
  onError: () => {
    setConnectionState('error');
  },
  onClose: () => {
    setConnectionState('disconnected');
  },
});
```

**原因**：

- 提供连接状态反馈
- 支持 UI 状态显示
- 便于调试和监控

## 常见问题

### Q1: SSE 连接无法建立怎么办？

**A**: 检查以下几点：

1. **URL 是否正确**：确认 SSE 服务端地址和路径正确
2. **认证信息**：检查 Authorization header 是否正确设置
3. **CORS 配置**：确认服务端允许跨域请求
4. **网络连接**：检查网络连接是否正常
5. **服务端状态**：确认服务端 SSE 端点是否正常运行

```typescript
// 调试示例
await createSSEConnection({
  url: sseUrl,
  onOpen: (response) => {
    console.log('连接状态:', response.status);
    console.log('响应头:', response.headers);
  },
  onError: (error) => {
    console.error('连接错误详情:', error);
  },
});
```

### Q2: 如何手动关闭 SSE 连接？

**A**: 使用返回的 abort 函数：

```typescript
const abortConnectionRef = useRef<(() => void) | null>(null);

// 建立连接
abortConnectionRef.current = await createSSEConnection({
  // ... 配置
});

// 手动关闭连接
if (abortConnectionRef.current) {
  abortConnectionRef.current();
  abortConnectionRef.current = null;
}
```

### Q3: 如何处理连接断开后的自动重连？

**A**: `createSSEConnection` 内置了自动重连机制，但可以通过以下方式自定义：

```typescript
const [shouldReconnect, setShouldReconnect] = useState(true);

await createSSEConnection({
  // ... 其他配置
  onClose: () => {
    if (shouldReconnect) {
      // 延迟重连
      setTimeout(() => {
        initializeSSE();
      }, 1000);
    }
  },
  onError: (error) => {
    if (shouldReconnect && retryCount < MAX_RETRY) {
      setTimeout(() => {
        initializeSSE();
      }, 1000 * (retryCount + 1));
    }
  },
});
```

### Q4: 如何过滤和处理特定类型的消息？

**A**: 在 onMessage 回调中根据消息类型过滤：

```typescript
await createSSEConnection({
  // ... 其他配置
  onMessage: (data: UnifiedSessionMessage) => {
    // 只处理特定类型的消息
    if (data.messageType === SessionMessageType.AGENT_SESSION_UPDATE) {
      if (data.subType === AgentSessionUpdateSubType.AGENT_MESSAGE_CHUNK) {
        // 处理 AI 消息流
        handleAIMessage(data);
      } else if (data.subType === AgentSessionUpdateSubType.PLAN) {
        // 处理执行计划
        handlePlan(data);
      }
    }
  },
});
```

### Q5: 如何实现消息去重？

**A**: 使用 Set 或 Map 记录已处理的消息 ID：

```typescript
const processedMessageIds = useRef<Set<string>>(new Set());

await createSSEConnection({
  // ... 其他配置
  onMessage: (data: UnifiedSessionMessage) => {
    const messageId = data.data?.message_id || data.timestamp;

    // 检查是否已处理
    if (processedMessageIds.current.has(messageId)) {
      return; // 跳过已处理的消息
    }

    // 标记为已处理
    processedMessageIds.current.add(messageId);

    // 处理消息
    handleMessage(data);
  },
});
```

### Q6: 如何调试 SSE 连接问题？

**A**: 使用以下调试方法：

```typescript
// 1. 启用详细日志
await createSSEConnection({
  // ... 其他配置
  onOpen: (response) => {
    console.log('✅ SSE 连接已建立', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });
  },
  onMessage: (data, event) => {
    console.log('📨 收到消息', {
      data,
      eventId: event.id,
      eventType: event.event,
    });
  },
  onError: (error) => {
    console.error('❌ SSE 错误', error);
  },
  onClose: () => {
    console.log('🔌 SSE 连接已关闭');
  },
});

// 2. 使用浏览器开发者工具
// - Network 标签页查看 SSE 请求
// - Console 标签页查看日志
// - 检查响应头中的 Content-Type: text/event-stream
```

### Q7: 如何处理大量并发消息？

**A**: 使用队列和批处理：

```typescript
const messageQueue = useRef<UnifiedSessionMessage[]>([]);
const isProcessing = useRef(false);

const processMessageQueue = useCallback(() => {
  if (isProcessing.current || messageQueue.current.length === 0) {
    return;
  }

  isProcessing.current = true;
  const messages = messageQueue.current.splice(0, 10); // 批量处理 10 条

  // 批量处理消息
  messages.forEach((msg) => {
    handleMessage(msg);
  });

  isProcessing.current = false;

  // 继续处理队列
  if (messageQueue.current.length > 0) {
    setTimeout(processMessageQueue, 100);
  }
}, []);

await createSSEConnection({
  // ... 其他配置
  onMessage: (data) => {
    messageQueue.current.push(data);
    processMessageQueue();
  },
});
```

### Q8: 如何实现连接状态指示器？

**A**: 使用状态管理连接状态：

```typescript
const [connectionStatus, setConnectionStatus] = useState<
  'connecting' | 'connected' | 'disconnected' | 'error'
>('disconnected');

await createSSEConnection({
  // ... 其他配置
  onOpen: () => {
    setConnectionStatus('connected');
  },
  onError: () => {
    setConnectionStatus('error');
  },
  onClose: () => {
    setConnectionStatus('disconnected');
  },
});

// 在 UI 中显示状态
return (
  <div>
    {connectionStatus === 'connecting' && <Spin />}
    {connectionStatus === 'connected' && (
      <Badge status="success" text="已连接" />
    )}
    {connectionStatus === 'error' && <Badge status="error" text="连接错误" />}
  </div>
);
```

## 总结

通过本指南，你可以：

1. ✅ 理解 SSE 实现的架构和原理
2. ✅ **快速上手**：学会如何创建和管理 SSE 连接
3. ✅ **深入实现**：创建自己的 SSE 业务逻辑
4. ✅ 遵循最佳实践，编写高质量的代码
5. ✅ 解决常见问题，快速定位和修复错误

## 参考资源

- [Server-Sent Events MDN 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events)
- [@microsoft/fetch-event-source 文档](https://github.com/Azure/fetch-event-source)
- [UmiJS Model 文档](https://umijs.org/docs/max/data-flow)
- [React Hooks 文档](https://react.dev/reference/react)

---

**维护者**：开发团队

如有问题或建议，请联系开发团队或提交 Issue。
