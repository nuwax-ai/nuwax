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
import {
  apiGetGroupMenuList,
  apiGroupBindMenu,
} from '../../services/user-group-manage';
import { MenuBindTypeEnum, type MenuNodeInfo } from '../../types/menu-manage';
import {
  ResourceBindTypeEnum,
  type ResourceTreeNode,
} from '../../types/permission-resources';
import type { MenuTreeNode } from '../../types/role-manage';
import MenuPermissionTree from './MenuPermissionTree';
import styles from './index.less';

const cx = classNames.bind(styles);

interface MenuPermissionDrawerProps {
  /** 是否打开 */
  open: boolean;
  targetId: number;
  name: string;
  /** 类型：角色、用户组 */
  type?: 'role' | 'userGroup';
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
  type = 'role',
  onClose,
  onSuccess,
}) => {
  const [selectedMenuIds, setSelectedMenuIds] = useState<React.Key[]>([]);
  // 管理资源码的选中状态：key 为菜单ID，value 为该菜单关联的资源码ID列表
  const [selectedResourceIds, setSelectedResourceIds] = useState<
    Map<React.Key, React.Key[]>
  >(new Map());
  // 初始资源码选中状态（从接口数据中提取，用于回显）
  const [initialResourceIds, setInitialResourceIds] = useState<
    Map<React.Key, React.Key[]>
  >(new Map());

  // 根据类型选择不同的API
  const apiKey =
    type === 'role' ? apiGetRoleBoundMenuList : apiGetGroupMenuList;

  // 根据类型选择不同的绑定菜单API
  const bindMenuApi = type === 'role' ? apiRoleBindMenu : apiGroupBindMenu;

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

  /**
   * 从资源树中提取已绑定的资源ID（根据resourceBindType判断）
   */
  const extractBoundResourceIds = (
    resources: ResourceTreeNode[],
  ): React.Key[] => {
    const ids: React.Key[] = [];
    resources.forEach((resource) => {
      // 如果资源已绑定（AllBound 或 PartiallyBound），则添加到列表
      if (resource.resourceBindType === ResourceBindTypeEnum.AllBound) {
        ids.push(resource.id);
      }
      // 递归处理子节点
      if (resource.children && resource.children.length > 0) {
        ids.push(...extractBoundResourceIds(resource.children));
      }
    });
    return ids;
  };

  /**
   * 从菜单树中提取初始资源码选中状态（根据resourceBindType和menuBindType）
   */
  const extractInitialResourceIds = (
    menus: MenuNodeInfo[],
  ): Map<React.Key, React.Key[]> => {
    const resourceIdsMap = new Map<React.Key, React.Key[]>();

    const processMenuTree = (menuList: MenuNodeInfo[]) => {
      menuList.forEach((menu) => {
        // 如果菜单未绑定，理论上所有资源码都是未绑定的，不设置资源码选中状态
        if (menu.menuBindType === MenuBindTypeEnum.Unbound) {
          // 菜单未绑定，资源码也应该是未绑定的，设置为空数组
          resourceIdsMap.set(menu.id, []);
        } else if (menu.resourceTree && menu.resourceTree.length > 0) {
          // 如果菜单已绑定，根据resourceBindType提取已绑定的资源ID
          const boundResourceIds = extractBoundResourceIds(menu.resourceTree);
          if (boundResourceIds.length > 0) {
            resourceIdsMap.set(menu.id, boundResourceIds);
          } else {
            // 如果没有已绑定的资源，设置为空数组
            resourceIdsMap.set(menu.id, []);
          }
        }

        // 递归处理子菜单
        if (menu.children && menu.children.length > 0) {
          processMenuTree(menu.children);
        }
      });
    };

    processMenuTree(menus);
    return resourceIdsMap;
  };

  // 查询目标已绑定的菜单
  const {
    run: runGetMenuList,
    data: menuTree,
    loading: getMenuLoading,
  } = useRequest(apiKey, {
    manual: true,
    onSuccess: (data: MenuNodeInfo[]) => {
      setSelectedMenuIds(getSelectedMenuIds(data));
      // 从接口数据中提取初始资源码选中状态
      const initialResourceIdsMap = extractInitialResourceIds(data);
      setInitialResourceIds(initialResourceIdsMap);
    },
  });

  // 目标绑定菜单（全量覆盖）
  const { run: runBindMenu, loading: bindMenuLoading } = useRequest(
    bindMenuApi,
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
      // 查询目标已绑定的菜单
      runGetMenuList(targetId);
    } else {
      // 重置状态
      setSelectedMenuIds([]);
      setSelectedResourceIds(new Map());
      setInitialResourceIds(new Map());
    }
  }, [open, targetId]);

  /**
   * 根据资源码选中状态构建资源树
   */
  const buildResourceTree = (
    resources: ResourceTreeNode[],
    selectedResourceIds: React.Key[],
  ): ResourceTreeNode[] => {
    return resources.map((resource) => {
      const isResourceSelected = selectedResourceIds.includes(resource.id);
      const hasChildren = resource.children && resource.children.length > 0;

      let resourceBindType = ResourceBindTypeEnum.Unbound; // 未绑定
      let children: ResourceTreeNode[] | undefined;

      if (hasChildren) {
        // 递归处理子节点
        children = buildResourceTree(resource.children!, selectedResourceIds);

        // 检查子节点的绑定状态
        const allChildrenSelected = children?.every(
          (child) => child.resourceBindType === ResourceBindTypeEnum.AllBound,
        );
        const someChildrenSelected = children?.some(
          (child) =>
            child.resourceBindType === ResourceBindTypeEnum.AllBound ||
            child.resourceBindType === ResourceBindTypeEnum.PartiallyBound,
        );

        if (isResourceSelected && allChildrenSelected) {
          // 当前节点选中且所有子节点都是全部绑定
          resourceBindType = ResourceBindTypeEnum.AllBound; // 全部绑定
        } else if (isResourceSelected || someChildrenSelected) {
          // 当前节点选中或部分子节点绑定
          resourceBindType = ResourceBindTypeEnum.PartiallyBound; // 部分绑定
        } else {
          // 当前节点未选中且没有子节点绑定
          resourceBindType = ResourceBindTypeEnum.Unbound;
        }
      } else {
        // 叶子节点：选中则为全部绑定，未选中则为未绑定
        resourceBindType = isResourceSelected
          ? ResourceBindTypeEnum.AllBound
          : ResourceBindTypeEnum.Unbound;
      }

      return {
        ...resource,
        resourceBindType,
        children,
      };
    });
  };

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

      // 构建资源树：根据资源码选中状态构建
      let resourceTree: ResourceTreeNode[] | undefined;
      if (menu.resourceTree && menu.resourceTree.length > 0) {
        const menuSelectedResourceIds = selectedResourceIds.get(menu.id) || [];
        resourceTree = buildResourceTree(
          menu.resourceTree,
          menuSelectedResourceIds,
        );
      }

      return {
        menuId: menu.id,
        name: menu.name,
        menuBindType,
        children,
        resourceTree,
      };
    });
  };

  // 处理保存
  const handleSave = () => {
    if (!targetId || !menuTree) return;

    // 构建资源树结构
    const updatedMenuTree = buildMenuTree(menuTree, selectedMenuIds);

    // 根据类型选择不同的ID
    const id = type === 'role' ? 'roleId' : 'groupId';
    // 构建绑定菜单参数
    const bindMenuParams = {
      [id]: targetId,
      menuTree: updatedMenuTree,
    };

    runBindMenu(bindMenuParams);
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
            onResourceChange={setSelectedResourceIds}
            initialResourceIds={initialResourceIds}
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
