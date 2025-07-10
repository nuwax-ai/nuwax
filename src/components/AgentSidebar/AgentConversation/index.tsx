import Loading from '@/components/Loading';
import { apiAgentConversationList } from '@/services/agentConfig';
import { AgentConversationProps } from '@/types/interfaces/agentTask';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { formatTimeAgo } from '@/utils/common';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import HistoryConversation from './HistoryConversation';
import styles from './index.less';

const cx = classNames.bind(styles);

// 智能体相关会话
const AgentConversation: React.FC<AgentConversationProps> = ({ agentId }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  // 历史会话列表
  const [conversationList, setConversationList] =
    useState<ConversationInfo[]>();

  // 查询历史会话记录
  const { run: runHistory } = useRequest(apiAgentConversationList, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (result: ConversationInfo[]) => {
      setConversationList(result);
      setLoadingHistory(false);
    },
    onError: () => {
      setLoadingHistory(false);
    },
  });

  useEffect(() => {
    setLoadingHistory(true);
    runHistory({
      agentId,
    });
  }, [agentId]);

  const handleLink = (id: number, agentId: number) => {
    history.push(`/home/chat/${id}/${agentId}`);
  };

  const handleDel = (id: number) => {
    setConversationList((list) => {
      return list?.filter((item) => item.id !== id);
    });
  };

  return (
    <div className={cx(styles.container)}>
      {!loadingHistory && (
        <div className={cx('flex', 'items-center', 'content-between')}>
          <h3 className={cx(styles.title)}>相关会话</h3>
          <span
            className={cx(styles.more, 'cursor-pointer')}
            onClick={() => setOpen(true)}
          >
            查看更多
          </span>
        </div>
      )}
      <div className={cx(styles['chat-wrapper'])}>
        {loadingHistory ? (
          <Loading className={cx(styles['loading-box'])} />
        ) : conversationList?.length ? (
          conversationList?.slice(0, 5)?.map((item) => (
            <div
              key={item.id}
              className={cx(styles['chat-item'], 'cursor-pointer', 'hover-box')}
              onClick={() => handleLink(item.id, item.agentId)}
            >
              <p className={cx('text-ellipsis', 'flex-1')}>{item.topic}</p>
              <span className={cx(styles.time)}>
                {formatTimeAgo(item.created)}
              </span>
            </div>
          ))
        ) : (
          <Empty description="暂无相关会话" />
        )}
      </div>
      <HistoryConversation
        conversationList={conversationList}
        isOpen={open}
        onCancel={() => setOpen(false)}
        onDel={handleDel}
      />
    </div>
  );
};

export default AgentConversation;
