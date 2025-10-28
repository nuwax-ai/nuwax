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
  minLeftWidth = 350,
  minRightWidth = 350,
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
  const [isInitialized, setIsInitialized] = useState(false);
  // 控制分隔线的延迟淡入
  const [dividerVisible, setDividerVisible] = useState(false);
  // 保存上一次的容器宽度，用于检测容器尺寸变化
  const prevContainerWidthRef = useRef(0);
  // 保存左侧固定像素宽度（当达到最小宽度时）
  const fixedLeftWidthRef = useRef<number | null>(null);

  // 延迟显示分隔线，产生淡入效果
  useEffect(() => {
    const timer = setTimeout(() => {
      setDividerVisible(true);
    }, 300); // 延迟 300ms 后显示分隔线

    return () => clearTimeout(timer);
  }, []);

  // 监听容器宽度变化
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
        // 首次计算完成后标记为已初始化
        if (!isInitialized && width > 0) {
          setIsInitialized(true);
        }
      }
    };

    // 立即同步计算一次，减少初始渲染延迟
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
  }, [isInitialized]);

  // 当容器宽度变化时，自动调整分隔线位置以避免出现滚动条
  useEffect(() => {
    if (!containerWidth || !isInitialized) return;

    const prevWidth = prevContainerWidthRef.current;

    // 只有在容器宽度发生变化时才处理
    if (prevWidth === containerWidth) return;

    // 拖动时不执行自适应逻辑，避免冲突和闪烁
    if (isDragging) return;

    // 更新上一次的宽度
    prevContainerWidthRef.current = containerWidth;

    // 优先使用固定宽度（如果已设置）
    let targetLeftWidth: number;

    if (fixedLeftWidthRef.current !== null) {
      // 如果已经有固定宽度，优先使用固定宽度
      targetLeftWidth = fixedLeftWidthRef.current;
    } else {
      // 否则使用当前百分比计算的宽度
      targetLeftWidth = (leftWidthPercent / 100) * containerWidth;
    }

    // 计算右侧宽度
    const targetRightWidth = containerWidth - targetLeftWidth;

    // 检查是否超出最小宽度限制
    const leftBelowMin = targetLeftWidth < minLeftWidth;
    const rightBelowMin = targetRightWidth < minRightWidth;

    // 如果两侧都低于最小宽度，优先保证左侧最小宽度，固定左侧
    if (leftBelowMin && rightBelowMin) {
      fixedLeftWidthRef.current = minLeftWidth;
      const newLeftPercent = (minLeftWidth / containerWidth) * 100;
      setLeftWidthPercent(newLeftPercent);
      return;
    }

    // 如果左侧低于最小宽度，固定左侧为最小宽度
    if (leftBelowMin) {
      fixedLeftWidthRef.current = minLeftWidth;
      const newLeftPercent = (minLeftWidth / containerWidth) * 100;
      setLeftWidthPercent(newLeftPercent);
      return;
    }

    // 如果右侧低于最小宽度，调整左侧宽度以保证右侧最小宽度
    if (rightBelowMin) {
      const newLeftWidth = containerWidth - minRightWidth;
      fixedLeftWidthRef.current = newLeftWidth;
      const newLeftPercent = (newLeftWidth / containerWidth) * 100;
      setLeftWidthPercent(Math.max(0, newLeftPercent));
      return;
    }

    // 如果左侧已经是固定宽度，保持固定像素值，只更新百分比
    if (fixedLeftWidthRef.current !== null) {
      const newLeftPercent = (fixedLeftWidthRef.current / containerWidth) * 100;
      setLeftWidthPercent(newLeftPercent);
      return;
    }

    // 正常情况：容器放大/缩小，但都没有达到最小宽度限制
    // 检查右侧是否会超出最大范围
    const maxLeftWidth = containerWidth - minRightWidth;
    if (targetLeftWidth > maxLeftWidth) {
      const newLeftPercent = (maxLeftWidth / containerWidth) * 100;
      setLeftWidthPercent(newLeftPercent);
    }
  }, [
    containerWidth,
    isInitialized,
    leftWidthPercent,
    minLeftWidth,
    minRightWidth,
    isDragging,
  ]);

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

  // 拖拽中 - 实时更新状态
  const handleDrag = useCallback(
    (e: DraggableEvent, data: DraggableData) => {
      if (!containerRef.current || containerWidth === 0) return;

      // 使用 data.x 获取当前位置
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

      // 实时更新状态，React 18 会自动批处理
      setLeftWidthPercent(clampedWidth);

      // 拖动时清除固定宽度，避免与自适应逻辑冲突
      if (fixedLeftWidthRef.current !== null) {
        fixedLeftWidthRef.current = null;
      }
    },
    [containerWidth, minLeftWidth, minRightWidth],
  );

  // 全局鼠标移动处理（防止进入 iframe 时拖拽中断）
  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current || containerWidth === 0) return;

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

      // 实时更新状态
      setLeftWidthPercent(clampedWidth);

      // 拖动时清除固定宽度，避免与自适应逻辑冲突
      if (fixedLeftWidthRef.current !== null) {
        fixedLeftWidthRef.current = null;
      }
    },
    [containerWidth, minLeftWidth, minRightWidth],
  );

  // 全局鼠标松开处理
  const handleGlobalMouseUp = useCallback(() => {
    setIsDragging(false);
    // 恢复文本选择
    document.body.style.userSelect = '';
    // 移除全局事件监听
    document.removeEventListener('mousemove', handleGlobalMouseMove as any);
    document.removeEventListener('mouseup', handleGlobalMouseUp as any);
  }, [handleGlobalMouseMove]);

  // 拖拽开始
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    // 禁止文本选择
    document.body.style.userSelect = 'none';
    // 添加全局鼠标事件监听，防止进入 iframe 时拖拽中断
    document.addEventListener('mousemove', handleGlobalMouseMove as any);
    document.addEventListener('mouseup', handleGlobalMouseUp as any);
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  // 拖拽结束
  const handleDragStop = useCallback(
    (e: DraggableEvent, data: DraggableData) => {
      setIsDragging(false);
      // 恢复文本选择
      document.body.style.userSelect = '';
      // 移除全局事件监听
      document.removeEventListener('mousemove', handleGlobalMouseMove as any);
      document.removeEventListener('mouseup', handleGlobalMouseUp as any);

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

        // 用户手动拖动后，清除固定宽度，恢复百分比模式
        fixedLeftWidthRef.current = null;
      }
    },
    [
      containerWidth,
      minLeftWidth,
      minRightWidth,
      handleGlobalMouseMove,
      handleGlobalMouseUp,
    ],
  );

  // 计算分隔线的位置 - 实时跟随状态更新
  const dividerPosition = {
    x: (leftWidthPercent / 100) * containerWidth,
    y: 0,
  };

  return (
    <div
      className={`${styles.container} ${className || ''}`}
      style={style}
      ref={containerRef}
    >
      {/* 拖拽时的遮罩层，防止 iframe 干扰 */}
      {isDragging && <div className={styles.dragOverlay} />}

      {hasLeftContent && (
        <div
          className={styles.left}
          style={{
            width: `${actualLeftPercent}%`,
            // 初始化完成前使用 CSS 过渡，避免抖动
            transition: isInitialized ? 'none' : 'width 0ms',
            // 拖拽时禁用滚动，避免滚动条闪烁
            overflow: isDragging ? 'hidden' : 'auto',
          }}
        >
          {left}
        </div>
      )}

      {showDivider && containerWidth > 0 && (
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
                opacity: dividerVisible ? 1 : 0,
                transition: 'opacity 0.4s ease-in-out',
              } as React.CSSProperties
            }
          />
        </Draggable>
      )}

      {hasRightContent && (
        <div
          className={styles.right}
          style={{
            width: `${100 - actualLeftPercent}%`,
            // 初始化完成前使用 CSS 过渡，避免抖动
            transition: isInitialized ? 'none' : 'width 0ms',
            // 拖拽时禁用滚动，避免滚动条闪烁
            overflow: isDragging ? 'hidden' : 'auto',
          }}
        >
          {right}
        </div>
      )}
    </div>
  );
};

export default ResizableSplit;
