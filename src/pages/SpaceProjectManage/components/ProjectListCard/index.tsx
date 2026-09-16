import agentImage from '@/assets/images/agent_image.png';
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
import ProjectListCardShell from './ProjectListCardShell';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 项目列表卡片更多操作 */
enum ProjectListCardActionEnum {
  Edit = 'edit',
  Delete = 'delete',
}

export interface ProjectListCardProps {
  /** 项目数据 */
  item: UserProjectItem;
  /** 点击卡片 */
  onClick?: (item: UserProjectItem) => void;
  /** 编辑 */
  onEdit?: (item: UserProjectItem) => void;
  /** 删除 */
  onDelete?: (item: UserProjectItem) => void;
}

/**
 * 空间项目列表卡片：用于常规项目、全栈应用、三方应用接入等列表页。
 * 更多操作在标题右侧，展示最后编辑时间与发布状态。
 */
const ProjectListCard: React.FC<ProjectListCardProps> = ({
  item,
  onClick,
  onEdit,
  onDelete,
}) => {
  const actionList = useMemo<CustomPopoverItem[]>(
    () => [
      {
        type: ProjectListCardActionEnum.Edit,
        icon: <EditOutlined />,
        label: dict('PC.Common.Global.edit'),
      },
      {
        type: ProjectListCardActionEnum.Delete,
        icon: <DeleteOutlined />,
        isDel: true,
        label: dict('PC.Common.Global.delete'),
      },
    ],
    [],
  );

  const handleClickMore = useCallback(
    (action: CustomPopoverItem) => {
      if (action.type === ProjectListCardActionEnum.Edit) {
        onEdit?.(item);
      } else if (action.type === ProjectListCardActionEnum.Delete) {
        onDelete?.(item);
      }
    },
    [item, onDelete, onEdit],
  );

  return (
    <ProjectListCardShell
      title={item.name}
      avatar=""
      name=""
      content={item.description || ''}
      icon={item.icon}
      defaultIcon={agentImage}
      onClick={onClick ? () => onClick(item) : undefined}
      titleAction={
        <CustomPopover list={actionList} onClick={handleClickMore}>
          <Button
            size="small"
            type="text"
            className={cx(styles.moreBtn)}
            icon={<ICON_MORE />}
          />
        </CustomPopover>
      }
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
    />
  );
};

export default ProjectListCard;
