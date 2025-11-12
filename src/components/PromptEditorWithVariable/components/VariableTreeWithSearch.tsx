/**
 * 变量树组件
 * 支持键盘导航：上下键切换，回车展开/收起或选中
 */

import { TreeNodeData } from '@/components/SmartVariableInput/utils';
import { Tree } from 'antd';
import React, { useEffect, useState } from 'react';

interface VariableTreeProps {
  treeData: TreeNodeData[];
  selectedKeys: string[];
  onSelect: (selectedKeys: React.Key[], info: any) => void;
  expandedKeys?: React.Key[];
  onExpand?: (expandedKeys: React.Key[]) => void;
}

/**
 * 变量树组件
 */
const VariableTree: React.FC<VariableTreeProps> = ({
  treeData,
  selectedKeys,
  onSelect,
  expandedKeys: externalExpandedKeys,
  onExpand: externalOnExpand,
}) => {
  // 内部展开状态（如果外部没有提供）
  const [internalExpandedKeys, setInternalExpandedKeys] = useState<React.Key[]>(
    [],
  );

  // 使用外部或内部展开状态
  const expandedKeys = externalExpandedKeys ?? internalExpandedKeys;
  const handleExpand = externalOnExpand ?? setInternalExpandedKeys;

  // 初始化：展开所有有子节点的节点（仅在外部没有提供 expandedKeys 时）
  useEffect(() => {
    if (externalExpandedKeys !== undefined) {
      // 如果外部提供了 expandedKeys，不自动初始化
      return;
    }

    const getAllParentKeys = (nodes: TreeNodeData[]): React.Key[] => {
      const keys: React.Key[] = [];
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          keys.push(node.key);
          keys.push(...getAllParentKeys(node.children));
        }
      });
      return keys;
    };

    if (treeData.length > 0 && internalExpandedKeys.length === 0) {
      const allParentKeys = getAllParentKeys(treeData);
      setInternalExpandedKeys(allParentKeys);
    }
  }, [treeData, externalExpandedKeys, internalExpandedKeys.length]);

  return (
    <div className="variable-tree" style={{ height: '100%', overflow: 'auto' }}>
      {treeData.length > 0 ? (
        <Tree
          treeData={treeData}
          onSelect={onSelect}
          showLine={false}
          expandedKeys={expandedKeys}
          onExpand={handleExpand}
          selectedKeys={selectedKeys}
          autoExpandParent={true}
          blockNode={true}
          // 添加自定义渲染，支持 data-node-key 属性用于滚动定位
          titleRender={(nodeData: any) => {
            return <span data-node-key={nodeData.key}>{nodeData.title}</span>;
          }}
        />
      ) : (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#999',
          }}
        >
          暂无变量
        </div>
      )}
    </div>
  );
};

export default VariableTree;
