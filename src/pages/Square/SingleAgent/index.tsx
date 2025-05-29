import agentImage from '@/assets/images/agent_image.png';
import avatar from '@/assets/images/avatar.png';
import pluginImage from '@/assets/images/plugin_image.png';
import ConditionRender from '@/components/ConditionRender';
import { apiCollectAgent, apiUnCollectAgent } from '@/services/agentDev';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { SingleAgentProps } from '@/types/interfaces/square';
import {
  PlayCircleOutlined,
  StarFilled,
  UserOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 单个智能体组件
 */
const SingleAgent: React.FC<SingleAgentProps> = ({
  onClick,
  publishedItemInfo,
  onToggleCollectSuccess,
}) => {
  const {
    targetType,
    targetId,
    icon,
    name,
    publishUser,
    description,
    statistics,
    collect,
  } = publishedItemInfo;

  // 根据类型（目标对象（智能体、工作流、插件））显示不同的默认图标
  const defaultImage =
    targetType === SquareAgentTypeEnum.Agent ? agentImage : pluginImage;

  // 智能体收藏
  const { run: runCollectAgent } = useRequest(apiCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      onToggleCollectSuccess(targetId, true);
    },
  });

  // 智能体取消收藏
  const { run: runUnCollectAgent } = useRequest(apiUnCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      onToggleCollectSuccess(targetId, false);
    },
  });

  // 切换收藏与取消收藏
  const handleToggleCollect = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (collect) {
      runUnCollectAgent(targetId);
    } else {
      runCollectAgent(targetId);
    }
  };

  return (
    <div className={cx(styles.container, 'cursor-pointer')} onClick={onClick}>
      <div className={cx(styles.header, 'flex')}>
        <img
          className={cx(styles['a-logo'])}
          src={icon || defaultImage}
          alt=""
        />
        <div className={cx(styles['info-container'], 'flex-1')}>
          <div className={cx('flex')}>
            <span className={cx('flex-1', styles['a-name'], 'text-ellipsis')}>
              {name}
            </span>
          </div>
          <div className={cx('flex', 'items-center', styles['info-author'])}>
            <img
              className={cx(styles.avatar)}
              src={publishUser?.avatar || (avatar as string)}
              alt=""
            />
            <ConditionRender condition={publishUser?.userName}>
              <span className={cx(styles.author, 'text-ellipsis')}>
                {publishUser?.userName}
              </span>
            </ConditionRender>
            <ConditionRender condition={publishUser?.nickName}>
              <span className={cx(styles.nickname, 'text-ellipsis', 'flex-1')}>
                {publishUser?.nickName}
              </span>
            </ConditionRender>
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
          <span
            className={cx(styles.text, styles.collect, 'flex')}
            onClick={handleToggleCollect}
          >
            <StarFilled
              className={cx({ [styles['collected-star']]: collect })}
            />
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
