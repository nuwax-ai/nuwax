import Loading from '@/components/Loading';
import { apiAgentConversationList } from '@/services/agentConfig';
import { AgentConversationProps } from '@/types/interfaces/agentTask';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { Empty } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 智能体相关会话
const AgentConversation: React.FC<AgentConversationProps> = ({ agentId }) => {
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

  return (
    <div className={cx(styles.container)}>
      <div className={cx('flex', 'items-center', 'content-between')}>
        <h3 className={cx(styles.title)}>相关会话</h3>
        <span className={cx(styles.more, 'cursor-pointer')}>查看更多</span>
      </div>
      <div className={cx(styles['chat-wrapper'])}>
        {loadingHistory ? (
          <Loading className={cx(styles['loading-box'])} />
        ) : conversationList?.length ? (
          conversationList?.slice(0, 5)?.map((item) => (
            <div key={item.id} className={cx(styles['chat-item'])}>
              <p className={cx('text-ellipsis')}>{item.topic}</p>
              <span className={cx(styles.time)}>
                {moment(item.created).format('YYYY-MM-DD')}
              </span>
            </div>
          ))
        ) : (
          <Empty description="暂无相关会话" />
        )}
      </div>
    </div>
  );
};

export default AgentConversation;
