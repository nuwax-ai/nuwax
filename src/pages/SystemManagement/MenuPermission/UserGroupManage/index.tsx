import { modalConfirm } from '@/utils/ant-custom';
import { PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Empty, message, Space, Spin, Table, Tag } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useRequest } from 'umi';
import BindUser from '../components/BindUser';
import MenuPermissionModal from '../components/MenuPermissionModal';
import {
  apiDeleteUserGroup,
  apiGetUserGroupList,
} from '../services/user-group-manage';
import type { UserGroupInfo } from '../types/user-group-manage';
import { UserGroupStatusEnum } from '../types/user-group-manage';
import UserGroupFormModal from './components/UserGroupFormModal';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 用户组管理页面
 * 用于管理用户组，分配角色和菜单权限
 */
const UserGroupManage: React.FC = () => {
  const location = useLocation();
  // 删除用户组loading map
  const [deleteLoadingMap, setDeleteLoadingMap] = useState<
    Record<number, boolean>
  >({});
  // 新增/编辑用户组Modal是否打开
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  // 是否为编辑用户组
  const [isEdit, setIsEdit] = useState<boolean>(false);
  // 菜单权限弹窗是否打开
  const [menuPermissionModalOpen, setMenuPermissionModalOpen] =
    useState<boolean>(false);
  // 组绑定用户弹窗是否打开
  const [groupBindUserOpen, setGroupBindUserOpen] = useState<boolean>(false);
  // 当前用户组信息
  const [currentUserGroup, setCurrentUserGroup] =
    useState<UserGroupInfo | null>();

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
    const state = location.state as any;
    if (state?._t) {
      // 查询用户组列表
      runGetUserGroupList();
    }
  }, [location.state]);

  // 删除用户组
  const { run: runDelete } = useRequest(apiDeleteUserGroup, {
    manual: true,
    loadingDelay: 300,
    onBefore: (userGroupId: number) => {
      setDeleteLoadingMap((prev) => ({ ...prev, [userGroupId]: true }));
    },
    onSuccess: () => {
      message.success('删除成功');
      runGetUserGroupList();
    },
    onError: () => {
      message.error('删除失败');
    },
    onFinally: (userGroupId: number) => {
      setDeleteLoadingMap((prev) => ({ ...prev, [userGroupId]: false }));
    },
  });

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
  };

  // 处理Modal关闭
  const handleModalCancel = () => {
    setModalOpen(false);
    setCurrentUserGroup(null);
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

  // 定义表格列
  const columns: TableColumnsType<UserGroupInfo & { key: number }> = [
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
      render: (status: UserGroupStatusEnum) => (
        <Tag
          color={status === UserGroupStatusEnum.Enabled ? 'success' : 'default'}
        >
          {status === UserGroupStatusEnum.Enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right',
      render: (_: any, record: UserGroupInfo) => (
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
          <h1 className={cx(styles.title)}>用户组管理</h1>
          <p className={cx(styles.description)}>
            管理用户组,分配角色和菜单权限
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增用户组
        </Button>
      </div>

      {/* 用户组列表 */}
      <div className={cx(styles.content)}>
        <Spin spinning={loading}>
          {!tableData?.length ? (
            <Empty
              description="暂无用户组数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className={cx(styles.empty)}
            />
          ) : (
            <Table<UserGroupInfo & { key: number }>
              columns={columns}
              dataSource={tableData}
              pagination={false}
              scroll={{ x: 'max-content' }}
              className={cx(styles.table)}
            />
          )}
        </Spin>
      </div>

      {/* 新增/编辑用户组Modal */}
      <UserGroupFormModal
        open={modalOpen}
        isEdit={isEdit}
        userGroupInfo={currentUserGroup}
        onCancel={handleModalCancel}
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
    </div>
  );
};

export default UserGroupManage;
