import pluginIcon from '@/assets/images/plugin_image.png';
import workflowIcon from '@/assets/images/workflow_image.png';
import { dict } from '@/services/i18nRuntime';
import {
  apiDeleteResourceGroup,
  apiResourceGroupList,
} from '@/services/library';
import { ComponentTypeEnum } from '@/types/enums/space';
import type { ResourceGroupInfo } from '@/types/interfaces/library';
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';
import { Dropdown, Modal, Spin, Typography } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface HorizontalGroupListProps {
  spaceId: number;
  value: number; // 当前选中的分组 ID，0 表示“全部”
  onChange: (groupId: number, groupType?: string) => void;
  componentList?: any[]; // 用于组件统计（可选）
  className?: string;
  filterType?: ComponentTypeEnum;
  refreshTrigger?: number;
  onEdit: (group: ResourceGroupInfo) => void;
  onDeleteSuccess?: () => void;
}

const HorizontalGroupList: React.FC<HorizontalGroupListProps> = ({
  spaceId,
  value,
  onChange,
  className,
  filterType = ComponentTypeEnum.All_Type,
  refreshTrigger,
  onEdit,
  onDeleteSuccess,
}) => {
  const [groupList, setGroupList] = useState<ResourceGroupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const lastParamsRef = useRef<{ spaceId: number; types: string[] } | null>(
    null,
  );
  const lastRequestTimeRef = useRef<number>(0);

  // 根据筛选类型获取分组列表
  const fetchGroupList = React.useCallback(
    (targetGroupId?: number, force = false) => {
      if (!spaceId) return;

      let typesParam: string[] = [];
      if (filterType === ComponentTypeEnum.All_Type) {
        typesParam = [ComponentTypeEnum.Plugin, ComponentTypeEnum.Workflow];
      } else if (filterType === ComponentTypeEnum.Workflow) {
        typesParam = [ComponentTypeEnum.Workflow];
      } else {
        typesParam = [ComponentTypeEnum.Plugin];
      }

      const now = Date.now();
      const timeDiff = now - lastRequestTimeRef.current;

      // 高频防抖去重
      if (
        !targetGroupId &&
        !force &&
        timeDiff < 100 &&
        lastParamsRef.current &&
        lastParamsRef.current.spaceId === spaceId &&
        JSON.stringify(lastParamsRef.current.types) ===
          JSON.stringify(typesParam)
      ) {
        return;
      }

      lastParamsRef.current = { spaceId, types: typesParam };
      lastRequestTimeRef.current = now;
      setLoading(true);

      apiResourceGroupList({ spaceId, types: typesParam })
        .then((res) => {
          const list = res.data || [];
          setGroupList(list);
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
        });
    },
    [spaceId, filterType],
  );

  useEffect(() => {
    fetchGroupList();
  }, [fetchGroupList, refreshTrigger]);

  const handleDelete = React.useCallback(
    (group: ResourceGroupInfo, e: React.MouseEvent) => {
      e.stopPropagation();
      Modal.confirm({
        title: dict('PC.Common.Global.confirmDelete'),
        content: dict(
          'PC.Pages.SpaceResource.LeftGroupList.deleteConfirmContent',
        ).replace('{0}', String(group.name)),
        okText: dict('PC.Common.Global.confirm'),
        cancelText: dict('PC.Common.Global.cancel'),
        okButtonProps: { danger: true },
        onOk: () => {
          return apiDeleteResourceGroup(group.id)
            .then((res) => {
              if (res.success) {
                fetchGroupList(undefined, true);
                if (value === group.id) {
                  onChange(0, undefined);
                }
                onDeleteSuccess?.();
              }
            })
            .catch(() => {});
        },
      });
    },
    [value, onChange, fetchGroupList, onDeleteSuccess],
  );

  // 如果没有创建自定义分组，组件不占高度，直接渲染 null
  if (groupList.length === 0) {
    return null;
  }

  return (
    <div className={cx(styles['group-list-container'], className)}>
      <Spin spinning={loading}>
        <div className={cx(styles['group-grid'])}>
          {groupList.map((group) => {
            const isActive = value === group.id;
            const menuItems = [
              {
                key: 'edit',
                label: dict('PC.Common.Global.edit'),
                icon: <EditOutlined />,
                onClick: (info: any) => {
                  info.domEvent.stopPropagation();
                  onEdit(group);
                },
              },
              {
                key: 'delete',
                label: dict('PC.Common.Global.delete'),
                danger: true,
                icon: <DeleteOutlined />,
                onClick: (info: any) => {
                  info.domEvent.stopPropagation();
                  handleDelete(group, info.domEvent);
                },
              },
            ];

            return (
              <div
                key={group.id}
                className={cx(styles['group-card'], {
                  [styles.active]: isActive,
                })}
                onClick={() => {
                  if (isActive) {
                    onChange(0, undefined); // 再次点击取消选中，切换回“全部”
                  } else {
                    onChange(group.id, group.type);
                  }
                }}
              >
                <div className={cx(styles.icon)}>
                  <img
                    src={
                      group.icon ||
                      (group.type === ComponentTypeEnum.Workflow
                        ? workflowIcon
                        : pluginIcon)
                    }
                    alt={group.name}
                  />
                </div>
                <div className={cx(styles.info)}>
                  <div className={cx(styles['name-wrap'])}>
                    <Typography.Text
                      className={cx(styles.name)}
                      ellipsis={{
                        tooltip: group.name,
                      }}
                    >
                      {group.name}
                    </Typography.Text>
                    <span className={cx(styles['count-text'])}>
                      {dict(
                        'PC.Pages.SpaceResource.LeftGroupList.unitCount',
                      ).replace('{0}', String(group.toolCount || 0))}
                    </span>
                  </div>
                  {(group.description || menuItems.length > 0) && (
                    <div className={cx(styles['desc-wrap'])}>
                      <Typography.Paragraph
                        className={cx(styles.description)}
                        ellipsis={{
                          rows: 1,
                          tooltip: group.description,
                        }}
                      >
                        {group.description || ' '}
                      </Typography.Paragraph>
                      <Dropdown
                        menu={{ items: menuItems }}
                        trigger={['hover']}
                        placement="bottom"
                      >
                        <div
                          className={cx(styles['more-action-wrap'])}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EllipsisOutlined
                            className={cx(styles['more-icon'])}
                          />
                        </div>
                      </Dropdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Spin>
    </div>
  );
};

export default HorizontalGroupList;
