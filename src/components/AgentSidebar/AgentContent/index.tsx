import agentImage from '@/assets/images/agent_image.png'; // 智能体默认图标
import { SvgIcon } from '@/components/base';
import ChatTitleActions from '@/components/ChatTitleActions';
import ConditionRender from '@/components/ConditionRender';
import { AgentContentProps } from '@/types/interfaces/agentTask';
import { Typography } from 'antd';
import classNames from 'classnames';
import React, { useRef } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 智能体内容
const AgentContent: React.FC<AgentContentProps> = ({ agentDetail }) => {
  // 控制头像加载失败时只回退到默认图标一次，防止死循环
  const hasRetriedRef = useRef<boolean>(false);

  if (!agentDetail) {
    return null;
  }

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'items-center')}>
      <img
        className={styles.avatar}
        src={agentDetail?.icon || agentImage}
        onError={(e) => {
          const imgEl = e.currentTarget;
          // 仅在首次失败时回退到默认头像，避免无限重试
          if (!hasRetriedRef.current) {
            hasRetriedRef.current = true;
            imgEl.src = agentImage;
          } else {
            // 第二次依旧失败时，移除 onError，防止死循环
            imgEl.onerror = null;
          }
        }}
      />
      <Typography.Title
        level={5}
        className={styles.title}
        ellipsis={{ rows: 1, expandable: false, symbol: '...' }}
      >
        {agentDetail?.name}
      </Typography.Title>
      <div className={cx(styles.infoContainer)}>
        <Typography.Text className={cx(styles.from)} ellipsis={true}>
          来自于{' '}
          {agentDetail?.publishUser?.nickName ||
            agentDetail?.publishUser?.userName}
        </Typography.Text>
        {/* 统计信息 */}
        <div
          className={cx(
            styles.statistics,
            'flex',
            'items-center',
            'justify-center',
          )}
        >
          {/* 用户人数 */}
          <span className={cx(styles.statItem, 'flex', 'items-center')}>
            <SvgIcon name="icons-chat-user" className={styles.statIcon} />
            <span className={styles.statText}>
              {agentDetail?.statistics?.userCount || 0}
            </span>
          </span>
          {/* 会话次数 */}
          <span className={cx(styles.statItem, 'flex', 'items-center')}>
            <SvgIcon name="icons-chat-chat" className={styles.statIcon} />
            <span className={styles.statText}>
              {agentDetail?.statistics?.convCount || 0}
            </span>
          </span>
          {/* 收藏次数 */}
          <span className={cx(styles.statItem, 'flex', 'items-center')}>
            <SvgIcon name="icons-chat-collect" className={styles.statIcon} />
            <span className={styles.statText}>
              {agentDetail?.statistics?.collectCount || 0}
            </span>
          </span>
        </div>
        <ConditionRender condition={agentDetail?.description}>
          <Typography.Paragraph
            className={cx(styles.content)}
            ellipsis={{ rows: 2, expandable: false, symbol: '...' }}
          >
            {agentDetail?.description}
          </Typography.Paragraph>
        </ConditionRender>
        {/* 分享 复制 迁移 功能 */}
        <ChatTitleActions agentInfo={agentDetail} />
      </div>
    </div>
  );
};

export default AgentContent;
