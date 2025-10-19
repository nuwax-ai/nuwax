import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Input, Space, Tag, Typography } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import StreamMessageScrollContainer, {
  StreamMessageScrollContainerRef,
} from '../index';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

/**
 * 聊天消息示例组件
 * 展示如何使用 StreamMessageScrollContainer 组件
 */
const ChatExample: React.FC = () => {
  // 状态管理
  const [messages, setMessages] = useState<MessageInfo[]>([
    {
      id: '1',
      messageType: 'assistant',
      text: '你好！我是 AI 助手，有什么可以帮助你的吗？',
      isStreaming: false,
      timestamp: Date.now() - 10000,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // 组件引用
  const scrollContainerRef = useRef<StreamMessageScrollContainerRef>(null);

  /**
   * 模拟流式消息发送
   */
  const simulateStreamingMessage = useCallback((userMessage: string) => {
    // 添加用户消息
    const userMsg: MessageInfo = {
      id: `user-${Date.now()}`,
      messageType: 'user',
      text: userMessage,
      isStreaming: false,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // 开始流式消息
    setIsStreaming(true);
    const assistantMsg: MessageInfo = {
      id: `assistant-${Date.now()}`,
      messageType: 'assistant',
      text: '',
      isStreaming: true,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMsg]);

    // 模拟流式输出
    const response = `这是对"${userMessage}"的回复。我正在模拟流式消息的输出过程，你可以看到消息会逐渐显示，并且容器会自动滚动到底部。`;
    let currentText = '';
    let index = 0;

    const interval = setInterval(() => {
      if (index < response.length) {
        currentText += response[index];
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsg.id ? { ...msg, text: currentText } : msg,
          ),
        );
        index++;
      } else {
        // 流式消息结束
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsg.id ? { ...msg, isStreaming: false } : msg,
          ),
        );
        clearInterval(interval);
      }
    }, 50); // 每50ms输出一个字符
  }, []);

  /**
   * 发送消息
   */
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return;

    simulateStreamingMessage(inputValue);
    setInputValue('');
  }, [inputValue, simulateStreamingMessage]);

  /**
   * 清空消息
   */
  const handleClearMessages = useCallback(() => {
    setMessages([]);
    scrollContainerRef.current?.resetAutoScroll();
  }, []);

  /**
   * 添加测试消息
   */
  const handleAddTestMessage = useCallback(() => {
    const testMessages = [
      '这是一条测试消息',
      '这是另一条测试消息，内容比较长，用来测试长消息的显示效果。',
      '这是第三条测试消息，用来测试多条消息的滚动效果。',
    ];

    testMessages.forEach((text, index) => {
      setTimeout(() => {
        const msg: MessageInfo = {
          id: `test-${Date.now()}-${index}`,
          messageType: 'assistant',
          text,
          isStreaming: false,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, msg]);
      }, index * 1000);
    });
  }, []);

  /**
   * 滚动到底部
   */
  const handleScrollToBottom = useCallback(() => {
    scrollContainerRef.current?.scrollToBottom();
  }, []);

  /**
   * 切换自动滚动
   */
  const handleToggleAutoScroll = useCallback(() => {
    if (autoScrollEnabled) {
      scrollContainerRef.current?.disableAutoScroll();
      setAutoScrollEnabled(false);
    } else {
      scrollContainerRef.current?.enableAutoScroll();
      setAutoScrollEnabled(true);
    }
  }, [autoScrollEnabled]);

  /**
   * 处理滚动按钮点击
   */
  const handleScrollButtonClick = useCallback(() => {
    console.log('滚动按钮被点击');
  }, []);

  /**
   * 处理自动滚动状态变化
   */
  const handleAutoScrollChange = useCallback((enabled: boolean) => {
    setAutoScrollEnabled(enabled);
  }, []);

  /**
   * 处理滚动位置变化
   */
  const handleScrollPositionChange = useCallback((isAtBottom: boolean) => {
    console.log('是否在底部:', isAtBottom);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 控制面板 */}
      <Card size="small" style={{ margin: '16px', marginBottom: 0 }}>
        <Space wrap>
          <Button onClick={handleAddTestMessage}>添加测试消息</Button>
          <Button onClick={handleScrollToBottom}>滚动到底部</Button>
          <Button
            type={autoScrollEnabled ? 'primary' : 'default'}
            onClick={handleToggleAutoScroll}
          >
            {autoScrollEnabled ? '禁用自动滚动' : '启用自动滚动'}
          </Button>
          <Button danger onClick={handleClearMessages}>
            清空消息
          </Button>
          <Text type="secondary">
            自动滚动: {autoScrollEnabled ? '启用' : '禁用'}
          </Text>
        </Space>
      </Card>

      {/* 聊天容器 */}
      <div style={{ flex: 1, margin: '16px', marginTop: '8px' }}>
        <StreamMessageScrollContainer
          ref={scrollContainerRef}
          messages={messages}
          isStreaming={isStreaming}
          enableAutoScroll={true}
          scrollButtonPosition="bottom-right"
          scrollButtonText="回到底部"
          showScrollButtonIcon={true}
          onScrollButtonClick={handleScrollButtonClick}
          onAutoScrollChange={handleAutoScrollChange}
          onScrollPositionChange={handleScrollPositionChange}
          style={{
            height: '100%',
            border: '1px solid #d9d9d9',
            borderRadius: '8px',
          }}
        >
          {/* 消息列表 */}
          <div style={{ padding: '16px' }}>
            {messages.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: '#999',
                  padding: '40px 0',
                  fontSize: '16px',
                }}
              >
                暂无消息，开始对话吧！
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent:
                      message.messageType === 'user'
                        ? 'flex-end'
                        : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      flexDirection:
                        message.messageType === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    {/* 头像 */}
                    <Avatar
                      icon={
                        message.messageType === 'user' ? (
                          <UserOutlined />
                        ) : (
                          <RobotOutlined />
                        )
                      }
                      style={{
                        backgroundColor:
                          message.messageType === 'user'
                            ? '#1890ff'
                            : '#52c41a',
                        flexShrink: 0,
                      }}
                    />

                    {/* 消息内容 */}
                    <Card
                      size="small"
                      style={{
                        backgroundColor:
                          message.messageType === 'user'
                            ? '#1890ff'
                            : '#f5f5f5',
                        color:
                          message.messageType === 'user' ? 'white' : 'black',
                        border: 'none',
                        borderRadius: '12px',
                      }}
                    >
                      <Paragraph
                        style={{
                          margin: 0,
                          color: 'inherit',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {message.text}
                        {message.isStreaming && (
                          <span
                            style={{
                              display: 'inline-block',
                              width: '8px',
                              height: '16px',
                              backgroundColor: 'currentColor',
                              marginLeft: '4px',
                              animation: 'blink 1s infinite',
                            }}
                          />
                        )}
                      </Paragraph>

                      {/* 消息状态标签 */}
                      <div style={{ marginTop: '4px' }}>
                        {message.isStreaming && (
                          <Tag size="small" color="blue">
                            正在输入...
                          </Tag>
                        )}
                        <Text
                          type="secondary"
                          style={{
                            fontSize: '12px',
                            color:
                              message.messageType === 'user'
                                ? 'rgba(255,255,255,0.7)'
                                : '#999',
                          }}
                        >
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Text>
                      </div>
                    </Card>
                  </div>
                </div>
              ))
            )}
          </div>
        </StreamMessageScrollContainer>
      </div>

      {/* 输入区域 */}
      <div style={{ padding: '16px', borderTop: '1px solid #d9d9d9' }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入消息..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
          >
            发送
          </Button>
        </Space.Compact>
      </div>

      {/* 样式定义 */}
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default ChatExample;
