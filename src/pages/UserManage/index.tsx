import {
  ActionItem,
  TableActions,
  XProTable,
} from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiDisableSystemUser,
  apiEnableSystemUser,
  apiSystemUserList,
} from '@/services/systemManage';
import styles from '@/styles/systemManage.less';
import { UserRoleEnum, UserStatusEnum } from '@/types/enums/systemManage';
import type { SystemUserListInfo } from '@/types/interfaces/systemManage';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useRef, useState } from 'react';
import { useModel } from 'umi';
import DataPermissionModal from './components/DataPermissionModal';
import UserAuthModal from './components/UserAuthModal';
import UserFormModal from './components/UserFormModal';
import UserViewMenuModal from './components/UserViewMenuModal';
import MessageSendModal from './MessageSendModal';

const cx = classNames.bind(styles);

/**
 * 用户管理
 */
const UserManage: React.FC = () => {
  const { hasPermission } = useModel('menuModel');

  const actionRef = useRef<ActionType>();
  const [currentUserInfo, setCurrentUserInfo] =
    useState<SystemUserListInfo | null>(null);

  // 状态弹窗控制
  const [messageSendOpen, setMessageSendOpen] = useState(false);
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [openViewMenuModal, setOpenViewMenuModal] = useState(false);
  const [openDataPermissionModal, setOpenDataPermissionModal] = useState(false);
  const [openUserFormModal, setOpenUserFormModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // 操作处理函数
  const handleAddUser = useCallback(() => {
    setIsEdit(false);
    setCurrentUserInfo(null);
    setOpenUserFormModal(true);
  }, []);

  const handleEditUser = useCallback((record: SystemUserListInfo) => {
    setIsEdit(true);
    setCurrentUserInfo(record);
    setOpenUserFormModal(true);
  }, []);

  const handleAuth = useCallback((userInfo: SystemUserListInfo) => {
    setCurrentUserInfo(userInfo);
    setOpenAuthModal(true);
  }, []);

  const handleViewMenu = useCallback((userInfo: SystemUserListInfo) => {
    setCurrentUserInfo(userInfo);
    setOpenViewMenuModal(true);
  }, []);

  const handleViewDataPermission = useCallback(
    (userInfo: SystemUserListInfo) => {
      setCurrentUserInfo(userInfo);
      setOpenDataPermissionModal(true);
    },
    [],
  );

  const handleEnable = useCallback(async (record: SystemUserListInfo) => {
    const res = await apiEnableSystemUser({ id: record.id });
    if (res.code === SUCCESS_CODE) {
      message.success('启用成功');
      actionRef.current?.reload();
    }
  }, []);

  const handleDisable = useCallback(async (record: SystemUserListInfo) => {
    const res = await apiDisableSystemUser({ id: record.id });
    if (res.code === SUCCESS_CODE) {
      message.success('禁用成功');
      actionRef.current?.reload();
    }
  }, []);

  const handleSuccess = useCallback(() => {
    setOpenUserFormModal(false);
    actionRef.current?.reload();
  }, []);

  // 操作列配置
  const getActions = useCallback(
    (record: SystemUserListInfo): ActionItem<SystemUserListInfo>[] => {
      return [
        {
          key: 'edit',
          label: '修改',
          isShow: hasPermission('user_manage_modify'),
          onClick: handleEditUser,
        },
        {
          key: 'disable',
          label: '禁用',
          isShow:
            hasPermission('user_manage_disable') &&
            record.status === UserStatusEnum.Enabled,
          onClick: handleDisable,
        },
        {
          key: 'enable',
          label: '启用',
          isShow:
            hasPermission('user_manage_enable') &&
            record.status !== UserStatusEnum.Enabled,
          onClick: handleEnable,
        },
        {
          key: 'auth',
          label: '授权',
          isShow:
            hasPermission('user_manage_bind_role') ||
            hasPermission('user_manage_bind_group'),
          onClick: handleAuth,
        },
        {
          key: 'viewMenu',
          label: '查看菜单资源权限',
          isShow: hasPermission('user_manage_query_menu_permission'),
          onClick: handleViewMenu,
        },
        {
          key: 'dataPermission',
          label: '查看数据权限',
          isShow: hasPermission('user_manage_query_data_permission'),
          onClick: handleViewDataPermission,
        },
      ];
    },
    [
      hasPermission,
      handleEditUser,
      handleEnable,
      handleDisable,
      handleAuth,
      handleViewMenu,
      handleViewDataPermission,
    ],
  );

  const columns: ProColumns<SystemUserListInfo>[] = [
    {
      title: '用户名',
      dataIndex: 'userName',
      width: 160,
      fieldProps: { placeholder: '用户姓名' },
    },
    {
      title: '昵称',
      dataIndex: 'nickName',
      width: 100,
      hideInSearch: true,
    },
    {
      title: '手机号码',
      dataIndex: 'phone',
      width: 140,
      hideInSearch: true,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      hideInSearch: true,
    },
    {
      title: '类型',
      dataIndex: 'role',
      width: 100,
      valueType: 'select',
      valueEnum: {
        [UserRoleEnum.Admin]: { text: '管理员' },
        [UserRoleEnum.User]: { text: '成员' },
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      hideInSearch: true,
      render: (_, record: SystemUserListInfo) => {
        const isEnabled = record.status === UserStatusEnum.Enabled;
        return (
          <span>
            <span
              className={cx(
                styles['dot-circle'],
                isEnabled ? styles['dot-green'] : styles['dot-red'],
              )}
            ></span>
            {isEnabled ? '正常' : '禁用'}
          </span>
        );
      },
    },
    {
      title: '加入时间',
      dataIndex: 'created',
      width: 180,
      hideInSearch: true,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      fixed: 'right',
      align: 'center',
      width: 220,
      render: (_, record) => (
        <TableActions<SystemUserListInfo>
          record={record}
          actions={getActions(record)}
        />
      ),
    },
  ];

  const request = async (params: {
    pageSize?: number;
    current?: number;
    userName?: string;
    role?: string;
  }) => {
    const response = await apiSystemUserList({
      pageNo: params.current || 1,
      pageSize: params.pageSize || 15,
      queryFilter: {
        role: params.role || undefined,
        userName: params.userName,
      },
    });

    return {
      data: response.data.records,
      total: response.data.total,
      success: response.code === SUCCESS_CODE,
    };
  };

  return (
    <WorkspaceLayout
      title="用户管理"
      hideScroll
      rightSlot={[
        hasPermission('user_manage_add') && (
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddUser}
          >
            添加用户
          </Button>
        ),
        hasPermission('user_manage_send_message') && (
          <Button
            key="message"
            type="primary"
            onClick={() => setMessageSendOpen(true)}
          >
            消息发送
          </Button>
        ),
      ]}
    >
      <XProTable<SystemUserListInfo>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={request}
        showQueryButtons={hasPermission('user_manage_query')}
      />

      <UserFormModal
        open={openUserFormModal}
        isEdit={isEdit}
        record={currentUserInfo}
        onCancel={() => setOpenUserFormModal(false)}
        onSuccess={handleSuccess}
      />
      <MessageSendModal
        open={messageSendOpen}
        onCancel={() => setMessageSendOpen(false)}
      />
      <UserAuthModal
        open={openAuthModal}
        targetId={currentUserInfo?.id || 0}
        role={currentUserInfo?.role}
        onCancel={() => setOpenAuthModal(false)}
      />
      <UserViewMenuModal
        open={openViewMenuModal}
        userId={currentUserInfo?.id || 0}
        onCancel={() => setOpenViewMenuModal(false)}
      />
      <DataPermissionModal
        open={openDataPermissionModal}
        userId={currentUserInfo?.id || 0}
        userName={currentUserInfo?.userName || ''}
        onCancel={() => setOpenDataPermissionModal(false)}
      />
    </WorkspaceLayout>
  );
};

export default UserManage;
