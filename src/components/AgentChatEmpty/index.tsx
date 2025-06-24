import agentImage from '@/assets/images/agent_image.png';
import type { AgentChatEmptyProps } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 智能体聊天记录为空组件 - 展示智能体信息
 */
const AgentChatEmpty: React.FC<AgentChatEmptyProps> = ({
  className,
  icon,
  name,
  extra,
}) => {
  return (
    <div
      className={cx(
        'flex',
        'flex-col',
        'items-center',
        'content-center',
        className,
      )}
    >
      <img
        className={cx(styles.avatar)}
        src={icon || (agentImage as string)}
        alt=""
      />
      <h3 className={cx('w-full', 'text-ellipsis', styles.nickname)}>{name}</h3>
      {extra}
    </div>
  );
};

export default AgentChatEmpty;
