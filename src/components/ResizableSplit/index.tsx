import React, { useCallback, useEffect, useRef, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import styles from './index.module.less';

interface Props {
  left?: React.ReactNode;
  right?: React.ReactNode;
  minLeftWidth?: number;
  minRightWidth?: number;
  defaultLeftWidth?: number;
  /** 分隔线颜色 */
  dividerColor?: string;
  /** 分隔线悬停颜色 */
  dividerHoverColor?: string;
  /** 分隔线拖拽时颜色 */
  dividerDraggingColor?: string;
  /** 容器自定义样式 */
  style?: React.CSSProperties;
  /** 容器自定义类名 */
  className?: string;
}

const ResizableSplit: React.FC<Props> = ({
  left,
  right,
  minLeftWidth = 150,
  minRightWidth = 300,
  defaultLeftWidth = 33, // 默认左侧占比33%
  dividerColor = '#e0e0e0',
  dividerHoverColor = '#bbb',
  dividerDraggingColor = '#1890ff',
  style,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [leftWidthPercent, setLeftWidthPercent] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);

  // 使用 ref 来存储拖拽时的位置，避免状态更新延迟
  const dragPositionRef = useRef({ x: 0, y: 0 });

  // 节流函数，减少状态更新频率
  const throttleRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
        // 更新拖拽位置
        dragPositionRef.current.x = (leftWidthPercent / 100) * width;
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, [leftWidthPercent]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
    };
  }, []);

  // 检查是否有内容
  const hasLeftContent = !!left;
  const hasRightContent = !!right;

  // 如果只有一侧有内容，则不需要分隔线
  const showDivider = hasLeftContent && hasRightContent;

  // 计算实际宽度百分比
  const actualLeftPercent =
    hasLeftContent && !hasRightContent
      ? 100
      : !hasLeftContent && hasRightContent
      ? 0
      : leftWidthPercent;

  const disabled = !showDivider;

  // 节流更新函数
  const throttledUpdateWidth = useCallback((clampedWidth: number) => {
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
    }

    throttleRef.current = setTimeout(() => {
      setLeftWidthPercent(clampedWidth);
    }, 16); // 约60fps
  }, []);

  // 拖拽中
  const handleDrag = (e: DraggableEvent, data: DraggableData) => {
    if (!containerRef.current || containerWidth === 0) return;

    // 使用 data.x 而不是 data.lastX，确保位置准确
    const newX = data.x;

    // 计算新的左侧宽度百分比
    const newLeftWidthPercent = (newX / containerWidth) * 100;

    // 计算最小宽度百分比
    const minLeftPercent = (minLeftWidth / containerWidth) * 100;
    const minRightPercent = (minRightWidth / containerWidth) * 100;
    const maxLeftPercent = 100 - minRightPercent;

    // 限制宽度范围
    const clampedWidth = Math.max(
      minLeftPercent,
      Math.min(maxLeftPercent, newLeftWidthPercent),
    );

    // 更新 ref，避免状态更新延迟
    dragPositionRef.current.x = (clampedWidth / 100) * containerWidth;

    // 使用节流更新状态，减少闪烁
    throttledUpdateWidth(clampedWidth);
  };

  // 全局鼠标移动处理（防止进入 iframe 时拖拽中断）
  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current || containerWidth === 0) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - containerRect.left;

    // 计算新的左侧宽度百分比
    const newLeftWidthPercent = (relativeX / containerWidth) * 100;

    // 计算最小宽度百分比
    const minLeftPercent = (minLeftWidth / containerWidth) * 100;
    const minRightPercent = (minRightWidth / containerWidth) * 100;
    const maxLeftPercent = 100 - minRightPercent;

    // 限制宽度范围
    const clampedWidth = Math.max(
      minLeftPercent,
      Math.min(maxLeftPercent, newLeftWidthPercent),
    );

    // 更新 ref，避免状态更新延迟
    dragPositionRef.current.x = (clampedWidth / 100) * containerWidth;

    // 使用节流更新状态，减少闪烁
    throttledUpdateWidth(clampedWidth);
  };

  // 全局鼠标松开处理
  const handleGlobalMouseUp = () => {
    setIsDragging(false);
    // 恢复文本选择
    document.body.style.userSelect = '';
    // 移除全局事件监听
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
    // 清理节流定时器
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
      throttleRef.current = null;
    }
  };

  // 拖拽开始
  const handleDragStart = () => {
    setIsDragging(true);
    // 禁止文本选择
    document.body.style.userSelect = 'none';
    // 添加全局鼠标事件监听，防止进入 iframe 时拖拽中断
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  // 拖拽结束
  const handleDragStop = (e: DraggableEvent, data: DraggableData) => {
    setIsDragging(false);
    // 恢复文本选择
    document.body.style.userSelect = '';
    // 移除全局事件监听
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
    // 清理节流定时器
    if (throttleRef.current) {
      clearTimeout(throttleRef.current);
      throttleRef.current = null;
    }

    // 最后一次更新位置
    if (containerRef.current && containerWidth > 0) {
      const newX = data.x;
      const newLeftWidthPercent = (newX / containerWidth) * 100;
      const minLeftPercent = (minLeftWidth / containerWidth) * 100;
      const minRightPercent = (minRightWidth / containerWidth) * 100;
      const maxLeftPercent = 100 - minRightPercent;
      const clampedWidth = Math.max(
        minLeftPercent,
        Math.min(maxLeftPercent, newLeftWidthPercent),
      );

      setLeftWidthPercent(clampedWidth);
      dragPositionRef.current.x = (clampedWidth / 100) * containerWidth;
    }
  };

  // 计算分隔线的位置
  const dividerPosition = isDragging
    ? dragPositionRef.current
    : { x: (leftWidthPercent / 100) * containerWidth, y: 0 };

  return (
    <div
      className={`${styles.container} ${className || ''}`}
      style={style}
      ref={containerRef}
    >
      {/* 拖拽时的遮罩层，防止 iframe 干扰 */}
      {isDragging && <div className={styles.dragOverlay} />}

      {hasLeftContent && (
        <div className={styles.left} style={{ width: `${actualLeftPercent}%` }}>
          {left}
        </div>
      )}

      {showDivider && (
        <Draggable
          axis="x"
          position={dividerPosition}
          onStart={handleDragStart}
          onDrag={handleDrag}
          onStop={handleDragStop}
          disabled={disabled}
          bounds={{
            left: minLeftWidth,
            right: containerWidth - minRightWidth,
          }}
        >
          <div
            className={`${styles.divider} ${disabled ? styles.disabled : ''} ${
              isDragging ? styles.dragging : ''
            }`}
            style={
              {
                '--divider-color': dividerColor,
                '--divider-hover-color': dividerHoverColor,
                '--divider-dragging-color': dividerDraggingColor,
              } as React.CSSProperties
            }
          />
        </Draggable>
      )}

      {hasRightContent && (
        <div
          className={styles.right}
          style={{ width: `${100 - actualLeftPercent}%` }}
        >
          {right}
        </div>
      )}
    </div>
  );
};

export default ResizableSplit;
