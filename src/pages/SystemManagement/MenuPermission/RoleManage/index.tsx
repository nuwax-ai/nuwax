import CustomPopover from '@/components/CustomPopover';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import { modalConfirm } from '@/utils/ant-custom';
import {
  EllipsisOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button, Empty, message, Space, Spin, Switch, Tooltip } from 'antd';
import classNames from 'classnames';
import type { ReactNode } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useModel, useRequest } from 'umi';
import BindUser from '../components/BindUser';
import DataPermissionModal from '../components/DataPermissionModal';
import { DragHandle, Row } from '../components/DraggableTableRow';
import MenuPermissionModal from '../components/MenuPermissionModal';
import {
  apiDeleteRole,
  apiGetRoleList,
  apiUpdateRole,
  apiUpdateRoleSort,
} from '../services/role-manage';
import {
  RoleSourceEnum,
  RoleStatusEnum,
  type RoleInfo,
  type UpdateRoleParams,
  type UpdateRoleSortItem,
} from '../types/role-manage';
import RoleFormModal from './components/RoleFormModal';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 角色管理页面
 * 用于管理系统角色，分配菜单权限和数据范围
 */
const RoleManage: React.FC = () => {
  const location = useLocation();
  // 更新状态loading map
  const [updateStatusLoadingMap, setUpdateStatusLoadingMap] = useState<
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

  // 新增时，默认排序索引，默认1
  const [defaultSortIndex, setDefaultSortIndex] = useState<number>(1);

  // 权限检查
  const { hasPermissionByMenuCode } = useModel('menuModel');

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
    // 查询角色列表
    runGetRoleList();
  }, [location.state]);

  // 删除角色
  const { run: runDelete } = useRequest(apiDeleteRole, {
    manual: true,
    onSuccess: () => {
      message.success('删除成功');
      runGetRoleList();
    },
  });

  // 更新角色状态
  const { run: runUpdateRole } = useRequest(apiUpdateRole, {
    manual: true,
    onSuccess: () => {
      runGetRoleList();
    },
  });

  // 处理状态更新
  const handleUpdateStatus = async (record: RoleInfo, checked: boolean) => {
    const newStatus = checked
      ? RoleStatusEnum.Enabled
      : RoleStatusEnum.Disabled;
    const params: UpdateRoleParams = {
      id: record.id,
      status: newStatus,
    };
    try {
      setUpdateStatusLoadingMap((prev) => ({ ...prev, [record.id]: true }));
      await runUpdateRole(params);
    } finally {
      setTimeout(() => {
        setUpdateStatusLoadingMap((prev) => ({ ...prev, [record.id]: false }));
      }, 300);
    }
  };

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
    // 新增时，默认排序索引，默认1
    setDefaultSortIndex((draggableData?.length || 0) + 1);
  };

  // 处理Modal关闭
  const handleModalCancel = () => {
    setModalOpen(false);
    setCurrentRole(null);
    setDefaultSortIndex(1);
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
  const columns: ProColumns<RoleInfo & { key: number }>[] = [
    {
      title: '排序',
      key: 'sort',
      align: 'center',
      width: 80,
      fixed: 'left',
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
      render: (_: ReactNode, record: RoleInfo & { key: number }) => (
        <div className={cx(styles.descriptionCell)} title={record.description}>
          {record.description || '--'}
        </div>
      ),
    },
    {
      title: (
        <span>
          状态
          <Tooltip title="启用或禁用此角色">
            <InfoCircleOutlined
              style={{ marginLeft: 4, color: '#999', cursor: 'help' }}
            />
          </Tooltip>
        </span>
      ),
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 100,
      fixed: 'right',
      render: (_: ReactNode, record: RoleInfo & { key: number }) => (
        <Tooltip
          title={
            record.source === RoleSourceEnum.SystemBuiltIn
              ? '系统内置的角色不能禁用'
              : ''
          }
        >
          <Switch
            disabled={record.source === RoleSourceEnum.SystemBuiltIn}
            checked={record.status === RoleStatusEnum.Enabled}
            checkedChildren="启用"
            unCheckedChildren="禁用"
            loading={updateStatusLoadingMap[record.id] || false}
            onChange={(checked) => handleUpdateStatus(record, checked)}
          />
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      width: 260,
      fixed: 'right',
      render: (_: ReactNode, record: RoleInfo & { key: number }) => {
        // 判断是否为系统内置角色
        const isSystemBuiltIn = record.source === RoleSourceEnum.SystemBuiltIn;

        // 编辑权限检查
        const canEdit =
          hasPermissionByMenuCode('role_manage', 'role_manage_modify') &&
          !isSystemBuiltIn;
        const editTooltip = isSystemBuiltIn
          ? '系统内置的角色不能编辑'
          : !hasPermissionByMenuCode('role_manage', 'role_manage_modify')
          ? '无此资源权限'
          : '';

        // 删除权限检查
        const canDelete =
          hasPermissionByMenuCode('role_manage', 'role_manage_delete') &&
          !isSystemBuiltIn;
        const deleteTooltip = isSystemBuiltIn
          ? '系统内置的角色不能删除'
          : !hasPermissionByMenuCode('role_manage', 'role_manage_delete')
          ? '无此资源权限'
          : '';

        // 构建更多操作菜单项
        const moreActionList: CustomPopoverItem[] = [
          {
            key: 'edit',
            label: '编辑',
            disabled: !canEdit,
            tooltip: editTooltip,
          },
          {
            key: 'delete',
            label: '删除',
            disabled: !canDelete,
            tooltip: deleteTooltip,
          },
        ];

        // 处理更多操作点击
        const handleMoreActionClick = (item: CustomPopoverItem) => {
          if (item.disabled) {
            return;
          }
          if (item.key === 'edit') {
            handleEdit(record);
          } else if (item.key === 'delete') {
            handleDeleteConfirm(record);
          }
        };

        return (
          <Space size={0}>
            <Tooltip
              title={
                !hasPermissionByMenuCode('role_manage', 'role_manage_bind_user')
                  ? '无此资源权限'
                  : ''
              }
            >
              <Button
                type="link"
                size="small"
                disabled={
                  !hasPermissionByMenuCode(
                    'role_manage',
                    'role_manage_bind_user',
                  )
                }
                onClick={() => handleBindUser(record)}
              >
                绑定用户
              </Button>
            </Tooltip>
            <Tooltip
              title={
                !hasPermissionByMenuCode('role_manage', 'role_manage_bind_menu')
                  ? '无此资源权限'
                  : ''
              }
            >
              <Button
                type="link"
                size="small"
                disabled={
                  !hasPermissionByMenuCode(
                    'role_manage',
                    'role_manage_bind_menu',
                  )
                }
                onClick={() => handleMenuPermission(record)}
              >
                菜单权限
              </Button>
            </Tooltip>
            <Tooltip
              title={
                !hasPermissionByMenuCode('role_manage', 'role_manage_bind_data')
                  ? '无此资源权限'
                  : ''
              }
            >
              <Button
                type="link"
                size="small"
                disabled={
                  !hasPermissionByMenuCode(
                    'role_manage',
                    'role_manage_bind_data',
                  )
                }
                onClick={() => handleDataPermission(record)}
              >
                数据权限
              </Button>
            </Tooltip>
            <CustomPopover
              list={moreActionList}
              onClick={handleMoreActionClick}
            >
              <Button type="link" size="small" icon={<EllipsisOutlined />} />
            </CustomPopover>
          </Space>
        );
      },
    },
  ];

  return (
    <WorkspaceLayout
      title="角色管理"
      hideScroll
      rightSlot={[
        hasPermissionByMenuCode('role_manage', 'role_manage_query') && (
          <Button
            key="query"
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => runGetRoleList()}
            loading={loading}
          >
            查询
          </Button>
        ),
        hasPermissionByMenuCode('role_manage', 'role_manage_add') && (
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增角色
          </Button>
        ),
      ]}
    >
      {/* 角色列表 */}
      <Spin spinning={loading && !draggableData?.length}>
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={draggableData.map((item) => String(item.key))}
            strategy={verticalListSortingStrategy}
          >
            <XProTable<RoleInfo & { key: number }>
              rowKey="key"
              columns={columns}
              dataSource={draggableData}
              search={false}
              pagination={false}
              scroll={{ x: 'max-content' }}
              className={cx(styles.table)}
              showQueryButtons={false}
              showIndex={false}
              components={{
                body: {
                  row: Row,
                },
              }}
              options={false}
              toolBarRender={false}
              locale={{
                emptyText: (
                  <Empty
                    description="暂无角色数据"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className={cx(styles.empty)}
                  />
                ),
              }}
            />
          </SortableContext>
        </DndContext>
      </Spin>

      {/* 新增/编辑角色Modal */}
      <RoleFormModal
        open={modalOpen}
        isEdit={isEdit}
        /** 编辑时的角色数据 */
        roleInfo={currentRole}
        /** 新增时，默认排序索引，默认1 */
        defaultSortIndex={defaultSortIndex}
        /** 取消回调 */
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
        targetId={currentRole?.id || 0}
        type="role"
        name={currentRole?.name}
        onCancel={() => {
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
    </WorkspaceLayout>
  );
};

export default RoleManage;
