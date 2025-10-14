import { listConversations } from '@/services/appDev';
import type {
  AppDevChatMessage,
  ConversationRecord,
} from '@/types/interfaces/appDev';
import { HistoryOutlined } from '@ant-design/icons';
import { Button, Dropdown, List, Spin, Typography, message } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const { Text } = Typography;

interface ConversationSelectorProps {
  projectId: string;
  currentSessionId: string | null;
  onSessionChange: (sessionId: string) => void;
  setChatMessages: (messages: AppDevChatMessage[]) => void;
}

/**
 * 历史会话选择器组件
 * 提供下拉列表选择历史会话的功能
 */
const ConversationSelector: React.FC<ConversationSelectorProps> = ({
  projectId,
  currentSessionId,
  onSessionChange,
  setChatMessages,
}) => {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * 解析会话内容并生成预览文本
   * @param conversation 会话记录
   * @returns 内容预览文本
   */
  const getConversationPreview = (conversation: ConversationRecord): string => {
    try {
      const messages = JSON.parse(conversation.content) as AppDevChatMessage[];

      if (!messages || messages.length === 0) {
        return '暂无对话内容';
      }

      // 获取前几条消息的内容
      const previewMessages = messages.slice(0, 2); // 只显示前2条消息

      const previewTexts = previewMessages
        .map((msg) => {
          if (msg.role === 'USER') {
            return `👤 ${msg.text}`;
          } else if (msg.role === 'ASSISTANT') {
            return `🤖 ${msg.text}`;
          }
          return '';
        })
        .filter((text) => text.length > 0);

      // 合并预览文本
      const fullPreview = previewTexts.join(' → ');

      // 如果内容太长，截断并添加省略号
      if (fullPreview.length > 80) {
        return fullPreview.substring(0, 80) + '...';
      }

      return fullPreview;
    } catch (error) {
      console.error('解析会话内容失败:', error);
      return '内容解析失败';
    }
  };

  /**
   * 处理历史会话选择
   * @param conversation 选中的会话记录
   * @param isAutoLoad 是否为自动加载（不显示成功提示）
   */
  const handleConversationSelect = async (
    conversation: ConversationRecord,
    isAutoLoad = false,
  ) => {
    try {
      console.log(
        '🔄 [ConversationSelector] 开始还原历史会话:',
        conversation.sessionId,
        isAutoLoad ? '(自动加载)' : '(手动选择)',
      );

      // 解析会话内容
      const messages = JSON.parse(conversation.content) as AppDevChatMessage[];

      // 还原聊天消息
      setChatMessages(messages);

      // 切换会话ID
      onSessionChange(conversation.sessionId);

      console.log('✅ [ConversationSelector] 历史会话还原成功:', {
        sessionId: conversation.sessionId,
        messageCount: messages.length,
        topic: conversation.topic,
        isAutoLoad,
      });

      // 只有在手动选择时才显示成功提示
      if (!isAutoLoad) {
        message.success(`已还原会话: ${conversation.topic}`);
      }
    } catch (error) {
      console.error('❌ [ConversationSelector] 还原历史会话失败:', error);
      message.error('还原历史会话失败');
    }
  };

  // 加载会话列表并自动加载最新会话
  useEffect(() => {
    const loadConversations = async () => {
      if (!projectId) return;

      setLoading(true);
      try {
        const response = await listConversations({
          projectId,
        });

        if (response.success && response.data) {
          const conversations = response.data;
          setConversations(conversations);

          // 自动加载最新的历史会话（如果存在且当前没有活跃会话）
          if (conversations.length > 0 && !currentSessionId) {
            // 按创建时间排序，获取最新的会话
            const sortedConversations = conversations.sort(
              (a: ConversationRecord, b: ConversationRecord) =>
                new Date(b.created).getTime() - new Date(a.created).getTime(),
            );
            const latestConversation = sortedConversations[0];

            console.log('🔄 [ConversationSelector] 自动加载最新历史会话:', {
              sessionId: latestConversation.sessionId,
              topic: latestConversation.topic,
              created: latestConversation.created,
            });

            // 自动还原最新会话
            await handleConversationSelect(latestConversation, true);
          }
        }
      } catch (error) {
        console.error('加载会话列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [projectId, currentSessionId]);

  // 渲染下拉菜单内容
  const renderDropdownContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingContainer}>
          <Spin size="small" />
          <Text type="secondary" style={{ marginLeft: 8 }}>
            加载中...
          </Text>
        </div>
      );
    }

    if (conversations.length === 0) {
      return (
        <div className={styles.emptyContainer}>
          <Text type="secondary">暂无历史会话</Text>
        </div>
      );
    }

    return (
      <List
        className={styles.conversationList}
        dataSource={conversations}
        renderItem={(conv) => (
          <List.Item
            className={`${styles.conversationItem} ${
              conv.sessionId === currentSessionId ? styles.activeItem : ''
            }`}
            onClick={() => handleConversationSelect(conv, false)}
          >
            <div className={styles.conversationContent}>
              <div className={styles.topic}>
                <Text ellipsis={{ tooltip: conv.topic }}>{conv.topic}</Text>
              </div>
              <div className={styles.contentPreview}>
                <Text
                  type="secondary"
                  className={styles.contentText}
                  ellipsis={{ tooltip: getConversationPreview(conv) }}
                >
                  {getConversationPreview(conv)}
                </Text>
              </div>
              <div className={styles.time}>
                <Text type="secondary" className={styles.timeText}>
                  {dayjs(conv.created).format('MM-DD HH:mm')}
                </Text>
              </div>
            </div>
          </List.Item>
        )}
      />
    );
  };

  return (
    <Dropdown
      overlay={renderDropdownContent()}
      trigger={['click']}
      placement="bottomRight"
      overlayClassName={styles.conversationDropdown}
    >
      <Button
        type="text"
        icon={<HistoryOutlined />}
        className={styles.historyButton}
        title="历史会话"
      />
    </Dropdown>
  );
};

export default ConversationSelector;
