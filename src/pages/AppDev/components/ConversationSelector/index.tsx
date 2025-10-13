import { listConversations } from '@/services/appDev';
import type { ConversationRecord } from '@/types/interfaces/appDev';
import { HistoryOutlined } from '@ant-design/icons';
import { Select, Spin } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

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

  return (
    <Select
      className={styles.conversationSelector}
      placeholder="选择历史会话"
      value={currentSessionId}
      onChange={onSessionChange}
      loading={loading}
      suffixIcon={<HistoryOutlined />}
      style={{ width: 240 }}
      notFoundContent={loading ? <Spin size="small" /> : '暂无历史会话'}
    >
      {conversations.map((conv) => (
        <Select.Option key={conv.sessionId} value={conv.sessionId}>
          <div className={styles.optionContent}>
            <div className={styles.topic}>{conv.topic}</div>
            <div className={styles.time}>
              {dayjs(conv.created).format('MM-DD HH:mm')}
            </div>
          </div>
        </Select.Option>
      ))}
    </Select>
  );
};

export default ConversationSelector;
