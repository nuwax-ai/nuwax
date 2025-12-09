/**
 * V2 ControlPanel 组件
 *
 * 左下角控制面板，包含：
 * - 缩放控制（放大/缩小/下拉选择/适配画布）
 * - 添加节点按钮
 * - 试运行按钮
 *
 * 完全独立，不依赖 v1 任何代码
 */

import React, { useState, useCallback } from 'react';
import { Button, Popover, Select, Tooltip } from 'antd';
import {
  MinusOutlined,
  PlusOutlined,
  CompressOutlined,
  CaretRightOutlined,
  ToolOutlined,
} from '@ant-design/icons';

import StencilContentV2 from './StencilContentV2';
import { NodeTypeEnumV2 } from '../../types';
import type { StencilChildNodeV2 } from '../../constants/stencilConfigV2';

import './ControlPanelV2.less';

// ==================== 类型定义 ====================

export interface ControlPanelV2Props {
  /** 当前缩放比例 (0-1) */
  zoomSize?: number;
  /** 是否在循环节点内 */
  isInLoop?: boolean;
  /** 是否正在试运行 */
  isTestRunning?: boolean;
  /** 缩放变化回调 */
  onZoomChange?: (zoom: number) => void;
  /** 缩放到适配画布回调 */
  onZoomToFit?: () => void;
  /** 添加节点回调 */
  onAddNode?: (
    node: StencilChildNodeV2,
    position?: React.DragEvent<HTMLDivElement>,
  ) => void;
  /** 试运行回调 */
  onTestRun?: () => void;
}

// ==================== 常量 ====================

const ZOOM_OPTIONS = [
  { label: '放大 10%', value: '+' },
  { label: '缩小 10%', value: '-' },
  { label: '缩放到适配画布', value: -1 },
  {
    label: (
      <div
        style={{
          borderTop: '1px solid #d9d9d9',
          marginTop: '15px',
          height: 0,
          width: '90%',
          marginLeft: '5%',
        }}
      />
    ),
    value: 'divider',
    disabled: true,
    style: { padding: 0, cursor: 'default' },
  },
  { label: '缩放到 50%', value: 0.5 },
  { label: '缩放到 100%', value: 1 },
  { label: '缩放到 150%', value: 1.5 },
  { label: '缩放到 200%', value: 2 },
];

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

// ==================== 组件实现 ====================

const ControlPanelV2: React.FC<ControlPanelV2Props> = ({
  zoomSize = 1,
  isInLoop = false,
  isTestRunning = false,
  onZoomChange,
  onZoomToFit,
  onAddNode,
  onTestRun,
}) => {
  // Popover 打开状态
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // 连续添加计数（用于计算位置偏移）
  const [continueDragCount, setContinueDragCount] = useState(0);

  /**
   * 处理 Popover 打开状态变化
   */
  const handlePopoverOpenChange = useCallback((open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      setContinueDragCount(0);
    }
  }, []);

  /**
   * 缩小
   */
  const handleZoomOut = useCallback(() => {
    const currentPercent = Math.round(zoomSize * 100);
    const newPercent = Math.max(MIN_ZOOM * 100, currentPercent - ZOOM_STEP * 100);
    onZoomChange?.(newPercent / 100);
  }, [zoomSize, onZoomChange]);

  /**
   * 放大
   */
  const handleZoomIn = useCallback(() => {
    const currentPercent = Math.round(zoomSize * 100);
    const newPercent = Math.min(MAX_ZOOM * 100, currentPercent + ZOOM_STEP * 100);
    onZoomChange?.(newPercent / 100);
  }, [zoomSize, onZoomChange]);

  /**
   * 处理缩放选择
   */
  const handleZoomSelect = useCallback(
    (val: string | number) => {
      if (val === '+') {
        handleZoomIn();
      } else if (val === '-') {
        handleZoomOut();
      } else if (val === -1) {
        onZoomToFit?.();
      } else if (typeof val === 'number') {
        onZoomChange?.(val);
      }
    },
    [handleZoomIn, handleZoomOut, onZoomToFit, onZoomChange],
  );

  /**
   * 处理添加节点
   */
  const handleAddNode = useCallback(
    (node: StencilChildNodeV2, position?: React.DragEvent<HTMLDivElement>) => {
      setContinueDragCount((prev) => prev + 1);
      onAddNode?.(node, position);
    },
    [onAddNode],
  );

  return (
    <div className="control-panel-v2">
      {/* 缩放控制区 */}
      <div className="control-panel-v2-section">
        <Button
          type="text"
          icon={<MinusOutlined />}
          onClick={handleZoomOut}
          disabled={zoomSize <= MIN_ZOOM}
        />

        <Select
          options={ZOOM_OPTIONS}
          value={`${Math.round(zoomSize * 100)}%`}
          onChange={handleZoomSelect}
          style={{ width: 80 }}
          popupMatchSelectWidth={false}
          size="small"
        />

        <Button
          type="text"
          icon={<PlusOutlined />}
          onClick={handleZoomIn}
          disabled={zoomSize >= MAX_ZOOM}
        />

        <Tooltip title="缩放到适配画布">
          <Button
            type="text"
            icon={<CompressOutlined />}
            onClick={onZoomToFit}
          />
        </Tooltip>

        {/* 添加节点按钮 */}
        <Popover
          content={
            <StencilContentV2
              isLoop={isInLoop}
              onAddNode={handleAddNode}
            />
          }
          trigger={['click']}
          open={isPopoverOpen}
          onOpenChange={handlePopoverOpenChange}
          placement="topLeft"
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsPopoverOpen(true)}
          >
            添加节点
          </Button>
        </Popover>
      </div>

      {/* 试运行区 */}
      <div className="control-panel-v2-section">
        <Tooltip title="调试">
          <ToolOutlined className="control-panel-v2-debug-icon" />
        </Tooltip>

        <Button
          icon={<CaretRightOutlined />}
          loading={isTestRunning}
          onClick={onTestRun}
          style={{
            backgroundColor: '#52c41a',
            borderColor: '#52c41a',
            color: '#fff',
          }}
        >
          试运行
        </Button>
      </div>
    </div>
  );
};

export default ControlPanelV2;
