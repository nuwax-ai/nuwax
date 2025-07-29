import avatar from '@/assets/images/avatar.png';
import ConditionRender from '@/components/ConditionRender';
import CustomPopover from '@/components/CustomPopover';
import {
  COMPONENT_LIST,
  COMPONENT_MORE_ACTION,
} from '@/constants/library.constants';
import { PermissionsEnum, PublishStatusEnum } from '@/types/enums/common';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ComponentItemProps } from '@/types/interfaces/library';
import { CheckCircleTwoTone, MoreOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import dayjs from 'dayjs';
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
  // 更多操作列表
  const [actionList, setActionList] = useState<CustomPopoverItem[]>([]);
  // 组件默认信息
  const info = useMemo(() => {
    return COMPONENT_LIST.find((item) => item.type === componentInfo.type);
  }, [componentInfo.type]);

  // 检查是否有删除权限
  const hasPermission = (action: ApplicationMoreActionEnum) => {
    if (action === ApplicationMoreActionEnum.Del) {
      return componentInfo?.permissions?.includes(PermissionsEnum.Delete);
    }
    return true;
  };

  useEffect(() => {
    // 根据组件类型，过滤更多操作
    const list = COMPONENT_MORE_ACTION.filter((item) => {
      const { type, action } = item;
      return (
        type === componentInfo.type &&
        hasPermission(action as ApplicationMoreActionEnum)
      );
    });
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
        <img
          className={cx(styles.img, 'radius-6')}
          src={componentInfo?.creator?.avatar || avatar}
          alt=""
        />
        <div className={cx('flex-1', 'flex', 'item-center', 'overflow-hide')}>
          <div className={cx('flex-1', 'text-ellipsis')}>
            {componentInfo.creator?.nickName || componentInfo.creator?.userName}
          </div>
          <div className={cx(styles['edit-time'], 'text-ellipsis')}>
            最近编辑 {dayjs(componentInfo.modified).format('MM-DD HH:mm')}
          </div>
        </div>
        <ConditionRender condition={actionList?.length}>
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
        </ConditionRender>
      </div>
    </div>
  );
};

export default memo(ComponentItem);
