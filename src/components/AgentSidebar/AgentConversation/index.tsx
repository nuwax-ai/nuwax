import SvgIcon from '@/components/base/SvgIcon';
import Loading from '@/components/custom/Loading';
import { AgentConversationProps } from '@/types/interfaces/agentTask';
import { formatTimeAgo } from '@/utils/common';
import { Button, Empty, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import { history, useModel } from 'umi';
import HistoryConversation from './HistoryConversation';
import styles from './index.less';

const cx = classNames.bind(styles);

// 智能体相关会话
const AgentConversation: React.FC<AgentConversationProps> = ({ agentId }) => {
  // 使用 model 中的历史会话弹窗状态，而不是本地状态
  const {
    isHistoryConversationOpen,
    closeHistoryConversation,
    openHistoryConversation,
  } = useModel('conversationInfo');
  const { conversationListItem, loadingHistoryItem } = useModel(
    'conversationHistory',
  );

  const handleLink = (id: number, agentId: number) => {
    history.push(`/home/chat/${id}/${agentId}`);
  };

  // 查看更多 打开历史会话弹窗 - 现在通过 model 状态管理
  const handleMore = useCallback(() => {
    // 这里不再需要设置本地状态，因为使用 model 中的状态
    openHistoryConversation();
  }, []);

  return (
    <div className={cx(styles.container)}>
      {!loadingHistoryItem && (
        <div
          className={cx(
            'flex',
            'items-center',
            'content-between',
            styles.titleBox,
          )}
        >
          <Typography.Title className={cx(styles.title)} level={5}>
            相关会话
          </Typography.Title>
          <Button
            size="small"
            className={cx(styles.more, 'cursor-pointer')}
            onClick={handleMore}
            icon={
              <SvgIcon
                name="icons-common-caret_right"
                style={{ fontSize: 16 }}
              />
            }
            iconPosition="end"
            type="text"
          >
            查看更多
          </Button>
        </div>
      )}
      <div className={cx(styles['chat-wrapper'])}>
        {loadingHistoryItem ? (
          <Loading className={cx(styles['loading-box'])} />
        ) : conversationListItem?.length ? (
          conversationListItem?.slice(0, 5)?.map((item: any) => (
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
        agentId={agentId}
        isOpen={isHistoryConversationOpen}
        onCancel={closeHistoryConversation}
      />
    </div>
  );
};

export default AgentConversation;
