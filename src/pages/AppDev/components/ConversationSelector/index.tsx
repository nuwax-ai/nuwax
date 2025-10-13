import { listConversations } from '@/services/appDev';
import type { ConversationRecord } from '@/types/interfaces/appDev';
import { HistoryOutlined } from '@ant-design/icons';
import { Button, Dropdown, List, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const { Text } = Typography;

interface ConversationSelectorProps {
  projectId: string;
  currentSessionId: string | null;
  onSessionChange: (sessionId: string) => void;
}

/**
 * 历史会话选择器组件
 * 提供下拉列表选择历史会话的功能
 */
const ConversationSelector: React.FC<ConversationSelectorProps> = ({
  projectId,
  currentSessionId,
  onSessionChange,
}) => {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载会话列表
  useEffect(() => {
    const loadConversations = async () => {
      if (!projectId) return;

      setLoading(true);
      try {
        const response = await listConversations({
          projectId: Number(projectId),
        });

        if (response.success && response.data) {
          setConversations(response.data);
        }
      } catch (error) {
        console.error('加载会话列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [projectId]);

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
            onClick={() => onSessionChange(conv.sessionId)}
          >
            <div className={styles.conversationContent}>
              <div className={styles.topic}>
                <Text ellipsis={{ tooltip: conv.topic }}>{conv.topic}</Text>
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
