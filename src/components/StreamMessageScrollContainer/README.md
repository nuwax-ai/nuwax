# StreamMessageScrollContainer 组件

## 概述

`StreamMessageScrollContainer` 是一个专门用于管理流式消息自动滚动的 React 组件。它封装了 `useStreamMessageScroll` Hook 的所有功能，提供了开箱即用的滚动管理能力。

## 主要特性

- 🚀 **自动滚动管理**: 流式消息期间自动滚动到底部
- 🎯 **智能交互控制**: 用户手动滚动时智能暂停/恢复自动滚动
- 🎨 **可定制样式**: 支持自定义滚动按钮样式和位置
- 📱 **响应式设计**: 适配移动端和桌面端
- 🔧 **灵活配置**: 支持多种配置选项
- 📊 **状态回调**: 提供丰富的状态变化回调

## 安装使用

```tsx
import StreamMessageScrollContainer, {
  StreamMessageScrollContainerRef,
} from '@/components/StreamMessageScrollContainer';
```

## 基础用法

```tsx
import React, { useRef, useState } from 'react';
import StreamMessageScrollContainer from '@/components/StreamMessageScrollContainer';

const ChatComponent = () => {
  const scrollContainerRef = useRef<StreamMessageScrollContainerRef>(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  return (
    <StreamMessageScrollContainer
      ref={scrollContainerRef}
      messages={messages}
      isStreaming={isStreaming}
      style={{ height: '500px' }}
    >
      {/* 你的消息内容 */}
      {messages.map((message, index) => (
        <div key={index}>{message.text}</div>
      ))}
    </StreamMessageScrollContainer>
  );
};
```

## API 文档

### Props

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `children` | `React.ReactNode` | - | 子组件内容 |
| `messages` | `any[]` | `[]` | 消息列表 |
| `isStreaming` | `boolean` | `false` | 是否正在流式传输 |
| `enableAutoScroll` | `boolean` | `true` | 是否启用自动滚动 |
| `throttleDelay` | `number` | `300` | 滚动节流延迟（ms） |
| `scrollThreshold` | `number` | `50` | 滚动到底部的阈值（px） |
| `showButtonThreshold` | `number` | `100` | 显示滚动按钮的阈值（px） |
| `scrollButtonPosition` | `'bottom-right' \| 'bottom-center' \| 'bottom-left'` | `'bottom-right'` | 滚动按钮位置 |
| `scrollButtonClassName` | `string` | - | 滚动按钮自定义样式类名 |
| `scrollButtonText` | `string` | `'滚动到底部'` | 滚动按钮文本 |
| `showScrollButtonIcon` | `boolean` | `true` | 是否显示滚动按钮图标 |
| `className` | `string` | - | 容器自定义样式类名 |
| `style` | `React.CSSProperties` | - | 容器内联样式 |
| `onScrollButtonClick` | `() => void` | - | 滚动按钮点击回调 |
| `onAutoScrollChange` | `(enabled: boolean) => void` | - | 自动滚动状态变化回调 |
| `onScrollPositionChange` | `(isAtBottom: boolean) => void` | - | 滚动位置变化回调 |

### Ref 方法

通过 `ref` 可以调用以下方法：

| 方法 | 类型 | 描述 |
| --- | --- | --- |
| `scrollToBottom` | `() => void` | 滚动到底部 |
| `handleScrollButtonClick` | `() => void` | 手动滚动到底部并启用自动滚动 |
| `enableAutoScroll` | `() => void` | 强制启用自动滚动 |
| `disableAutoScroll` | `() => void` | 禁用自动滚动 |
| `resetAutoScroll` | `() => void` | 重置自动滚动状态 |
| `isAtBottom` | `() => boolean` | 检查是否在底部 |
| `handleNewMessage` | `(isStreaming?: boolean) => void` | 处理新消息到达 |
| `getScrollContainer` | `() => HTMLDivElement \| null` | 获取滚动容器元素 |

## 使用示例

### 1. 基础聊天组件

```tsx
import React, { useRef, useState, useCallback } from 'react';
import { Button, Input, Space } from 'antd';
import StreamMessageScrollContainer, {
  StreamMessageScrollContainerRef,
} from '@/components/StreamMessageScrollContainer';

const SimpleChat = () => {
  const scrollContainerRef = useRef<StreamMessageScrollContainerRef>(null);
  const [messages, setMessages] = useState([
    { id: '1', text: '你好！', type: 'assistant' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return;

    // 添加用户消息
    const userMessage = {
      id: Date.now().toString(),
      text: inputValue,
      type: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);

    // 开始流式回复
    setIsStreaming(true);
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      text: '',
      type: 'assistant',
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // 模拟流式输出
    const response = `这是对"${inputValue}"的回复。`;
    let currentText = '';
    let index = 0;

    const interval = setInterval(() => {
      if (index < response.length) {
        currentText += response[index];
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, text: currentText }
              : msg,
          ),
        );
        index++;
      } else {
        setIsStreaming(false);
        clearInterval(interval);
      }
    }, 50);

    setInputValue('');
  }, [inputValue]);

  return (
    <div style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      <StreamMessageScrollContainer
        ref={scrollContainerRef}
        messages={messages}
        isStreaming={isStreaming}
        style={{ flex: 1 }}
      >
        {messages.map((message) => (
          <div key={message.id} style={{ padding: '8px', margin: '4px 0' }}>
            <strong>{message.type}:</strong> {message.text}
          </div>
        ))}
      </StreamMessageScrollContainer>

      <Space.Compact style={{ width: '100%' }}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={handleSendMessage}
          placeholder="输入消息..."
        />
        <Button type="primary" onClick={handleSendMessage}>
          发送
        </Button>
      </Space.Compact>
    </div>
  );
};
```

### 2. 在 Chat 页面中使用

```tsx
import React, { useRef, useCallback } from 'react';
import StreamMessageScrollContainer, {
  StreamMessageScrollContainerRef,
} from '@/components/StreamMessageScrollContainer';
import ChatInputHome from '@/components/ChatInputHome';

const ChatPage = () => {
  const scrollContainerRef = useRef<StreamMessageScrollContainerRef>(null);

  // 处理滚动按钮点击
  const handleScrollButtonClick = useCallback(() => {
    console.log('滚动按钮被点击');
  }, []);

  // 处理自动滚动状态变化
  const handleAutoScrollChange = useCallback((enabled: boolean) => {
    console.log('自动滚动状态:', enabled);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 消息区域 */}
      <div style={{ flex: 1 }}>
        <StreamMessageScrollContainer
          ref={scrollContainerRef}
          messages={messageList}
          isStreaming={isLoadingConversation}
          scrollButtonPosition="bottom-right"
          onScrollButtonClick={handleScrollButtonClick}
          onAutoScrollChange={handleAutoScrollChange}
          style={{ height: '100%' }}
        >
          {messageList.map((message, index) => (
            <ChatView
              key={message.id || index}
              messageInfo={message}
              roleInfo={roleInfo}
              mode="home"
            />
          ))}
        </StreamMessageScrollContainer>
      </div>

      {/* 输入区域 */}
      <ChatInputHome
        onScrollBottom={() =>
          scrollContainerRef.current?.handleScrollButtonClick()
        }
        // ... 其他 props
      />
    </div>
  );
};
```

### 3. 自定义样式

```tsx
<StreamMessageScrollContainer
  messages={messages}
  isStreaming={isStreaming}
  scrollButtonPosition="bottom-center"
  scrollButtonText="回到底部"
  scrollButtonClassName="custom-scroll-button"
  className="custom-chat-container"
  style={{
    height: '600px',
    border: '1px solid #d9d9d9',
    borderRadius: '8px',
  }}
>
  {/* 消息内容 */}
</StreamMessageScrollContainer>
```

### 4. 高级配置

```tsx
<StreamMessageScrollContainer
  messages={messages}
  isStreaming={isStreaming}
  enableAutoScroll={true}
  throttleDelay={200} // 更快的响应
  scrollThreshold={30} // 更严格的底部检测
  showButtonThreshold={80} // 更早显示滚动按钮
  scrollButtonPosition="bottom-left"
  onScrollButtonClick={() => console.log('滚动按钮点击')}
  onAutoScrollChange={(enabled) => console.log('自动滚动:', enabled)}
  onScrollPositionChange={(isAtBottom) =>
    console.log('是否在底部:', isAtBottom)
  }
>
  {/* 消息内容 */}
</StreamMessageScrollContainer>
```

## 样式定制

### CSS 变量

组件支持以下 CSS 变量进行样式定制：

```css
.stream-message-scroll-container {
  --scroll-button-size: 48px;
  --scroll-button-bottom: 20px;
  --scroll-button-right: 20px;
  --scroll-button-left: 20px;
  --scroll-button-bg: #1890ff;
  --scroll-button-color: #fff;
  --scroll-button-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

### 自定义滚动按钮样式

```css
.custom-scroll-button {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  border: none;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.custom-scroll-button:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}
```

### 暗色主题适配

```css
.dark-theme .stream-message-scroll-container {
  --scroll-button-bg: #1890ff;
  --scroll-button-color: #fff;
}

.dark-theme .scroll-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
}
```

## 最佳实践

### 1. 性能优化

```tsx
// 使用 useMemo 优化消息列表
const memoizedMessages = useMemo(() => messages, [
  messages.map(msg => msg.id).join(','),
  messages.map(msg => msg.isStreaming).join(',')
]);

<StreamMessageScrollContainer
  messages={memoizedMessages}
  // ... 其他 props
>
```

### 2. 错误处理

```tsx
const handleScrollButtonClick = useCallback(() => {
  try {
    scrollContainerRef.current?.handleScrollButtonClick();
  } catch (error) {
    console.error('滚动处理错误:', error);
  }
}, []);
```

### 3. 移动端适配

```tsx
<StreamMessageScrollContainer
  messages={messages}
  isStreaming={isStreaming}
  throttleDelay={200}  // 移动端使用更快的响应
  scrollThreshold={30}  // 移动端使用更严格的阈值
  scrollButtonPosition="bottom-center"  // 移动端居中显示
>
```

### 4. 状态管理

```tsx
const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

const handleAutoScrollChange = useCallback((enabled: boolean) => {
  setAutoScrollEnabled(enabled);
  // 可以保存到 localStorage 或其他状态管理
  localStorage.setItem('autoScrollEnabled', enabled.toString());
}, []);
```

## 注意事项

1. **容器高度**: 确保父容器有明确的高度，否则滚动容器无法正常工作
2. **消息更新**: 在消息列表更新后，组件会自动处理滚动逻辑
3. **流式状态**: 正确传递 `isStreaming` 状态以确保流式消息的正确处理
4. **性能考虑**: 大量消息时考虑使用虚拟滚动或其他优化方案
5. **移动端**: 在移动端可能需要调整阈值和延迟参数

## 迁移指南

### 从现有 Chat 页面迁移

1. **替换滚动容器**:

   ```tsx
   // 旧代码
   <div ref={messageViewRef} className="message-container">
     {/* 消息内容 */}
   </div>

   // 新代码
   <StreamMessageScrollContainer
     ref={scrollContainerRef}
     messages={messageList}
     isStreaming={isLoadingConversation}
   >
     {/* 消息内容 */}
   </StreamMessageScrollContainer>
   ```

2. **更新滚动控制**:

   ```tsx
   // 旧代码
   const onScrollBottom = () => {
     allowAutoScrollRef.current = true;
     messageViewScrollToBottom();
     setShowScrollBtn(false);
   };

   // 新代码
   const onScrollBottom = () => {
     scrollContainerRef.current?.handleScrollButtonClick();
   };
   ```

3. **更新消息处理**:

   ```tsx
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
     scrollContainerRef.current?.handleNewMessage(data.message.isStreaming);
   };
   ```

通过使用 `StreamMessageScrollContainer` 组件，可以大大简化流式消息的滚动管理，提高代码的可维护性和复用性。
