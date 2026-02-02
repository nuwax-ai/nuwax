import { modalConfirm } from '@/utils/ant-custom';
import { DownOutlined, HolderOutlined, PlusOutlined } from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TableColumnsType } from 'antd';
import { Button, Empty, message, Space, Spin, Table, Tag } from 'antd';
import classNames from 'classnames';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useRequest } from 'umi';
import {
  apiDeleteMenu,
  apiGetMenuList,
  apiUpdateMenu,
} from '../services/menu-manage';
import type { MenuNodeInfo } from '../types/menu-manage';
import { MenuStatusEnum } from '../types/menu-manage';
import MenuFormModal from './components/MenuFormModal';
import styles from './index.less';

const cx = classNames.bind(styles);

// Row Context 用于传递拖拽相关的 listeners 和 setActivatorNodeRef
interface RowContextProps {
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  listeners?: SyntheticListenerMap;
}

const RowContext = React.createContext<RowContextProps>({});

// 拖拽手柄组件
const DragHandle: React.FC = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      style={{ cursor: 'move' }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

// 可拖拽的行组件
interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

const Row: React.FC<RowProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props['data-row-key'] });

  const style: React.CSSProperties = {
    ...props.style,
    ...(isDragging ? { position: 'relative' } : {}),
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const contextValue = useMemo<RowContextProps>(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners],
  );

  return (
    <RowContext.Provider value={contextValue}>
      <tr
        {...props}
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={classNames(props.className, isDragging && cx('draggingRow'))}
      />
    </RowContext.Provider>
  );
};

/**
 * 菜单管理页面
 * 管理系统菜单结构,未级菜单可关联资源码
 */
const MenuManage: React.FC = () => {
  const location = useLocation();

  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuNodeInfo | null>(null);
  const [parentMenu, setParentMenu] = useState<MenuNodeInfo | null>(null);
  const [deleteLoadingMap, setDeleteLoadingMap] = useState<
    Record<number, boolean>
  >({});
  // 拖拽排序的数据源
  const [draggableData, setDraggableData] = useState<
    (MenuNodeInfo & { key: number })[]
  >([]);

  // 根据条件查询菜单列表（树形结构）
  const {
    run: runGetMenuList,
    data: menuList,
    loading,
  } = useRequest(apiGetMenuList, {
    manual: true,
  });

  // 监听 location.state 变化
  // 当 state 中存在 _t 变量时，说明是通过菜单切换过来的，需要清空 query 参数
  useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      // 根据条件查询菜单列表（树形结构）
      runGetMenuList();
    }
  }, [location.state]);

  // 删除菜单
  const { run: runDelete } = useRequest(apiDeleteMenu, {
    manual: true,
    loadingDelay: 300,
    onBefore: (menuId: number) => {
      setDeleteLoadingMap((prev) => ({ ...prev, [menuId]: true }));
    },
    onSuccess: () => {
      message.success('删除成功');
      runGetMenuList();
    },
    onError: () => {
      message.error('删除失败');
    },
    onFinally: (menuId: number) => {
      setDeleteLoadingMap((prev) => ({ ...prev, [menuId]: false }));
    },
  });

  // 处理编辑
  const handleEdit = (menuInfo: MenuNodeInfo) => {
    setEditingMenu(menuInfo);
    setIsEdit(true);
    setModalOpen(true);
  };

  // 处理删除确认
  const handleDeleteConfirm = (menu: MenuNodeInfo) => {
    modalConfirm('删除菜单', `确认删除菜单 "${menu.name}" 吗？`, () => {
      runDelete(menu?.id);
      return new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
    });
  };

  // 处理新增
  const handleAdd = () => {
    setEditingMenu(null);
    setParentMenu(null);
    setIsEdit(false);
    setModalOpen(true);
  };

  // 处理新增子菜单
  const handleAddChild = (parentMenu: MenuNodeInfo) => {
    setEditingMenu(null);
    setParentMenu(parentMenu);
    setIsEdit(false);
    setModalOpen(true);
  };

  // 处理Modal关闭
  const handleModalCancel = () => {
    setModalOpen(false);
    setEditingMenu(null);
    setParentMenu(null);
  };

  // 处理Modal成功
  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingMenu(null);
    setParentMenu(null);
    runGetMenuList();
  };

  // 转换数据格式，为树形数据添加 key 字段，并过滤掉根节点（id为0）
  const tableData = useMemo(() => {
    const transformData = (data: MenuNodeInfo[]): any[] => {
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
    if (!menuList || !menuList.length) {
      return [];
    }
    // 如果第一个节点是根节点（id为0），则只返回其子节点
    if (menuList.length === 1 && menuList[0].id === 0) {
      const rootNode = menuList[0];
      return rootNode.children?.length ? transformData(rootNode.children) : [];
    }
    // 否则过滤掉所有 id 为 0 的节点
    return transformData(menuList);
  }, [menuList]);

  // 同步 tableData 到 draggableData
  useEffect(() => {
    setDraggableData(tableData);
  }, [tableData]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 更新菜单排序
  const { run: runUpdateMenuSort } = useRequest(apiUpdateMenu, {
    manual: true,
    onSuccess: () => {
      runGetMenuList();
    },
    onError: () => {
      // 恢复原数据
      setDraggableData(tableData);
    },
  });

  // 递归获取所有节点的 key（包括子节点）
  const getAllKeys = (data: (MenuNodeInfo & { key: number })[]): string[] => {
    const keys: string[] = [];
    const traverse = (items: (MenuNodeInfo & { key: number })[]) => {
      items.forEach((item) => {
        keys.push(item.key.toString());
        if (item.children && item.children.length > 0) {
          traverse(item.children as (MenuNodeInfo & { key: number })[]);
        }
      });
    };
    traverse(data);
    return keys;
  };

  // 递归查找节点
  const findNodeInTree = (
    data: (MenuNodeInfo & { key: number })[],
    key: number,
  ): (MenuNodeInfo & { key: number }) | null => {
    for (const item of data) {
      if (item.key === key) {
        return item;
      }
      if (item.children && item.children.length > 0) {
        const found = findNodeInTree(
          item.children as (MenuNodeInfo & { key: number })[],
          key,
        );
        if (found) return found;
      }
    }
    return null;
  };

  // 递归更新树形数据
  const updateTreeData = (
    data: (MenuNodeInfo & { key: number })[],
    activeKey: number,
    overKey: number,
  ): (MenuNodeInfo & { key: number })[] => {
    // 先检查是否在第一层（data 的直接子节点中）
    const activeIndex = data.findIndex((item) => item.key === activeKey);
    const overIndex = data.findIndex((item) => item.key === overKey);

    if (activeIndex !== -1 && overIndex !== -1) {
      // 在第一层，直接更新 data 数组
      return arrayMove(data, activeIndex, overIndex);
    }

    // 不在第一层，递归处理子节点
    return data.map((item) => {
      if (item.children && item.children.length > 0) {
        // 检查是否在子节点中
        const children = item.children as (MenuNodeInfo & { key: number })[];
        const childActiveIndex = children.findIndex(
          (child) => child.key === activeKey,
        );
        const childOverIndex = children.findIndex(
          (child) => child.key === overKey,
        );

        if (childActiveIndex !== -1 && childOverIndex !== -1) {
          // 在同一父节点下，更新子节点顺序
          const newChildren = arrayMove(
            children,
            childActiveIndex,
            childOverIndex,
          );
          return {
            ...item,
            children: newChildren,
          };
        } else {
          // 递归处理子节点
          return {
            ...item,
            children: updateTreeData(children, activeKey, overKey),
          };
        }
      }
      return item;
    });
  };

  // 获取同一层级的所有节点
  const getSameLevelItems = (
    data: (MenuNodeInfo & { key: number })[],
    parentId: number | undefined,
  ): (MenuNodeInfo & { key: number })[] => {
    const result: (MenuNodeInfo & { key: number })[] = [];
    const traverse = (items: (MenuNodeInfo & { key: number })[]) => {
      items.forEach((item) => {
        if (item.parentId === parentId) {
          result.push(item);
        }
        if (item.children && item.children.length > 0) {
          traverse(item.children as (MenuNodeInfo & { key: number })[]);
        }
      });
    };
    traverse(data);
    return result;
  };

  // 处理拖拽结束
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      const activeKey = Number(active.id);
      const overKey = Number(over?.id);

      const activeItem = findNodeInTree(draggableData, activeKey);
      const overItem = findNodeInTree(draggableData, overKey);

      if (!activeItem || !overItem) {
        return;
      }

      // 只允许同一层级的拖拽
      if (activeItem.parentId !== overItem.parentId) {
        message.warning('只能在同一层级内拖拽排序');
        return;
      }

      // 更新树形数据
      const newData = updateTreeData(draggableData, activeKey, overKey);
      setDraggableData(newData);

      // 获取更新后的同一层级节点（已经交换过位置）
      const newSameLevelItems = getSameLevelItems(newData, activeItem.parentId);

      // 验证两个节点都在同一层级中
      const hasActive = newSameLevelItems.some(
        (item: MenuNodeInfo & { key: number }) => item.key === activeKey,
      );
      const hasOver = newSameLevelItems.some(
        (item: MenuNodeInfo & { key: number }) => item.key === overKey,
      );

      if (!hasActive || !hasOver) {
        return;
      }

      // 更新当前一级菜单的所有菜单的 sortIndex
      // 根据它们在数组中的新位置来更新 sortIndex（从 1 开始）
      newSameLevelItems.forEach(
        (item: MenuNodeInfo & { key: number }, index: number) => {
          const newSortIndex = index + 1;
          // 只有当 sortIndex 发生变化时才更新
          runUpdateMenuSort({
            id: item.id,
            name: item.name,
            parentId: item.parentId,
            sortIndex: newSortIndex,
          });
        },
      );
    }
  };

  // 定义表格列
  const columns: TableColumnsType<MenuNodeInfo & { key: number }> = [
    {
      key: 'sort',
      align: 'center',
      width: 60,
      render: () => <DragHandle />,
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 80,
      render: (icon: string, record: MenuNodeInfo) => (
        <div className={cx(styles.iconCell)}>
          {icon ? (
            <img
              src={icon}
              alt={record.name || '菜单图标'}
              className={cx(styles.menuIcon)}
            />
          ) : (
            <span className={cx(styles.iconPlaceholder)}></span>
          )}
        </div>
      ),
    },
    {
      title: '菜单名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string) => code || '--',
    },
    {
      title: '路由路径',
      dataIndex: 'path',
      key: 'path',
      width: 200,
      ellipsis: true,
      render: (path: string) => path || '--',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: MenuStatusEnum) => (
        <Tag color={status === MenuStatusEnum.Enabled ? 'success' : 'default'}>
          {status === MenuStatusEnum.Enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right',
      render: (_: any, record: MenuNodeInfo) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleAddChild(record)}
          >
            新增子菜单
          </Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            loading={deleteLoadingMap[record.id] || false}
            onClick={() => handleDeleteConfirm(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={cx(styles.container)}>
      {/* 页面头部 */}
      <div className={cx(styles.header)}>
        <div className={cx(styles.headerLeft)}>
          <h1 className={cx(styles.title)}>菜单管理</h1>
          <p className={cx(styles.description)}>
            管理系统菜单结构,未级菜单可关联资源码
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增菜单
        </Button>
      </div>

      {/* 菜单列表 */}
      <div className={cx(styles.content)}>
        <Spin spinning={loading}>
          {!tableData?.length ? (
            <Empty
              description="暂无菜单数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className={cx(styles.empty)}
            />
          ) : (
            <DndContext
              sensors={sensors}
              modifiers={[restrictToVerticalAxis]}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={getAllKeys(draggableData)}
                strategy={verticalListSortingStrategy}
              >
                <Table<MenuNodeInfo & { key: number }>
                  components={{
                    body: {
                      row: Row,
                    },
                  }}
                  rowKey="key"
                  columns={columns}
                  dataSource={draggableData}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  className={cx(styles.table)}
                  expandable={{
                    expandIcon: ({ expanded, onExpand, record }) =>
                      record.children ? (
                        <DownOutlined
                          className={cx(styles.icon, {
                            [styles['rotate-0']]: expanded,
                          })}
                          onClick={(e) => onExpand(record, e)}
                        />
                      ) : (
                        <DownOutlined
                          className={cx(styles.icon, styles['icon-hidden'])}
                        />
                      ),
                  }}
                />
              </SortableContext>
            </DndContext>
          )}
        </Spin>
      </div>

      {/* 新增/编辑菜单Modal */}
      <MenuFormModal
        open={modalOpen}
        isEdit={isEdit}
        menuInfo={editingMenu}
        parentMenu={parentMenu}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default MenuManage;
