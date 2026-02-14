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
  apiDeleteUserGroup,
  apiGetUserGroupList,
  apiUpdateUserGroup,
  apiUpdateUserGroupSort,
} from '../services/user-group-manage';
import type {
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
 * 用户组管理页面
 * 用于管理用户组，分配角色和菜单权限
 */
const UserGroupManage: React.FC = () => {
  const location = useLocation();
  // 更新状态loading map
  const [updateStatusLoadingMap, setUpdateStatusLoadingMap] = useState<
    Record<number, boolean>
  >({});
  // 新增/编辑用户组Modal是否打开
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  // 是否为编辑用户组
  const [isEdit, setIsEdit] = useState<boolean>(false);
  // 菜单权限弹窗是否打开
  const [menuPermissionModalOpen, setMenuPermissionModalOpen] =
    useState<boolean>(false);
  // 数据权限弹窗是否打开
  const [dataPermissionModalOpen, setDataPermissionModalOpen] =
    useState<boolean>(false);
  // 组绑定用户弹窗是否打开
  const [groupBindUserOpen, setGroupBindUserOpen] = useState<boolean>(false);
  // 当前用户组信息
  const [currentUserGroup, setCurrentUserGroup] =
    useState<UserGroupInfo | null>();

  // 拖拽排序的数据源
  const [draggableData, setDraggableData] = useState<
    (UserGroupInfo & { key: number })[]
  >([]);

  // 新增时，默认排序索引，默认1
  const [defaultSortIndex, setDefaultSortIndex] = useState<number>(1);

  // 权限检查
  const { hasPermissionByMenuCode } = useModel('menuModel');

  // 查询用户组列表
  const {
    run: runGetUserGroupList,
    data: userGroupList,
    loading,
  } = useRequest(apiGetUserGroupList, {
    manual: true,
  });

  // 监听 location.state 变化
  // 当 state 中存在 _t 变量时，说明是通过菜单切换过来的，需要清空 query 参数
  useEffect(() => {
    // 查询用户组列表
    runGetUserGroupList();
  }, [location.state]);

  // 删除用户组
  const { run: runDelete } = useRequest(apiDeleteUserGroup, {
    manual: true,
    onSuccess: () => {
      message.success('删除成功');
      runGetUserGroupList();
    },
  });

  // 更新用户组状态
  const { run: runUpdateUserGroup } = useRequest(apiUpdateUserGroup, {
    manual: true,
    onSuccess: () => {
      runGetUserGroupList();
    },
  });

  // 处理状态更新
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
      maxUserCount: record.maxUserCount,
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

  // 处理绑定用户
  const handleBindUser = (userGroup: UserGroupInfo) => {
    setCurrentUserGroup(userGroup);
    setGroupBindUserOpen(true);
  };

  // 处理编辑
  const handleEdit = (userGroup: UserGroupInfo) => {
    setCurrentUserGroup(userGroup);
    setIsEdit(true);
    setModalOpen(true);
  };

  // 处理新增
  const handleAdd = () => {
    setCurrentUserGroup(null);
    setIsEdit(false);
    setModalOpen(true);
    setDefaultSortIndex((draggableData?.length || 0) + 1);
  };

  // 处理Modal关闭
  const handleModalCancel = () => {
    setModalOpen(false);
    setCurrentUserGroup(null);
    setDefaultSortIndex(1);
  };

  // 处理Modal成功
  const handleModalSuccess = () => {
    setModalOpen(false);
    setCurrentUserGroup(null);
    runGetUserGroupList();
  };

  // 处理菜单权限
  const handleMenuPermission = (userGroup: UserGroupInfo) => {
    setCurrentUserGroup(userGroup);
    setMenuPermissionModalOpen(true);
  };

  // 处理菜单权限弹窗关闭
  const handleMenuPermissionModalClose = () => {
    setMenuPermissionModalOpen(false);
    setCurrentUserGroup(null);
  };

  // 处理菜单权限保存成功
  const handleMenuPermissionSuccess = () => {
    setMenuPermissionModalOpen(false);
    setCurrentUserGroup(null);
    runGetUserGroupList();
  };

  // 处理数据权限
  const handleDataPermission = (userGroup: UserGroupInfo) => {
    setCurrentUserGroup(userGroup);
    setDataPermissionModalOpen(true);
  };

  // 处理删除确认
  const handleDeleteConfirm = (userGroup: UserGroupInfo) => {
    modalConfirm(
      '删除用户组',
      `确认删除用户组 "${userGroup.name}" 吗？`,
      () => {
        runDelete(userGroup?.id);
        return new Promise((resolve) => {
          setTimeout(resolve, 300);
        });
      },
    );
  };

  // 转换数据格式，为树形数据添加 key 字段，并过滤掉根节点（id为0）
  const tableData = useMemo(() => {
    if (!userGroupList || !userGroupList.length) {
      return [];
    }

    const transformData = (data: UserGroupInfo[]): any[] => {
      return data.map((item) => ({
        ...item,
        key: item.id,
      }));
    };
    // 否则过滤掉所有 id 为 0 的节点，只保留其他节点
    const filteredList = userGroupList.filter(
      (item: UserGroupInfo) => item.id !== 0,
    );
    return filteredList.length > 0 ? transformData(filteredList) : [];
  }, [userGroupList]);

  // 同步 tableData 到 draggableData
  useEffect(() => {
    setDraggableData(tableData);
  }, [tableData]);

  // 更新用户组排序
  const { run: runUpdateUserGroupSort } = useRequest(apiUpdateUserGroupSort, {
    manual: true,
    onSuccess: () => {
      message.success('排序更新成功');
      runGetUserGroupList();
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

    // 收集所有需要更新的用户组（只更新受影响的行）
    const updateItems: UpdateUserGroupSortItem[] = newData.map(
      (item, index) => ({
        id: item.id,
        name: item.name,
        sortIndex: index + 1,
      }),
    );

    // 批量更新用户组排序
    if (updateItems.length > 0) {
      runUpdateUserGroupSort({
        items: updateItems,
      });
    }
  };

  // 定义表格列
  const columns: ProColumns<UserGroupInfo & { key: number }>[] = [
    {
      title: '排序',
      key: 'sort',
      align: 'center',
      width: 80,
      fixed: 'left',
      render: () => <DragHandle />,
    },
    {
      title: '用户组名称',
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
      render: (_: ReactNode, record: UserGroupInfo & { key: number }) => (
        <div className={cx(styles.descriptionCell)} title={record.description}>
          {record.description || '--'}
        </div>
      ),
    },
    {
      title: (
        <span>
          状态
          <Tooltip title="启用或禁用此用户组">
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
      render: (_: ReactNode, record: UserGroupInfo & { key: number }) => (
        <Tooltip
          title={
            record.source === UserGroupSourceEnum.SystemBuiltIn
              ? '系统内置的用户组不能禁用'
              : ''
          }
        >
          <Switch
            disabled={record.source === UserGroupSourceEnum.SystemBuiltIn}
            checked={record.status === UserGroupStatusEnum.Enabled}
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
      render: (_: ReactNode, record: UserGroupInfo & { key: number }) => {
        // 判断是否为系统内置用户组
        const isSystemBuiltIn =
          record.source === UserGroupSourceEnum.SystemBuiltIn;

        // 编辑权限检查
        const canEdit =
          hasPermissionByMenuCode(
            'user_group_manage',
            'user_group_manage_modify',
          ) && !isSystemBuiltIn;
        const editTooltip = isSystemBuiltIn
          ? '系统内置的用户组不能编辑'
          : !hasPermissionByMenuCode(
              'user_group_manage',
              'user_group_manage_modify',
            )
          ? '无此资源权限'
          : '';

        // 删除权限检查
        const canDelete =
          hasPermissionByMenuCode(
            'user_group_manage',
            'user_group_manage_delete',
          ) && !isSystemBuiltIn;
        const deleteTooltip = isSystemBuiltIn
          ? '系统内置的用户组不能删除'
          : !hasPermissionByMenuCode(
              'user_group_manage',
              'user_group_manage_delete',
            )
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
                !hasPermissionByMenuCode(
                  'user_group_manage',
                  'user_group_manage_bind_user',
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
                    'user_group_manage',
                    'user_group_manage_bind_user',
                  )
                }
                onClick={() => handleBindUser(record)}
              >
                绑定用户
              </Button>
            </Tooltip>
            <Tooltip
              title={
                !hasPermissionByMenuCode(
                  'user_group_manage',
                  'user_group_manage_bind_menu',
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
                    'user_group_manage',
                    'user_group_manage_bind_menu',
                  )
                }
                onClick={() => handleMenuPermission(record)}
              >
                菜单权限
              </Button>
            </Tooltip>
            <Tooltip
              title={
                !hasPermissionByMenuCode(
                  'user_group_manage',
                  'user_group_manage_bind_data',
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
                    'user_group_manage',
                    'user_group_manage_bind_data',
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
      title="用户组管理"
      hideScroll
      rightSlot={[
        hasPermissionByMenuCode(
          'user_group_manage',
          'user_group_manage_query',
        ) && (
          <Button
            key="query"
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => runGetUserGroupList()}
            loading={loading}
          >
            查询
          </Button>
        ),
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
            新增用户组
          </Button>
        ),
      ]}
    >
      {/* 用户组列表 */}
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
            <XProTable<UserGroupInfo & { key: number }>
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
                    description="暂无用户组数据"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className={cx(styles.empty)}
                  />
                ),
              }}
            />
          </SortableContext>
        </DndContext>
      </Spin>

      {/* 新增/编辑用户组Modal */}
      <UserGroupFormModal
        open={modalOpen}
        isEdit={isEdit}
        /** 新增时，默认排序索引，默认1 */
        defaultSortIndex={defaultSortIndex}
        /** 编辑时的用户组数据 */
        userGroupInfo={currentUserGroup}
        /** 取消回调 */
        onCancel={handleModalCancel}
        /** 成功回调 */
        onSuccess={handleModalSuccess}
      />

      {/* 菜单权限配置Modal */}
      <MenuPermissionModal
        open={menuPermissionModalOpen}
        type="userGroup"
        targetId={currentUserGroup?.id || 0}
        name={currentUserGroup?.name || ''}
        onClose={handleMenuPermissionModalClose}
        onSuccess={handleMenuPermissionSuccess}
      />

      {/* 数据权限配置Modal */}
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

      {/* 组绑定用户弹窗 */}
      <BindUser
        targetId={currentUserGroup?.id || 0}
        name={currentUserGroup?.name || ''}
        type="userGroup"
        open={groupBindUserOpen}
        onCancel={() => setGroupBindUserOpen(false)}
        onConfirmBindUser={() => {
          setGroupBindUserOpen(false);
          runGetUserGroupList();
        }}
      />
    </WorkspaceLayout>
  );
};

export default UserGroupManage;
