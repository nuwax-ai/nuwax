import {
  apiDisableSystemUser,
  apiEnableSystemUser,
  apiSystemUserList,
} from '@/services/systemManage';
import styles from '@/styles/systemManage.less';
import { UserRoleEnum, UserStatusEnum } from '@/types/enums/systemManage';
import type { SystemUserListInfo } from '@/types/interfaces/systemManage';
import {
  CheckOutlined,
  EllipsisOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { MenuProps } from 'antd';
import { Button, Dropdown, Input, Select, Space, Table, message } from 'antd';
import { ColumnType } from 'antd/es/table';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import CreateModifyUser from './components/createModifyUser';
import DataPermissionModal from './components/DataPermissionModal';
import UserBindGroupModal from './components/UserBindGroupModal';
import UserBindRoleModal from './components/UserBindRoleModal';
import UserViewMenuModal from './components/UserViewMenuModal';
import MessageSendModal from './MessageSendModal';

const cx = classNames.bind(styles);

const selectOptions = [
  { value: '', label: '全部' },
  { value: UserRoleEnum.Admin, label: '管理员' },
  { value: UserRoleEnum.User, label: '成员' },
];

/**
 * 用户管理
 */
const UserManage: React.FC = () => {
  const [selectedValue, setSelectedValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [enableLoadingMap, setEnableLoadingMap] = useState<
    Record<number, boolean>
  >({});
  const [disableLoadingMap, setDisableLoadingMap] = useState<
    Record<number, boolean>
  >({});
  // 消息发送弹窗是否打开
  const [messageSendOpen, setMessageSendOpen] = useState<boolean>(false);

  // 打开绑定角色弹窗
  const [openBindRoleModal, setOpenBindRoleModal] = useState<boolean>(false);
  // 打开绑定用户组弹窗
  const [openBindGroupModal, setOpenBindGroupModal] = useState<boolean>(false);
  // 打开查看权限弹窗
  const [openViewMenuModal, setOpenViewMenuModal] = useState<boolean>(false);
  // 打开数据权限弹窗
  const [openDataPermissionModal, setOpenDataPermissionModal] =
    useState<boolean>(false);

  // 当前选中的用户信息
  const [currentUserInfo, setCurrentUserInfo] =
    useState<SystemUserListInfo | null>(null);

  // 查询用户列表
  const { data, run, refresh, loading } = useRequest(apiSystemUserList, {
    debounceWait: 300,
    defaultParams: [
      {
        pageNo: currentPage,
        pageSize: 10,
        queryFilter: {
          role: selectedValue || undefined,
          userName: inputValue,
        },
      },
    ],
  });

  const { run: runEnable } = useRequest(apiEnableSystemUser, {
    manual: true,
    onBefore: (params) => {
      setEnableLoadingMap((prev) => ({ ...prev, [params[0].id]: true }));
    },
    onSuccess: () => {
      message.success('启用成功');
      refresh();
    },
    onFinally: (params) => {
      setEnableLoadingMap((prev) => ({ ...prev, [params[0].id]: false }));
    },
  });

  const { run: runDisable } = useRequest(apiDisableSystemUser, {
    manual: true,
    onBefore: (params) => {
      setDisableLoadingMap((prev) => ({ ...prev, [params[0].id]: true }));
    },
    onSuccess: () => {
      message.success('禁用成功');
      refresh();
    },
    onFinally: (params) => {
      setDisableLoadingMap((prev) => ({ ...prev, [params[0].id]: false }));
    },
  });

  const getParams = (
    page: number,
    role: UserRoleEnum | undefined,
    keyword: string,
  ) => {
    return {
      pageNo: page,
      pageSize: 10,
      queryFilter: {
        role: role || undefined,
        userName: keyword,
      },
    };
  };

  const handleSelectChange = (value: string) => {
    setSelectedValue(value);
    setCurrentPage(1);
    const params = getParams(1, value as UserRoleEnum, inputValue);
    run(params);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setCurrentPage(1);
    const params = getParams(1, selectedValue as UserRoleEnum, value);
    run(params);
  };

  const handleTableChange = (page: number) => {
    setCurrentPage(page); // 更新当前页码
    const params = getParams(page, selectedValue as UserRoleEnum, inputValue);
    run(params);
  };

  const handleSuccess = (isEdit: boolean) => {
    if (isEdit) {
      refresh();
      return;
    }
    setSelectedValue('');
    setInputValue('');
    setCurrentPage(1);
    const params = getParams(1, selectedValue as UserRoleEnum, inputValue);
    run(params);
  };

  // 绑定角色
  const handleBindRole = (userInfo: SystemUserListInfo) => {
    setCurrentUserInfo(userInfo);
    setOpenBindRoleModal(true);
  };

  // 绑定用户组
  const handleBindGroup = (userInfo: SystemUserListInfo) => {
    setCurrentUserInfo(userInfo);
    setOpenBindGroupModal(true);
  };

  // 查看权限
  const handleViewMenu = (userInfo: SystemUserListInfo) => {
    setCurrentUserInfo(userInfo);
    setOpenViewMenuModal(true);
  };

  // 查看数据权限
  const handleViewDataPermission = (userInfo: SystemUserListInfo) => {
    setCurrentUserInfo(userInfo);
    setOpenDataPermissionModal(true);
  };

  // 查询用户绑定的角色列表
  const columns = [
    {
      title: '用户名',
      dataIndex: 'userName',
      key: 'userName',
      width: 160,
      render: (text: string) => {
        return text ? text : '--';
      },
    },
    {
      title: '昵称',
      dataIndex: 'nickName',
      key: 'nickName',
      width: 100,
    },
    {
      title: '手机号码',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (text: string) => {
        return text ? text : '--';
      },
    },
    {
      title: '类型',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: UserRoleEnum) => {
        switch (role) {
          case UserRoleEnum.Admin:
            return '管理员';
          case UserRoleEnum.User:
            return '成员';
          default:
            return '--';
        }
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: UserStatusEnum) => {
        let statusText = '';
        let dotStyle = '';
        switch (status) {
          case UserStatusEnum.Disabled:
            statusText = '禁用';
            dotStyle = styles['dot-red'];
            break;
          case UserStatusEnum.Enabled:
            statusText = '正常';
            dotStyle = styles['dot-green'];
            break;
        }
        return (
          <span>
            <span className={cx(styles['dot-circle'], dotStyle)}></span>
            {statusText}
          </span>
        );
      },
    },
    {
      title: '加入时间',
      dataIndex: 'created',
      key: 'created',
      width: 180,
      render: (created: string) => {
        return dayjs(created).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      fixed: 'right',
      render: (_: null, record: SystemUserListInfo) => {
        // 下拉菜单项
        const menuItems: MenuProps['items'] = [
          {
            key: 'bindRole',
            label: '绑定角色',
            onClick: () => handleBindRole(record),
          },
          {
            key: 'bindGroup',
            label: '绑定用户组',
            onClick: () => handleBindGroup(record),
          },
          {
            key: 'viewMenu',
            label: '查看权限',
            onClick: () => handleViewMenu(record),
          },
          {
            key: 'dataPermission',
            label: '数据权限',
            onClick: () => handleViewDataPermission(record),
          },
        ];

        return (
          <Space size={0} wrap={false}>
            {record.status === UserStatusEnum.Enabled ? (
              <Button
                type="link"
                size="small"
                className={cx(styles['table-action-ant-btn-link'])}
                loading={disableLoadingMap[record.id] || false}
                onClick={() => runDisable({ id: record.id })}
              >
                禁用
              </Button>
            ) : (
              <Button
                type="link"
                size="small"
                className={cx(styles['table-action-ant-btn-link'])}
                loading={enableLoadingMap[record.id] || false}
                onClick={() => runEnable({ id: record.id })}
              >
                启用
              </Button>
            )}
            <CreateModifyUser
              isEdit={true}
              record={record}
              onSuccess={handleSuccess}
            />
            <Dropdown
              menu={{ items: menuItems }}
              trigger={['hover']}
              placement="bottomRight"
            >
              <Button
                type="link"
                size="small"
                className={cx(styles['table-action-ant-btn-link'])}
                icon={<EllipsisOutlined />}
                style={{ padding: '0 4px' }}
              />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div className={cx(styles['system-manage-container'], 'scroll-container')}>
      <h3 className={cx(styles['system-manage-title'])}>用户管理</h3>
      <section className={cx('flex', 'content-between', 'flex-wrap', 'gap-10')}>
        <Select
          className={cx(styles['select-132'])}
          options={selectOptions}
          defaultValue=""
          onChange={handleSelectChange}
          optionLabelProp="label"
          popupRender={(menu) => <>{menu}</>}
          menuItemSelectedIcon={<CheckOutlined style={{ marginRight: 8 }} />}
        />
        <div className={cx('flex', 'gap-10', 'flex-wrap')}>
          <Input
            className={cx(styles['search-input-225'])}
            placeholder="请输入手机号码邮箱或昵称"
            prefix={<SearchOutlined />}
            onPressEnter={(event) => {
              if (event.key === 'Enter') {
                handleInputChange(
                  (event.currentTarget as HTMLInputElement).value,
                );
              }
            }}
          />
          <CreateModifyUser isEdit={false} onSuccess={handleSuccess} />
          <Button type="primary" onClick={() => setMessageSendOpen(true)}>
            消息发送
          </Button>
        </div>
      </section>

      <Table
        rowClassName={cx(styles['table-row-divider'])}
        className={cx('mt-30')}
        rowKey="id"
        loading={loading}
        columns={columns as ColumnType<SystemUserListInfo>[]}
        dataSource={data?.data?.records || []}
        scroll={{ x: 'max-content' }}
        pagination={{
          total: data?.data.total,
          showSizeChanger: true,
          onChange: handleTableChange,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
      <MessageSendModal
        open={messageSendOpen}
        onCancel={() => setMessageSendOpen(false)}
      />
      {/* 绑定角色弹窗 */}
      <UserBindRoleModal
        open={openBindRoleModal}
        targetId={currentUserInfo?.id || 0}
        onCancel={() => setOpenBindRoleModal(false)}
        onConfirm={() => setOpenBindRoleModal(false)}
      />
      {/* 绑定组弹窗 */}
      <UserBindGroupModal
        open={openBindGroupModal}
        targetId={currentUserInfo?.id || 0}
        onCancel={() => setOpenBindGroupModal(false)}
        onConfirm={() => setOpenBindGroupModal(false)}
      />
      {/* 查看权限弹窗 */}
      <UserViewMenuModal
        open={openViewMenuModal}
        userId={currentUserInfo?.id || 0}
        onCancel={() => setOpenViewMenuModal(false)}
      />
      {/* 数据权限弹窗 */}
      <DataPermissionModal
        open={openDataPermissionModal}
        userId={currentUserInfo?.id || 0}
        userName={currentUserInfo?.userName || ''}
        onCancel={() => setOpenDataPermissionModal(false)}
      />
    </div>
  );
};

export default UserManage;
