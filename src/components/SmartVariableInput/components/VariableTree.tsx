import { Tree } from 'antd';
import React from 'react';
import { TreeNodeData } from '../utils';

interface VariableTreeProps {
  treeData: TreeNodeData[];
  selectedKeys: string[];
  onSelect: (selectedKeys: React.Key[], info: any) => void;
}

/**
 * 变量选择树组件
 */
const VariableTree: React.FC<VariableTreeProps> = ({
  treeData,
  selectedKeys,
  onSelect,
}) => {
  return (
    <Tree
      treeData={treeData}
      onSelect={onSelect}
      showLine={false}
      defaultExpandAll
      selectedKeys={selectedKeys}
      autoExpandParent={true}
      blockNode={true}
    />
  );
};

export default VariableTree;
