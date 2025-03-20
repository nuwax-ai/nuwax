import agentImage from '@/assets/images/agent_image.png';
import ConditionRender from '@/components/ConditionRender';
import { apiAgentConversationCreate } from '@/services/agentConfig';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { SingleAgentProps } from '@/types/interfaces/square';
import {
  PlayCircleOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import { history, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 单个智能体组件
 */
const SingleAgent: React.FC<SingleAgentProps> = ({ publishedAgentInfo }) => {
  const { targetId, icon, name, publishUser, description, statistics } =
    publishedAgentInfo;
  // 创建会话
  const { run: runConversationCreate } = useRequest(
    apiAgentConversationCreate,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (result: ConversationInfo) => {
        history.push(`/home/chat/${result.id}`);
      },
    },
  );

  const handleClick = () => {
    runConversationCreate({
      agentId: targetId,
    });
  };

  return (
    <div
      className={cx(styles.container, 'cursor-pointer')}
      onClick={handleClick}
    >
      <div className={cx(styles.header, 'flex')}>
        <img
          className={cx(styles['a-logo'])}
          src={icon || (agentImage as string)}
          alt=""
        />
        <div className={cx(styles['info-container'], 'flex-1')}>
          <div className={cx('flex')}>
            <span className={cx('flex-1', styles['a-name'], 'text-ellipsis')}>
              {name}
            </span>
          </div>
          <div className={cx('flex', 'items-center', styles['info-author'])}>
            <ConditionRender condition={publishUser?.avatar}>
              <img
                className={cx(styles.avatar)}
                src={publishUser?.avatar}
                alt=""
              />
            </ConditionRender>
            <span className={cx(styles.author)}>{publishUser?.userName}</span>
            <span className={cx(styles.nickname)}>{publishUser?.nickName}</span>
          </div>
          <p className={cx(styles.desc, 'text-ellipsis-3')}>{description}</p>
        </div>
      </div>
      <div className={cx(styles['divider-horizontal'])} />
      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <div className={cx('flex', styles.left)}>
          {/*用户人数*/}
          <span className={cx(styles.text, 'flex')}>
            <UserOutlined />
            <span>{statistics?.userCount || 0}</span>
          </span>
          {/*会话次数*/}
          <span className={cx(styles.text, 'flex')}>
            <PlayCircleOutlined />
            <span>{statistics?.convCount || 0}</span>
          </span>
          {/*收藏次数*/}
          <span className={cx(styles.text, 'flex')}>
            <StarOutlined />
            <span>{statistics?.collectCount || 0}</span>
          </span>
        </div>
        <div className={cx(styles.right)}>
          <span className={cx('cursor-pointer')}>立即使用</span>
        </div>
      </div>
    </div>
  );
};

export default SingleAgent;
