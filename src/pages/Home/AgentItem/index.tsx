import agentImage from '@/assets/images/agent_image.png';
import { CategoryItemInfo } from '@/types/interfaces/agentConfig';
import { StarFilled } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AgentItemProps {
  info: CategoryItemInfo;
  onClick: () => void;
  onCollect: () => void;
}

const AgentItem: React.FC<AgentItemProps> = ({ info, onClick, onCollect }) => {
  // 收藏、取消收藏事件
  const handlerCollect = async (e) => {
    e.stopPropagation();
    onCollect();
  };

  return (
    <div
      className={cx(styles.container, 'flex', 'overflow-hide')}
      onClick={onClick}
    >
      <img
        className={cx(styles.img)}
        src={info.icon || (agentImage as string)}
        alt=""
      />
      <div className={cx(styles['info-box'], 'flex-1', 'flex', 'flex-col')}>
        <h3>{info?.name}</h3>
        <p className={cx('text-ellipsis-2', styles.desc)}>
          {info?.description}
        </p>
        <p className={cx(styles.source)}>
          来自{info?.publishUser?.nickName || info?.publishUser?.userName}
        </p>
      </div>
      <span
        className={cx(
          styles['icon-box'],
          'flex',
          'content-center',
          'items-center',
          'hover-box',
          { [styles.collected]: info.collect },
        )}
        onClick={handlerCollect}
      >
        <StarFilled />
      </span>
    </div>
  );
};

export default AgentItem;
