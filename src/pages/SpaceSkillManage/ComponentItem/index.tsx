import AgentType from '@/components/base/AgentType';
import CardWrapper from '@/components/business-component/CardWrapper';
import CustomPopover from '@/components/CustomPopover';
import { ICON_MORE, ICON_SUCCESS } from '@/constants/images.constants';
import {
  COMPONENT_LIST,
  SKILL_MORE_ACTION,
} from '@/constants/library.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PermissionsEnum, PublishStatusEnum } from '@/types/enums/common';
import {
  ApplicationMoreActionEnum,
  ComponentTypeEnum,
  ModelComponentStatusEnum,
} from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ComponentItemProps } from '@/types/interfaces/library';
import { Button } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
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
    const list = SKILL_MORE_ACTION.filter((item) => {
      const { type, action } = item;
      return (
        type === componentInfo.type &&
        hasPermission(action as ApplicationMoreActionEnum)
      );
    });
    // TODO: 临时测试
    console.log(list);

    setActionList(SKILL_MORE_ACTION);
  }, [componentInfo]);

  return (
    <CardWrapper
      title={componentInfo.name}
      avatar={componentInfo.creator?.avatar || ''}
      name={componentInfo.creator?.nickName || componentInfo.creator?.userName}
      content={componentInfo.description}
      icon={componentInfo.icon}
      defaultIcon={info?.defaultImage || ''}
      onClick={onClick}
      extra={
        <>
          <span className={cx('text-ellipsis', 'flex-1', styles.time)}>
            最近编辑 {dayjs(componentInfo.modified).format('MM-DD HH:mm')}
          </span>
          {
            // 模型组件
            componentInfo?.type === ComponentTypeEnum.Model ? (
              <span
                className={cx('flex', 'items-center', 'gap-4', styles.status)}
              >
                {componentInfo?.enabled === ModelComponentStatusEnum.Enabled ? (
                  <>
                    <ICON_SUCCESS />
                    已启用
                  </>
                ) : (
                  <>已禁用</>
                )}
              </span>
            ) : (
              // 其他组件
              componentInfo?.publishStatus === PublishStatusEnum.Published && (
                <span
                  className={cx('flex', 'items-center', 'gap-4', styles.status)}
                >
                  <ICON_SUCCESS />
                  已发布
                </span>
              )
            )
          }
        </>
      }
      footer={
        <footer className={cx('flex', 'items-center', 'content-between')}>
          <AgentType
            type={componentInfo.type as unknown as AgentComponentTypeEnum}
          />
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
