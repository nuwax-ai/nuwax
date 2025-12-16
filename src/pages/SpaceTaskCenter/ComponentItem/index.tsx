import CardWrapper from '@/components/business-component/CardWrapper';
import CustomPopover from '@/components/CustomPopover';
import { ICON_MORE } from '@/constants/images.constants';
import {
  COMPONENT_LIST,
  SKILL_MORE_ACTION,
} from '@/constants/library.constants';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { TaskItemProps } from '@/types/interfaces/library';
import { Button } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 单个资源组件
const ComponentItem: React.FC<TaskItemProps> = ({
  taskInfo,
  onClick,
  onClickMore,
}) => {
  // 更多操作列表
  const [actionList, setActionList] = useState<CustomPopoverItem[]>([]);
  // 组件默认信息
  const info = useMemo(() => {
    return COMPONENT_LIST.find((item) => item.type === taskInfo.targetType);
  }, [taskInfo.targetType]);

  useEffect(() => {
    setActionList(SKILL_MORE_ACTION);
  }, [taskInfo]);

  return (
    <CardWrapper
      title={taskInfo.taskName}
      avatar={taskInfo.creator?.avatar || ''}
      name={taskInfo.creator?.userName}
      content={taskInfo.targetName}
      icon={taskInfo.targetIcon}
      defaultIcon={info?.defaultImage || ''}
      onClick={onClick}
      extra={
        <>
          <span className={cx('text-ellipsis', 'flex-1', styles.time)}>
            最近编辑 {dayjs(taskInfo.modified).format('MM-DD HH:mm')}
          </span>
        </>
      }
      footer={
        <footer className={cx('flex', 'items-center', 'content-between')}>
          {/*更多操作*/}
          <CustomPopover list={actionList} onClick={onClickMore}>
            <Button size="small" type="text" icon={<ICON_MORE />}></Button>
          </CustomPopover>
        </footer>
      }
    />
  );
};

export default ComponentItem;
