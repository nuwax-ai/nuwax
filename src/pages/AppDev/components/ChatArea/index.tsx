import { MessageStatusEnum } from '@/types/enums/common';
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
      const isStreaming = message.isStreaming;
      const isLoading = message.status === MessageStatusEnum.Loading;
      const isError = message.status === MessageStatusEnum.Error;
      const hasThinking = message.think && message.think.trim() !== '';
      const isThinkingExpanded = expandedThinking.has(message.id);

      // 调试信息
      if (isAssistant) {
        console.log('🎨 [UI] 渲染 ASSISTANT 消息:', {
          id: message.id,
          requestId: message.requestId,
          status: message.status,
          isStreaming: message.isStreaming,
          isLoading,
          text: message.text?.substring(0, 50) + '...',
        });
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
  const chatMessagesList = useMemo(() => {
    return chat.chatMessages.map(renderChatMessage);
  }, [chat.chatMessages, renderChatMessage]);

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
              dropdownClassName={styles.versionDropdown}
              options={projectInfo.versionList.map((version) => ({
                value: `v${version.version}`,
                label: (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>v{version.version}</span>
                    <Tag
                      color={projectInfo.getActionColor(version.action)}
                      style={{ marginLeft: 8, fontSize: '10px' }}
                    >
                      {projectInfo.getActionText(version.action)}
                    </Tag>
                  </div>
                ),
              }))}
              suffixIcon={<DownOutlined />}
              onChange={(value) => {
                const versionNumber = parseInt(value.replace('v', ''));
                console.log('选择版本:', versionNumber);
                onVersionSelect(versionNumber);
              }}
              placeholder="选择版本"
              disabled={projectInfo.versionList.length === 0}
            />
          </div>
        </div>
      </div>

      {/* 聊天消息区域 */}
      <div className={styles.chatMessages}>{chatMessagesList}</div>

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
