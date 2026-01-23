import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Grid, message, Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import { apiDeleteRole, apiGetRoleList } from './api';
import RoleCard from './components/RoleCard';
import RoleFormModal from './components/RoleFormModal';
import styles from './index.less';
import type { RoleInfo } from './type';

const { useBreakpoint } = Grid;
const cx = classNames.bind(styles);

/**
 * 角色管理页面
 * 用于管理系统角色，分配菜单权限和数据范围
 */
const RoleManage: React.FC = () => {
  const screens = useBreakpoint();
  const [deleteLoadingMap, setDeleteLoadingMap] = useState<
    Record<number, boolean>
  >({});
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleInfo>();

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
    onBefore: (params: number[]) => {
      setDeleteLoadingMap((prev) => ({ ...prev, [params[0]]: true }));
    },
    onSuccess: () => {
      message.success('删除成功');
      runGetRoleList();
    },
    onError: () => {
      message.error('删除失败');
    },
    onFinally: (params: number[]) => {
      setDeleteLoadingMap((prev) => ({ ...prev, [params[0]]: false }));
    },
  });

  // 处理编辑
  const handleEdit = (role: RoleInfo) => {
    setEditingRole(role);
    setIsEdit(true);
    setModalOpen(true);
  };

  // 处理删除
  const handleDelete = (role: RoleInfo) => {
    runDelete(role?.id);
  };

  // 处理新增
  const handleAdd = () => {
    setEditingRole(undefined);
    setIsEdit(false);
    setModalOpen(true);
  };

  // 处理Modal关闭
  const handleModalCancel = () => {
    setModalOpen(false);
    setEditingRole(undefined);
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className={cx(styles.addButton)}
        >
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
                  onEdit={handleEdit}
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
        roleInfo={editingRole}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default RoleManage;
