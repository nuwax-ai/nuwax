import CustomPopover from '@/components/CustomPopover';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { t } from '@/services/i18nRuntime';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import { modalConfirm } from '@/utils/ant-custom';
import {
  EllipsisOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
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
import { Button, Empty, message, Space, Switch, Tooltip } from 'antd';
import classNames from 'classnames';
import type { ReactNode } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useModel, useRequest } from 'umi';
import BindUser from '../components/BindUser';
import DataPermissionModal from '../components/DataPermissionModal';
import { DragHandle, Row } from '../components/DraggableTableRow';
import MenuPermissionModal from '../components/MenuPermissionModal';
import {
  apiDeleteUserGroup,
  apiGetUserGroupList,
  apiUpdateUserGroup,
  apiUpdateUserGroupSort,
} from '../services/user-group-manage';
import type {
  GetUserGroupListParams,
  UpdateUserGroupParams,
  UpdateUserGroupSortItem,
  UserGroupInfo,
} from '../types/user-group-manage';
import {
  UserGroupSourceEnum,
  UserGroupStatusEnum,
} from '../types/user-group-manage';
import UserGroupFormModal from './components/UserGroupFormModal';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * User-group management page.
 */
const UserGroupManage: React.FC = () => {
  const location = useLocation();
  // Loading map for row-level status updates.
  const [updateStatusLoadingMap, setUpdateStatusLoadingMap] = useState<
    Record<number, boolean>
  >({});
  // Create/edit modal state.
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  // Edit mode flag.
  const [isEdit, setIsEdit] = useState<boolean>(false);
  // Menu permission modal state.
  const [menuPermissionModalOpen, setMenuPermissionModalOpen] =
    useState<boolean>(false);
  // Data permission modal state.
  const [dataPermissionModalOpen, setDataPermissionModalOpen] =
    useState<boolean>(false);
  // Bind-user drawer state.
  const [groupBindUserOpen, setGroupBindUserOpen] = useState<boolean>(false);
  // Current user-group context.
  const [currentUserGroup, setCurrentUserGroup] =
    useState<UserGroupInfo | null>();

  // Drag-sort datasource.
  const [draggableData, setDraggableData] = useState<
    (UserGroupInfo & { key: number })[]
  >([]);

  // Default sort index for create mode.
  const [defaultSortIndex, setDefaultSortIndex] = useState<number>(1);

  // ProTable refs.
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();

  // Prevent postData from overriding data while dragging.
  const isDraggingRef = useRef<boolean>(false);
  // Backup data before drag, used for rollback on API failure.
  const originalDataRef = useRef<(UserGroupInfo & { key: number })[] | null>(
    null,
  );

  // Permission check.
  const { hasPermissionByMenuCode } = useModel('menuModel');

  /**
   * ProTable request handler.
   */
  const request = useCallback(async (params: any) => {
    const { name, code } = params;
    const queryParams: GetUserGroupListParams = {
      name: name || undefined,
      code: code || undefined,
    };
    try {
      const res = await apiGetUserGroupList(queryParams);
      // Keep empty state deterministic when response is invalid.
      if (res?.code !== SUCCESS_CODE || !res?.data) {
        setDraggableData([]);
        return {
          data: [],
          total: 0,
          success: true,
        };
      }
      // Filter out placeholder entries.
      const filteredList = res.data.filter(
        (item: UserGroupInfo) => item.id !== 0,
      );
      const data = filteredList.map((item: UserGroupInfo) => ({
        ...item,
        key: item.id,
      }));
      return {
        data,
        total: data.length,
        success: true,
      };
    } catch (error) {
      console.error('[UserGroupManage] query user-group list failed', error);
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

  // Delete user group.
  const { run: runDelete } = useRequest(apiDeleteUserGroup, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success(t('PC.Pages.SystemUserGroupManage.deleteSuccess'));
      actionRef.current?.reload();
    },
  });

  // Update user-group status.
  const { run: runUpdateUserGroup } = useRequest(apiUpdateUserGroup, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      actionRef.current?.reload();
    },
  });

  // Handle status change.
  const handleUpdateStatus = async (
    record: UserGroupInfo,
    checked: boolean,
  ) => {
    const newStatus = checked
      ? UserGroupStatusEnum.Enabled
      : UserGroupStatusEnum.Disabled;
    const params: UpdateUserGroupParams = {
      id: record.id,
      status: newStatus,
    };
    try {
      setUpdateStatusLoadingMap((prev) => ({ ...prev, [record.id]: true }));
      await runUpdateUserGroup(params);
    } finally {
      setTimeout(() => {
        setUpdateStatusLoadingMap((prev) => ({ ...prev, [record.id]: false }));
      }, 300);
    }
  };

  // Bind users.
  const handleBindUser = (userGroup: UserGroupInfo) => {
    setCurrentUserGroup(userGroup);
    setGroupBindUserOpen(true);
  };

  // Edit user group.
  const handleEdit = (userGroup: UserGroupInfo) => {
    setCurrentUserGroup(userGroup);
    setIsEdit(true);
    setModalOpen(true);
  };

  // Add user group.
  const handleAdd = () => {
    setCurrentUserGroup(null);
    setIsEdit(false);
    setModalOpen(true);
    setDefaultSortIndex((draggableData?.length || 0) + 1);
  };

  // Close user-group modal.
  const handleModalCancel = () => {
    setModalOpen(false);
    setCurrentUserGroup(null);
    setDefaultSortIndex(1);
  };

  // Handle user-group modal success.
  const handleModalSuccess = () => {
    setModalOpen(false);
    setCurrentUserGroup(null);
    actionRef.current?.reload();
  };

  // Configure menu permission.
  const handleMenuPermission = (userGroup: UserGroupInfo) => {
    setCurrentUserGroup(userGroup);
    setMenuPermissionModalOpen(true);
  };

  // Close menu-permission modal.
  const handleMenuPermissionModalClose = () => {
    setMenuPermissionModalOpen(false);
    setCurrentUserGroup(null);
  };

  // Handle menu-permission save success.
  const handleMenuPermissionSuccess = () => {
    setMenuPermissionModalOpen(false);
    setCurrentUserGroup(null);
    actionRef.current?.reload();
  };

  // Configure data permission.
  const handleDataPermission = (userGroup: UserGroupInfo) => {
    setCurrentUserGroup(userGroup);
    setDataPermissionModalOpen(true);
  };

  // Confirm delete.
  const handleDeleteConfirm = (userGroup: UserGroupInfo) => {
    modalConfirm(
      t('PC.Pages.SystemUserGroupManage.deleteTitle'),
      t('PC.Pages.SystemUserGroupManage.deleteConfirm', userGroup.name),
      () => {
        runDelete(userGroup?.id);
        return new Promise((resolve) => {
          setTimeout(resolve, 300);
        });
      },
    );
  };

  // Update user-group order.
  const { run: runUpdateUserGroupSort } = useRequest(apiUpdateUserGroupSort, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success(t('PC.Pages.SystemUserGroupManage.sortUpdated'));
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

    const updateItems: UpdateUserGroupSortItem[] = newData.map(
      (item, index) => ({
        id: item.id,
        name: item.name,
        sortIndex: index + 1,
      }),
    );

    if (updateItems.length > 0) {
      runUpdateUserGroupSort({
        items: updateItems,
      });
    }
  };

  // Table columns.
  const columns: ProColumns<UserGroupInfo & { key: number }>[] = [
    {
      title: t('PC.Pages.SystemUserGroupManage.columnSort'),
      key: 'sort',
      align: 'center',
      width: 80,
      fixed: 'left',
      hideInSearch: true,
      render: () => <DragHandle />,
    },
    {
      title: t('PC.Pages.SystemUserGroupManage.columnName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      valueType: 'text',
    },
    {
      title: t('PC.Pages.SystemUserGroupManage.columnCode'),
      dataIndex: 'code',
      key: 'code',
      width: 150,
      valueType: 'text',
    },
    {
      title: t('PC.Pages.SystemUserGroupManage.columnDescription'),
      dataIndex: 'description',
      key: 'description',
      width: 300,
      hideInSearch: true,
      ellipsis: true,
    },
    {
      title: (
        <span>
          {t('PC.Pages.SystemUserGroupManage.columnStatus')}
          <Tooltip title={t('PC.Pages.SystemUserGroupManage.statusTip')}>
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
      render: (_: ReactNode, record: UserGroupInfo & { key: number }) => (
        <Tooltip
          title={
            record.source === UserGroupSourceEnum.SystemBuiltIn
              ? t('PC.Pages.SystemUserGroupManage.builtInCannotDisable')
              : ''
          }
        >
          <Switch
            disabled={record.source === UserGroupSourceEnum.SystemBuiltIn}
            checked={record.status === UserGroupStatusEnum.Enabled}
            checkedChildren={t('PC.Pages.SystemUserGroupManage.enabled')}
            unCheckedChildren={t('PC.Pages.SystemUserGroupManage.disabled')}
            loading={updateStatusLoadingMap[record.id] || false}
            onChange={(checked) => handleUpdateStatus(record, checked)}
          />
        </Tooltip>
      ),
    },
    {
      title: t('PC.Pages.SystemUserGroupManage.columnAction'),
      key: 'action',
      align: 'center',
      width: 260,
      fixed: 'right',
      hideInSearch: true,
      render: (_: ReactNode, record: UserGroupInfo & { key: number }) => {
        // Built-in user-group checks.
        const isSystemBuiltIn =
          record.source === UserGroupSourceEnum.SystemBuiltIn;

        // Edit permission checks.
        const canEdit =
          hasPermissionByMenuCode(
            'user_group_manage',
            'user_group_manage_modify',
          ) && !isSystemBuiltIn;
        const editTooltip = isSystemBuiltIn
          ? t('PC.Pages.SystemUserGroupManage.builtInCannotEdit')
          : !hasPermissionByMenuCode(
              'user_group_manage',
              'user_group_manage_modify',
            )
          ? t('PC.Pages.SystemUserGroupManage.noPermission')
          : '';

        // Delete permission checks.
        const canDelete =
          hasPermissionByMenuCode(
            'user_group_manage',
            'user_group_manage_delete',
          ) && !isSystemBuiltIn;
        const deleteTooltip = isSystemBuiltIn
          ? t('PC.Pages.SystemUserGroupManage.builtInCannotDelete')
          : !hasPermissionByMenuCode(
              'user_group_manage',
              'user_group_manage_delete',
            )
          ? t('PC.Pages.SystemUserGroupManage.noPermission')
          : '';

        // Build more actions menu.
        const moreActionList: CustomPopoverItem[] = [
          {
            key: 'edit',
            label: t('PC.Pages.SystemUserGroupManage.edit'),
            disabled: !canEdit,
            tooltip: editTooltip,
          },
          {
            key: 'delete',
            label: t('PC.Pages.SystemUserGroupManage.delete'),
            disabled: !canDelete,
            tooltip: deleteTooltip,
          },
        ];

        // Handle more action click.
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
                !hasPermissionByMenuCode(
                  'user_group_manage',
                  'user_group_manage_bind_user',
                )
                  ? t('PC.Pages.SystemUserGroupManage.noPermission')
                  : ''
              }
            >
              <Button
                type="link"
                size="small"
                disabled={
                  !hasPermissionByMenuCode(
                    'user_group_manage',
                    'user_group_manage_bind_user',
                  )
                }
                onClick={() => handleBindUser(record)}
              >
                {t('PC.Pages.SystemUserGroupManage.bindUser')}
              </Button>
            </Tooltip>
            <Tooltip
              title={
                !hasPermissionByMenuCode(
                  'user_group_manage',
                  'user_group_manage_bind_menu',
                )
                  ? t('PC.Pages.SystemUserGroupManage.noPermission')
                  : ''
              }
            >
              <Button
                type="link"
                size="small"
                disabled={
                  !hasPermissionByMenuCode(
                    'user_group_manage',
                    'user_group_manage_bind_menu',
                  )
                }
                onClick={() => handleMenuPermission(record)}
              >
                {t('PC.Pages.SystemUserGroupManage.menuPermission')}
              </Button>
            </Tooltip>
            <Tooltip
              title={
                !hasPermissionByMenuCode(
                  'user_group_manage',
                  'user_group_manage_bind_data',
                )
                  ? t('PC.Pages.SystemUserGroupManage.noPermission')
                  : ''
              }
            >
              <Button
                type="link"
                size="small"
                disabled={
                  !hasPermissionByMenuCode(
                    'user_group_manage',
                    'user_group_manage_bind_data',
                  )
                }
                onClick={() => handleDataPermission(record)}
              >
                {t('PC.Pages.SystemUserGroupManage.dataPermission')}
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
      title={t('PC.Pages.SystemUserGroupManage.pageTitle')}
      hideScroll
      rightSlot={
        hasPermissionByMenuCode(
          'user_group_manage',
          'user_group_manage_add',
        ) && (
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            {t('PC.Pages.SystemUserGroupManage.add')}
          </Button>
        )
      }
    >
      {/* User-group list */}
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={draggableData.map((item) => String(item.key))}
          strategy={verticalListSortingStrategy}
        >
          <XProTable<UserGroupInfo & { key: number }>
            actionRef={actionRef}
            formRef={formRef}
            rowKey="key"
            columns={columns}
            request={request}
            dataSource={draggableData}
            pagination={false}
            scroll={{ x: 1090 }}
            className={cx(styles.table)}
            showQueryButtons={hasPermissionByMenuCode(
              'user_group_manage',
              'user_group_manage_query',
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
            postData={(data: (UserGroupInfo & { key: number })[]) => {
              if (!isDraggingRef.current) {
                setDraggableData(data || []);
              }
              return data;
            }}
            locale={{
              emptyText: (
                <Empty
                  description={t('PC.Pages.SystemUserGroupManage.empty')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className={cx(styles.empty)}
                />
              ),
            }}
          />
        </SortableContext>
      </DndContext>

      {/* Create/Edit user-group modal */}
      <UserGroupFormModal
        open={modalOpen}
        isEdit={isEdit}
        /** Default sort index for create mode. */
        defaultSortIndex={defaultSortIndex}
        /** User-group info for edit mode. */
        userGroupInfo={currentUserGroup}
        /** Cancel callback. */
        onCancel={handleModalCancel}
        /** Success callback. */
        onSuccess={handleModalSuccess}
      />

      {/* Menu permission modal */}
      <MenuPermissionModal
        open={menuPermissionModalOpen}
        type="userGroup"
        targetId={currentUserGroup?.id || 0}
        name={currentUserGroup?.name || ''}
        onClose={handleMenuPermissionModalClose}
        onSuccess={handleMenuPermissionSuccess}
      />

      {/* Data permission modal */}
      <DataPermissionModal
        open={dataPermissionModalOpen}
        targetId={currentUserGroup?.id || 0}
        type="userGroup"
        name={currentUserGroup?.name}
        onCancel={() => {
          setDataPermissionModalOpen(false);
          setCurrentUserGroup(null);
        }}
      />

      {/* Bind-user drawer */}
      <BindUser
        targetId={currentUserGroup?.id || 0}
        name={currentUserGroup?.name || ''}
        type="userGroup"
        open={groupBindUserOpen}
        onCancel={() => setGroupBindUserOpen(false)}
      />
    </WorkspaceLayout>
  );
};

export default UserGroupManage;
