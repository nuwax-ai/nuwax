/**
 * 变量选择弹窗组件
 * 集成 VariableTreeWithSearch 并处理位置计算
 */

import { POPOVER_CONFIG } from '@/components/SmartVariableInput/hooks/usePopoverPosition';
import { TreeNodeData } from '@/components/SmartVariableInput/utils';
import React, { forwardRef, useEffect, useRef } from 'react';
import VariableTree from './VariableTreeWithSearch';

interface VariablePopoverProps {
  visible: boolean;
  position: { top: number; left: number };
  treeData: TreeNodeData[];
  selectedKeys: string[];
  onSelect: (selectedKeys: React.Key[], info: any) => void;
  expandedKeys?: React.Key[];
  onExpand?: (expandedKeys: React.Key[]) => void;
}

/**
 * 变量选择弹窗组件
 */
const VariablePopover = forwardRef<HTMLDivElement, VariablePopoverProps>(
  (
    {
      visible,
      position,
      treeData,
      selectedKeys,
      onSelect,
      expandedKeys,
      onExpand,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // 当弹窗显示时，自动聚焦到容器上，使键盘导航生效
    useEffect(() => {
      if (visible) {
        // 使用 requestAnimationFrame 确保 DOM 已完全渲染
        const rafId = requestAnimationFrame(() => {
          // 再次使用 setTimeout 确保浏览器完成渲染
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.focus();
              // 验证焦点是否设置成功
              if (document.activeElement === containerRef.current) {
                console.log('✅ 焦点已成功设置到弹窗容器');
              } else {
                console.warn(
                  '⚠️ 焦点设置失败，当前焦点:',
                  document.activeElement,
                );
              }
            }
          }, 10);
        });

        return () => {
          cancelAnimationFrame(rafId);
        };
      }
    }, [visible]);

    if (!visible) return null;

    return (
      <div
        className="variable-popover"
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        tabIndex={0} // 使容器可以接收焦点并参与 Tab 键导航
        role="listbox"
        aria-label="变量选择器"
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
          display: 'flex',
          flexDirection: 'column',
          outline: 'none', // 移除焦点时的默认轮廓
        }}
        onFocus={(e) => {
          console.log('弹窗容器获得焦点', e.target);
        }}
        onBlur={(e) => {
          console.log('弹窗容器失去焦点', e.target);
        }}
      >
        <VariableTree
          treeData={treeData}
          selectedKeys={selectedKeys}
          onSelect={onSelect}
          expandedKeys={expandedKeys}
          onExpand={onExpand}
        />
      </div>
    );
  },
);

VariablePopover.displayName = 'VariablePopover';

export default VariablePopover;
