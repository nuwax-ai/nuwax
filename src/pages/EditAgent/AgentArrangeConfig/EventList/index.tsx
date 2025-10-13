import type { EventListProps } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 事件列表
 */
const EventList: React.FC<EventListProps> = ({
  textClassName,
  list,
  onClick,
}) => {
  return (
    <>
      {list?.length > 0 ? (
        <div className={cx('flex', 'items-center', styles.container)}>
          {list?.map((item, index) => (
            <span
              key={index}
              className={cx(
                styles.box,
                'radius-6',
                'hover-box',
                'cursor-pointer',
              )}
              onClick={() => onClick(item)}
            >
              {item.name}
            </span>
          ))}
        </div>
      ) : (
        <p className={cx(textClassName)}>
          用于保存用户个人信息，让智能体记住用户的特征，使回复更加个性化。
        </p>
      )}
    </>
  );
};

export default EventList;
