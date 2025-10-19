import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { Button, Space, Typography } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import StreamMessageScrollContainer, {
  StreamMessageScrollContainerRef,
} from '../index';

const { Text } = Typography;

/**
 * 在 Chat 页面中使用 StreamMessageScrollContainer 的示例
 * 展示如何替换现有的滚动逻辑
 */
interface ChatPageExampleProps {
  /** 消息列表 */
  messageList: MessageInfo[];
  /** 角色信息 */
  roleInfo: RoleInfo;
  /** 是否正在加载会话 */
  loadingConversation: boolean;
  /** 是否正在流式传输 */
  isLoadingConversation: boolean;
  /** 聊天建议列表 */
  chatSuggestList: any[];
  /** 建议加载状态 */
  loadingSuggest: boolean;
  /** 手动组件列表 */
  manualComponents: any[];
  /** 选中的组件列表 */
  selectedComponentList: any[];
  /** 是否禁用发送 */
  wholeDisabled: boolean;
  /** 消息发送处理函数 */
  onMessageSend: (message: string, files?: any[]) => void;
  /** 组件选择处理函数 */
  onSelectComponent: (component: any) => void;
  /** 清空会话处理函数 */
  onClear: () => void;
}

const ChatPageExample: React.FC<ChatPageExampleProps> = ({
  messageList,
  roleInfo,
  loadingConversation,
  isLoadingConversation,
  chatSuggestList,
  loadingSuggest, // eslint-disable-line @typescript-eslint/no-unused-vars
  manualComponents,
  selectedComponentList,
  wholeDisabled,
  onMessageSend,
  onSelectComponent,
  onClear,
}) => {
  // 组件引用
  const scrollContainerRef = useRef<StreamMessageScrollContainerRef>(null);

  // 状态管理
  const [isStreaming, setIsStreaming] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  /**
   * 处理消息发送
   */
  const handleMessageSend = useCallback(
    (message: string, files: any[] = []) => {
      // 开始流式传输
      setIsStreaming(true);

      // 调用原有的消息发送逻辑
      onMessageSend(message, files);

      // 模拟流式传输结束（实际项目中应该根据真实的状态来设置）
      setTimeout(() => {
        setIsStreaming(false);
      }, 2000);
    },
    [onMessageSend],
  );

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
    console.log('自动滚动状态变化:', enabled);
  }, []);

  /**
   * 处理滚动位置变化
   */
  const handleScrollPositionChange = useCallback((isAtBottom: boolean) => {
    setShowScrollButton(!isAtBottom);
  }, []);

  /**
   * 处理新消息到达（模拟）
   */
  const handleNewMessage = useCallback((isStreaming = false) => {
    scrollContainerRef.current?.handleNewMessage(isStreaming);
  }, []);

  // 监听消息列表变化，自动处理滚动
  useEffect(() => {
    if (messageList.length > 0) {
      // 检查最后一条消息是否为流式消息
      const lastMessage = messageList[messageList.length - 1];
      const isLastMessageStreaming = (lastMessage as any)?.isStreaming || false;

      // 处理新消息滚动
      handleNewMessage(isLastMessageStreaming);
    }
  }, [messageList, handleNewMessage]);

  // 监听流式传输状态
  useEffect(() => {
    if (isLoadingConversation) {
      setIsStreaming(true);
    } else {
      setIsStreaming(false);
    }
  }, [isLoadingConversation]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 标题区域 */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #d9d9d9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text strong>聊天页面示例</Text>
        <Space>
          <Button onClick={() => scrollContainerRef.current?.scrollToBottom()}>
            滚动到底部
          </Button>
          <Button onClick={() => scrollContainerRef.current?.resetAutoScroll()}>
            重置滚动
          </Button>
        </Space>
      </div>

      {/* 消息区域 */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <StreamMessageScrollContainer
          ref={scrollContainerRef}
          messages={messageList}
          isStreaming={isStreaming}
          enableAutoScroll={true}
          scrollButtonPosition="bottom-right"
          scrollButtonText="回到底部"
          showScrollButtonIcon={true}
          onScrollButtonClick={handleScrollButtonClick}
          onAutoScrollChange={handleAutoScrollChange}
          onScrollPositionChange={handleScrollPositionChange}
          style={{ height: '100%' }}
        >
          {/* 消息内容 */}
          <div style={{ padding: '16px' }}>
            {loadingConversation ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: '#999',
                }}
              >
                加载中...
              </div>
            ) : messageList.length > 0 ? (
              <>
                {messageList.map((message, index) => (
                  <ChatView
                    key={message.id || index}
                    messageInfo={message}
                    roleInfo={roleInfo}
                    mode="home"
                  />
                ))}

                {/* 聊天建议 */}
                {chatSuggestList.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    {/* 这里可以放置 RecommendList 组件 */}
                    <Text type="secondary">建议回复:</Text>
                    <div style={{ marginTop: '8px' }}>
                      {chatSuggestList.map((suggest, index) => (
                        <Button
                          key={index}
                          size="small"
                          style={{ marginRight: '8px', marginBottom: '8px' }}
                          onClick={() => handleMessageSend(suggest.text)}
                        >
                          {suggest.text}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: '#999',
                }}
              >
                开始对话吧！
              </div>
            )}
          </div>
        </StreamMessageScrollContainer>
      </div>

      {/* 输入区域 */}
      <div style={{ padding: '16px', borderTop: '1px solid #d9d9d9' }}>
        <ChatInputHome
          onEnter={handleMessageSend}
          visible={showScrollButton}
          wholeDisabled={wholeDisabled}
          onClear={onClear}
          manualComponents={manualComponents}
          selectedComponentList={selectedComponentList}
          onSelectComponent={onSelectComponent}
          onScrollBottom={() =>
            scrollContainerRef.current?.handleScrollButtonClick()
          }
          showAnnouncement={true}
        />
      </div>
    </div>
  );
};

export default ChatPageExample;
