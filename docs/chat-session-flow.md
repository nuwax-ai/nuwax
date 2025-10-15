# AI 聊天会话流程说明

## 📋 会话流程概述

根据您的要求，AI 聊天会话的正确流程如下：

### 🔄 完整流程

```
1. 用户发送第一条消息
   ├── 请求参数：{ prompt: "消息内容", project_id: "项目ID" }
   ├── 不传递 session_id（为 undefined）
   └── 服务器生成新的 session_id

2. 服务器响应
   ├── 返回：{ project_id: "项目ID", session_id: "新生成的会话ID" }
   └── 前端保存 session_id

3. 建立 SSE 连接
   ├── 使用返回的 session_id
   ├── 连接 URL：/api/custom-page/ai-session-sse?session_id={session_id}
   └── 开始接收实时消息

4. 后续消息发送
   ├── 请求参数：{ prompt: "新消息", project_id: "项目ID", session_id: "已保存的会话ID" }
   ├── 使用相同的 session_id
   └── 继续使用现有的 SSE 连接
```

## 🔧 代码实现

### 1. 第一次发送消息

```typescript
// 第一次发送消息时不传递 session_id
const response = await sendChatMessage({
  prompt: inputText,
  project_id: projectId || undefined,
  session_id: undefined, // 第一次为 undefined
  request_id: generateRequestId(),
});
```

### 2. 处理服务器响应

```typescript
if (response.success && response.data) {
  // 使用服务器返回的 session_id
  const serverSessionId = response.data.session_id;

  // 保存 session_id 供后续使用
  if (!currentSessionId) {
    setCurrentSessionId(serverSessionId);
  }

  // 建立 SSE 连接
  initializeSSEManager(serverSessionId);
}
```

### 3. 建立 SSE 连接

```typescript
const newSseManager = createSSEManager({
  baseUrl: 'http://localhost:8000',
  sessionId: serverSessionId, // 使用服务器返回的 session_id
  onMessage: handleSSEMessage,
  // ... 其他配置
});

// 连接到：/api/custom-page/ai-session-sse?session_id={serverSessionId}
newSseManager.connect();
```

### 4. 后续消息发送

```typescript
// 后续消息使用保存的 session_id
const response = await sendChatMessage({
  prompt: inputText,
  project_id: projectId || undefined,
  session_id: currentSessionId, // 使用已保存的 session_id
  request_id: generateRequestId(),
});
```

## 📝 关键要点

1. **第一次发送消息**：不传递 `session_id`，让服务器生成
2. **服务器响应**：返回新生成的 `session_id`
3. **SSE 连接**：使用服务器返回的 `session_id` 建立连接
4. **后续消息**：使用相同的 `session_id` 保持会话连续性
5. **会话管理**：前端保存 `session_id` 供后续使用

## 🚀 优势

- **服务器控制**：会话 ID 由服务器生成，确保唯一性
- **会话连续性**：后续消息使用相同的 `session_id`
- **实时通信**：SSE 连接使用相同的 `session_id` 接收消息
- **错误处理**：如果连接断开，可以重新建立连接

## 🔍 调试信息

在控制台中可以看到以下日志：

```
🔌 [SSE] 连接到: http://localhost:8000/api/custom-page/ai-session-sse?session_id=session_xxx
🔌 [SSE] 连接已建立
📨 [SSE] 收到消息 [agent_message_chunk]: {...}
```

这样的流程确保了会话的正确管理和实时通信的稳定性。
