import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Grid, message, Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import MenuPermissionDrawer from '../components/MenuPermissionDrawer';
import {
  apiDeleteUserGroup,
  apiGetUserGroupList,
} from '../services/user-group-manage';
import type { UserGroupInfo } from '../types/user-group-manage';
import UserGroupCard from './components/UserGroupCard';
import UserGroupFormModal from './components/UserGroupFormModal';
import styles from './index.less';

const { useBreakpoint } = Grid;
const cx = classNames.bind(styles);

/**
 * 用户组管理页面
 * 用于管理用户组，分配角色和菜单权限
 */
const UserGroupManage: React.FC = () => {
  const screens = useBreakpoint();
  const [deleteLoadingMap, setDeleteLoadingMap] = useState<
    Record<number, boolean>
  >({});
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [editingUserGroup, setEditingUserGroup] =
    useState<UserGroupInfo | null>();
  const [menuPermissionDrawerOpen, setMenuPermissionDrawerOpen] =
    useState<boolean>(false);
  const [menuPermissionUserGroup, setMenuPermissionUserGroup] =
    useState<UserGroupInfo | null>();

  // 查询用户组列表
  const {
    run: runGetUserGroupList,
    data: userGroupList,
    loading,
  } = useRequest(apiGetUserGroupList, {
    manual: true,
  });

  useEffect(() => {
    runGetUserGroupList();
  }, []);

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

  // 处理编辑
  const handleEdit = (userGroup: UserGroupInfo) => {
    setEditingUserGroup(userGroup);
    setIsEdit(true);
    setModalOpen(true);
  };

  // 处理删除
  const handleDelete = (userGroup: UserGroupInfo) => {
    runDelete(userGroup?.id);
  };

  // 处理新增
  const handleAdd = () => {
    setEditingUserGroup(null);
    setIsEdit(false);
    setModalOpen(true);
  };

  // 处理Modal关闭
  const handleModalCancel = () => {
    setModalOpen(false);
    setEditingUserGroup(null);
  };

  // 处理Modal成功
  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingUserGroup(null);
    runGetUserGroupList();
  };

  // 处理菜单权限
  const handleMenuPermission = (userGroup: UserGroupInfo) => {
    setMenuPermissionUserGroup(userGroup);
    setMenuPermissionDrawerOpen(true);
  };

  // 处理菜单权限抽屉关闭
  const handleMenuPermissionDrawerClose = () => {
    setMenuPermissionDrawerOpen(false);
    setMenuPermissionUserGroup(null);
  };

  // 处理菜单权限保存成功
  const handleMenuPermissionSuccess = () => {
    setMenuPermissionDrawerOpen(false);
    setMenuPermissionUserGroup(null);
    runGetUserGroupList();
  };

  // 计算每行显示的列数（响应式）
  const getCols = () => {
    if (screens.xxl) return 4;
    if (screens.xl) return 3;
    if (screens.lg) return 3;
    if (screens.md) return 2;
    if (screens.sm) return 2;
    return 1;
  };

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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className={cx(styles.addButton)}
        >
          新增用户组
        </Button>
      </div>

      {/* 用户组列表 */}
      <div className={cx(styles.content)}>
        <Spin spinning={loading}>
          {!userGroupList?.length ? (
            <Empty
              description="暂无用户组数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className={cx(styles.empty)}
            />
          ) : (
            <div
              className={cx(styles.cardList)}
              style={{
                gridTemplateColumns: `repeat(${getCols()}, 1fr)`,
              }}
            >
              {userGroupList?.map((userGroup: UserGroupInfo) => (
                <UserGroupCard
                  key={userGroup.id}
                  userGroup={userGroup}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onMenuPermission={handleMenuPermission}
                  deleteLoading={deleteLoadingMap[userGroup.id] || false}
                />
              ))}
            </div>
          )}
        </Spin>
      </div>

      {/* 新增/编辑用户组Modal */}
      <UserGroupFormModal
        open={modalOpen}
        isEdit={isEdit}
        userGroupInfo={editingUserGroup}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />

      {/* 菜单权限配置Drawer */}
      <MenuPermissionDrawer
        open={menuPermissionDrawerOpen}
        type="userGroup"
        targetId={menuPermissionUserGroup?.id || 0}
        name={menuPermissionUserGroup?.name || ''}
        onClose={handleMenuPermissionDrawerClose}
        onSuccess={handleMenuPermissionSuccess}
      />
    </div>
  );
};

export default UserGroupManage;
