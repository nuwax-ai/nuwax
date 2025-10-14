import CustomPopover from '@/components/CustomPopover';
import { EVENT_LIST } from '@/constants/agent.constants';
import { EventListEnum } from '@/types/enums/agent';
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
  return list?.length > 0 ? (
    <div className={cx('flex', 'items-center', styles.container)}>
      {list?.map((item, index) => (
        <CustomPopover
          key={index}
          list={EVENT_LIST}
          onClick={(actionItem) =>
            onClick(item, actionItem.value as EventListEnum, index)
          }
        >
          <span className={cx(styles.box, 'hover-box', 'cursor-pointer')}>
            {item.name}
          </span>
        </CustomPopover>
      ))}
    </div>
  ) : (
    <p className={cx(textClassName)}>
      用于保存用户个人信息，让智能体记住用户的特征，使回复更加个性化。
    </p>
  );
};

export default EventList;
