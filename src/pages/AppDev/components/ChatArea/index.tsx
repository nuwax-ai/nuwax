import type { AppDevChatMessage } from '@/types/interfaces/appDev';
import { DownOutlined, SendOutlined, StopOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Input,
  Segmented,
  Select,
  Spin,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useMemo, useState } from 'react';
import styles from './index.less';
import type { ChatAreaProps } from './types';

const { Text } = Typography;

/**
 * 聊天会话区域组件
 * 包含聊天模式切换、消息显示和输入区域
 */
const ChatArea: React.FC<ChatAreaProps> = ({
  chatMode,
  setChatMode,
  chat,
  projectInfo,
  // projectId, // 暂时未使用，保留以备将来使用
  // loadHistorySession, // 暂时未使用，保留以备将来使用
  onVersionSelect,
}) => {
  // 展开的思考过程消息
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(
    new Set(),
  );

  /**
   * 切换思考过程展开状态
   */
  const toggleThinkingExpansion = useCallback((messageId: string) => {
    setExpandedThinking((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  /**
   * 渲染聊天消息 - 按 role 区分渲染
   */
  const renderChatMessage = useCallback(
    (message: AppDevChatMessage) => {
      const isUser = message.role === 'USER';
      const isAssistant = message.role === 'ASSISTANT';

      // 判断是否为历史消息（有会话信息）
      const isHistoryMessage = !!(
        message.conversationTopic && message.conversationCreated
      );

      // 在历史会话渲染场景中，完全忽略所有状态
      const isStreaming = false; // 历史消息永远不显示流式传输状态
      const isLoading = false; // 历史消息永远不显示加载状态
      const isError = false; // 历史消息永远不显示错误状态
      const hasThinking = message.think && message.think.trim() !== '';
      const isThinkingExpanded = expandedThinking.has(message.id);

      // 调试信息
      if (isAssistant && !isHistoryMessage) {
        // 调试信息已移除
      }

      return (
        <div
          key={message.id}
          className={`${styles.messageWrapper} ${
            isUser ? styles.user : styles.assistant
          }`}
        >
          <div className={styles.messageBubble}>
            {/* 消息内容 */}
            <div className={styles.messageContent}>
              {message.text?.split('\n').map((line: string, index: number) => (
                <div key={index}>{line}</div>
              ))}
            </div>

            {/* 流式传输指示器 */}
            {isStreaming && (
              <div className={styles.streamingIndicator}>
                <Spin size="small" />
                <span className={styles.streamingText}>正在输出...</span>
              </div>
            )}

            {/* 加载状态 */}
            {isLoading && !isStreaming && (
              <div className={styles.loadingIndicator}>
                <Spin size="small" />
                <span>正在思考...</span>
              </div>
            )}

            {/* 错误状态 */}
            {isError && (
              <div className={styles.errorIndicator}>
                <span>❌ 消息发送失败</span>
              </div>
            )}

            {/* 思考过程区域 */}
            {hasThinking && isAssistant && (
              <div className={styles.thinkingArea}>
                <div
                  className={styles.thinkingHeader}
                  onClick={() => toggleThinkingExpansion(message.id)}
                >
                  <span className={styles.thinkingTitle}>💭 AI 思考过程</span>
                  <span className={styles.expandIcon}>
                    {isThinkingExpanded ? '▼' : '▶'}
                  </span>
                </div>
                {isThinkingExpanded && (
                  <div className={styles.thinkingContent}>
                    {message.think
                      ?.split('\n')
                      .map((line: string, index: number) => (
                        <div key={index} className={styles.thinkingLine}>
                          {line}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    },
    [expandedThinking, toggleThinkingExpansion],
  );

  /**
   * 聊天消息列表（memo化）
   */
  /**
   * 渲染会话分隔符
   */
  const renderConversationDivider = useCallback(
    (
      conversationTopic: string,
      conversationCreated: string,
      // sessionId: string, // 暂时未使用，保留以备将来使用
    ) => {
      return (
        <div
          key={`divider-${conversationCreated}`}
          className={styles.conversationDivider}
        >
          <div className={styles.dividerLine} />
          <div className={styles.dividerContent}>
            <Text type="secondary" className={styles.conversationTopic}>
              {conversationTopic}
            </Text>
            <Text type="secondary" className={styles.conversationTime}>
              {dayjs(conversationCreated).format('YYYY-MM-DD HH:mm')}
            </Text>
          </div>
          <div className={styles.dividerLine} />
        </div>
      );
    },
    [],
  );

  const chatMessagesList = useMemo(() => {
    const messages = chat.chatMessages;
    const renderedMessages: React.ReactNode[] = [];
    let currentSessionId: string | null = null;

    messages.forEach((message) => {
      // 检查是否需要添加会话分隔符
      if (
        message.conversationTopic &&
        message.sessionId &&
        message.sessionId !== currentSessionId
      ) {
        renderedMessages.push(
          renderConversationDivider(
            message.conversationTopic,
            message.conversationCreated || message.time,
          ),
        );
        currentSessionId = message.sessionId;
      }

      // 渲染消息
      renderedMessages.push(renderChatMessage(message));
    });

    return renderedMessages;
  }, [chat.chatMessages, renderChatMessage, renderConversationDivider]);

  const labelRender = useCallback((props: any) => {
    return <span>v{props.value.replace('v', '')}</span>;
  }, []);

  return (
    <Card className={styles.chatCard} bordered={false}>
      {/* 聊天模式切换 */}
      <div className={styles.chatModeContainer}>
        <div className={styles.chatModeSwitcher}>
          <Segmented
            value={chatMode}
            onChange={(value) => setChatMode(value as 'chat' | 'design')}
            options={[
              { label: 'Chat', value: 'chat' },
              { label: 'Design', value: 'design' },
            ]}
            className={styles.chatModeSegmented}
          />
          <div className={styles.versionSelectorWrapper}>
            <Select
              value={
                projectInfo.projectInfoState.projectInfo?.codeVersion
                  ? `v${projectInfo.projectInfoState.projectInfo.codeVersion}`
                  : undefined
              }
              size="small"
              className={styles.versionSelector}
              options={projectInfo.versionList.map((version) => ({
                label: `v${version.version}`,
                value: version.version,
                action: version.action,
              }))}
              labelRender={labelRender}
              popupMatchSelectWidth={150}
              optionRender={(option) => {
                return (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>v{option.data.value}</span>
                    <Tag
                      color={projectInfo.getActionColor(option.data.action)}
                      style={{ marginLeft: 8, fontSize: '10px' }}
                    >
                      {projectInfo.getActionText(option.data.action)}
                    </Tag>
                  </div>
                );
              }}
              suffixIcon={<DownOutlined />}
              onChange={(value) => {
                onVersionSelect(parseInt(value));
              }}
              placeholder="选择版本"
              disabled={projectInfo.versionList.length === 0}
            />
          </div>

          {/* 历史会话选择器 */}
          {/* <div className={styles.conversationSelectorWrapper}>
            <ConversationSelector
              projectId={projectId}
              currentSessionId={chat.currentSessionId}
              onSessionChange={loadHistorySession}
              setChatMessages={chat.setChatMessages}
            />
          </div> */}
        </div>
      </div>

      {/* 聊天消息区域 */}
      <div className={styles.chatMessages}>
        {chat.isLoadingHistory ? (
          <div className={styles.loadingContainer}>
            <Spin size="small" />
            <Text type="secondary" style={{ marginLeft: 8 }}>
              正在加载历史会话...
            </Text>
          </div>
        ) : (
          chatMessagesList
        )}
      </div>

      {/* 聊天输入区域 */}
      <div className={styles.chatInput}>
        <Input
          placeholder="向AI助手提问..."
          value={chat.chatInput}
          onChange={(e) => chat.setChatInput(e.target.value)}
          onPressEnter={chat.sendChat}
          suffix={
            <div style={{ display: 'flex', gap: 4 }}>
              {chat.isChatLoading && (
                <Button
                  type="text"
                  icon={<StopOutlined />}
                  onClick={chat.cancelChat}
                  title="取消AI任务"
                  className={styles.cancelButton}
                />
              )}
              <Button
                type="text"
                icon={<SendOutlined />}
                onClick={chat.sendChat}
                disabled={!chat.chatInput.trim() || chat.isChatLoading}
              />
            </div>
          }
          className={styles.inputField}
        />
        <div className={styles.modelSelector}>
          <Text type="secondary">deepseek-v3</Text>
        </div>
      </div>
    </Card>
  );
};

export default ChatArea;
