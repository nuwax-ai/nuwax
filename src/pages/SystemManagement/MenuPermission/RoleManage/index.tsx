import { DragHandle, Row } from '@/components/base/DraggableTableRow';
import {
  TableActions,
  XProTable,
  type ActionItem,
} from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { t } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
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
import { Button, Empty, message, Switch, Tooltip } from 'antd';
import classNames from 'classnames';
import type { ReactNode } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useModel, useRequest } from 'umi';
import BindUser from '../components/BindUser';
import DataPermissionModal from '../components/DataPermissionModal';
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
  type GetRoleListParams,
  type RoleInfo,
  type UpdateRoleParams,
  type UpdateRoleSortItem,
} from '../types/role-manage';
import styles from './index.less';
import RoleFormModal from './RoleFormModal';

const cx = classNames.bind(styles);

/**
 * Role management page.
 */
const RoleManage: React.FC = () => {
  const location = useLocation();
  // Loading map for row-level status updates.
  const [updateStatusLoadingMap, setUpdateStatusLoadingMap] = useState<
    Record<number, boolean>
  >({});
  // Create/edit modal state.
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  // Edit mode flag.
  const [isEdit, setIsEdit] = useState<boolean>(false);
  // Current role context.
  const [currentRole, setCurrentRole] = useState<RoleInfo | null>();
  // Menu permission modal state.
  const [menuPermissionModalOpen, setMenuPermissionModalOpen] =
    useState<boolean>(false);
  // Data permission modal state.
  const [dataPermissionModalOpen, setDataPermissionModalOpen] =
    useState<boolean>(false);
  // Bind-user drawer state.
  const [bindUserDrawerOpen, setBindUserDrawerOpen] = useState<boolean>(false);

  // Drag-sort datasource.
  const [draggableData, setDraggableData] = useState<
    (RoleInfo & { key: number })[]
  >([]);

  // Prevent postData from overriding data while dragging.
  const isDraggingRef = useRef<boolean>(false);
  // Backup data before drag, used for rollback on API failure.
  const originalDataRef = useRef<(RoleInfo & { key: number })[] | null>(null);

  // Default sort index for create mode.
  const [defaultSortIndex, setDefaultSortIndex] = useState<number>(1);

  // ProTable refs.
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();

  // Permission check.
  const { hasPermissionByMenuCode } = useModel('menuModel');

  /**
   * ProTable request handler.
   */
  const request = useCallback(async (params: any) => {
    const { name, code } = params;
    const queryParams: GetRoleListParams = {
      name: name || undefined,
      code: code || undefined,
    };
    try {
      const res = await apiGetRoleList(queryParams);
      // Keep empty state deterministic when response is invalid.
      if (res?.code !== SUCCESS_CODE || !res?.data) {
        setDraggableData([]);
        return {
          data: [],
          total: 0,
          success: true,
        };
      }
      const data = res.data.map((item: RoleInfo) => ({
        ...item,
        key: item.id,
      }));
      return {
        data,
        total: data.length,
        success: true,
      };
    } catch (error) {
      console.error('[RoleManage] query role list failed', error);
      setDraggableData([]);
      return {
        data: [],
        total: 0,
        success: false,
      };
    }
  }, []);

  /**
   * Reset table and form state.
   */
  const handleReset = useCallback(() => {
    actionRef.current?.reset?.();
  }, []);

  // Reset when route state changes.
  useEffect(() => {
    handleReset();
  }, [location.state, handleReset]);

  // Delete role.
  const { run: runDelete } = useRequest(apiDeleteRole, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success(t('PC.Pages.SystemRoleManage.deleteSuccess'));
      actionRef.current?.reload();
    },
  });

  // Update role status.
  const { run: runUpdateRole } = useRequest(apiUpdateRole, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      actionRef.current?.reload();
    },
  });

  // Handle status change.
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

  // Bind users.
  const handleBindUser = (role: RoleInfo) => {
    setCurrentRole(role);
    setBindUserDrawerOpen(true);
  };

  // Edit role.
  const handleEdit = (roleInfo: RoleInfo) => {
    setCurrentRole(roleInfo);
    setIsEdit(true);
    setModalOpen(true);
  };

  // Confirm delete.
  const handleDeleteConfirm = (roleInfo: RoleInfo) => {
    modalConfirm(
      t('PC.Pages.SystemRoleManage.deleteRoleTitle'),
      t('PC.Pages.SystemRoleManage.deleteRoleConfirm', roleInfo.name),
      () => {
        runDelete(roleInfo.id);
        return new Promise((resolve) => {
          setTimeout(resolve, 300);
        });
      },
    );
  };

  // Configure menu permission.
  const handleMenuPermission = (roleInfo: RoleInfo) => {
    setCurrentRole(roleInfo);
    setMenuPermissionModalOpen(true);
  };

  // Configure data permission.
  const handleDataPermission = (roleInfo: RoleInfo) => {
    setCurrentRole(roleInfo);
    setDataPermissionModalOpen(true);
  };

  // Close menu permission modal.
  const handleMenuPermissionModalClose = () => {
    setMenuPermissionModalOpen(false);
    setCurrentRole(null);
  };

  // Handle menu permission save success.
  const handleMenuPermissionSuccess = () => {
    setMenuPermissionModalOpen(false);
    setCurrentRole(null);
    actionRef.current?.reload();
  };

  // Add role.
  const handleAdd = () => {
    setCurrentRole(null);
    setIsEdit(false);
    setModalOpen(true);
    setDefaultSortIndex((draggableData?.length || 0) + 1);
  };

  // Close role modal.
  const handleModalCancel = () => {
    setModalOpen(false);
    setCurrentRole(null);
    setDefaultSortIndex(1);
  };

  // Handle role modal success.
  const handleModalSuccess = () => {
    setModalOpen(false);
    actionRef.current?.reload();
  };

  // Update role order.
  const { run: runUpdateRoleSort } = useRequest(apiUpdateRoleSort, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success(t('PC.Pages.SystemRoleManage.sortUpdated'));
      isDraggingRef.current = false;
      originalDataRef.current = null;
    },
    onError: () => {
      isDraggingRef.current = false;
      if (originalDataRef.current) {
        setDraggableData(originalDataRef.current);
        originalDataRef.current = null;
      } else {
        actionRef.current?.reload();
      }
    },
  });

  // Handle drag end.
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    // Ignore invalid or no-op drag.
    if (!over || active.id === over.id) {
      isDraggingRef.current = false;
      return;
    }

    const activeKey = Number(active.id);
    const overKey = Number(over.id);

    const activeIndex = draggableData.findIndex(
      (item) => item.key === activeKey,
    );
    const overIndex = draggableData.findIndex((item) => item.key === overKey);

    // Invalid drag target.
    if (activeIndex === -1 || overIndex === -1) {
      isDraggingRef.current = false;
      return;
    }

    isDraggingRef.current = true;

    originalDataRef.current = [...draggableData];

    const newData = arrayMove(draggableData, activeIndex, overIndex);
    setDraggableData(newData);

    const updateItems: UpdateRoleSortItem[] = newData.map((item, index) => ({
      id: item.id,
      name: item.name,
      sortIndex: index + 1,
    }));

    if (updateItems.length > 0) {
      runUpdateRoleSort({
        items: updateItems,
      });
    }
  };

  // Table columns.
  const columns: ProColumns<RoleInfo & { key: number }>[] = [
    {
      title: t('PC.Pages.SystemRoleManage.columnSort'),
      key: 'sort',
      align: 'center',
      width: 80,
      fixed: 'left',
      hideInSearch: true,
      render: () => <DragHandle />,
    },
    {
      title: t('PC.Pages.SystemRoleManage.columnRoleName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      valueType: 'text',
    },
    {
      title: t('PC.Pages.SystemRoleManage.columnCode'),
      dataIndex: 'code',
      key: 'code',
      width: 150,
      valueType: 'text',
    },
    {
      title: t('PC.Pages.SystemRoleManage.columnDescription'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      // width: 300,
      hideInSearch: true,
    },
    {
      title: (
        <span>
          {t('PC.Pages.SystemRoleManage.columnStatus')}
          <Tooltip title={t('PC.Pages.SystemRoleManage.statusTooltip')}>
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
      hideInSearch: true,
      render: (_: ReactNode, record: RoleInfo & { key: number }) => (
        <Tooltip
          title={
            record.source === RoleSourceEnum.SystemBuiltIn
              ? t('PC.Pages.SystemRoleManage.builtInCannotDisable')
              : ''
          }
        >
          <Switch
            disabled={record.source === RoleSourceEnum.SystemBuiltIn}
            checked={record.status === RoleStatusEnum.Enabled}
            checkedChildren={t('PC.Pages.SystemRoleManage.enabled')}
            unCheckedChildren={t('PC.Pages.SystemRoleManage.disabled')}
            loading={updateStatusLoadingMap[record.id] || false}
            onChange={(checked) => handleUpdateStatus(record, checked)}
          />
        </Tooltip>
      ),
    },
    {
      title: t('PC.Pages.SystemRoleManage.columnAction'),
      key: 'action',
      align: 'center',
      width: 300,
      fixed: 'right',
      hideInSearch: true,
      render: (_: ReactNode, record: RoleInfo & { key: number }) => {
        const isSystemBuiltIn = record.source === RoleSourceEnum.SystemBuiltIn;

        const actions: ActionItem<RoleInfo & { key: number }>[] = [
          {
            key: 'bindUser',
            label: t('PC.Pages.SystemRoleManage.bindUser'),
            onClick: () => handleBindUser(record),
            visible: hasPermissionByMenuCode(
              'role_manage',
              'role_manage_bind_user',
            ),
          },
          {
            key: 'menuPermission',
            label: t('PC.Pages.SystemRoleManage.menuPermission'),
            onClick: () => handleMenuPermission(record),
            visible: hasPermissionByMenuCode(
              'role_manage',
              'role_manage_bind_menu',
            ),
          },
          {
            key: 'dataPermission',
            label: t('PC.Pages.SystemRoleManage.dataPermission'),
            onClick: () => handleDataPermission(record),
            visible: hasPermissionByMenuCode(
              'role_manage',
              'role_manage_bind_data',
            ),
          },
          {
            key: 'edit',
            label: t('PC.Pages.SystemRoleManage.edit'),
            onClick: () => handleEdit(record),
            disabled: isSystemBuiltIn,
            tooltip: isSystemBuiltIn
              ? t('PC.Pages.SystemRoleManage.builtInCannotEdit')
              : undefined,
            visible: hasPermissionByMenuCode(
              'role_manage',
              'role_manage_modify',
            ),
          },
          {
            key: 'delete',
            label: t('PC.Pages.SystemRoleManage.delete'),
            onClick: () => handleDeleteConfirm(record),
            disabled: isSystemBuiltIn,
            tooltip: isSystemBuiltIn
              ? t('PC.Pages.SystemRoleManage.builtInCannotDelete')
              : undefined,
            visible: hasPermissionByMenuCode(
              'role_manage',
              'role_manage_delete',
            ),
          },
        ];

        return (
          <TableActions<RoleInfo & { key: number }>
            record={record}
            actions={actions}
          />
        );
      },
    },
  ];

  return (
    <WorkspaceLayout
      title={t('PC.Pages.SystemRoleManage.pageTitle')}
      hideScroll
      rightSlot={
        hasPermissionByMenuCode('role_manage', 'role_manage_add') && (
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            {t('PC.Pages.SystemRoleManage.addRole')}
          </Button>
        )
      }
    >
      {/* Role list */}
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
            actionRef={actionRef}
            formRef={formRef}
            rowKey="key"
            columns={columns}
            request={request}
            dataSource={draggableData}
            pagination={false}
            scroll={{ x: 1090 }}
            showQueryButtons={hasPermissionByMenuCode(
              'role_manage',
              'role_manage_query',
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
            postData={(data: (RoleInfo & { key: number })[]) => {
              if (!isDraggingRef.current) {
                setDraggableData(data || []);
              }
              return data;
            }}
            locale={{
              emptyText: (
                <Empty
                  description={t('PC.Pages.SystemRoleManage.emptyData')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className={cx(styles.empty)}
                />
              ),
            }}
          />
        </SortableContext>
      </DndContext>

      {/* Create/Edit role modal */}
      <RoleFormModal
        open={modalOpen}
        isEdit={isEdit}
        /** Role info for edit mode. */
        roleInfo={currentRole}
        /** Default sort index for create mode. */
        defaultSortIndex={defaultSortIndex}
        /** Cancel callback. */
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />

      {/* Menu permission modal */}
      <MenuPermissionModal
        open={menuPermissionModalOpen}
        targetId={currentRole?.id || 0}
        name={currentRole?.name || ''}
        onClose={handleMenuPermissionModalClose}
        onSuccess={handleMenuPermissionSuccess}
      />
      {/* Data permission modal */}
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
      {/* Bind-user drawer */}
      <BindUser
        targetId={currentRole?.id || 0}
        name={currentRole?.name || ''}
        open={bindUserDrawerOpen}
        onCancel={() => setBindUserDrawerOpen(false)}
      />
    </WorkspaceLayout>
  );
};

export default RoleManage;
