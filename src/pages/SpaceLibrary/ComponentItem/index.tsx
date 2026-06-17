import AgentType from '@/components/base/AgentType';
import CardWrapper from '@/components/business-component/CardWrapper';
import CustomPopover from '@/components/CustomPopover';
import { ICON_MORE, ICON_SUCCESS } from '@/constants/images.constants';
import {
  COMPONENT_LIST,
  COMPONENT_MORE_ACTION,
} from '@/constants/library.constants';
import { dict } from '@/services/i18nRuntime';
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
  // // 权限检查
  // const { hasPermission: hasPermissionMenu } = useModel('menuModel');

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
    const list: CustomPopoverItem[] = COMPONENT_MORE_ACTION.filter((item) => {
      const { type, action } = item;

      // 移出分组：仅当组件本身已经归属于某具体分组时才展示此操作，增进界面的直观体验
      if (action === ApplicationMoreActionEnum.Remove_From_Group) {
        return (
          type === componentInfo.type &&
          componentInfo.groupId !== undefined &&
          componentInfo.groupId !== null &&
          Number(componentInfo.groupId) !== 0 &&
          hasPermission(action as ApplicationMoreActionEnum)
        );
      }

      // 移入分组：移入与移出分组支持同时存在，允许已加入分组的资源移动至其它分组
      if (action === ApplicationMoreActionEnum.Add_To_Group) {
        return (
          type === componentInfo.type &&
          hasPermission(action as ApplicationMoreActionEnum)
        );
      }

      return (
        type === componentInfo.type &&
        hasPermission(action as ApplicationMoreActionEnum)
      );
    }).map((item) => {
      if (
        item.action === ApplicationMoreActionEnum.Add_To_Group &&
        componentInfo.groupId !== undefined &&
        componentInfo.groupId !== null &&
        Number(componentInfo.groupId) !== 0
      ) {
        return {
          ...item,
          label: dict('PC.Pages.SpaceResource.LeftGroupList.moveToOtherGroup'),
        };
      }
      return item;
    });

    setActionList(list);
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
            {dict('PC.Pages.SpaceLibrary.ComponentItem.lastEdited')}{' '}
            {dayjs(componentInfo.modified).format('MM-DD HH:mm')}
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
                    {dict('PC.Pages.SpaceLibrary.ComponentItem.enabled')}
                  </>
                ) : (
                  <>{dict('PC.Pages.SpaceLibrary.ComponentItem.disabled')}</>
                )}
              </span>
            ) : (
              // 其他组件
              componentInfo?.publishStatus === PublishStatusEnum.Published && (
                <span
                  className={cx('flex', 'items-center', 'gap-4', styles.status)}
                >
                  <ICON_SUCCESS />
                  {dict('PC.Pages.SpaceLibrary.ComponentItem.published')}
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
