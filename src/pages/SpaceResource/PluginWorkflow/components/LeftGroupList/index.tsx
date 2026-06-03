import pluginIcon from '@/assets/images/plugin_image.png';
import workflowIcon from '@/assets/images/workflow_image.png';
import AgentType from '@/components/base/AgentType';
import type { SelectionListItem } from '@/components/SelectionList';
import SelectionList from '@/components/SelectionList';
import { dict } from '@/services/i18nRuntime';
import {
  apiDeleteResourceGroup,
  apiGetResourceGroup,
  apiResourceGroupList,
} from '@/services/library';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { ComponentTypeEnum } from '@/types/enums/space';
import type {
  ComponentInfo,
  ResourceGroupInfo,
} from '@/types/interfaces/library';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Modal, Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'umi';
import GroupEditModal from './components/GroupEditModal';
import styles from './index.less';

const cx = classNames.bind(styles);

interface LeftGroupListProps {
  spaceId: number;
  value: number;
  onChange: (groupId: number, groupType?: string) => void;
  componentList?: ComponentInfo[];
  className?: string;
  filterType?: ComponentTypeEnum;
}

const LeftGroupList: React.FC<LeftGroupListProps> = ({
  spaceId,
  value,
  onChange,
  componentList = [],
  className,
  filterType = ComponentTypeEnum.All_Type,
}) => {
  const location = useLocation();
  const lastParamsRef = useRef<{ spaceId: number; types: string[] } | null>(
    null,
  );
  const lastRequestTimeRef = useRef<number>(0);
  const [groupList, setGroupList] = useState<ResourceGroupInfo[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingGroup, setEditingGroup] = useState<ResourceGroupInfo | null>(
    null,
  );

  // 根据顶部筛选类型动态拉取资源分组列表
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

      // 高频防抖去重判定：只有在极短时间间隔（如小于 100ms）内，且参数完全一致时，才判定为 React 渲染/挂载阶段的重复调用，予以拦截去重
      // 如果时间间隔超过 100ms，说明是一次全新的人工或独立业务刷新，哪怕参数完全相同也必须放行以保证数据的准确触发
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
      setGroupLoading(true);

      apiResourceGroupList({ spaceId, types: typesParam })
        .then((res) => {
          const list = res.data || [];
          setGroupList(list);

          if (targetGroupId) {
            setTimeout(() => {
              const element = document.querySelector(
                `[data-value="${targetGroupId}"]`,
              );
              if (element) {
                element.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest',
                });
              }
            }, 100);
          }
        })
        .catch(() => {
          // 静默降级以维持用户体验
        })
        .finally(() => {
          setGroupLoading(false);
        });
    },
    [spaceId, filterType],
  );

  useEffect(() => {
    fetchGroupList();
  }, [fetchGroupList, location.key]);

  const isFirstLoadRef = useRef(true);

  // 切换空间或筛选类型时，重置首次加载标记，避免在首次数据填充时造成冗余请求
  useEffect(() => {
    isFirstLoadRef.current = true;
  }, [spaceId, filterType]);

  // 深度监听组件列表的改变，以高灵敏度联动刷新左侧分组列表的 toolCount 及分组信息
  useEffect(() => {
    if (!componentList || componentList.length === 0) {
      return;
    }

    if (isFirstLoadRef.current) {
      // 首次获取到非空组件列表，说明是页面初始化的首批组件数据加载完成。
      // 因为此时分组列表已在初始化的 useEffect (line 108) 中加载完毕，所以这里不需要重复拉取，仅标记已完成首次加载即可。
      isFirstLoadRef.current = false;
      return;
    }

    // 之后的每一次组件列表的非空变更（比如移入/移出/删除组件等导致的列表重载），都必须联动强刷分组列表，保证 toolCount 与分组状态同步
    fetchGroupList(undefined, true);
  }, [componentList, fetchGroupList]);

  // 高灵敏实时统计每个资源分组下组件的物理真实总数
  const groupCounts = useMemo<Record<number, number>>(() => {
    const map: Record<number, number> = {};
    componentList.forEach((item) => {
      if (item.groupId !== undefined && item.groupId !== null) {
        map[item.groupId] = (map[item.groupId] || 0) + 1;
      }
    });
    return map;
  }, [componentList]);

  // 动态构建 SelectionList 所需的卡片选项数据
  const listOptions = useMemo<SelectionListItem<number>[]>(() => {
    const groupOptions = groupList.map<SelectionListItem<number>>((group) => ({
      value: group.id,
      label: group.name,
      icon:
        group.icon ||
        (group.type === ComponentTypeEnum.Workflow ? workflowIcon : pluginIcon),
      description: group.description || '',
      extra: (
        <span className={cx(styles['extra-wrap'])}>
          <span className={cx(styles['count-text'])}>
            {dict('PC.Pages.SpaceResource.LeftGroupList.unitCount').replace(
              '{0}',
              String(group.toolCount || 0),
            )}
          </span>
          <AgentType
            type={
              group.type === ComponentTypeEnum.Workflow
                ? AgentComponentTypeEnum.Workflow
                : AgentComponentTypeEnum.Plugin
            }
          />
        </span>
      ),
      allowEdit: true,
      allowDelete: true,
    }));

    return groupOptions;
  }, [groupList, componentList, groupCounts]);

  const handleOpenAdd = React.useCallback(() => {
    setModalMode('add');
    setEditingGroup(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = React.useCallback(
    (item: SelectionListItem<number>, e: React.MouseEvent) => {
      e.stopPropagation();
      const groupId = item.value;

      setGroupLoading(true);
      apiGetResourceGroup(groupId)
        .then((res) => {
          if (res.success && res.data) {
            setModalMode('edit');
            setEditingGroup(res.data);
            setIsModalOpen(true);
          }
        })
        .catch(() => {
          // 静默降级，由全局拦截器做报错提醒
        })
        .finally(() => {
          setGroupLoading(false);
        });
    },
    [],
  );

  const handleDelete = React.useCallback(
    (item: SelectionListItem<number>, e: React.MouseEvent) => {
      e.stopPropagation();
      Modal.confirm({
        title: dict('PC.Common.Global.confirmDelete'),
        content: dict(
          'PC.Pages.SpaceResource.LeftGroupList.deleteConfirmContent',
        ).replace('{0}', String(item.label)),
        okText: dict('PC.Common.Global.confirm'),
        cancelText: dict('PC.Common.Global.cancel'),
        okButtonProps: { danger: true },
        onOk: () => {
          return apiDeleteResourceGroup(item.value)
            .then((res) => {
              if (res.success) {
                fetchGroupList(undefined, true);
                if (value === item.value) {
                  onChange(0, undefined);
                }
              }
            })
            .catch(() => {
              // 托管给全局拦截器报错，这里静默降级
            });
        },
      });
    },
    [value, onChange, fetchGroupList],
  );

  const titleNode = useMemo(() => {
    return (
      <div className={cx(styles['selection-header-wrap'])}>
        <span>{dict('PC.Constants.Space.group')}</span>
        <Button
          type="link"
          icon={<PlusOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenAdd();
          }}
        >
          {dict('PC.Pages.IMChannel.Index.add')}
        </Button>
      </div>
    );
  }, [handleOpenAdd]);

  return (
    <div className={cx(styles['sidebar-container'], className)}>
      <Spin spinning={groupLoading}>
        <SelectionList
          title={titleNode}
          list={listOptions}
          value={value}
          onChange={(val) => {
            if (val === value) {
              onChange(0, undefined);
            } else {
              const selectedGroup = groupList.find((g) => g.id === val);
              onChange(val, selectedGroup?.type);
            }
          }}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          emptyText={dict('PC.Common.Global.noData')}
        />
      </Spin>
      <GroupEditModal
        open={isModalOpen}
        mode={modalMode}
        editingGroup={editingGroup}
        spaceId={spaceId}
        filterType={filterType}
        onCancel={() => setIsModalOpen(false)}
        onSuccess={(targetGroupId) => {
          setIsModalOpen(false);
          fetchGroupList(targetGroupId, true); // force 参数强刷列表
        }}
      />
    </div>
  );
};

export default LeftGroupList;
