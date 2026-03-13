# 会话消息队列方案设计（智能体会话详情页）

## Context

在智能体会话详情页（`src/pages/Chat/index.tsx`）中，当 AI 正在流式输出时（`isConversationActive=true`），发送按钮被替换为停止按钮，用户无法发送新消息。本方案实现一个**消息队列**机制，允许用户在 AI 响应期间继续发送消息，消息先进入队列展示，并提供立即发送/删除/编辑操作。

### 当前架构关键点

- **状态管理**：通过 umi model `useModel('conversationInfo')` 全局管理
- **活跃状态**：`isConversationActive` — 基于 `messageList` 中最后几条消息是否有 `Loading/Incomplete` 状态
- **发送流程**：`ChatInputHome.onEnter` → `Chat.handleMessageSend` → `conversationInfo.onMessageSend(id, messageInfo, files, ...)` → `handleConversation` → SSE 连接
- **输入阻断**：`handlePressEnter` 检查 `isConversationActive || isStoppingConversation`；发送按钮在 `isConversationActive` 时被停止按钮替换
- **停止流程**：`ChatInputHome.handleStopConversation` → `runStopConversation(conversationId)` 或 `onTempChatStop(requestId)`

## 设计原则

- **独立模块**：队列逻辑封装在独立 hook + 独立组件中，最小化对现有代码侵入
- **拦截模式**：在 Chat 页面层拦截发送行为，不修改 `conversationInfo` model 核心逻辑
- **FIFO 自动消费**：AI 响应完成后自动发送队列头部消息
- **错误暂停**：AI 响应出错时暂停自动消费，用户手动操作

---

## 架构概览

```
用户输入 → ChatInputHome（不再阻断发送）
    ↓
Chat.handleMessageSend
    ├─ isConversationActive=false → 正常发送（现有逻辑不变）
    └─ isConversationActive=true  → messageQueue.enqueue() → 渲染队列 UI
                                                                ↓
                                                        用户操作按钮
                                                        ├─ 立即发送 → 停止当前 → sendMessage
                                                        ├─ 删除 → remove
                                                        └─ 编辑 → dequeueForEdit → 回填输入框

AI 响应完成
    → isConversationActive: true → false
    → useEffect 检测切换 → dequeueFirst → 自动发送下一条
```

---

## 实现步骤

### Step 1: 类型定义

**新建 `src/types/interfaces/messageQueue.ts`**

```typescript
import type { UploadFileInfo } from './common';

/** 队列中的待发送消息 */
export interface QueuedMessage {
  /** 队列项唯一 ID */
  id: string;
  /** 用户输入的文本内容 */
  text: string;
  /** 入队时间戳 */
  queuedAt: Date;
  /** 入队时快照 - 附件文件 */
  files?: UploadFileInfo[];
}
```

> 类型较简单，因为 Chat 页面的 `handleMessageSend` 只接收 `(messageInfo: string, files: UploadFileInfo[])` 两个参数。

---

### Step 2: 队列 Hook

**新建 `src/hooks/useMessageQueue.ts`**

纯数据管理 hook，**零外部依赖**：

| 方法                 | 说明                        |
| -------------------- | --------------------------- |
| `enqueue(item)`      | 生成唯一 ID，追加到队列尾部 |
| `remove(id)`         | 按 ID 移除                  |
| `dequeueForEdit(id)` | 移除并返回（编辑用）        |
| `dequeueFirst()`     | 弹出队列头部（自动发送用）  |
| `clearQueue()`       | 清空                        |

暴露只读 `queue: QueuedMessage[]` 和 `hasQueuedMessages: boolean`。

```typescript
import { useCallback, useState } from 'react';
import type { QueuedMessage } from '@/types/interfaces/messageQueue';

export const useMessageQueue = () => {
  const [queue, setQueue] = useState<QueuedMessage[]>([]);

  const enqueue = useCallback(
    (item: Omit<QueuedMessage, 'id' | 'queuedAt'>) => {
      const newItem: QueuedMessage = {
        ...item,
        id: `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        queuedAt: new Date(),
      };
      setQueue((prev) => [...prev, newItem]);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const dequeueForEdit = useCallback(
    (id: string): QueuedMessage | undefined => {
      let found: QueuedMessage | undefined;
      setQueue((prev) => {
        found = prev.find((item) => item.id === id);
        return prev.filter((item) => item.id !== id);
      });
      return found;
    },
    [],
  );

  const dequeueFirst = useCallback((): QueuedMessage | undefined => {
    let first: QueuedMessage | undefined;
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      first = prev[0];
      return prev.slice(1);
    });
    return first;
  }, []);

  const clearQueue = useCallback(() => setQueue([]), []);

  return {
    queue,
    hasQueuedMessages: queue.length > 0,
    enqueue,
    remove,
    dequeueForEdit,
    dequeueFirst,
    clearQueue,
  };
};
```

---

### Step 3: 队列消息 UI 组件

**新建 `src/components/QueuedMessage/index.tsx`** **新建 `src/components/QueuedMessage/index.less`**

> 放在 `src/components/` 下作为通用组件，便于后续 AppDev 等页面复用。

#### Props

```typescript
interface QueuedMessageProps {
  message: QueuedMessage;
  onSendNow: (message: QueuedMessage) => void;
  onDelete: (id: string) => void;
  onEdit: (message: QueuedMessage) => void;
}
```

#### UI 设计

- **布局**：右对齐（与 USER 消息一致）
- **视觉区分**：虚线边框 + 半透明背景 + "排队中" Tag
- **消息文本**：完整显示，过长折叠
- **附件指示器**：小标签展示（如 "2 个文件"）
- **操作按钮**（消息右侧垂直排列）：
  - **立即发送**（Primary Outline）→ `onSendNow(message)`
  - **编辑**（Text 按钮）→ `onEdit(message)`
  - **删除**（Danger Text 按钮）→ `onDelete(message.id)`

---

### Step 4: Chat 页面集成

**修改 `src/pages/Chat/index.tsx`**

#### 4.1 引入

```typescript
import { useMessageQueue } from '@/hooks/useMessageQueue';
import QueuedMessageComponent from '@/components/QueuedMessage';
```

```typescript
const messageQueue = useMessageQueue();
```

#### 4.2 修改 `handleMessageSend` — 添加队列拦截

```typescript
const handleMessageSend = (
  messageInfo: string,
  files: UploadFileInfo[] = [],
) => {
  if (wholeDisabled) {
    form.validateFields();
    return;
  }

  // ===== 新增：队列拦截 =====
  if (isConversationActive) {
    messageQueue.enqueue({ text: messageInfo, files });
    // 输入框在 ChatInputHome 内部自动清空（isClearInput=true）
    return;
  }
  // ===== 拦截结束 =====

  // ... 现有发送逻辑不变 ...
  setHasUserSentMessage(true);
  isSendMessageRef.current = true;
  const effectiveSandboxId = getEffectiveSandboxId();
  onMessageSend(
    id,
    messageInfo,
    files,
    selectedComponentList,
    variableParams,
    effectiveSandboxId,
  );
};
```

> **关键**：`handleMessageSend` 接收的 `messageInfo` 和 `files` 已经是最终值（由 ChatInputHome 传入），无需读取外部 state，因此不存在异步竞态问题。

#### 4.3 队列操作 Handlers

```typescript
/** 立即发送：停止当前会话 → 发送此消息 */
const handleSendNowQueued = useCallback(
  async (qMsg: QueuedMessage) => {
    messageQueue.remove(qMsg.id);
    // 停止当前会话
    const conversationId = getCurrentConversationId();
    if (conversationId) {
      await runStopConversation(conversationId);
    }
    // 延迟发送，等待停止完成
    setTimeout(() => {
      handleMessageSend(qMsg.text, qMsg.files || []);
    }, 300);
  },
  [
    messageQueue,
    getCurrentConversationId,
    runStopConversation,
    handleMessageSend,
  ],
);

/** 删除 */
const handleDeleteQueued = useCallback(
  (id: string) => {
    messageQueue.remove(id);
  },
  [messageQueue],
);

/** 编辑：移除并回填到输入框 */
const handleEditQueued = useCallback(
  (qMsg: QueuedMessage) => {
    const item = messageQueue.dequeueForEdit(qMsg.id);
    if (item) {
      // 使用 eventBus 方案（项目已有 eventBus）通知 ChatInputHome 回填
      eventBus.emit('QUEUE_EDIT_MESSAGE', {
        text: item.text,
        files: item.files,
      });
    }
  },
  [messageQueue],
);
```

#### 4.4 渲染队列消息

在消息列表区域之后、输入框之前渲染：

```tsx
{/* 消息列表 */}
{messageList?.map(...)}

{/* 队列消息 */}
{messageQueue.queue.map(qMsg => (
  <QueuedMessageComponent
    key={qMsg.id}
    message={qMsg}
    onSendNow={handleSendNowQueued}
    onDelete={handleDeleteQueued}
    onEdit={handleEditQueued}
  />
))}
```

#### 4.5 自动消费 Effect

```typescript
const prevIsConversationActiveRef = useRef(isConversationActive);

useEffect(() => {
  const wasActive = prevIsConversationActiveRef.current;
  prevIsConversationActiveRef.current = isConversationActive;

  // 检测 isConversationActive 从 true → false 的切换
  if (wasActive && !isConversationActive && messageQueue.hasQueuedMessages) {
    // 错误暂停：检查最后一条消息是否出错
    const lastMessage = messageList?.[messageList.length - 1];
    if (lastMessage?.status === MessageStatusEnum.Error) {
      return; // 出错时不自动消费
    }

    const next = messageQueue.dequeueFirst();
    if (next) {
      // 使用 setTimeout 确保状态完全更新
      setTimeout(() => {
        handleMessageSend(next.text, next.files || []);
      }, 200);
    }
  }
}, [isConversationActive]);
```

---

### Step 5: ChatInputHome 改动

**修改 `src/components/ChatInputHome/index.tsx`**

#### 5.1 解除发送阻断

当前 `handlePressEnter`（第 136 行）阻断了会话活跃时的 Enter 发送：

```typescript
// 修改前
if (isConversationActive || isStoppingConversation) {
  return;
}

// 修改后
if (isStoppingConversation) {
  return;
}
// isConversationActive 不再阻断，由 Chat 页面决定入队还是直接发送
```

#### 5.2 发送/停止按钮共存

当前逻辑（第 522-584 行）是互斥显示发送按钮或停止按钮。修改为：

- `isConversationActive` 时同时显示**停止按钮**和**发送（入队）按钮**
- 发送按钮可选添加 Tooltip 提示"消息将加入队列等待发送"

```tsx
{/* 停止按钮 - 会话活跃时显示 */}
{(isConversationActive || conversationInfo?.taskStatus === TaskStatus.EXECUTING) && (
  <Tooltip title={getStopButtonTooltip()}>
    <span onClick={handleStopConversation} className={...}>
      {isStoppingConversation ? <LoadingOutlined /> : <SvgIcon name="icons-chat-stop" />}
    </span>
  </Tooltip>
)}
{/* 发送按钮 - 始终显示 */}
<Tooltip title={isConversationActive ? '加入发送队列' : getButtonTooltip()}>
  <span onClick={handleSendMessage} className={...}>
    <SvgIcon name="icons-chat-send" style={{ fontSize: '14px' }} />
  </span>
</Tooltip>
```

#### 5.3 监听编辑回填事件

```typescript
useEffect(() => {
  const handleEditMessage = ({
    text,
    files,
  }: {
    text: string;
    files?: UploadFileInfo[];
  }) => {
    setMessageInfo((prev) => (prev ? prev + '\n' + text : text));
    if (files?.length) {
      setUploadFiles((prev) => [...prev, ...files]);
    }
  };
  eventBus.on('QUEUE_EDIT_MESSAGE', handleEditMessage);
  return () => eventBus.off('QUEUE_EDIT_MESSAGE', handleEditMessage);
}, []);
```

---

## 关键文件清单

| 操作 | 文件路径 | 改动说明 |
| --- | --- | --- |
| **新建** | `src/types/interfaces/messageQueue.ts` | QueuedMessage 类型定义 |
| **新建** | `src/hooks/useMessageQueue.ts` | 队列管理 hook（零依赖） |
| **新建** | `src/components/QueuedMessage/index.tsx` | 队列消息 UI 组件 |
| **新建** | `src/components/QueuedMessage/index.less` | 队列消息样式 |
| **改动** | `src/pages/Chat/index.tsx` | 集成队列（拦截 + 渲染 + handlers + auto-consume effect） |
| **改动** | `src/components/ChatInputHome/index.tsx` | 解除 isConversationActive 发送阻断 + 发送/停止按钮共存 + 编辑回填 |

> **不修改** `src/models/conversationInfo.ts`（model 层零侵入）

---

## 边界情况处理

| 场景 | 处理方式 |
| --- | --- |
| 多条排队消息 | FIFO 逐条消费，每次 AI 完成触发下一条 |
| 快速连续发送 | 均入队，队列按序展示 |
| 立即发送 + 当前正在处理队列消息 | 停止当前 → 发送选中的 → 剩余继续排队 |
| AI 响应出错 | **暂停自动消费**，用户手动操作队列 |
| 编辑时输入框有内容 | 追加到末尾（换行分隔） |
| 页面离开/组件卸载 | 队列为 React state，自然清理 |
| 用户手动点停止 | isConversationActive → false → 触发自动消费 |
| `handleMessageSend` 竞态 | 无竞态风险：`messageInfo` 和 `files` 由 ChatInputHome 作为参数直接传入，非异步 state 读取 |

---

## 验证方式

1. AI 流式响应期间发送消息 → 消息出现在队列区域，不中断当前流式输出
2. 点击"删除" → 消息从队列移除
3. 点击"编辑" → 消息从队列移除，文本回填到输入框（已有内容则追加）
4. 点击"立即发送" → 当前 AI 响应被取消，该消息立即发送
5. AI 响应自然结束 → 队列头部消息自动发送
6. 连续入队多条 → 逐条自动消费直到队列清空
7. AI 响应出错 → 不自动消费，用户手动决定
8. 非会话活跃时发送 → 走正常发送逻辑，队列不介入
