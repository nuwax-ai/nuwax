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
}) => {
  // 展开的消息详情
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set(),
  );

  /**
   * 切换消息展开状态
   */
  const toggleMessageExpansion = useCallback((messageId: string) => {
    setExpandedMessages((prev) => {
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
   * 处理动作按钮点击
   */
  const handleActionButton = useCallback((action: string) => {
    // TODO: 实现具体的动作处理逻辑
    console.log('Action clicked:', action);
  }, []);

  /**
   * 渲染聊天消息
   */
  const renderChatMessage = useCallback(
    (message: any) => {
      switch (message.type) {
        case 'ai':
          return (
            <div key={message.id} className={styles.messageWrapper}>
              <div className={`${styles.message} ${styles.ai}`}>
                <div className={styles.messageContent}>
                  {message.content
                    ?.split('\n')
                    .map((line: string, index: number) => (
                      <div key={index}>{line}</div>
                    ))}
                </div>
              </div>
              {message.details && (
                <div className={styles.detailsMessage}>
                  <div
                    className={styles.detailsHeader}
                    onClick={() => toggleMessageExpansion(message.id)}
                  >
                    <span className={styles.detailsTitle}>
                      {message.content}
                    </span>
                    <span className={styles.expandIcon}>
                      {expandedMessages.has(message.id) ? '▼' : '▶'}
                    </span>
                  </div>
                  {expandedMessages.has(message.id) && (
                    <div className={styles.detailsContent}>
                      {message.details.map((detail: string, index: number) => (
                        <div key={index} className={styles.detailItem}>
                          {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );

        case 'user':
          return (
            <div key={message.id} className={styles.messageWrapper}>
              <div className={`${styles.message} ${styles.user}`}>
                <div className={styles.messageContent}>
                  {message.content
                    ?.split('\n')
                    .map((line: string, index: number) => (
                      <div key={index}>{line}</div>
                    ))}
                </div>
              </div>
            </div>
          );

        case 'button':
          return (
            <div key={message.id} className={styles.messageWrapper}>
              <div className={styles.buttonMessage}>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleActionButton(message.action || '')}
                  className={styles.actionButton}
                >
                  {message.content}
                </Button>
              </div>
            </div>
          );

        case 'section':
          return (
            <div key={message.id} className={styles.messageWrapper}>
              <div className={styles.sectionMessage}>
                <div className={styles.sectionTitle}>{message.title}</div>
                <div className={styles.sectionItems}>
                  {message.items?.map((item: string, index: number) => (
                    <div key={index} className={styles.sectionItem}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );

        case 'thinking':
          return (
            <div key={message.id} className={styles.messageWrapper}>
              <div className={`${styles.message} ${styles.thinking}`}>
                <div className={styles.messageContent}>
                  <div className={styles.thinkingIndicator}>💭 思考中...</div>
                  {message.content
                    ?.split('\n')
                    .map((line: string, index: number) => (
                      <div key={index} className={styles.thinkingText}>
                        {line}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          );

        case 'tool_call':
          return (
            <div key={message.id} className={styles.messageWrapper}>
              <div className={`${styles.message} ${styles.toolCall}`}>
                <div className={styles.messageContent}>
                  <div className={styles.toolCallIndicator}>🔧</div>
                  <span>{message.content}</span>
                  {message.isStreaming && (
                    <span className={styles.streamingIndicator}>...</span>
                  )}
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    },
    [expandedMessages, toggleMessageExpansion, handleActionButton],
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
                // TODO: 实现版本切换逻辑
              }}
              placeholder="选择版本"
              disabled={projectInfo.versionList.length === 0}
            />
          </div>
        </div>
      </div>

      {/* 聊天消息区域 */}
      <div className={styles.chatMessages}>
        {chatMessagesList}
        {chat.isChatLoading && (
          <div className={`${styles.message} ${styles.ai}`}>
            <div className={styles.messageContent}>
              <Spin size="small" /> 正在思考...
            </div>
          </div>
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
