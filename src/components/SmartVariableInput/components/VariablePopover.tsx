import React, { forwardRef } from 'react';
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
const VariablePopover = forwardRef<HTMLDivElement, VariablePopoverProps>(
  ({ visible, position, treeData, selectedKeys, onSelect }, ref) => {
    if (!visible) return null;

    return (
      <div
        className="variable-popover"
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
        ref={ref}
      >
        <VariableTree
          treeData={treeData}
          selectedKeys={selectedKeys}
          onSelect={onSelect}
        />
      </div>
    );
  },
);

VariablePopover.displayName = 'VariablePopover';

export default VariablePopover;
