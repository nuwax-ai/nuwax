import CustomPopover from '@/components/CustomPopover';
import { EVENT_LIST } from '@/constants/agent.constants';
import { dict } from '@/services/i18nRuntime';
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
      {dict('PC.Pages.EditAgent.EventList.emptyDescription')}
    </p>
  );
};

export default EventList;
