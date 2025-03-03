import ConditionRender from '@/components/ConditionRender';
import CustomPopover from '@/components/CustomPopover';
import {
  COMPONENT_LIST,
  COMPONENT_MORE_ACTION,
} from '@/constants/library.constants';
import { PublishStatusEnum } from '@/types/enums/common';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ComponentItemProps } from '@/types/interfaces/library';
import { CheckCircleTwoTone, MoreOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import moment from 'moment';
import React, { memo, useEffect, useMemo, useState } from 'react';
import BoxInfo from './BoxInfo';
import styles from './index.less';

const cx = classNames.bind(styles);

// 单个资源组件
const ComponentItem: React.FC<ComponentItemProps> = ({
  componentInfo,
  onClick,
  onClickMore,
}) => {
  const [actionList, setActionList] = useState<CustomPopoverItem[]>([]);
  // 组件默认信息
  const info = useMemo(() => {
    return COMPONENT_LIST.find((item) => item.type === componentInfo.type);
  }, [componentInfo.type]);

  useEffect(() => {
    const list = COMPONENT_MORE_ACTION.filter(
      (item) => item.type === componentInfo.type,
    );
    setActionList(list);
  }, [componentInfo]);

  return (
    <div
      className={cx(
        styles.container,
        'py-12',
        'radius-6',
        'flex',
        'flex-col',
        'content-between',
        'cursor-pointer',
      )}
      onClick={onClick}
    >
      <div className={cx('flex', 'content-between', styles.header)}>
        <div
          className={cx(
            'flex-1',
            'flex',
            'flex-col',
            'content-around',
            'overflow-hide',
          )}
        >
          <h3 className={cx('text-ellipsis', styles['plugin-name'])}>
            {componentInfo.name}
          </h3>
          <p className={cx('text-ellipsis', styles.desc)}>
            {componentInfo.description}
          </p>
        </div>
        <img
          className={cx(styles.img)}
          src={componentInfo.icon || (info?.defaultImage as string)}
          alt=""
        />
      </div>
      {/*插件类型*/}
      <div
        className={cx('flex', 'flex-wrap', 'items-center', styles['type-wrap'])}
      >
        <BoxInfo icon={info?.icon} text={info?.text as string} />
        {componentInfo.publishStatus === PublishStatusEnum.Published && (
          <>
            <BoxInfo text="已发布" />
            <CheckCircleTwoTone twoToneColor="#52c41a" />
          </>
        )}
      </div>
      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <ConditionRender condition={componentInfo.icon}>
          <img
            className={cx(styles.img, 'radius-6')}
            src={componentInfo.icon}
            alt=""
          />
        </ConditionRender>
        <div className={cx('flex-1', 'flex', 'item-center', 'overflow-hide')}>
          <div className={cx('flex-1', 'text-ellipsis')}>
            {componentInfo.creator?.nickName}
          </div>
          <div className={cx(styles['edit-time'], 'text-ellipsis')}>
            最近编辑 {moment(componentInfo.modified).format('MM-DD HH:mm')}
          </div>
        </div>
        <CustomPopover list={actionList} onClick={onClickMore}>
          <span
            className={cx(
              styles['icon-box'],
              'flex',
              'content-center',
              'items-center',
              'hover-box',
            )}
          >
            <MoreOutlined />
          </span>
        </CustomPopover>
      </div>
    </div>
  );
};

export default memo(ComponentItem);
