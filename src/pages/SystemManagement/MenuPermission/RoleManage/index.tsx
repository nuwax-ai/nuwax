import { modalConfirm } from '@/utils/ant-custom';
import { PlusOutlined } from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { TableColumnsType } from 'antd';
import { Button, Empty, message, Space, Spin, Table, Tag } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useRequest } from 'umi';
import BindUser from '../components/BindUser';
import { DragHandle, Row } from '../components/DraggableTableRow';
import MenuPermissionModal from '../components/MenuPermissionModal';
import {
  apiDeleteRole,
  apiGetRoleList,
  apiUpdateRoleSort,
} from '../services/role-manage';
import {
  RoleStatusEnum,
  type RoleInfo,
  type UpdateRoleSortItem,
} from '../types/role-manage';
import DataPermissionModal from './components/DataPermissionModal';
import RoleFormModal from './components/RoleFormModal';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 角色管理页面
 * 用于管理系统角色，分配菜单权限和数据范围
 */
const RoleManage: React.FC = () => {
  const location = useLocation();
  // 删除角色loading map
  const [deleteLoadingMap, setDeleteLoadingMap] = useState<
    Record<number, boolean>
  >({});
  // 新增/编辑角色Modal是否打开
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  // 是否为编辑角色
  const [isEdit, setIsEdit] = useState<boolean>(false);
  // 当前角色信息
  const [currentRole, setCurrentRole] = useState<RoleInfo | null>();
  // 菜单权限弹窗是否打开
  const [menuPermissionModalOpen, setMenuPermissionModalOpen] =
    useState<boolean>(false);
  // 数据权限弹窗是否打开
  const [dataPermissionModalOpen, setDataPermissionModalOpen] =
    useState<boolean>(false);
  // 角色绑定用户抽屉是否打开
  const [bindUserDrawerOpen, setBindUserDrawerOpen] = useState<boolean>(false);

  // 拖拽排序的数据源
  const [draggableData, setDraggableData] = useState<
    (RoleInfo & { key: number })[]
  >([]);

  // 查询角色列表
  const {
    run: runGetRoleList,
    data: roleList,
    loading,
  } = useRequest(apiGetRoleList, {
    manual: true,
  });

  // 监听 location.state 变化
  // 当 state 中存在 _t 变量时，说明是通过菜单切换过来的，需要清空 query 参数
  useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      // 查询角色列表
      runGetRoleList();
    }
  }, [location.state]);

  // 删除角色
  const { run: runDelete } = useRequest(apiDeleteRole, {
    manual: true,
    loadingDelay: 300,
    onBefore: (roleId: number) => {
      setDeleteLoadingMap((prev) => ({ ...prev, [roleId]: true }));
    },
    onSuccess: () => {
      message.success('删除成功');
      runGetRoleList();
    },
    onFinally: (roleId: number) => {
      setDeleteLoadingMap((prev) => ({ ...prev, [roleId]: false }));
    },
  });

  // 处理绑定用户
  const handleBindUser = (role: RoleInfo) => {
    setCurrentRole(role);
    setBindUserDrawerOpen(true);
  };

  // 处理编辑
  const handleEdit = (roleInfo: RoleInfo) => {
    setCurrentRole(roleInfo);
    setIsEdit(true);
    setModalOpen(true);
  };

  // 处理删除确认
  const handleDeleteConfirm = (roleInfo: RoleInfo) => {
    modalConfirm('删除角色', `确认删除角色 "${roleInfo.name}" 吗？`, () => {
      runDelete(roleInfo.id);
      return new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
    });
  };

  // 处理菜单权限
  const handleMenuPermission = (roleInfo: RoleInfo) => {
    setCurrentRole(roleInfo);
    setMenuPermissionModalOpen(true);
  };

  // 处理数据权限
  const handleDataPermission = (roleInfo: RoleInfo) => {
    setCurrentRole(roleInfo);
    setDataPermissionModalOpen(true);
  };

  // 处理菜单权限弹窗关闭
  const handleMenuPermissionModalClose = () => {
    setMenuPermissionModalOpen(false);
    setCurrentRole(null);
  };

  // 处理菜单权限保存成功
  const handleMenuPermissionSuccess = () => {
    setMenuPermissionModalOpen(false);
    setCurrentRole(null);
    runGetRoleList();
  };

  // 处理新增
  const handleAdd = () => {
    setCurrentRole(null);
    setIsEdit(false);
    setModalOpen(true);
  };

  // 处理Modal关闭
  const handleModalCancel = () => {
    setModalOpen(false);
    setCurrentRole(null);
  };

  // 处理Modal成功
  const handleModalSuccess = () => {
    setModalOpen(false);
    runGetRoleList();
  };

  // 转换数据格式，为表格数据添加 key 字段
  const tableData = useMemo(() => {
    if (!roleList || !roleList.length) {
      return [];
    }
    return roleList.map((item: RoleInfo) => ({
      ...item,
      key: item.id,
    }));
  }, [roleList]);

  // 同步 tableData 到 draggableData
  useEffect(() => {
    setDraggableData(tableData);
  }, [tableData]);

  // 更新角色排序
  const { run: runUpdateRoleSort } = useRequest(apiUpdateRoleSort, {
    manual: true,
    onSuccess: () => {
      message.success('排序更新成功');
      runGetRoleList();
    },
    onError: () => {
      // 恢复原数据
      setDraggableData(tableData);
    },
  });

  // 处理拖拽结束
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    // 如果没有目标位置或拖拽到同一位置，直接返回
    if (!over || active.id === over.id) {
      return;
    }

    const activeKey = Number(active.id);
    const overKey = Number(over.id);

    const activeIndex = draggableData.findIndex(
      (item) => item.key === activeKey,
    );
    const overIndex = draggableData.findIndex((item) => item.key === overKey);

    // 如果找不到对应的索引，说明拖拽到了无效位置
    if (activeIndex === -1 || overIndex === -1) {
      return;
    }

    // 更新数据
    const newData = arrayMove(draggableData, activeIndex, overIndex);
    setDraggableData(newData);

    // 收集所有需要更新的角色（只更新受影响的行）
    const updateItems: UpdateRoleSortItem[] = newData.map((item, index) => ({
      id: item.id,
      name: item.name,
      sortIndex: index + 1,
    }));

    // 批量更新角色排序
    if (updateItems.length > 0) {
      runUpdateRoleSort({
        items: updateItems,
      });
    }
  };

  // 定义表格列
  const columns: TableColumnsType<RoleInfo & { key: number }> = [
    {
      title: '排序',
      key: 'sort',
      align: 'center',
      render: () => <DragHandle />,
    },
    {
      title: '角色名称',
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
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => (
        <div className={cx(styles.descriptionCell)} title={description}>
          {description || '--'}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: RoleStatusEnum) => (
        <Tag color={status === RoleStatusEnum.Enabled ? 'success' : 'default'}>
          {status === RoleStatusEnum.Enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      align: 'center',
      fixed: 'right',
      render: (_: null, record: RoleInfo) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleBindUser(record)}
          >
            绑定用户
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleMenuPermission(record)}
          >
            菜单权限
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleDataPermission(record)}
          >
            数据权限
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
          <h1 className={cx(styles.title)}>角色管理</h1>
          <p className={cx(styles.description)}>
            管理系统角色,分配菜单权限和数据范围
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增角色
        </Button>
      </div>

      {/* 角色列表 */}
      <div className={cx(styles.content)}>
        <Spin spinning={loading}>
          {!draggableData?.length ? (
            <Empty
              description="暂无角色数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className={cx(styles.empty)}
            />
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={draggableData.map((item) => String(item.key))}
                strategy={verticalListSortingStrategy}
              >
                <Table<RoleInfo & { key: number }>
                  columns={columns}
                  dataSource={draggableData}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  className={cx(styles.table)}
                  components={{
                    body: {
                      row: Row,
                    },
                  }}
                />
              </SortableContext>
            </DndContext>
          )}
        </Spin>
      </div>

      {/* 新增/编辑角色Modal */}
      <RoleFormModal
        open={modalOpen}
        isEdit={isEdit}
        roleInfo={currentRole}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />

      {/* 菜单权限配置Modal */}
      <MenuPermissionModal
        open={menuPermissionModalOpen}
        targetId={currentRole?.id || 0}
        name={currentRole?.name || ''}
        onClose={handleMenuPermissionModalClose}
        onSuccess={handleMenuPermissionSuccess}
      />
      {/* 数据权限配置Modal */}
      <DataPermissionModal
        open={dataPermissionModalOpen}
        roleId={currentRole?.id}
        roleName={currentRole?.name}
        onCancel={() => {
          setDataPermissionModalOpen(false);
          setCurrentRole(null);
        }}
        onSuccess={() => {
          setDataPermissionModalOpen(false);
          setCurrentRole(null);
        }}
      />
      {/* 角色绑定用户弹窗 */}
      <BindUser
        targetId={currentRole?.id || 0}
        name={currentRole?.name || ''}
        open={bindUserDrawerOpen}
        onCancel={() => setBindUserDrawerOpen(false)}
        onConfirmBindUser={() => {
          setBindUserDrawerOpen(false);
          runGetRoleList();
        }}
      />
    </div>
  );
};

export default RoleManage;
