import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import { apiGetRoleBoundMenuList, apiRoleBindMenu } from '../../api';
import type { MenuNodeInfo, RoleInfo } from '../../type';
import MenuPermissionTree from '../MenuPermissionTree';
import styles from './index.less';

const cx = classNames.bind(styles);

interface MenuPermissionDrawerProps {
  /** 是否打开 */
  open: boolean;
  /** 角色信息 */
  roleInfo?: RoleInfo;
  /** 关闭回调 */
  onClose: () => void;
  /** 成功回调 */
  onSuccess?: () => void;
}

/**
 * 菜单权限抽屉组件
 * 用于配置角色的菜单权限
 */
const MenuPermissionDrawer: React.FC<MenuPermissionDrawerProps> = ({
  open,
  roleInfo,
  onClose,
  onSuccess,
}) => {
  const [selectedMenuIds, setSelectedMenuIds] = useState<React.Key[]>([]);
  const [expandedMenuKeys, setExpandedMenuKeys] = useState<React.Key[]>([]);

  // 将MenuTreeNode转换为MenuNodeInfo格式
  const convertMenuTreeToMenuNodeInfo = (menuTree: any[]): MenuNodeInfo[] => {
    return menuTree.map((menu) => ({
      id: menu.menuId,
      name: menu.name || `菜单${menu.menuId}`,
      code: menu.code,
      parentId: menu.parentId,
      children: menu.children
        ? convertMenuTreeToMenuNodeInfo(menu.children)
        : undefined,
    }));
  };

  // 查询角色已绑定的菜单
  const {
    run: runGetRoleBoundMenuList,
    data: menuTree,
    loading: getMenuLoading,
  } = useRequest(apiGetRoleBoundMenuList, {
    manual: true,
    onSuccess: (data: MenuNodeInfo[]) => {
      // 初始化选中的菜单ID
      // 注意：API返回的是MenuTreeNode格式，需要转换为MenuNodeInfo格式
      const getSelectedMenuIds = (menus: any[]): React.Key[] => {
        const ids: React.Key[] = [];
        menus.forEach((menu) => {
          // 如果菜单已绑定，添加到选中列表
          if (menu.menuBindType === 1) {
            // 全部绑定
            ids.push(menu.menuId);
          } else if (menu.menuBindType === 2) {
            // 部分绑定，需要递归处理子菜单
            ids.push(menu.menuId);
            if (menu.children) {
              ids.push(...getSelectedMenuIds(menu.children));
            }
          }
          // 递归处理子菜单
          if (menu.children) {
            ids.push(...getSelectedMenuIds(menu.children));
          }
        });
        return ids;
      };
      setSelectedMenuIds(getSelectedMenuIds(data));

      // 默认展开所有父节点
      const getAllParentKeys = (menus: any[]): React.Key[] => {
        const keys: React.Key[] = [];
        menus.forEach((menu) => {
          if (menu.children && menu.children.length > 0) {
            keys.push(menu.menuId);
            keys.push(...getAllParentKeys(menu.children));
          }
        });
        return keys;
      };
      setExpandedMenuKeys(getAllParentKeys(data));
    },
  });

  // 绑定菜单权限
  const { run: runRoleBindMenu, loading: bindMenuLoading } = useRequest(
    apiRoleBindMenu,
    {
      manual: true,
      onSuccess: () => {
        message.success('菜单权限保存成功');
        onSuccess?.();
        onClose();
      },
      onError: () => {
        message.error('菜单权限保存失败');
      },
    },
  );

  useEffect(() => {
    if (open && roleInfo) {
      // 查询角色已绑定的菜单
      runGetRoleBoundMenuList(roleInfo.id);
    } else {
      // 重置状态
      setSelectedMenuIds([]);
      setExpandedMenuKeys([]);
    }
  }, [open, roleInfo]);

  // 处理保存
  const handleSave = () => {
    if (!roleInfo || !menuTree) return;

    // 将MenuTreeNode转换为MenuNodeInfo格式，用于构建菜单树
    const menuNodeInfoList = convertMenuTreeToMenuNodeInfo(menuTree);

    // 构建菜单树结构（需要根据选中的菜单ID构建）
    const buildMenuTree = (
      menus: MenuNodeInfo[],
      selectedIds: React.Key[],
    ): any[] => {
      return menus.map((menu) => {
        const isSelected = selectedIds.includes(menu.id);
        const hasChildren = menu.children && menu.children.length > 0;

        let menuBindType = 0; // 未绑定
        let children: any[] | undefined;
        let resourceBindType = 0; // 资源绑定类型，默认为未绑定

        if (hasChildren) {
          children = buildMenuTree(menu.children!, selectedIds);
          const allChildrenSelected = children.every(
            (child) => child.menuBindType === 1,
          );
          const someChildrenSelected = children.some(
            (child) => child.menuBindType === 1 || child.menuBindType === 2,
          );

          if (isSelected && allChildrenSelected) {
            menuBindType = 1; // 全部绑定
          } else if (isSelected || someChildrenSelected) {
            menuBindType = 2; // 部分绑定
          }
        } else {
          menuBindType = isSelected ? 1 : 0;
        }

        return {
          menuId: menu.id,
          menuBindType,
          resourceBindType,
          children,
        };
      });
    };

    const updatedMenuTree = buildMenuTree(menuNodeInfoList, selectedMenuIds);

    runRoleBindMenu({
      roleId: roleInfo.id,
      menuTree: updatedMenuTree,
    });
  };

  // 渲染抽屉头部
  const renderDrawerHeader = () => (
    <div className={cx(styles.drawerHeader)}>
      <div className={cx(styles.titleArea)}>
        <div className={cx(styles.titleContent)}>
          <h3 className={cx(styles.title)}>菜单权限配置</h3>
          <p className={cx(styles.subtitle)}>
            {roleInfo?.name || '角色菜单权限'}
          </p>
        </div>
      </div>
      <Button
        type="text"
        icon={<CloseOutlined />}
        onClick={onClose}
        className={cx(styles.closeButton)}
      />
    </div>
  );

  const loading = getMenuLoading || bindMenuLoading;

  return (
    <Drawer
      placement="right"
      open={open}
      width={400}
      closeIcon={false}
      onClose={onClose}
      className={cx(styles.menuPermissionDrawer)}
      maskClassName={cx(styles.resetMask)}
      rootClassName={cx(styles.resetRoot)}
      destroyOnHidden={true}
    >
      {/* 抽屉头部 */}
      {renderDrawerHeader()}

      {/* 抽屉内容 */}
      <div className={cx(styles.content)}>
        {loading && !menuTree ? (
          <div className={cx(styles.loading)}>加载中...</div>
        ) : menuTree && menuTree.length > 0 ? (
          <MenuPermissionTree
            menuTree={convertMenuTreeToMenuNodeInfo(menuTree)}
            selectedKeys={selectedMenuIds}
            onSelect={setSelectedMenuIds}
            expandedKeys={expandedMenuKeys}
            onExpand={setExpandedMenuKeys}
          />
        ) : (
          <div className={cx(styles.empty)}>暂无菜单数据</div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className={cx(styles.actions)}>
        <Button
          type="primary"
          onClick={handleSave}
          loading={bindMenuLoading}
          block
          className={cx(styles.saveButton)}
        >
          保存
        </Button>
        <Button onClick={onClose} block className={cx(styles.cancelButton)}>
          取消
        </Button>
      </div>
    </Drawer>
  );
};

export default MenuPermissionDrawer;
