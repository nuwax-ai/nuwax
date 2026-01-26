import { DownOutlined } from '@ant-design/icons';
import { Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import React, { useMemo } from 'react';
import type { MenuNodeInfo } from '../../../types/role-manage';
import styles from './index.less';

interface MenuPermissionTreeProps {
  /** 菜单树数据 */
  menuTree: MenuNodeInfo[];
  /** 选中的菜单ID列表 */
  selectedKeys: React.Key[];
  /** 选择变化回调 */
  onSelect: (selectedKeys: React.Key[]) => void;
  /** 展开的节点keys */
  expandedKeys?: React.Key[];
  /** 展开变化回调 */
  onExpand?: (expandedKeys: React.Key[]) => void;
}

/**
 * 菜单权限树形选择器组件
 * 支持多选和父子级联选择
 */
const MenuPermissionTree: React.FC<MenuPermissionTreeProps> = ({
  menuTree,
  selectedKeys,
  onSelect,
  expandedKeys,
  onExpand,
}) => {
  // 将菜单数据转换为Tree组件需要的数据格式
  const treeData = useMemo(() => {
    const convertToTreeData = (menus: MenuNodeInfo[]): DataNode[] => {
      return menus.map((menu) => ({
        title: menu.name,
        key: menu.id,
        children: menu.children ? convertToTreeData(menu.children) : undefined,
      }));
    };
    return convertToTreeData(menuTree);
  }, [menuTree]);

  // 处理树节点选择
  const handleSelect = (selectedKeys: React.Key[]) => {
    onSelect(selectedKeys);
  };

  // 处理树节点展开
  const handleExpand = (expandedKeys: React.Key[]) => {
    onExpand?.(expandedKeys);
  };

  return (
    <div className={styles.container}>
      <Tree
        checkable
        checkStrictly={false} // 父子节点关联，支持级联选择
        switcherIcon={<DownOutlined />}
        treeData={treeData}
        checkedKeys={selectedKeys}
        expandedKeys={expandedKeys}
        // 点击复选框触发
        onCheck={(checkedKeys, info) => {
          console.log('onCheck', checkedKeys, info);
          // onCheck返回的是CheckedKeys类型，需要转换为Key[]
          // 当checkStrictly为false时，checkedKeys包含所有选中的节点（包括父节点和子节点）
          const keys = Array.isArray(checkedKeys)
            ? checkedKeys
            : checkedKeys.checked || [];
          handleSelect(keys as React.Key[]);
        }}
        // 点击树节点触发
        onSelect={(selectedKeys, info) => {
          console.log('onSelect', selectedKeys, info);
          // 点击节点文本时也触发选择（可选功能）
          // 注意：这里使用的是onSelect，主要用于点击节点文本时的处理
          // 实际的多选功能主要通过onCheck实现
        }}
        onExpand={handleExpand}
        blockNode
        defaultExpandAll={false}
      />
    </div>
  );
};

export default MenuPermissionTree;
