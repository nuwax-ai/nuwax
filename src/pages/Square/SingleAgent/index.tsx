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
      title={name}
      avatar={publishUser?.avatar || ''}
      name={publishUser?.nickName || publishUser?.userName}
      content={description}
      icon={icon}
      defaultIcon={agentImage}
      onClick={onClick}
      footer={
        <footer className={cx('flex', 'items-center')}>
          <div className={cx('flex', 'items-center', 'gap-4')}>
            {/*用户人数*/}
            <span className={cx(styles.text, 'flex')}>
              <ICON_USER />
              <span>{statistics?.userCount || 0}</span>
            </span>
            {/*会话次数*/}
            <span className={cx(styles.text, 'flex')}>
              <ICON_MESSAGE />
              <span>{statistics?.convCount || 0}</span>
            </span>
            {/*收藏次数*/}
            <span
              className={cx(styles.text, 'flex')}
              onClick={handleToggleCollect}
            >
              {collect ? <ICON_STAR_FILL /> : <ICON_STAR />}
              <span>{statistics?.collectCount || 0}</span>
            </span>
          </div>
        </footer>
      }
    />
    // <div className={cx(styles.container, 'cursor-pointer')} onClick={onClick}>
    //   <div className={cx(styles.header, 'flex')}>
    //     <img className={cx(styles['a-logo'])} src={icon || agentImage} alt="" />
    //     <div className={cx(styles['info-container'], 'flex-1')}>
    //       <div className={cx('flex', 'gap-10')}>
    //         <span className={cx('flex-1', styles['a-name'], 'text-ellipsis')}>
    //           {name}
    //         </span>
    //         {extra}
    //       </div>
    //       <div className={cx('flex', 'items-center', styles['info-author'])}>
    //         <img
    //           className={cx(styles.avatar)}
    //           src={publishUser?.avatar || (avatar as string)}
    //           alt=""
    //         />
    //         <span className={cx(styles.author, 'text-ellipsis', 'flex-1')}>
    //           {publishUser?.nickName || publishUser?.userName}
    //         </span>
    //       </div>
    //       <p className={cx(styles.desc, 'text-ellipsis-3')}>{description}</p>
    //     </div>
    //   </div>
    //   <div className={cx(styles['divider-horizontal'])} />
    //   <div className={cx(styles.footer, 'flex', 'items-center')}>
    //     <div className={cx('flex', styles.left)}>
    //       {/*用户人数*/}
    //       <span className={cx(styles.text, 'flex')}>
    //         <UserOutlined />
    //         <span>{statistics?.userCount || 0}</span>
    //       </span>
    //       {/*会话次数*/}
    //       <span className={cx(styles.text, 'flex')}>
    //         <PlayCircleOutlined />
    //         <span>{statistics?.convCount || 0}</span>
    //       </span>
    //       {/*收藏次数*/}
    //       <span
    //         className={cx(styles.text, styles.collect, 'flex')}
    //         onClick={handleToggleCollect}
    //       >
    //         <StarFilled
    //           className={cx({ [styles['collected-star']]: collect })}
    //         />
    //         <span>{statistics?.collectCount || 0}</span>
    //       </span>
    //     </div>
    //     <div className={cx(styles.right)}>
    //       <span className={cx('cursor-pointer')}>立即使用</span>
    //     </div>
    //   </div>
    // </div>
  );
};

export default SingleAgent;
