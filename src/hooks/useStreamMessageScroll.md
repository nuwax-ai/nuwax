# useStreamMessageScroll Hook 使用文档

## 概述

`useStreamMessageScroll` 是一个专门用于管理流式消息自动滚动的 React Hook。它提供了完整的滚动控制功能，包括自动滚动、用户交互控制、滚动按钮管理等。

## 主要功能

### 1. 流式消息自动滚动

- 在流式消息传输期间自动滚动到底部
- 支持平滑滚动和即时滚动
- 智能检测消息内容变化

### 2. 用户交互控制

- 用户手动滚动时自动暂停自动滚动
- 滚动到底部时重新启用自动滚动
- 提供滚动按钮显示/隐藏控制

### 3. 状态管理

- 自动滚动启用/禁用状态
- 滚动按钮显示状态
- 用户滚动状态跟踪

## API 接口

### useStreamMessageScroll

#### 参数 (UseStreamMessageScrollOptions)

```typescript
interface UseStreamMessageScrollOptions {
  /** 滚动容器引用 */
  scrollContainerRef: React.RefObject<HTMLElement>;
  /** 是否启用自动滚动（默认 true） */
  enableAutoScroll?: boolean;
  /** 滚动节流延迟（默认 300ms） */
  throttleDelay?: number;
  /** 滚动到底部的阈值（默认 50px） */
  scrollThreshold?: number;
  /** 显示滚动按钮的阈值（默认 100px） */
  showButtonThreshold?: number;
}
```

#### 返回值 (UseStreamMessageScrollReturn)

```typescript
interface UseStreamMessageScrollReturn {
  /** 是否启用自动滚动 */
  isAutoScrollEnabled: boolean;
  /** 是否显示滚动按钮 */
  showScrollButton: boolean;
  /** 滚动到底部 */
  scrollToBottom: () => void;
  /** 手动滚动到底部并启用自动滚动 */
  handleScrollButtonClick: () => void;
  /** 强制启用自动滚动 */
  enableAutoScroll: () => void;
  /** 禁用自动滚动 */
  disableAutoScroll: () => void;
  /** 重置自动滚动状态 */
  resetAutoScroll: () => void;
  /** 检查是否在底部 */
  isAtBottom: () => boolean;
  /** 处理新消息到达 */
  handleNewMessage: (isStreaming?: boolean) => void;
}
```

### useStreamMessageScrollEffects

#### 参数

```typescript
useStreamMessageScrollEffects(
  messages: any[],           // 消息列表
  isStreaming: boolean,      // 是否正在流式传输
  scrollToBottom: () => void, // 滚动到底部的方法
  isAutoScrollEnabled: boolean, // 是否启用自动滚动
  handleNewMessage: (isStreaming?: boolean) => void // 处理新消息的方法
)
```

## 使用示例

### 基础用法

```typescript
import React, { useRef } from 'react';
import {
  useStreamMessageScroll,
  useStreamMessageScrollEffects,
} from '@/hooks/useStreamMessageScroll';

const ChatComponent: React.FC = () => {
  // 创建滚动容器引用
  const messageViewRef = useRef<HTMLDivElement>(null);

  // 使用流式消息滚动 Hook
  const {
    isAutoScrollEnabled,
    showScrollButton,
    scrollToBottom,
    handleScrollButtonClick,
    enableAutoScroll,
    disableAutoScroll,
    resetAutoScroll,
    isAtBottom,
    handleNewMessage,
  } = useStreamMessageScroll({
    scrollContainerRef: messageViewRef,
    enableAutoScroll: true,
    throttleDelay: 300,
    scrollThreshold: 50,
    showButtonThreshold: 100,
  });

  // 使用滚动效果 Hook
  useStreamMessageScrollEffects(
    messageList,
    isStreaming,
    scrollToBottom,
    isAutoScrollEnabled,
    handleNewMessage,
  );

  // 处理新消息到达
  const handleNewMessageReceived = (message: any) => {
    setMessageList((prev) => [...prev, message]);
    handleNewMessage(message.isStreaming);
  };

  return (
    <div className="chat-container">
      {/* 消息列表容器 */}
      <div ref={messageViewRef} className="message-list">
        {messageList.map((message, index) => (
          <div key={index} className="message-item">
            {message.text}
          </div>
        ))}
      </div>

      {/* 滚动按钮 */}
      {showScrollButton && (
        <button className="scroll-button" onClick={handleScrollButtonClick}>
          滚动到底部
        </button>
      )}

      {/* 控制按钮 */}
      <div className="control-buttons">
        <button onClick={enableAutoScroll}>启用自动滚动</button>
        <button onClick={disableAutoScroll}>禁用自动滚动</button>
        <button onClick={resetAutoScroll}>重置状态</button>
      </div>
    </div>
  );
};
```

### 在 Chat 页面中的使用示例

```typescript
// 在 Chat 页面中替换现有的滚动逻辑
const Chat: React.FC = () => {
  const messageViewRef = useRef<HTMLDivElement>(null);

  // 使用新的流式消息滚动 Hook
  const {
    isAutoScrollEnabled,
    showScrollButton,
    scrollToBottom,
    handleScrollButtonClick,
    handleNewMessage,
  } = useStreamMessageScroll({
    scrollContainerRef: messageViewRef,
    enableAutoScroll: true,
  });

  // 使用滚动效果
  useStreamMessageScrollEffects(
    messageList,
    isLoadingConversation, // 或者 isStreaming 状态
    scrollToBottom,
    isAutoScrollEnabled,
    handleNewMessage,
  );

  // 监听会话更新事件
  const handleConversationUpdate = (data: {
    conversationId: string;
    message: MessageInfo;
  }) => {
    const { conversationId, message } = data;
    if (Number(id) === Number(conversationId)) {
      setMessageList((list: MessageInfo[]) => [...list, message]);
      // 使用新的消息处理方法
      handleNewMessage(message.isStreaming);
    }
  };

  return (
    <div className="chat-page">
      {/* 消息容器 */}
      <div ref={messageViewRef} className="message-container">
        {/* 消息列表 */}
      </div>

      {/* 输入框组件 */}
      <ChatInputHome
        onScrollBottom={handleScrollButtonClick}
        visible={showScrollButton}
        // ... 其他 props
      />
    </div>
  );
};
```

### 高级配置示例

```typescript
const AdvancedChatComponent: React.FC = () => {
  const messageViewRef = useRef<HTMLDivElement>(null);

  const {
    isAutoScrollEnabled,
    showScrollButton,
    scrollToBottom,
    handleScrollButtonClick,
    enableAutoScroll,
    disableAutoScroll,
    resetAutoScroll,
    isAtBottom,
    handleNewMessage,
  } = useStreamMessageScroll({
    scrollContainerRef: messageViewRef,
    enableAutoScroll: true,
    throttleDelay: 200, // 更快的响应
    scrollThreshold: 30, // 更严格的底部检测
    showButtonThreshold: 80, // 更早显示滚动按钮
  });

  // 自定义消息处理逻辑
  const handleCustomMessage = (message: any) => {
    // 根据消息类型决定是否自动滚动
    if (message.type === 'system') {
      disableAutoScroll();
    } else if (message.type === 'user') {
      enableAutoScroll();
    }

    handleNewMessage(message.isStreaming);
  };

  return <div className="advanced-chat">{/* 组件内容 */}</div>;
};
```

## 配置说明

### scrollThreshold (滚动阈值)

- **默认值**: 50px
- **作用**: 距离底部多少像素时认为是在底部
- **建议**: 根据消息高度调整，消息越高可以设置更大的值

### showButtonThreshold (显示按钮阈值)

- **默认值**: 100px
- **作用**: 距离底部多少像素时显示滚动按钮
- **建议**: 通常比 scrollThreshold 大一些

### throttleDelay (节流延迟)

- **默认值**: 300ms
- **作用**: 滚动事件处理的节流延迟
- **建议**:
  - 移动端可以设置更小的值 (200ms) 提高响应速度
  - 桌面端可以设置更大的值 (500ms) 减少性能消耗

## 最佳实践

### 1. 容器引用管理

```typescript
// 确保容器引用正确设置
const messageViewRef = useRef<HTMLDivElement>(null);

// 在 JSX 中正确绑定
<div ref={messageViewRef} className="message-container">
  {/* 消息内容 */}
</div>;
```

### 2. 消息状态管理

```typescript
// 正确传递流式状态
const isStreaming = messageList.some((msg) => msg.isStreaming);

useStreamMessageScrollEffects(
  messageList,
  isStreaming,
  scrollToBottom,
  isAutoScrollEnabled,
  handleNewMessage,
);
```

### 3. 性能优化

```typescript
// 使用 useMemo 优化消息列表
const messageListMemo = useMemo(
  () => messageList,
  [
    messageList.map((msg) => msg.id).join(','),
    messageList.map((msg) => msg.isStreaming).join(','),
  ],
);
```

### 4. 错误处理

```typescript
// 添加错误边界处理
const handleNewMessageSafe = useCallback(
  (isStreaming = false) => {
    try {
      handleNewMessage(isStreaming);
    } catch (error) {
      console.error('滚动处理错误:', error);
    }
  },
  [handleNewMessage],
);
```

## 注意事项

1. **容器引用**: 确保 `scrollContainerRef` 正确指向可滚动的容器元素
2. **消息更新**: 在消息列表更新后及时调用 `handleNewMessage`
3. **流式状态**: 正确传递 `isStreaming` 状态以确保流式消息的正确处理
4. **性能考虑**: 大量消息时考虑使用虚拟滚动或其他优化方案
5. **移动端适配**: 在移动端可能需要调整阈值和延迟参数

## 迁移指南

### 从现有代码迁移

1. **替换滚动状态管理**:

   ```typescript
   // 旧代码
   const allowAutoScrollRef = useRef(true);
   const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
   const [showScrollBtn, setShowScrollBtn] = useState(false);

   // 新代码
   const { isAutoScrollEnabled, showScrollButton, ... } = useStreamMessageScroll({
     scrollContainerRef: messageViewRef,
   });
   ```

2. **替换滚动事件处理**:

   ```typescript
   // 旧代码 - 手动添加事件监听器
   useEffect(() => {
     const messageView = messageViewRef.current;
     if (messageView) {
       const handleScroll = () => {
         /* 滚动处理逻辑 */
       };
       messageView.addEventListener('wheel', throttle(handleScroll, 300));
       return () =>
         messageView.removeEventListener('wheel', throttle(handleScroll, 300));
     }
   }, []);

   // 新代码 - Hook 自动处理
   const { handleUserScroll } = useStreamMessageScroll({
     scrollContainerRef: messageViewRef,
   });
   ```

3. **替换消息处理逻辑**:

   ```typescript
   // 旧代码
   const handleConversationUpdate = (data) => {
     setMessageList((prev) => [...prev, data.message]);
     if (allowAutoScrollRef.current) {
       messageViewScrollToBottom();
     }
   };

   // 新代码
   const handleConversationUpdate = (data) => {
     setMessageList((prev) => [...prev, data.message]);
     handleNewMessage(data.message.isStreaming);
   };
   ```

通过使用 `useStreamMessageScroll` Hook，可以大大简化流式消息的滚动管理逻辑，提高代码的可维护性和复用性。
