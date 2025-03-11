import agentImage from '@/assets/images/agent_image.png';
import type { AgentChatEmptyProps } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 智能体聊天记录为空组件 - 展示智能体信息
 */
const AgentChatEmpty: React.FC<AgentChatEmptyProps> = ({ icon, name }) => {
  return (
    <div
      className={cx(
        'flex',
        'flex-col',
        'h-full',
        'items-center',
        'content-center',
      )}
    >
      <img
        className={cx(styles.avatar)}
        src={icon || (agentImage as string)}
        alt=""
      />
      <h3 className={cx('w-full', 'text-ellipsis', styles.nickname)}>{name}</h3>
    </div>
  );
};

export default AgentChatEmpty;
