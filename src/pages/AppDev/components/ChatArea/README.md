# ChatArea 组件

## 概述

ChatArea 组件是 AppDev 页面中的聊天会话区域，负责处理 AI 助手的交互界面。

## 功能特性

- 聊天模式切换（Chat/Design）
- 版本选择器
- 聊天消息显示
- 消息输入和发送
- 加载状态显示
- 取消 AI 任务

## Props 接口

```typescript
interface ChatAreaProps {
  chatMode: 'chat' | 'design';
  setChatMode: (mode: 'chat' | 'design') => void;
  chat: ReturnType<typeof useAppDevChat>;
  projectInfo: ReturnType<typeof useAppDevProjectInfo>;
  chatMessagesList: React.ReactNode[];
}
```

### 属性说明

- `chatMode`: 当前聊天模式
- `setChatMode`: 切换聊天模式的回调函数
- `chat`: useAppDevChat hook 的返回值
- `projectInfo`: useAppDevProjectInfo hook 的返回值
- `chatMessagesList`: 聊天消息列表

## 使用示例

```tsx
import ChatArea from './components/ChatArea';

const AppDev: React.FC = () => {
  const [chatMode, setChatMode] = useState<'chat' | 'design'>('chat');
  const chat = useAppDevChat({ projectId });
  const projectInfo = useAppDevProjectInfo(projectId);

  const chatMessagesList = useMemo(() => {
    return chat.chatMessages.map(renderChatMessage);
  }, [chat.chatMessages, renderChatMessage]);

  return (
    <ChatArea
      chatMode={chatMode}
      setChatMode={setChatMode}
      chat={chat}
      projectInfo={projectInfo}
      chatMessagesList={chatMessagesList}
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

## 依赖

- React
- Ant Design 组件
- useAppDevChat Hook
- useAppDevProjectInfo Hook
- TypeScript 类型定义
