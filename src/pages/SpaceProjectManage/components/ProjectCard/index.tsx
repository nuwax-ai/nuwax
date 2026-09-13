import agentImage from '@/assets/images/agent_image.png';
import CardWrapper from '@/components/business-component/CardWrapper';
import CustomPopover from '@/components/CustomPopover';
import { ICON_MORE, ICON_SUCCESS } from '@/constants/images.constants';
import { dict } from '@/services/i18nRuntime';
import { PublishStatusEnum } from '@/types/enums/common';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { UserProjectItem } from '@/types/interfaces/userProject';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useCallback, useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 项目卡片更多操作 */
enum ProjectCardActionEnum {
  Rename = 'rename',
  Delete = 'delete',
}

export interface ProjectCardProps {
  /** 项目数据 */
  item: UserProjectItem;
  /** 点击卡片 */
  onClick?: (item: UserProjectItem) => void;
  /** 重命名 */
  onRename?: (item: UserProjectItem) => void;
  /** 删除 */
  onDelete?: (item: UserProjectItem) => void;
}

/**
 * 项目管理卡片：布局对齐 ApplicationItem / McpComponentItem（CardWrapper）。
 *
 * @param props.item 项目数据
 * @param props.onClick 点击卡片
 * @param props.onRename 重命名
 * @param props.onDelete 删除
 * @returns 项目卡片
 */
const ProjectCard: React.FC<ProjectCardProps> = ({
  item,
  onClick,
  onRename,
  onDelete,
}) => {
  const actionList = useMemo<CustomPopoverItem[]>(
    () => [
      {
        type: ProjectCardActionEnum.Rename,
        icon: <EditOutlined />,
        label: dict('PC.Components.ConversationContextMenu.rename'),
      },
      {
        type: ProjectCardActionEnum.Delete,
        icon: <DeleteOutlined />,
        isDel: true,
        label: dict('PC.Common.Global.delete'),
      },
    ],
    [],
  );

  const handleClickMore = useCallback(
    (action: CustomPopoverItem) => {
      if (action.type === ProjectCardActionEnum.Rename) {
        onRename?.(item);
      } else if (action.type === ProjectCardActionEnum.Delete) {
        onDelete?.(item);
      }
    },
    [item, onDelete, onRename],
  );

  return (
    <CardWrapper
      title={item.name}
      avatar=""
      name=""
      content={item.description || ''}
      icon={item.icon}
      defaultIcon={agentImage}
      onClick={() => onClick?.(item)}
      extra={
        <>
          <span className={cx('text-ellipsis', 'flex-1')}>
            {dict('PC.Pages.SpaceDevelop.ApplicationItem.lastEdited')}{' '}
            {item.modified ? dayjs(item.modified).format('MM-DD HH:mm') : ''}
          </span>
          {item.publishStatus === PublishStatusEnum.Published && (
            <span className={cx('flex', 'items-center', 'gap-4')}>
              <ICON_SUCCESS />
              {dict('PC.Pages.SpaceDevelop.ApplicationItem.published')}
            </span>
          )}
        </>
      }
      footer={
        <footer
          className={cx(
            styles.footer,
            'flex',
            'items-center',
            'content-between',
          )}
        >
          <span />
          <CustomPopover list={actionList} onClick={handleClickMore}>
            <Button size="small" type="text" icon={<ICON_MORE />} />
          </CustomPopover>
        </footer>
      }
    />
  );
};

export default ProjectCard;
