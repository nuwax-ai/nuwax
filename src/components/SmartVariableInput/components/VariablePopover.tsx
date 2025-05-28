import React from 'react';
import { POPOVER_CONFIG } from '../hooks/usePopoverPosition';
import { TreeNodeData } from '../utils';
import VariableTree from './VariableTree';

interface VariablePopoverProps {
  visible: boolean;
  position: { top: number; left: number };
  treeData: TreeNodeData[];
  selectedKeys: string[];
  onSelect: (selectedKeys: React.Key[], info: any) => void;
}

/**
 * 变量选择弹窗组件
 */
const VariablePopover: React.FC<VariablePopoverProps> = ({
  visible,
  position,
  treeData,
  selectedKeys,
  onSelect,
}) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 1000,
        background: '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08)',
        padding: POPOVER_CONFIG.padding,
        width: POPOVER_CONFIG.width,
        height: POPOVER_CONFIG.height,
        overflow: 'hidden',
        maxWidth: 'calc(100vw - 20px)',
      }}
    >
      <VariableTree
        treeData={treeData}
        selectedKeys={selectedKeys}
        onSelect={onSelect}
      />
    </div>
  );
};

export default VariablePopover;
