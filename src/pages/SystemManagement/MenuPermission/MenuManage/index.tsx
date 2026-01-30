import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, message, Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useLocation, useRequest } from 'umi';
import { apiDeleteMenu, apiGetMenuList } from '../services/menu-manage';
import type { MenuNodeInfo } from '../types/menu-manage';
import MenuFormModal from './components/MenuFormModal';
import MenuItem from './components/MenuItem';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 菜单管理页面
 * 管理系统菜单结构,未级菜单可关联资源码
 */
const MenuManage: React.FC = () => {
  const location = useLocation();

  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuNodeInfo | null>(null);
  const [parentMenu, setParentMenu] = useState<MenuNodeInfo | null>(null);
  const [deleteLoadingMap, setDeleteLoadingMap] = useState<
    Record<number, boolean>
  >({});

  // 根据条件查询菜单列表（树形结构）
  const {
    run: runGetMenuList,
    data: menuList,
    loading,
  } = useRequest(apiGetMenuList, {
    manual: true,
  });

  // 监听 location.state 变化
  // 当 state 中存在 _t 变量时，说明是通过菜单切换过来的，需要清空 query 参数
  useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      // 根据条件查询菜单列表（树形结构）
      runGetMenuList();
    }
  }, [location.state]);

  // 删除菜单
  const { run: runDelete } = useRequest(apiDeleteMenu, {
    manual: true,
    loadingDelay: 300,
    onBefore: (menuId: number) => {
      setDeleteLoadingMap((prev) => ({ ...prev, [menuId]: true }));
    },
    onSuccess: () => {
      message.success('删除成功');
      runGetMenuList();
    },
    onError: () => {
      message.error('删除失败');
    },
    onFinally: (menuId: number) => {
      setDeleteLoadingMap((prev) => ({ ...prev, [menuId]: false }));
    },
  });

  // 处理编辑
  const handleEdit = (menuInfo: MenuNodeInfo) => {
    setEditingMenu(menuInfo);
    setIsEdit(true);
    setModalOpen(true);
  };

  // 处理删除
  const handleDelete = (menu: MenuNodeInfo) => {
    runDelete(menu?.id);
  };

  // 处理新增
  const handleAdd = () => {
    setEditingMenu(null);
    setParentMenu(null);
    setIsEdit(false);
    setModalOpen(true);
  };

  // 处理新增子菜单
  const handleAddChild = (parentMenu: MenuNodeInfo) => {
    setEditingMenu(null);
    setParentMenu(parentMenu);
    setIsEdit(false);
    setModalOpen(true);
  };

  // 处理Modal关闭
  const handleModalCancel = () => {
    setModalOpen(false);
    setEditingMenu(null);
    setParentMenu(null);
  };

  // 处理Modal成功
  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingMenu(null);
    setParentMenu(null);
    runGetMenuList();
  };

  return (
    <div className={cx(styles.container)}>
      {/* 页面头部 */}
      <div className={cx(styles.header)}>
        <div className={cx(styles.headerLeft)}>
          <h1 className={cx(styles.title)}>菜单管理</h1>
          <p className={cx(styles.description)}>
            管理系统菜单结构,未级菜单可关联资源码
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增菜单
        </Button>
      </div>

      {/* 菜单列表 */}
      <div className={cx(styles.content)}>
        <Spin spinning={loading}>
          {!menuList?.length ? (
            <Empty
              description="暂无菜单数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className={cx(styles.empty)}
            />
          ) : (
            <div className={cx(styles.menuList)}>
              {menuList
                ?.filter((menu: MenuNodeInfo) => !menu.parentId)
                .map((menu: MenuNodeInfo) => (
                  <MenuItem
                    key={menu.id}
                    menu={menu}
                    level={0}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                    deleteLoading={deleteLoadingMap[menu.id] || false}
                  />
                ))}
            </div>
          )}
        </Spin>
      </div>

      {/* 新增/编辑菜单Modal */}
      <MenuFormModal
        open={modalOpen}
        isEdit={isEdit}
        menuInfo={editingMenu}
        parentMenu={parentMenu}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default MenuManage;
