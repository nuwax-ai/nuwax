import { modalConfirm } from '@/utils/ant-custom';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Empty, message, Space, Spin, Table, Tag } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useRequest } from 'umi';
import { apiDeleteMenu, apiGetMenuList } from '../services/menu-manage';
import type { MenuNodeInfo } from '../types/menu-manage';
import { MenuStatusEnum } from '../types/menu-manage';
import MenuFormModal from './components/MenuFormModal';
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

  // 处理删除确认
  const handleDeleteConfirm = (menu: MenuNodeInfo) => {
    modalConfirm('删除菜单', `确认删除菜单 "${menu.name}" 吗？`, () => {
      runDelete(menu?.id);
      return new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
    });
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

  // 转换数据格式，为树形数据添加 key 字段，并过滤掉根节点（id为0）
  const tableData = useMemo(() => {
    const transformData = (data: MenuNodeInfo[]): any[] => {
      return data
        .filter((item) => item.id !== 0) // 过滤掉根节点
        .map((item) => ({
          ...item,
          key: item.id,
          children: item.children?.length
            ? transformData(item.children)
            : undefined,
        }));
    };
    if (!menuList || !menuList.length) {
      return [];
    }
    // 如果第一个节点是根节点（id为0），则只返回其子节点
    if (menuList.length === 1 && menuList[0].id === 0) {
      const rootNode = menuList[0];
      return rootNode.children?.length ? transformData(rootNode.children) : [];
    }
    // 否则过滤掉所有 id 为 0 的节点
    return transformData(menuList);
  }, [menuList]);

  // 定义表格列
  const columns: TableColumnsType<MenuNodeInfo & { key: number }> = [
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 80,
      render: (icon: string, record: MenuNodeInfo) => (
        <div className={cx(styles.iconCell)}>
          {icon ? (
            <img
              src={icon}
              alt={record.name || '菜单图标'}
              className={cx(styles.menuIcon)}
            />
          ) : (
            <span className={cx(styles.iconPlaceholder)}></span>
          )}
        </div>
      ),
    },
    {
      title: '菜单名称',
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
      render: (code: string) => code || '--',
    },
    {
      title: '路由路径',
      dataIndex: 'path',
      key: 'path',
      width: 200,
      ellipsis: true,
      render: (path: string) => path || '--',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: MenuStatusEnum) => (
        <Tag color={status === MenuStatusEnum.Enabled ? 'success' : 'default'}>
          {status === MenuStatusEnum.Enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right',
      render: (_: any, record: MenuNodeInfo) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleAddChild(record)}
          >
            新增子菜单
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
          {!tableData?.length ? (
            <Empty
              description="暂无菜单数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className={cx(styles.empty)}
            />
          ) : (
            <Table<MenuNodeInfo & { key: number }>
              columns={columns}
              dataSource={tableData}
              pagination={false}
              scroll={{ x: 'max-content' }}
              className={cx(styles.table)}
              expandable={{
                expandIcon: ({ expanded, onExpand, record }) =>
                  record.children ? (
                    <DownOutlined
                      className={cx(styles.icon, {
                        [styles['rotate-0']]: expanded,
                      })}
                      onClick={(e) => onExpand(record, e)}
                    />
                  ) : (
                    <DownOutlined
                      className={cx(styles.icon, styles['icon-hidden'])}
                    />
                  ),
              }}
            />
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
