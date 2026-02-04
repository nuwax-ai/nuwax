import { DownOutlined } from '@ant-design/icons';
import { Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import React, { useEffect, useMemo, useState } from 'react';
import type { MenuNodeInfo } from '../../../types/menu-manage';
import { type ResourceTreeNode } from '../../../types/permission-resources';
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
  /** 初始资源码选中状态（从接口数据中提取） */
  initialResourceIds?: Map<React.Key, React.Key[]>;
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
 * 从菜单树中提取指定菜单的所有子菜单ID（递归）
 */
const extractAllChildrenMenuIds = (
  menus: MenuNodeInfo[],
  targetMenuId: React.Key,
): React.Key[] => {
  const childrenIds: React.Key[] = [];

  const findMenuAndExtractChildren = (menuList: MenuNodeInfo[]): boolean => {
    for (const menu of menuList) {
      if (menu.id === targetMenuId) {
        // 找到目标菜单，提取所有子菜单ID
        if (menu.children && menu.children.length > 0) {
          const extractChildren = (children: MenuNodeInfo[]) => {
            children.forEach((child) => {
              childrenIds.push(child.id);
              if (child.children && child.children.length > 0) {
                extractChildren(child.children);
              }
            });
          };
          extractChildren(menu.children);
        }
        return true;
      }
      // 递归查找子菜单
      if (menu.children && menu.children.length > 0) {
        if (findMenuAndExtractChildren(menu.children)) {
          return true;
        }
      }
    }
    return false;
  };

  findMenuAndExtractChildren(menus);
  return childrenIds;
};

/**
 * 查找菜单的父级菜单ID
 */
const findParentMenuId = (
  menus: MenuNodeInfo[],
  targetMenuId: React.Key,
): React.Key | null => {
  for (const menu of menus) {
    if (menu.id === targetMenuId) {
      // 找到目标菜单，返回null（说明是根节点）
      return null;
    }
    // 检查子菜单
    if (menu.children && menu.children.length > 0) {
      const childFound = menu.children.find(
        (child) => child.id === targetMenuId,
      );
      if (childFound) {
        // 找到父级菜单
        return menu.id;
      }
      // 递归查找子菜单
      const parentId = findParentMenuId(menu.children, targetMenuId);
      if (parentId !== null) {
        return parentId;
      }
    }
  }
  return null;
};

/**
 * 检查父级菜单的所有子菜单是否都被选中
 */
const areAllSiblingsSelected = (
  menus: MenuNodeInfo[],
  parentMenuId: React.Key,
  selectedKeys: React.Key[],
): boolean => {
  const findParentAndCheckChildren = (menuList: MenuNodeInfo[]): boolean => {
    for (const menu of menuList) {
      if (menu.id === parentMenuId) {
        // 找到父级菜单，检查所有子菜单是否都被选中
        if (menu.children && menu.children.length > 0) {
          return menu.children.every((child) =>
            selectedKeys.includes(child.id),
          );
        }
        return false;
      }
      // 递归查找子菜单
      if (menu.children && menu.children.length > 0) {
        if (findParentAndCheckChildren(menu.children)) {
          return true;
        }
      }
    }
    return false;
  };

  return findParentAndCheckChildren(menus);
};

/**
 * 提取所有应该被选中的父级菜单ID（递归向上查找）
 */
const extractAllParentMenuIds = (
  menus: MenuNodeInfo[],
  targetMenuId: React.Key,
  selectedKeys: React.Key[],
): React.Key[] => {
  const parentIds: React.Key[] = [];
  let currentMenuId: React.Key | null = targetMenuId;
  // 使用动态更新的选中列表（包含已找到的父级菜单）
  let currentSelectedKeys = [...selectedKeys];

  // 递归向上查找父级菜单
  while (currentMenuId !== null) {
    const parentId = findParentMenuId(menus, currentMenuId);
    if (parentId === null) {
      // 已经到达根节点
      break;
    }

    // 检查父级菜单的所有子菜单是否都被选中（使用当前更新的选中列表）
    if (areAllSiblingsSelected(menus, parentId, currentSelectedKeys)) {
      // 所有兄弟菜单都被选中，父级菜单也应该被选中
      parentIds.push(parentId);
      // 将父级菜单添加到当前选中列表，用于后续检查
      currentSelectedKeys.push(parentId);
      // 继续向上查找
      currentMenuId = parentId;
    } else {
      // 不是所有兄弟菜单都被选中，停止向上查找
      break;
    }
  }

  return parentIds;
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
  initialResourceIds,
}) => {
  // 管理资源码的选中状态：key 为菜单ID，value 为该菜单关联的资源码ID列表
  const [selectedResourceIds, setSelectedResourceIds] = useState<
    Map<React.Key, React.Key[]>
  >(new Map());

  // 使用初始资源码选中状态初始化（从接口数据中提取）
  useEffect(() => {
    if (initialResourceIds) {
      // 当初始资源码数据变化时，重新初始化（用于切换不同的角色/用户组）
      // 即使 initialResourceIds 为空 Map，也要设置，确保所有菜单的资源码状态都被正确初始化
      setSelectedResourceIds(initialResourceIds);
    }
  }, [initialResourceIds]);

  /**
   * 从 checkedKeys 中提取实际选中的节点（用于保存状态）
   * 策略：
   * 1. 如果父节点的所有子节点都被选中，且父节点也被选中，则保存父节点和所有子节点
   * 2. 如果只有部分子节点被选中，则只保存实际选中的子节点
   * 3. 叶子节点直接保存
   */
  const extractActualCheckedKeys = (
    resources: ResourceTreeNode[],
    checkedKeys: React.Key[],
  ): React.Key[] => {
    const processResource = (resourceList: ResourceTreeNode[]): React.Key[] => {
      const actualKeys: React.Key[] = [];

      resourceList.forEach((resource) => {
        if (resource.children && resource.children.length > 0) {
          // 有子节点，先递归处理子节点
          const childActualKeys = processResource(resource.children);

          // 检查所有直接子节点是否都被选中
          const directChildrenIds = resource.children.map((child) => child.id);
          const allDirectChildrenChecked = directChildrenIds.every((id) =>
            checkedKeys.includes(id),
          );
          const parentChecked = checkedKeys.includes(resource.id);

          if (allDirectChildrenChecked && parentChecked) {
            // 所有直接子节点都被选中，且父节点也被选中
            // 保存父节点和所有子节点（包括递归处理得到的子节点的子节点）
            actualKeys.push(resource.id);
            // childActualKeys 已经包含了所有实际选中的子节点的子节点
            // 但我们还需要确保所有直接子节点都被包含（即使它们有子节点）
            directChildrenIds.forEach((childId) => {
              if (!actualKeys.includes(childId)) {
                actualKeys.push(childId);
              }
            });
            // 添加所有子节点的子节点（通过递归处理得到）
            childActualKeys.forEach((key) => {
              if (!actualKeys.includes(key)) {
                actualKeys.push(key);
              }
            });
          } else {
            // 不是所有直接子节点都被选中，或者父节点未被选中
            // 只保存实际选中的子节点（通过递归处理得到）
            actualKeys.push(...childActualKeys);
          }
        } else {
          // 叶子节点，如果在 checkedKeys 中，则保存
          if (checkedKeys.includes(resource.id)) {
            actualKeys.push(resource.id);
          }
        }
      });

      return actualKeys;
    };

    return processResource(resources);
  };

  /**
   * 过滤 checkedKeys，用于传递给 Tree 组件
   * 策略：
   * 1. 如果父节点的所有子节点都被选中，且父节点也被选中，则只传递父节点（Tree 会自动级联选中所有子节点）
   * 2. 如果只有部分子节点被选中，则只传递实际选中的子节点（Tree 会自动显示父节点为半选中状态）
   * 3. 叶子节点直接传递
   */
  const filterCheckedKeysForTree = (
    resources: ResourceTreeNode[],
    checkedKeys: React.Key[],
  ): React.Key[] => {
    const processResource = (resourceList: ResourceTreeNode[]): React.Key[] => {
      const filteredKeys: React.Key[] = [];

      resourceList.forEach((resource) => {
        if (resource.children && resource.children.length > 0) {
          // 有子节点，先递归处理子节点
          const childFilteredKeys = processResource(resource.children);

          // 检查所有直接子节点是否都被选中
          const directChildrenIds = resource.children.map((child) => child.id);
          const allDirectChildrenChecked = directChildrenIds.every((id) =>
            checkedKeys.includes(id),
          );
          const parentChecked = checkedKeys.includes(resource.id);

          if (allDirectChildrenChecked && parentChecked) {
            // 所有直接子节点都被选中，且父节点也被选中，只传递父节点
            // Tree 组件会自动级联选中所有子节点
            filteredKeys.push(resource.id);
          } else {
            // 不是所有直接子节点都被选中，或者父节点未被选中
            // 只传递实际选中的子节点（通过递归处理得到）
            filteredKeys.push(...childFilteredKeys);
          }
        } else {
          // 叶子节点，如果在 checkedKeys 中，则传递
          if (checkedKeys.includes(resource.id)) {
            filteredKeys.push(resource.id);
          }
        }
      });

      return filteredKeys;
    };

    return processResource(resources);
  };

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

  /**
   * 渲染资源树（单独处理，显示在菜单下方）
   */
  const renderResourceTree = (menu: MenuNodeInfo) => {
    if (!menu.resourceTree || menu.resourceTree.length === 0) {
      return null;
    }

    const resourceTreeData = convertResourceTreeToDataNode(menu.resourceTree);
    const menuResourceIds = selectedResourceIds.get(menu.id) || [];

    // 过滤 checkedKeys，用于传递给 Tree 组件
    const filteredCheckedKeys =
      menu.resourceTree && menu.resourceTree.length > 0
        ? filterCheckedKeysForTree(menu.resourceTree, menuResourceIds)
        : menuResourceIds;

    // 处理资源码选中状态变化
    const handleResourceCheck = (
      checkedKeys:
        | React.Key[]
        | { checked: React.Key[]; halfChecked: React.Key[] },
    ) => {
      const allCheckedKeys = Array.isArray(checkedKeys)
        ? checkedKeys
        : checkedKeys.checked || [];

      // 从 Tree 返回的 checkedKeys 中提取实际选中的节点（用于保存状态）
      const actualCheckedKeys =
        menu.resourceTree && menu.resourceTree.length > 0
          ? extractActualCheckedKeys(menu.resourceTree, allCheckedKeys)
          : allCheckedKeys;

      // 检查当前菜单是否被选中
      const isMenuSelected = selectedKeys.includes(menu.id);
      const hasSelectedResources = actualCheckedKeys.length > 0;

      // 如果菜单未选中，但用户选中了资源码，则自动选中该菜单
      if (!isMenuSelected && hasSelectedResources) {
        // 提取当前菜单的所有子菜单ID
        const childrenMenuIds = extractAllChildrenMenuIds(menuTree, menu.id);
        // 先添加当前菜单和子菜单，用于检查父级菜单
        const tempSelectedKeys = [...selectedKeys, menu.id, ...childrenMenuIds];
        // 提取所有应该被选中的父级菜单ID（递归向上查找）
        const parentMenuIds = extractAllParentMenuIds(
          menuTree,
          menu.id,
          tempSelectedKeys,
        );
        // 将菜单、所有子菜单和所有父级菜单添加到选中列表（去重）
        const newSelectedKeysSet = new Set([
          ...selectedKeys,
          menu.id,
          ...childrenMenuIds,
          ...parentMenuIds,
        ]);
        const newSelectedKeys = Array.from(newSelectedKeysSet);
        onSelect(newSelectedKeys);
      }

      // 更新该菜单的资源码选中状态（只保存实际选中的节点）
      setSelectedResourceIds((prev) => {
        const newMap = new Map(prev);
        newMap.set(menu.id, actualCheckedKeys as React.Key[]);
        // 通知父组件资源码选中状态变化
        onResourceChange?.(newMap);
        return newMap;
      });
    };

    return (
      <div className={styles.resourceTreeContainer}>
        <Tree
          checkable
          switcherIcon={<DownOutlined />}
          checkStrictly={false} // 父子节点关联，支持级联选择和半选中状态
          treeData={resourceTreeData}
          showLine={{ showLeafIcon: false }}
          blockNode
          checkedKeys={filteredCheckedKeys}
          onCheck={handleResourceCheck}
          className={styles.resourceTree}
        />
      </div>
    );
  };

  // 将菜单数据转换为Tree组件需要的数据格式
  const treeData = useMemo(() => {
    /**
     * 渲染菜单标题（只显示菜单名称，确保选择框和菜单名称在同一行）
     */
    const renderMenuTitle = (menu: MenuNodeInfo) => {
      return <span className={styles.menuName}>{menu.name}</span>;
    };

    const convertToTreeData = (menus: MenuNodeInfo[]): DataNode[] => {
      return menus
        .filter((menu) => menu.id !== 0) // 过滤掉根节点（id为0）
        .map((menu) => ({
          title: renderMenuTitle(menu),
          key: menu.id,
          value: menu.id,
          children: menu.children
            ? convertToTreeData(menu.children)
            : undefined,
          resourceTree: menu.resourceTree,
          menuData: menu, // 保存菜单原始数据，用于渲染资源树
        }));
    };

    // 如果第一个节点是根节点（id为0），则只返回其子节点
    if (menuTree.length === 1 && menuTree[0].id === 0) {
      const rootNode = menuTree[0];
      return rootNode.children?.length
        ? convertToTreeData(rootNode.children)
        : [];
    }

    // 否则过滤掉所有 id 为 0 的节点
    return convertToTreeData(menuTree);
  }, [menuTree]);

  /**
   * 处理树节点选择
   * 当菜单选中状态变化时，自动管理关联的资源码选中状态
   * 规则：
   * 1. 选中菜单 → 自动选中该菜单下的所有资源
   * 2. 取消菜单 → 自动清空该菜单下的所有资源
   */
  const handleSelect = (newSelectedKeys: React.Key[]) => {
    // 先更新菜单选中状态
    onSelect(newSelectedKeys);

    // 处理资源码的自动管理
    setSelectedResourceIds((prev) => {
      const newSelectedResourceIds = new Map(prev);
      const prevSelectedKeys = selectedKeys;

      // 遍历菜单树，处理所有菜单的资源码状态
      const processMenuTree = (menus: MenuNodeInfo[]) => {
        menus.forEach((menu) => {
          const isMenuSelected = newSelectedKeys.includes(menu.id);
          const wasMenuSelected = prevSelectedKeys.includes(menu.id);

          // 如果菜单状态发生变化（从选中变为未选中，或从未选中变为选中）
          if (isMenuSelected !== wasMenuSelected) {
            if (isMenuSelected) {
              // 菜单被选中：自动选中该菜单下的所有资源
              if (menu.resourceTree && menu.resourceTree.length > 0) {
                const allResourceIds = extractResourceIds(menu.resourceTree);
                newSelectedResourceIds.set(menu.id, allResourceIds);
              } else {
                // 菜单没有资源树，设置为空数组
                newSelectedResourceIds.set(menu.id, []);
              }
            } else {
              // 菜单被取消选中：清空该菜单下的所有资源
              newSelectedResourceIds.set(menu.id, []);
            }
          }
          // 如果菜单状态没有变化，保持当前资源选择状态不变

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
  };

  return (
    <div className={styles.container}>
      <Tree
        checkable
        checkStrictly={false} // 父子节点关联，支持级联选择
        switcherIcon={<DownOutlined />}
        treeData={treeData}
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
        titleRender={(nodeData: any) => {
          const menuData = nodeData.menuData as MenuNodeInfo | undefined;
          return (
            <div className={styles.menuNodeWrapper}>
              <span className={styles.menuName}>{nodeData.title}</span>
              {menuData && renderResourceTree(menuData)}
            </div>
          );
        }}
      />
    </div>
  );
};

export default MenuPermissionTree;
