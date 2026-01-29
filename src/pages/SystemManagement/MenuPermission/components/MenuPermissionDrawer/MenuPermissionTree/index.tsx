import { CaretDownOutlined, DownOutlined } from '@ant-design/icons';
import { Popover, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import React, { useEffect, useMemo, useState } from 'react';
import type { MenuNodeInfo } from '../../../types/menu-manage';
import type { ResourceTreeNode } from '../../../types/permission-resources';
import styles from './index.less';

interface MenuPermissionTreeProps {
  /** 菜单树数据 */
  menuTree: MenuNodeInfo[];
  /** 选中的菜单ID列表 */
  selectedKeys: React.Key[];
  /** 选择变化回调 */
  onSelect: (selectedKeys: React.Key[]) => void;
  /** 资源码选中状态变化回调 */
  onResourceChange?: (selectedResourceIds: Map<React.Key, React.Key[]>) => void;
}

/**
 * 从资源树中提取所有资源ID
 */
const extractResourceIds = (resources: ResourceTreeNode[]): React.Key[] => {
  const ids: React.Key[] = [];
  resources.forEach((resource) => {
    ids.push(resource.id);
    if (resource.children && resource.children.length > 0) {
      ids.push(...extractResourceIds(resource.children));
    }
  });
  return ids;
};

/**
 * 菜单权限树形选择器组件
 * 支持多选和父子级联选择
 */
const MenuPermissionTree: React.FC<MenuPermissionTreeProps> = ({
  menuTree,
  selectedKeys,
  onSelect,
  onResourceChange,
}) => {
  // 管理资源码的选中状态：key 为菜单ID，value 为该菜单关联的资源码ID列表
  const [selectedResourceIds, setSelectedResourceIds] = useState<
    Map<React.Key, React.Key[]>
  >(new Map());
  // 跟踪上一次的菜单选中状态，用于检测菜单选中状态变化
  const prevSelectedKeysRef = React.useRef<React.Key[]>([]);

  // 当菜单选中状态变化时，自动管理关联的资源码选中状态
  useEffect(() => {
    const prevSelectedKeys = prevSelectedKeysRef.current;
    const newSelectedKeys = selectedKeys;

    setSelectedResourceIds((prev) => {
      const newSelectedResourceIds = new Map(prev);

      // 遍历菜单树，找到所有选中的菜单及其关联的资源码
      const processMenuTree = (menus: MenuNodeInfo[]) => {
        menus.forEach((menu) => {
          const isMenuSelected = newSelectedKeys.includes(menu.id);
          const wasMenuSelected = prevSelectedKeys.includes(menu.id);
          const currentResourceIds = newSelectedResourceIds.get(menu.id) || [];

          if (
            isMenuSelected &&
            menu.resourceTree &&
            menu.resourceTree.length > 0
          ) {
            // 如果菜单被选中
            if (!wasMenuSelected) {
              // 如果菜单从"未选中"变为"选中"
              // 检查用户是否已经手动选择了资源码
              if (currentResourceIds.length > 0) {
                // 如果用户已经手动选择了资源码，保留用户的选择
                // 不做任何操作，保持当前状态
              } else {
                // 如果用户没有手动选择资源码，自动选中所有关联的资源码
                const allResourceIds = extractResourceIds(menu.resourceTree);
                newSelectedResourceIds.set(menu.id, allResourceIds);
              }
            } else {
              // 如果菜单一直是选中状态，保持用户的选择（允许用户手动取消部分资源码）
              // 但如果当前没有选中的资源码，说明可能是初始化，需要全选
              if (currentResourceIds.length === 0) {
                const allResourceIds = extractResourceIds(menu.resourceTree);
                newSelectedResourceIds.set(menu.id, allResourceIds);
              }
            }
          } else if (!isMenuSelected) {
            // 如果菜单未选中，检查是否有用户手动选择的资源码
            // 如果有用户手动选择的资源码，保留它们（不自动清空）
            // 只有当菜单从选中变为未选中时，才清空资源码
            if (!wasMenuSelected) {
              // 菜单一直是未选中状态，保留用户的选择（如果有）
              // 不做任何操作，保持当前状态
            } else {
              // 菜单从选中变为未选中，清空资源码
              newSelectedResourceIds.set(menu.id, []);
            }
          } else {
            // 如果菜单已选中但没有资源树，保持空数组
            newSelectedResourceIds.set(menu.id, []);
          }

          // 递归处理子菜单
          if (menu.children && menu.children.length > 0) {
            processMenuTree(menu.children);
          }
        });
      };

      processMenuTree(menuTree);

      // 通知父组件资源码选中状态变化
      onResourceChange?.(newSelectedResourceIds);

      return newSelectedResourceIds;
    });

    // 更新上一次的选中状态
    prevSelectedKeysRef.current = newSelectedKeys;
  }, [selectedKeys, menuTree, onResourceChange]);

  /**
   * 将资源树数据转换为Tree组件需要的数据格式
   */
  const convertResourceTreeToDataNode = (
    resources: ResourceTreeNode[],
  ): DataNode[] => {
    return resources.map((resource) => ({
      title: resource.name || `资源 ${resource.id}`,
      key: resource.id, // 使用资源ID作为key，与extractResourceIds保持一致
      value: resource.id,
      children: resource.children
        ? convertResourceTreeToDataNode(resource.children)
        : undefined,
    }));
  };

  // 将菜单数据转换为Tree组件需要的数据格式
  const treeData = useMemo(() => {
    /**
     * 渲染带资源树下拉箭头的标题
     */
    const renderTitleWithResourceTree = (menu: MenuNodeInfo) => {
      if (!menu.resourceTree || menu.resourceTree.length === 0) {
        return <span>{menu.name}</span>;
      }

      const resourceTreeData = convertResourceTreeToDataNode(menu.resourceTree);
      const menuResourceIds = selectedResourceIds.get(menu.id) || [];

      // 处理资源码选中状态变化
      const handleResourceCheck = (
        checkedKeys:
          | React.Key[]
          | { checked: React.Key[]; halfChecked: React.Key[] },
      ) => {
        const keys = Array.isArray(checkedKeys)
          ? checkedKeys
          : checkedKeys.checked || [];

        // 检查当前菜单是否被选中
        const isMenuSelected = selectedKeys.includes(menu.id);
        const hasSelectedResources = keys.length > 0;

        // 如果菜单未选中，但用户选中了资源码，则自动选中该菜单
        if (!isMenuSelected && hasSelectedResources) {
          // 将菜单添加到选中列表
          const newSelectedKeys = [...selectedKeys, menu.id];
          onSelect(newSelectedKeys);
        }

        // 更新该菜单的资源码选中状态
        setSelectedResourceIds((prev) => {
          const newMap = new Map(prev);
          newMap.set(menu.id, keys as React.Key[]);
          // 通知父组件资源码选中状态变化
          onResourceChange?.(newMap);
          return newMap;
        });
      };

      return (
        <div className={styles.titleWithResource}>
          <Popover
            content={
              <div className={styles.resourceTreePopover}>
                <Tree
                  checkable
                  checkStrictly={false} // 父子节点关联，支持级联选择
                  treeData={resourceTreeData}
                  defaultExpandAll
                  showLine={{ showLeafIcon: false }}
                  blockNode
                  checkedKeys={menuResourceIds}
                  onCheck={handleResourceCheck}
                />
              </div>
            }
            title="关联资源码"
            placement="rightTop"
            overlayClassName={styles.resourceTreePopoverOverlay}
          >
            <div className="w-full flex items-center content-between">
              <span className={styles.menuName}>{menu.name}</span>
              <CaretDownOutlined className={styles.resourceTreeIcon} />
            </div>
          </Popover>
        </div>
      );
    };

    const convertToTreeData = (menus: MenuNodeInfo[]): DataNode[] => {
      return menus.map((menu) => ({
        title: renderTitleWithResourceTree(menu),
        key: menu.id,
        value: menu.id,
        children: menu.children ? convertToTreeData(menu.children) : undefined,
        resourceTree: menu.resourceTree,
      }));
    };
    return convertToTreeData(menuTree);
  }, [menuTree, selectedResourceIds]);

  // 处理树节点选择
  const handleSelect = (selectedKeys: React.Key[]) => {
    onSelect(selectedKeys);
  };

  return (
    <div className={styles.container}>
      <Tree
        checkable
        checkStrictly={false} // 父子节点关联，支持级联选择
        switcherIcon={<DownOutlined />}
        treeData={treeData}
        defaultExpandAll
        checkedKeys={selectedKeys}
        // 点击复选框触发
        onCheck={(checkedKeys) => {
          // onCheck返回的是CheckedKeys类型，需要转换为Key[]
          // 当checkStrictly为false时，checkedKeys包含所有选中的节点（包括父节点和子节点）
          const keys = Array.isArray(checkedKeys)
            ? checkedKeys
            : checkedKeys.checked || [];
          handleSelect(keys as React.Key[]);
        }}
        blockNode
      />
    </div>
  );
};

export default MenuPermissionTree;
