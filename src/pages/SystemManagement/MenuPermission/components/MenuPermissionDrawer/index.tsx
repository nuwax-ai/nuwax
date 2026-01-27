import Loading from '@/components/custom/Loading';
import useDrawerScroll from '@/hooks/useDrawerScroll';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Drawer, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiGetRoleBoundMenuList,
  apiRoleBindMenu,
} from '../../services/role-manage';
import { MenuBindTypeEnum, type MenuNodeInfo } from '../../types/menu-manage';
import type { MenuTreeNode } from '../../types/role-manage';
import MenuPermissionTree from './MenuPermissionTree';
import styles from './index.less';

const cx = classNames.bind(styles);

interface MenuPermissionDrawerProps {
  /** 是否打开 */
  open: boolean;
  targetId: number;
  name: string;
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
  targetId,
  name,
  onClose,
  onSuccess,
}) => {
  const [selectedMenuIds, setSelectedMenuIds] = useState<React.Key[]>([]);

  // 使用自定义 Hook 处理抽屉打开时的滚动条
  useDrawerScroll(open);

  // 初始化选中的菜单ID
  const getSelectedMenuIds = (menus: MenuNodeInfo[]): React.Key[] => {
    const ids: React.Key[] = [];
    menus?.forEach((menu) => {
      // 如果菜单已绑定，添加到选中列表
      if (menu.menuBindType === MenuBindTypeEnum.AllBound) {
        // 全部绑定
        ids.push(menu.id);
      }
      // 递归处理子菜单
      if (menu.children && menu.children.length > 0) {
        ids.push(...getSelectedMenuIds(menu.children));
      }
    });
    return ids;
  };

  // 查询角色已绑定的菜单
  const {
    run: runGetRoleBoundMenuList,
    data: menuTree,
    loading: getMenuLoading,
  } = useRequest(apiGetRoleBoundMenuList, {
    manual: true,
    onSuccess: (data: MenuNodeInfo[]) => {
      setSelectedMenuIds(getSelectedMenuIds(data));
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
      },
      onError: () => {
        message.error('菜单权限保存失败');
      },
    },
  );

  useEffect(() => {
    if (open && targetId) {
      // 查询角色已绑定的菜单
      runGetRoleBoundMenuList(targetId);
    } else {
      // 重置状态
      setSelectedMenuIds([]);
    }
  }, [open, targetId]);

  // 构建菜单树结构（需要根据选中的菜单ID构建）
  const buildMenuTree = (
    menus: MenuNodeInfo[],
    selectedIds: React.Key[],
  ): MenuTreeNode[] => {
    return menus.map((menu) => {
      const isSelected = selectedIds.includes(menu.id);
      const hasChildren = menu.children && menu.children.length > 0;

      let menuBindType = MenuBindTypeEnum.Unbound; // 未绑定
      let children: MenuTreeNode[] | undefined;

      if (hasChildren) {
        // 递归处理子节点
        children = buildMenuTree(menu.children!, selectedIds);

        // 检查子节点的绑定状态
        const allChildrenSelected = children?.every(
          (child) => child.menuBindType === MenuBindTypeEnum.AllBound,
        );
        const someChildrenSelected = children?.some(
          (child) =>
            child.menuBindType === MenuBindTypeEnum.AllBound ||
            child.menuBindType === MenuBindTypeEnum.PartiallyBound,
        );

        if (isSelected && allChildrenSelected) {
          // 当前节点选中且所有子节点都是全部绑定
          menuBindType = MenuBindTypeEnum.AllBound; // 全部绑定
        } else if (isSelected || someChildrenSelected) {
          // 当前节点选中或部分子节点绑定
          menuBindType = MenuBindTypeEnum.PartiallyBound; // 部分绑定
        } else {
          // 当前节点未选中且没有子节点绑定
          menuBindType = MenuBindTypeEnum.Unbound;
        }
      } else {
        // 叶子节点：选中则为全部绑定，未选中则为未绑定
        menuBindType = isSelected
          ? MenuBindTypeEnum.AllBound
          : MenuBindTypeEnum.Unbound;
      }

      return {
        menuId: menu.id,
        menuBindType,
        children,
      };
    });
  };

  // 处理保存
  const handleSave = () => {
    if (!targetId || !menuTree) return;

    // 将MenuTreeNode转换为MenuNodeInfo格式，用于构建菜单树
    // const menuNodeInfoList = convertMenuTreeToMenuNodeInfo(menuTree);
    // 构建资源树结构
    const updatedMenuTree = buildMenuTree(menuTree, selectedMenuIds);

    runRoleBindMenu({
      roleId: targetId,
      menuTree: updatedMenuTree,
    });
  };

  // 渲染抽屉头部
  const renderDrawerHeader = () => (
    <div className={cx(styles.drawerHeader)}>
      <div className={cx(styles.titleArea)}>
        <div className={cx(styles.titleContent)}>
          <h3 className={cx(styles.title)}>菜单权限配置</h3>
          <p className={cx(styles.subtitle)}>{name || '菜单权限'}</p>
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

  // const loading = getMenuLoading;

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
        {getMenuLoading ? (
          <div
            className={cx('flex', 'items-center', 'content-center', 'h-full')}
          >
            <Loading />
          </div>
        ) : menuTree && menuTree.length > 0 ? (
          <MenuPermissionTree
            menuTree={menuTree}
            selectedKeys={selectedMenuIds}
            onSelect={setSelectedMenuIds}
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
