import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { modalConfirm } from '@/utils/ant-custom';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import type {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button, Empty, message, Space, Switch, Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import type { ReactNode } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useModel, useRequest } from 'umi';
import { DragHandle, Row } from '../components/DraggableTableRow';
import {
  apiDeleteResource,
  apiGetResourceList,
  apiUpdateResource,
  apiUpdateResourceSort,
} from '../services/permission-resources';
import {
  ResourceEnabledEnum,
  ResourceSourceEnum,
  ResourceTypeEnum,
  type GetResourceListParams,
  type ResourceInfo,
  type ResourceTreeNode,
  type UpdateResourceParams,
  type UpdateResourceSortItem,
} from '../types/permission-resources';
import ResourceFormModal from './components/ResourceFormModal';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 权限资源管理页面
 * 管理系统中的模块、菜单、接口、组件等权限资源
 */
const PermissionResources: React.FC = () => {
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [editingResource, setEditingResource] = useState<ResourceInfo | null>();
  const [parentResource, setParentResource] =
    useState<ResourceTreeNode | null>();
  const [updateVisibleLoadingMap, setUpdateVisibleLoadingMap] = useState<
    Record<number, boolean>
  >({});

  // 拖拽排序的数据源
  const [draggableData, setDraggableData] = useState<
    (ResourceTreeNode & { key: number })[]
  >([]);

  // 新增时，默认排序索引，默认1
  const [defaultSortIndex, setDefaultSortIndex] = useState<number>(1);

  // 控制表格行的展开状态，避免使用默认的展开图标列，改为在名称列中自定义展开图标
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  // ProTable 的 ref
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();

  // 标记是否正在拖拽，用于防止 postData 覆盖拖拽后的数据
  const isDraggingRef = useRef<boolean>(false);
  // 保存拖拽前的原始数据，用于接口失败时恢复
  const originalDataRef = useRef<(ResourceTreeNode & { key: number })[] | null>(
    null,
  );

  // 权限检查
  const { hasPermissionByMenuCode } = useModel('menuModel');

  /**
   * ProTable 的 request 函数
   * 根据表单查询条件获取权限资源列表
   */
  const request = useCallback(async (params: any) => {
    const { name, code } = params;
    const queryParams: GetResourceListParams = {
      name: name || undefined,
      code: code || undefined,
    };
    try {
      const res = await apiGetResourceList(queryParams);
      // 如果请求失败或数据为空/null，返回空数组并清空 draggableData
      if (res?.code !== SUCCESS_CODE || !res?.data) {
        // 立即清空 draggableData，确保表格显示空状态
        setDraggableData([]);
        return {
          data: [],
          total: 0,
          success: true, // 即使没有数据，也返回 success: true，让 ProTable 正常渲染空状态
        };
      }
      // 转换数据格式，为树形数据添加 key 字段，并过滤掉根节点（id为0）
      const transformData = (data: ResourceTreeNode[]): any[] => {
        return data
          .filter((item) => item.id !== 0) // 过滤掉根节点
          .map((item) => ({
            ...item,
            key: item.id,
            children: item.children?.length
              ? transformData(item.children)
              : undefined,
          }));
      };
      let processedData: (ResourceTreeNode & { key: number })[];
      // 如果第一个节点是根节点（id为0），则只返回其子节点
      if (res.data.length === 1 && res.data[0].id === 0) {
        const rootNode = res.data[0];
        processedData = rootNode.children?.length
          ? transformData(rootNode.children)
          : [];
      } else {
        // 否则过滤掉所有 id 为 0 的节点
        processedData = transformData(res.data);
      }
      return {
        data: processedData,
        total: processedData.length,
        success: true,
      };
    } catch (error) {
      console.error('查询权限资源列表失败', error);
      // 发生错误时也清空 draggableData
      setDraggableData([]);
      return {
        data: [],
        total: 0,
        success: false,
      };
    }
  }, []);

  /**
   * 重置处理
   */
  const handleReset = useCallback(() => {
    // 重置到默认值，包括表单
    actionRef.current?.reset?.();
  }, []);

  // 监听 location.state 变化
  // 当 state 中存在 _t 变量时，说明是通过菜单切换过来的，需要清空 query 参数
  useEffect(() => {
    handleReset();
  }, [location.state, handleReset]);

  // 删除资源
  const { run: runDelete } = useRequest(apiDeleteResource, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('删除成功');
      actionRef.current?.reload();
    },
  });

  // 更新资源是否显示
  const { run: runUpdateResource } = useRequest(apiUpdateResource, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      actionRef.current?.reload();
    },
  });

  // 处理更新资源是否显示（手动管理 loading 状态）
  const handleUpdateVisible = async (params: UpdateResourceParams) => {
    setUpdateVisibleLoadingMap((prev) => ({ ...prev, [params.id]: true }));
    try {
      await runUpdateResource(params);
    } finally {
      setTimeout(() => {
        setUpdateVisibleLoadingMap((prev) => ({ ...prev, [params.id]: false }));
      }, 300);
    }
  };

  // 处理编辑
  const handleEdit = (resource: ResourceTreeNode) => {
    // 将 ResourceTreeNode 转换为 ResourceInfo
    const resourceInfo: ResourceInfo = {
      id: resource.id,
      code: resource.code || '',
      name: resource.name || '',
      description: resource.description,
      source: resource.source || ResourceSourceEnum.SystemBuiltIn,
      type: resource.type || ResourceTypeEnum.Module,
      parentId: resource.parentId,
      path: resource.path,
      sortIndex: resource.sortIndex || 0,
      status: resource.status,
    };
    setEditingResource(resourceInfo);
    setIsEdit(true);
    setModalOpen(true);
  };

  // 处理删除确认
  const handleDeleteConfirm = (resource: ResourceTreeNode) => {
    modalConfirm('删除资源', `确认删除资源 "${resource.name}" 吗？`, () => {
      runDelete(resource?.id);
      return new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
    });
  };

  // 处理新增
  const handleAdd = () => {
    setEditingResource(null);
    setParentResource(null);
    setIsEdit(false);
    setModalOpen(true);
    setDefaultSortIndex((draggableData?.length || 0) + 1);
  };

  // 处理新增子资源
  const handleAddChild = (parentResource: ResourceTreeNode) => {
    setEditingResource(null);
    setParentResource(parentResource);
    setIsEdit(false);
    setModalOpen(true);
    setDefaultSortIndex((parentResource?.children?.length || 0) + 1);
  };

  // 处理Modal关闭
  const handleModalCancel = () => {
    setModalOpen(false);
    setEditingResource(null);
    setParentResource(null);
    setDefaultSortIndex(1);
  };

  // 处理Modal成功
  const handleModalSuccess = () => {
    handleModalCancel();
    actionRef.current?.reload();
  };

  // 获取资源类型显示文本
  const getResourceTypeText = (type?: ResourceTypeEnum): string => {
    if (type === ResourceTypeEnum.Module) {
      return '模块';
    } else {
      return '组件';
    }
  };

  const handleExpand = (
    expanded: boolean,
    record: ResourceTreeNode & { key: number },
  ) => {
    setExpandedRowKeys((prevKeys) => {
      const key = record.key;
      if (expanded) {
        // 展开：如果不存在则添加
        return prevKeys.includes(key) ? prevKeys : [...prevKeys, key];
      }
      // 收起：移除对应 key
      return prevKeys.filter((k) => k !== key);
    });
  };

  // 更新资源排序
  const { run: runUpdateResourceSort } = useRequest(apiUpdateResourceSort, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('排序更新成功');
      // 标记拖拽完成，允许 postData 正常同步数据
      isDraggingRef.current = false;
      // 清空原始数据引用
      originalDataRef.current = null;
      // 不调用 reload()，因为 draggableData 已经更新，表格会通过 dataSource 自动更新
      // 这样可以避免拖拽的行先回到原位置再移动到新位置的问题
    },
    onError: () => {
      // 标记拖拽完成
      isDraggingRef.current = false;
      // 接口失败时，恢复原始数据
      if (originalDataRef.current) {
        setDraggableData(originalDataRef.current);
        originalDataRef.current = null;
      } else {
        // 如果没有保存原始数据，重新从服务器获取
        actionRef.current?.reload();
      }
    },
  });

  // 递归查找节点
  const findNodeInTree = (
    data: (ResourceTreeNode & { key: number })[],
    key: number,
  ): (ResourceTreeNode & { key: number }) | null => {
    for (const item of data) {
      if (item.key === key) {
        return item;
      }
      if (item.children && item.children.length > 0) {
        const found = findNodeInTree(
          item.children as (ResourceTreeNode & { key: number })[],
          key,
        );
        if (found) return found;
      }
    }
    return null;
  };

  // 从树中移除节点（不包含子节点）
  const removeNodeFromTree = (
    data: (ResourceTreeNode & { key: number })[],
    key: number,
  ): {
    newData: (ResourceTreeNode & { key: number })[];
    removedNode: (ResourceTreeNode & { key: number }) | null;
  } => {
    for (let i = 0; i < data.length; i++) {
      if (data[i].key === key) {
        const removed = { ...data[i] };
        // 移除子节点，因为移动时只移动当前节点
        removed.children = undefined;
        return {
          newData: [...data.slice(0, i), ...data.slice(i + 1)],
          removedNode: removed,
        };
      }
      const children = data[i].children as
        | (ResourceTreeNode & { key: number })[]
        | undefined;
      if (children && children.length > 0) {
        const result = removeNodeFromTree(children, key);
        if (result.removedNode) {
          return {
            newData: [
              ...data.slice(0, i),
              {
                ...data[i],
                children: result.newData,
              },
              ...data.slice(i + 1),
            ],
            removedNode: result.removedNode,
          };
        }
      }
    }
    return { newData: data, removedNode: null };
  };

  // 获取目标层级的所有节点（扁平化，统一处理 parentId：0 和 undefined 都表示根层级）
  const getLevelItems = (
    data: (ResourceTreeNode & { key: number })[],
    parentId: number | undefined,
  ): (ResourceTreeNode & { key: number })[] => {
    // 统一处理：0 和 undefined 都表示根层级
    const normalizedParentId = parentId === 0 ? undefined : parentId;

    const result: (ResourceTreeNode & { key: number })[] = [];
    const traverse = (items: (ResourceTreeNode & { key: number })[]) => {
      items.forEach((item) => {
        // 统一比较：将 item.parentId 的 0 也转换为 undefined
        const itemParentId = item.parentId === 0 ? undefined : item.parentId;
        if (itemParentId === normalizedParentId) {
          result.push(item);
        }
        if (item.children && item.children.length > 0) {
          traverse(item.children as (ResourceTreeNode & { key: number })[]);
        }
      });
    };
    traverse(data);
    return result;
  };

  // 在指定层级的末尾插入节点
  const insertNodeAtLevelEnd = (
    data: (ResourceTreeNode & { key: number })[],
    node: ResourceTreeNode & { key: number },
    parentId: number | undefined,
  ): (ResourceTreeNode & { key: number })[] => {
    // 如果是根层级（parentId 为 undefined）
    if (parentId === undefined) {
      return [...data, node];
    }

    // 递归查找父节点
    return data.map((item) => {
      if (item.id === parentId) {
        const children =
          (item.children as (ResourceTreeNode & { key: number })[]) || [];
        return {
          ...item,
          children: [...children, node],
        };
      }
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: insertNodeAtLevelEnd(
            item.children as (ResourceTreeNode & { key: number })[],
            node,
            parentId,
          ),
        };
      }
      return item;
    });
  };

  // 在指定层级的指定索引位置插入节点
  const insertNodeAtLevelIndex = (
    data: (ResourceTreeNode & { key: number })[],
    node: ResourceTreeNode & { key: number },
    parentId: number | undefined,
    targetIndex: number,
  ): (ResourceTreeNode & { key: number })[] => {
    // 如果是根层级（parentId 为 undefined）
    if (parentId === undefined) {
      return [...data.slice(0, targetIndex), node, ...data.slice(targetIndex)];
    }

    // 递归查找父节点
    return data.map((item) => {
      if (item.id === parentId) {
        const children =
          (item.children as (ResourceTreeNode & { key: number })[]) || [];
        return {
          ...item,
          children: [
            ...children.slice(0, targetIndex),
            node,
            ...children.slice(targetIndex),
          ],
        };
      }
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: insertNodeAtLevelIndex(
            item.children as (ResourceTreeNode & { key: number })[],
            node,
            parentId,
            targetIndex,
          ),
        };
      }
      return item;
    });
  };

  // 在指定层级的目标位置插入节点
  const insertNodeAtLevel = (
    data: (ResourceTreeNode & { key: number })[],
    node: ResourceTreeNode & { key: number },
    targetKey: number,
    newParentId: number | undefined,
    originalActiveKey?: number, // 原始被拖拽节点的 key，用于判断拖拽方向
  ): (ResourceTreeNode & { key: number })[] => {
    // 更新节点的 parentId（统一处理：0 转换为 undefined）
    const normalizedParentId = newParentId === 0 ? undefined : newParentId;
    const updatedNode = {
      ...node,
      parentId: normalizedParentId,
    };

    // 获取目标层级的所有节点（统一处理 parentId）
    const levelItems = getLevelItems(data, normalizedParentId);
    const targetIndex = levelItems.findIndex((item) => item.key === targetKey);

    if (targetIndex === -1) {
      // 如果找不到目标节点，追加到层级末尾
      return insertNodeAtLevelEnd(data, updatedNode, normalizedParentId);
    }

    // 判断插入位置：
    // 1. 如果 originalActiveKey 在目标层级中，根据位置关系判断（同层级拖拽）
    //    - 如果 originalIndex < targetIndex（向下拖拽），插入到目标节点之后（targetIndex + 1）
    //    - 如果 originalIndex > targetIndex（向上拖拽），插入到目标节点之前（targetIndex）
    // 2. 如果 originalActiveKey 不在目标层级（跨层级拖拽），插入到目标节点的位置（targetIndex）
    let insertIndex = targetIndex;
    if (originalActiveKey !== undefined) {
      const originalIndex = levelItems.findIndex(
        (item) => item.key === originalActiveKey,
      );
      if (originalIndex !== -1) {
        // 原始节点也在目标层级中（同层级拖拽），根据位置关系判断
        if (originalIndex < targetIndex) {
          // 向下拖拽，插入到目标节点之后
          insertIndex = targetIndex + 1;
        } else {
          // 向上拖拽，插入到目标节点之前
          insertIndex = targetIndex;
        }
      } else {
        // 原始节点不在目标层级（跨层级拖拽），插入到目标节点的位置
        insertIndex = targetIndex;
      }
    } else {
      // 没有原始节点信息，插入到目标节点的位置
      insertIndex = targetIndex;
    }

    // 在目标位置插入节点
    return insertNodeAtLevelIndex(
      data,
      updatedNode,
      normalizedParentId,
      insertIndex,
    );
  };

  // 更新同层级的数据（使用 arrayMove）
  const updateSameLevelData = (
    data: (ResourceTreeNode & { key: number })[],
    activeKey: number,
    overKey: number,
    parentId: number | undefined,
  ): (ResourceTreeNode & { key: number })[] => {
    // 如果是根层级（parentId 为 undefined 或 0）
    if (parentId === undefined || parentId === 0) {
      const activeIndex = data.findIndex((item) => item.key === activeKey);
      const overIndex = data.findIndex((item) => item.key === overKey);
      if (activeIndex !== -1 && overIndex !== -1) {
        return arrayMove(data, activeIndex, overIndex);
      }
      return data;
    }

    // 递归查找父节点
    return data.map((item) => {
      // 如果当前节点就是父节点
      if (item.id === parentId) {
        const children =
          (item.children as (ResourceTreeNode & { key: number })[]) || [];
        const activeIndex = children.findIndex(
          (child) => child.key === activeKey,
        );
        const overIndex = children.findIndex((child) => child.key === overKey);
        if (activeIndex !== -1 && overIndex !== -1) {
          return {
            ...item,
            children: arrayMove(children, activeIndex, overIndex),
          };
        }
        return item;
      }
      // 递归处理子节点
      if (item.children && item.children.length > 0) {
        const updatedChildren = updateSameLevelData(
          item.children as (ResourceTreeNode & { key: number })[],
          activeKey,
          overKey,
          parentId,
        );
        // 只有当子节点发生变化时才更新
        if (updatedChildren !== item.children) {
          return {
            ...item,
            children: updatedChildren,
          };
        }
      }
      return item;
    });
  };

  // 递归更新树形数据（支持跨层级移动）
  const updateTreeData = (
    data: (ResourceTreeNode & { key: number })[],
    activeKey: number,
    overKey: number,
  ): (ResourceTreeNode & { key: number })[] => {
    // 找到原始节点和目标节点
    const activeItem = findNodeInTree(data, activeKey);
    const overItem = findNodeInTree(data, overKey);

    if (!activeItem || !overItem) {
      return data;
    }

    const originalParentId = activeItem.parentId ?? 0;
    const newParentId = overItem.parentId ?? 0;

    // 如果是同层级拖拽，直接使用 arrayMove
    if (originalParentId === newParentId) {
      return updateSameLevelData(
        data,
        activeKey,
        overKey,
        originalParentId === 0 ? undefined : originalParentId,
      );
    }

    // 跨层级拖拽：先移除，再插入
    const { newData: dataWithoutActive, removedNode } = removeNodeFromTree(
      data,
      activeKey,
    );

    if (!removedNode) {
      return data;
    }

    // 统一处理 newParentId：0 转换为 undefined
    const normalizedNewParentId = newParentId === 0 ? undefined : newParentId;

    // 在目标位置插入节点（传递原始 activeKey 用于判断拖拽方向）
    return insertNodeAtLevel(
      dataWithoutActive,
      removedNode,
      overKey,
      normalizedNewParentId,
      activeKey, // 传递原始 activeKey
    );
  };

  // 获取同一层级的所有节点（统一处理 parentId：0 和 undefined 都表示根层级）
  const getSameLevelItems = (
    data: (ResourceTreeNode & { key: number })[],
    parentId: number | undefined,
  ): (ResourceTreeNode & { key: number })[] => {
    // 统一处理：0 和 undefined 都表示根层级
    const normalizedParentId = parentId === 0 ? undefined : parentId;

    const result: (ResourceTreeNode & { key: number })[] = [];
    const traverse = (items: (ResourceTreeNode & { key: number })[]) => {
      items.forEach((item) => {
        // 统一比较：将 item.parentId 的 0 也转换为 undefined
        const itemParentId = item.parentId === 0 ? undefined : item.parentId;
        if (itemParentId === normalizedParentId) {
          result.push(item);
        }
        if (item.children && item.children.length > 0) {
          traverse(item.children as (ResourceTreeNode & { key: number })[]);
        }
      });
    };
    traverse(data);
    return result;
  };

  // 获取所有节点的 key（包括子节点）
  const getAllKeys = (
    data: (ResourceTreeNode & { key: number })[],
  ): string[] => {
    const result: string[] = [];
    const traverse = (items: (ResourceTreeNode & { key: number })[]) => {
      items.forEach((item) => {
        result.push(String(item.key));
        if (item.children && item.children.length > 0) {
          traverse(item.children as (ResourceTreeNode & { key: number })[]);
        }
      });
    };
    traverse(data);
    return result;
  };

  // 处理拖拽结束
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      isDraggingRef.current = false;
      return;
    }

    const activeKey = Number(active.id);
    const overKey = Number(over.id);

    const activeItem = findNodeInTree(draggableData, activeKey);
    const overItem = findNodeInTree(draggableData, overKey);

    if (!activeItem || !overItem) {
      isDraggingRef.current = false;
      return;
    }

    // 标记正在拖拽，防止 postData 覆盖数据
    isDraggingRef.current = true;

    // 保存原始数据到 ref，用于错误时恢复（使用深拷贝，因为树形结构）
    originalDataRef.current = JSON.parse(JSON.stringify(draggableData));

    // 保存原始 parentId，用于判断是否变更层级
    // 注意：这里保持原始值，不进行转换，因为 API 需要知道真实的 parentId 值
    const originalParentId = activeItem.parentId ?? 0;
    const newParentId = overItem.parentId ?? 0;

    // 更新树形数据
    const newData = updateTreeData(draggableData, activeKey, overKey);

    // 验证节点是否被正确插入（在更新状态前先验证）
    const normalizedNewParentId = newParentId === 0 ? undefined : newParentId;
    const targetLevelItems = getSameLevelItems(newData, normalizedNewParentId);
    const hasActive = targetLevelItems.some(
      (item: ResourceTreeNode & { key: number }) => item.key === activeKey,
    );

    if (!hasActive) {
      // 如果节点没有被正确插入，恢复原数据并提示错误
      message.error('拖拽失败，请重试');
      isDraggingRef.current = false;
      originalDataRef.current = null;
      return;
    }

    // 节点已正确插入，更新状态
    setDraggableData(newData);

    // 收集所有需要更新的资源
    const updateItems: UpdateResourceSortItem[] = [];

    // 如果层级发生了变化，还需要更新原层级的资源排序
    if (originalParentId !== newParentId) {
      // 获取原层级的资源（排除被移动的节点）
      const normalizedOriginalParentId =
        originalParentId === 0 ? undefined : originalParentId;
      const originalLevelItems = getSameLevelItems(
        newData,
        normalizedOriginalParentId,
      ).filter((item) => item.key !== activeKey);

      // 更新原层级的资源排序
      originalLevelItems.forEach((item, index) => {
        updateItems.push({
          id: item.id,
          name: item.name || '',
          // 同一层级内排序，不传递 parentId
          sortIndex: index + 1,
        });
      });
    }

    // 更新目标层级的资源排序
    targetLevelItems.forEach((item, index) => {
      const updateItem: UpdateResourceSortItem = {
        id: item.id,
        name: item.name || '',
        sortIndex: index + 1,
      };

      // 只有被拖拽的资源且层级发生变化时，才传递 parentId
      // 根据 API 定义：parentId 为 0 表示根节点，不传则不修改层级
      if (item.key === activeKey && originalParentId !== newParentId) {
        // 层级发生变化，需要传递新的 parentId
        // 直接传递 newParentId（如果原来是 undefined，已经转换为 0）
        // 如果 newParentId 是 0，传递 0 表示根节点
        // 如果 newParentId 是其他数字，传递实际的 parentId
        updateItem.parentId = newParentId;
      }

      updateItems.push(updateItem);
    });

    // 批量更新资源排序
    if (updateItems.length > 0) {
      runUpdateResourceSort({
        items: updateItems,
      });
    }
  };

  /**
   * 计算节点在树中的层级深度
   */
  const getNodeLevel = useCallback(
    (
      data: (ResourceTreeNode & { key: number })[],
      targetKey: number,
      currentLevel: number = 0,
    ): number => {
      for (const node of data) {
        if (node.key === targetKey) {
          return currentLevel;
        }
        if (node.children && node.children.length > 0) {
          const found = getNodeLevel(
            node.children as (ResourceTreeNode & { key: number })[],
            targetKey,
            currentLevel + 1,
          );
          if (found !== -1) {
            return found;
          }
        }
      }
      return -1;
    },
    [],
  );

  // 定义表格列
  const columns: ProColumns<ResourceTreeNode & { key: number }>[] = [
    {
      title: '排序',
      key: 'sort',
      align: 'center',
      width: 80,
      fixed: 'left',
      hideInSearch: true,
      render: () => <DragHandle />,
    },
    {
      title: '资源名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      valueType: 'text',
      render: (_: ReactNode, record: ResourceTreeNode & { key: number }) => {
        const hasChildren =
          Array.isArray(record.children) && record.children.length > 0;
        const expanded = expandedRowKeys.includes(record.key);
        // 计算当前节点的层级
        const level = getNodeLevel(draggableData, record.key);
        // 根据层级计算缩进（每层 16px）
        const indent = level > 0 ? level * 16 : 0;

        return (
          <div
            className={cx('flex', 'items-center')}
            style={{ marginLeft: indent }}
          >
            {hasChildren ? (
              <DownOutlined
                className={cx(styles.icon, {
                  [styles['rotate-0']]: expanded,
                })}
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpand(!expanded, record);
                }}
              />
            ) : (
              // 无子节点时使用与箭头相同尺寸的占位元素，保证对齐
              <span className={cx(styles.icon, styles['icon-hidden'])} />
            )}
            <span className="text-ellipsis" title={record.name}>
              {record.name || '--'}
            </span>
          </div>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      hideInSearch: true,
      render: (_: ReactNode, record: ResourceTreeNode & { key: number }) => {
        const isModule = record.type === ResourceTypeEnum.Module;
        // 模块：使用绿色系
        // 组件：使用柔和的橙色系
        const backgroundColor = isModule ? '#f6ffed' : '#fff7e6';
        const color = isModule ? '#389e0d' : '#d46b08';
        const borderColor = isModule ? '#b7eb8f' : '#ffd591';
        return (
          <Tag
            style={{
              backgroundColor,
              color,
              borderColor,
            }}
          >
            {getResourceTypeText(record.type)}
          </Tag>
        );
      },
    },
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 200,
      valueType: 'text',
      ellipsis: true,
    },
    {
      title: '路由路径',
      dataIndex: 'path',
      key: 'path',
      hideInSearch: true,
      render: (_: ReactNode, record: ResourceTreeNode & { key: number }) =>
        record.path || '--',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 300,
      hideInSearch: true,
    },
    {
      title: '是否启用',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 100,
      fixed: 'right',
      hideInSearch: true,
      render: (_: ReactNode, record: ResourceTreeNode & { key: number }) => (
        <Tooltip
          title={
            record.source === ResourceSourceEnum.SystemBuiltIn
              ? '系统内置资源不能禁用'
              : ''
          }
        >
          <Switch
            checked={record.status === ResourceEnabledEnum.Enabled}
            disabled={record.source === ResourceSourceEnum.SystemBuiltIn}
            loading={updateVisibleLoadingMap[record.id] || false}
            checkedChildren="启用"
            unCheckedChildren="禁用"
            onChange={(checked) => {
              const newStatus = checked
                ? ResourceEnabledEnum.Enabled
                : ResourceEnabledEnum.Disabled;
              handleUpdateVisible({
                id: record.id,
                status: newStatus,
              });
            }}
          />
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      width: 200,
      fixed: 'right',
      hideInSearch: true,
      render: (_: ReactNode, record: ResourceTreeNode & { key: number }) => (
        <Space size={0}>
          {record.type !== ResourceTypeEnum.Component && (
            <Tooltip
              title={
                !hasPermissionByMenuCode(
                  'resource_manage',
                  'resource_manage_add',
                )
                  ? '无此资源权限'
                  : ''
              }
            >
              <Button
                type="link"
                size="small"
                disabled={
                  !hasPermissionByMenuCode(
                    'resource_manage',
                    'resource_manage_add',
                  )
                }
                onClick={() => handleAddChild(record)}
              >
                新增
              </Button>
            </Tooltip>
          )}
          {/* 系统内置的资源不能编辑和删除 */}
          <Tooltip
            title={
              record.source === ResourceSourceEnum.SystemBuiltIn
                ? '系统内置的资源不能编辑'
                : !hasPermissionByMenuCode(
                    'resource_manage',
                    'resource_manage_modify',
                  )
                ? '无此资源权限'
                : ''
            }
          >
            <Button
              type="link"
              size="small"
              disabled={
                record.source === ResourceSourceEnum.SystemBuiltIn ||
                !hasPermissionByMenuCode(
                  'resource_manage',
                  'resource_manage_modify',
                )
              }
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          </Tooltip>
          <Tooltip
            title={
              record.source === ResourceSourceEnum.SystemBuiltIn
                ? '系统内置的资源不能删除'
                : !hasPermissionByMenuCode(
                    'resource_manage',
                    'resource_manage_delete',
                  )
                ? '无此资源权限'
                : ''
            }
          >
            <Button
              type="link"
              size="small"
              disabled={
                !hasPermissionByMenuCode(
                  'resource_manage',
                  'resource_manage_delete',
                ) || record.source === ResourceSourceEnum.SystemBuiltIn
              }
              onClick={() => handleDeleteConfirm(record)}
            >
              删除
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <WorkspaceLayout
      title="权限资源管理"
      hideScroll
      rightSlot={
        hasPermissionByMenuCode('resource_manage', 'resource_manage_add') && (
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增资源
          </Button>
        )
      }
    >
      {/* 资源列表 */}
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={getAllKeys(draggableData)}
          strategy={verticalListSortingStrategy}
        >
          <XProTable<ResourceTreeNode & { key: number }>
            actionRef={actionRef}
            formRef={formRef}
            rowKey="key"
            columns={columns}
            request={request}
            dataSource={draggableData}
            pagination={false}
            scroll={{ x: 'max-content' }}
            showQueryButtons={hasPermissionByMenuCode(
              'resource_manage',
              'resource_manage_query',
            )}
            showIndex={false}
            onReset={handleReset}
            components={{
              body: {
                row: Row,
              },
            }}
            options={false}
            toolBarRender={false}
            // 关闭树形缩进对列宽的影响，保证拖拽手柄始终在同一列不偏移
            indentSize={0}
            // 关闭默认的展开图标列，避免影响第一列布局，展开逻辑由名称列中的图标控制
            expandable={{
              expandedRowKeys,
              onExpand: (expanded, record) =>
                handleExpand(
                  expanded,
                  record as ResourceTreeNode & { key: number },
                ),
              expandIcon: () => null,
              columnWidth: 0,
            }}
            // 防止展开/折叠时 Table 布局变动
            tableLayout="fixed"
            postData={(data: (ResourceTreeNode & { key: number })[]) => {
              // 同步数据到 draggableData 用于拖拽
              // 如果正在拖拽，不覆盖数据，保持拖拽后的位置
              if (!isDraggingRef.current) {
                setDraggableData(data || []);
              }
              // 始终返回数据，让 ProTable 正常渲染
              return data;
            }}
            locale={{
              emptyText: (
                <Empty
                  description="暂无资源数据"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className={cx(styles.empty)}
                />
              ),
            }}
          />
        </SortableContext>
      </DndContext>

      {/* 新增/编辑资源Modal */}
      <ResourceFormModal
        open={modalOpen}
        isEdit={isEdit}
        // 编辑时，资源信息
        resourceInfo={editingResource}
        // 新增时，父资源信息
        parentResource={parentResource}
        /** 新增时，默认排序索引，默认1 */
        defaultSortIndex={defaultSortIndex}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />
    </WorkspaceLayout>
  );
};

export default PermissionResources;
