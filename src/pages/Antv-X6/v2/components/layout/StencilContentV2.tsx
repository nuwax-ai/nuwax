/**
 * V2 StencilContent 组件
 *
 * 节点模板列表，支持：
 * - 拖拽添加节点
 * - 点击添加节点
 * - 循环内特殊节点过滤
 *
 * 完全独立，不依赖 v1 任何代码
 */

import React, { useCallback } from 'react';
import {
  asideListV2,
  StencilChildNodeV2,
} from '../../constants/stencilConfigV2';
import { NodeTypeEnumV2 } from '../../types';
// 导入 V1 的 returnImg 用于获取 SVG 图标

import './StencilContentV2.less';

// ==================== 类型定义 ====================

export interface StencilContentV2Props {
  /** 拖拽/点击添加节点回调 */
  onAddNode: (
    node: StencilChildNodeV2,
    position?: React.DragEvent<HTMLDivElement>,
  ) => void;
  /** 是否在循环节点内 */
  isLoop?: boolean;
}

// ==================== 组件实现 ====================

const StencilContentV2: React.FC<StencilContentV2Props> = ({
  onAddNode,
  isLoop = false,
}) => {
  /**
   * 处理拖拽结束事件
   */
  const handleDragEnd = useCallback(
    (child: StencilChildNodeV2, e: React.DragEvent<HTMLDivElement>) => {
      onAddNode(child, e);
    },
    [onAddNode],
  );

  /**
   * 处理点击事件
   */
  const handleClick = useCallback(
    (child: StencilChildNodeV2) => {
      onAddNode(child);
    },
    [onAddNode],
  );

  /**
   * 渲染节点图标 - 使用 V1 的背景图片方式
   */
  const renderIcon = (url: string) => {
    return (
      <div
        className="stencil-v2-icon"
        style={{
          width: '20px',
          height: '20px',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          ...(url && { backgroundImage: `url("${url}")` }),
        }}
      />
    );
  };

  /**
   * 检查节点是否应该显示
   */
  const shouldShowNode = (child: StencilChildNodeV2): boolean => {
    // 循环节点内不显示循环节点
    if (isLoop && child.type === NodeTypeEnumV2.Loop) {
      return false;
    }

    // LoopBreak/LoopContinue 只在循环节点内显示
    const isLoopControl = [
      NodeTypeEnumV2.LoopBreak,
      NodeTypeEnumV2.LoopContinue,
    ].includes(child.type);

    if (isLoopControl && !isLoop) {
      return false;
    }

    return true;
  };

  return (
    <div className="stencil-content-v2">
      <p className="stencil-v2-title">节点选择</p>

      <div className="stencil-v2-list">
        {asideListV2.map((group) => (
          <div className="stencil-v2-group" key={group.key}>
            {/* 分组标题 */}
            {group.name && (
              <p className="stencil-v2-group-title">{group.name}</p>
            )}

            {/* 节点列表 */}
            <div className="stencil-v2-group-content">
              {group.children.filter(shouldShowNode).map((child) => (
                <div
                  className="stencil-v2-item"
                  key={child.type}
                  draggable
                  onDragEnd={(e) => handleDragEnd(child, e)}
                  onClick={() => handleClick(child)}
                  title={child.description}
                >
                  {renderIcon(child.bgIcon)}
                  <span className="stencil-v2-item-name">{child.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StencilContentV2;
