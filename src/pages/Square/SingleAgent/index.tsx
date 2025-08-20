import agentImage from '@/assets/images/agent_image.png';
import CardWrapper from '@/components/business-component/CardWrapper';
import {
  ICON_MESSAGE,
  ICON_STAR,
  ICON_STAR_FILL,
  ICON_USER,
} from '@/constants/images.constants';
import { apiCollectAgent, apiUnCollectAgent } from '@/services/agentDev';
import type { SingleAgentProps } from '@/types/interfaces/square';
import { Button } from 'antd';
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
    targetId,
    icon,
    name,
    publishUser,
    description,
    statistics,
    collect,
  } = publishedItemInfo;

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
    <CardWrapper
      className={cx(styles['card-wrapper'])}
      title={name}
      avatar={publishUser?.avatar || ''}
      name={publishUser?.nickName || publishUser?.userName}
      content={description}
      icon={icon}
      defaultIcon={agentImage}
      onClick={onClick}
      footer={
        <>
          <footer className={cx('flex', 'items-center', styles.footer)}>
            {/*用户人数*/}
            <span className={cx(styles.text)}>
              <ICON_USER />
              <span>{statistics?.userCount || 0}</span>
            </span>
            {/*会话次数*/}
            <span className={cx(styles.text)}>
              <ICON_MESSAGE />
              <span>{statistics?.convCount || 0}</span>
            </span>
            {/*收藏次数*/}
            <span className={cx(styles.text)}>
              {collect ? <ICON_STAR_FILL /> : <ICON_STAR />}
              <span>{statistics?.collectCount || 0}</span>
            </span>
          </footer>
          <div className={cx(styles['action-box'], 'flex', 'items-center')}>
            <Button type="primary" block icon={<ICON_MESSAGE />}>
              开始使用
            </Button>
            <span
              className={cx(styles['star-box'])}
              onClick={handleToggleCollect}
            >
              {collect ? <ICON_STAR_FILL /> : <ICON_STAR />}
            </span>
          </div>
        </>
      }
    />
  );
};

export default SingleAgent;
