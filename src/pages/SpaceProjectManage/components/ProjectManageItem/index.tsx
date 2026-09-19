import agentImage from '@/assets/images/agent_image.png';
import AgentType from '@/components/base/AgentType';
import CardWrapper from '@/components/business-component/CardWrapper';
import CustomPopover from '@/components/CustomPopover';
import { ICON_MORE, ICON_SUCCESS } from '@/constants/images.constants';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PublishStatusEnum } from '@/types/enums/common';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useCallback, useMemo } from 'react';
import type { ProjectListItem } from '../../projectRows';
import { PROJECT_TAB_LABEL_KEYS } from '../../type';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 卡片 footer 更多菜单操作类型 */
enum ProjectManageItemActionEnum {
  Edit = 'edit',
  Delete = 'delete',
}

/** ProjectManageItem 组件属性 */
export interface ProjectManageItemProps {
  /** 项目行数据 */
  item: ProjectListItem;
  /** 点击卡片主体，通常跳转详情页 */
  onClick: (item: ProjectListItem) => void;
  /** 编辑/重命名；未传入时不展示对应菜单项 */
  onEdit?: (item: ProjectListItem) => void;
  /** 删除；未传入时不展示对应菜单项 */
  onDelete?: (item: ProjectListItem) => void;
}

/**
 * 项目管理列表卡片。
 *
 * 布局与 SpaceLibrary.ComponentItem 一致：CardWrapper + 最后编辑时间 + footer 类型标签 + 更多操作。
 * 三方应用菜单文案为「编辑」，常规/全栈为「重命名」。
 *
 * @param props 卡片属性
 * @returns 单个项目卡片
 */
const ProjectManageItem: React.FC<ProjectManageItemProps> = ({
  item,
  onClick,
  onEdit,
  onDelete,
}) => {
  /** 根据父组件传入的回调动态组装更多菜单 */
  const actionList = useMemo<CustomPopoverItem[]>(() => {
    const actions: CustomPopoverItem[] = [];
    if (onEdit) {
      actions.push({
        type: ProjectManageItemActionEnum.Edit,
        icon: <EditOutlined />,
        // 三方应用走完整编辑弹窗，其余类型仅重命名
        label:
          item.projectType === AgentComponentTypeEnum.ThirdApp
            ? dict('PC.Common.Global.edit')
            : dict('PC.Components.ConversationContextMenu.rename'),
      });
    }
    if (onDelete) {
      actions.push({
        type: ProjectManageItemActionEnum.Delete,
        icon: <DeleteOutlined />,
        isDel: true,
        label: dict('PC.Common.Global.delete'),
      });
    }
    return actions;
  }, [item.projectType, onDelete, onEdit]);

  /** 分发更多菜单点击到父组件 */
  const handleClickMore = useCallback(
    (action: CustomPopoverItem) => {
      if (action.type === ProjectManageItemActionEnum.Edit) {
        onEdit?.(item);
      } else if (action.type === ProjectManageItemActionEnum.Delete) {
        onDelete?.(item);
      }
    },
    [item, onDelete, onEdit],
  );

  /** tab 接口行可能不带 publishStatus，兼容可选字段 */
  const publishStatus = (item as { publishStatus?: PublishStatusEnum })
    .publishStatus;

  /** footer：项目类型标签 + 更多操作按钮 */
  const projectTypeLabel = (
    <footer className={cx('flex', 'items-center', 'content-between')}>
      {item.projectType === AgentComponentTypeEnum.PageApp ? (
        <AgentType type={AgentComponentTypeEnum.Page} />
      ) : (
        <span className={cx(styles.type)}>
          {dict(PROJECT_TAB_LABEL_KEYS[item.projectType] || item.projectType)}
        </span>
      )}
      {actionList.length > 0 ? (
        <CustomPopover list={actionList} onClick={handleClickMore}>
          <Button size="small" type="text" icon={<ICON_MORE />} />
        </CustomPopover>
      ) : null}
    </footer>
  );

  return (
    <CardWrapper
      title={item.name}
      avatar=""
      name=""
      content={item.description || ''}
      icon={item.icon || ''}
      defaultIcon={agentImage}
      onClick={() => onClick(item)}
      extra={
        <>
          <span className={cx('text-ellipsis', 'flex-1', styles.time)}>
            {dict('PC.Pages.SpaceLibrary.ComponentItem.lastEdited')}{' '}
            {item.modified ? dayjs(item.modified).format('MM-DD HH:mm') : ''}
          </span>
          {publishStatus === PublishStatusEnum.Published && (
            <span className={cx('flex', 'items-center', 'gap-4', styles.status)}>
              <ICON_SUCCESS />
              {dict('PC.Pages.SpaceLibrary.ComponentItem.published')}
            </span>
          )}
        </>
      }
      footer={projectTypeLabel}
    />
  );
};

export default ProjectManageItem;
