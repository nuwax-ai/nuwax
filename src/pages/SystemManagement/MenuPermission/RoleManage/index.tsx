import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Grid, message, Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import BindUser from '../components/BindUser';
import MenuPermissionDrawer from '../components/MenuPermissionDrawer';
import { apiDeleteRole, apiGetRoleList } from '../services/role-manage';
import type { RoleInfo } from '../types/role-manage';
import RoleCard from './components/RoleCard';
import RoleFormModal from './components/RoleFormModal';
import styles from './index.less';

const { useBreakpoint } = Grid;
const cx = classNames.bind(styles);

/**
 * 角色管理页面
 * 用于管理系统角色，分配菜单权限和数据范围
 */
const RoleManage: React.FC = () => {
  const screens = useBreakpoint();
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
  // 菜单权限抽屉是否打开
  const [menuPermissionDrawerOpen, setMenuPermissionDrawerOpen] =
    useState<boolean>(false);
  // 角色绑定用户抽屉是否打开
  const [bindUserDrawerOpen, setBindUserDrawerOpen] = useState<boolean>(false);

  // 查询角色列表
  const {
    run: runGetRoleList,
    data: roleList,
    loading,
  } = useRequest(apiGetRoleList, {
    manual: true,
  });

  useEffect(() => {
    runGetRoleList();
  }, []);

  // 删除角色
  const { run: runDelete } = useRequest(apiDeleteRole, {
    manual: true,
    loadingDelay: 300,
    debounceWait: 300,
    // onBefore: (params: number[]) => {
    //   setDeleteLoadingMap((prev) => ({ ...prev, [params[0]]: true }));
    // },
    onSuccess: (_: null, params: number[]) => {
      message.success('删除成功');
      runGetRoleList();
      setDeleteLoadingMap((prev) => ({ ...prev, [params[0]]: false }));
    },
    onFinally: (params: number[]) => {
      setDeleteLoadingMap((prev) => ({ ...prev, [params[0]]: false }));
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

  // 处理删除
  const handleDelete = (roleInfo: RoleInfo) => {
    setDeleteLoadingMap((prev) => ({ ...prev, [roleInfo.id]: true }));
    runDelete(roleInfo.id);
  };

  // 处理菜单权限
  const handleMenuPermission = (roleInfo: RoleInfo) => {
    setCurrentRole(roleInfo);
    setMenuPermissionDrawerOpen(true);
  };

  // 处理菜单权限抽屉关闭
  const handleMenuPermissionDrawerClose = () => {
    setMenuPermissionDrawerOpen(false);
    setCurrentRole(null);
  };

  // 处理菜单权限保存成功
  const handleMenuPermissionSuccess = () => {
    setMenuPermissionDrawerOpen(false);
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
          {!roleList?.length ? (
            <Empty
              description="暂无角色数据"
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
              {roleList?.map((role: RoleInfo) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onBindUser={handleBindUser}
                  onEdit={handleEdit}
                  onMenuPermission={handleMenuPermission}
                  onDelete={handleDelete}
                  deleteLoading={deleteLoadingMap[role.id] || false}
                />
              ))}
            </div>
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

      {/* 菜单权限配置Drawer */}
      <MenuPermissionDrawer
        open={menuPermissionDrawerOpen}
        targetId={currentRole?.id || 0}
        name={currentRole?.name || ''}
        onClose={handleMenuPermissionDrawerClose}
        onSuccess={handleMenuPermissionSuccess}
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
