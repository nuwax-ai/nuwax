import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.module.less';
import ResizeDivider from './ResizeDivider';
import { getSplitBounds } from './splitBounds';

interface Props {
  left?: React.ReactNode;
  /** 左侧子树保活但不占布局。 */
  leftHidden?: boolean;
  right?: React.ReactNode;
  /** 保持右侧子树挂载，但从布局中隐藏（用于 iframe / 终端实例保活） */
  rightHidden?: boolean;
  /** 容器窄于此宽度时上下排列，两栏各占一半高度。 */
  stackBelowWidth?: number;
  minLeftWidth?: number;
  minRightWidth?: number;
  defaultLeftWidth?: number;
  /** 重置触发器，当值变化时重置为 defaultLeftWidth */
  resetTrigger?: string | number | boolean;
  /** 拖拽结束回调，参数为最终左侧宽度百分比 */
  onResizeEnd?: (leftPercent: number) => void;
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
  leftHidden = false,
  right,
  rightHidden = false,
  stackBelowWidth = 0,
  minLeftWidth = 350,
  minRightWidth = 350,
  defaultLeftWidth = 50, // 默认左侧占比50%
  resetTrigger,
  onResizeEnd,
  // hover / 拖拽用中性深灰而非主题主色：主色在部分主题下是红色，
  // 落在分隔条上像错误态；这里要的是「可拖动」的中性反馈
  dividerHoverColor = '#8c8c8c',
  dividerDraggingColor = '#595959',
  style,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const { minLeft, minRight } = getSplitBounds(
    containerWidth,
    minLeftWidth,
    minRightWidth,
  );
  const [leftWidthPercent, setLeftWidthPercent] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // 保存上一次的容器宽度，用于检测容器尺寸变化
  const prevContainerWidthRef = useRef(0);
  // 保存左侧固定像素宽度（当达到最小宽度时）
  const fixedLeftWidthRef = useRef<number | null>(null);
  // 保存上一次的 defaultLeftWidth，用于检测变化
  const prevDefaultLeftWidthRef = useRef(defaultLeftWidth);
  // 保存上一次的 resetTrigger，用于检测变化
  const prevResetTriggerRef = useRef(resetTrigger);

  // 监听 defaultLeftWidth 变化，更新默认比例
  useEffect(() => {
    // 如果 defaultLeftWidth 发生变化
    if (prevDefaultLeftWidthRef.current !== defaultLeftWidth) {
      // 如果不在拖拽中，更新比例
      if (!isDragging) {
        // 清除固定宽度，恢复百分比模式
        fixedLeftWidthRef.current = null;
        // 更新比例
        setLeftWidthPercent(defaultLeftWidth);
      }
      // 更新上一次的值
      prevDefaultLeftWidthRef.current = defaultLeftWidth;
    }
  }, [defaultLeftWidth, isDragging]);

  // 监听 resetTrigger 变化，触发比例重置
  useEffect(() => {
    // 只有当 resetTrigger 真正变化时才重置
    if (
      resetTrigger !== undefined &&
      prevResetTriggerRef.current !== resetTrigger &&
      !isDragging
    ) {
      // 清除固定宽度，恢复百分比模式
      fixedLeftWidthRef.current = null;
      // 重置为默认比例
      setLeftWidthPercent(defaultLeftWidth);
      // 更新上一次的值
      prevResetTriggerRef.current = resetTrigger;
    }
  }, [resetTrigger, defaultLeftWidth, isDragging]);

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
    const leftBelowMin = targetLeftWidth < minLeft;
    const rightBelowMin = targetRightWidth < minRight;

    // 如果两侧都低于最小宽度，优先保证左侧最小宽度，固定左侧
    if (leftBelowMin && rightBelowMin) {
      fixedLeftWidthRef.current = minLeft;
      const newLeftPercent = (minLeft / containerWidth) * 100;
      setLeftWidthPercent(newLeftPercent);
      return;
    }

    // 如果左侧低于最小宽度，固定左侧为最小宽度
    if (leftBelowMin) {
      fixedLeftWidthRef.current = minLeft;
      const newLeftPercent = (minLeft / containerWidth) * 100;
      setLeftWidthPercent(newLeftPercent);
      return;
    }

    // 如果右侧低于最小宽度，调整左侧宽度以保证右侧最小宽度
    if (rightBelowMin) {
      const newLeftWidth = containerWidth - minRight;
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
    const maxLeftWidth = containerWidth - minRight;
    if (targetLeftWidth > maxLeftWidth) {
      const newLeftPercent = (maxLeftWidth / containerWidth) * 100;
      setLeftWidthPercent(newLeftPercent);
    }
  }, [
    containerWidth,
    isInitialized,
    leftWidthPercent,
    minLeft,
    minRight,
    isDragging,
  ]);

  // 检查是否有内容
  const shouldRenderLeft = !!left;
  const hasLeftContent = shouldRenderLeft && !leftHidden;
  const shouldRenderRight = !!right;
  const hasRightContent = shouldRenderRight && !rightHidden;

  // 如果只有一侧有内容，则不需要分隔线
  const isStacked =
    hasLeftContent &&
    hasRightContent &&
    containerWidth > 0 &&
    containerWidth < stackBelowWidth;
  const showDivider = hasLeftContent && hasRightContent && !isStacked;

  // 计算实际宽度百分比
  const actualLeftPercent =
    hasLeftContent && !hasRightContent
      ? 100
      : !hasLeftContent && hasRightContent
      ? 0
      : leftWidthPercent;

  const disabled = !showDivider;

  // 按最小宽度约束把容器相对坐标（px）夹到合法百分比
  const clampLeftPercent = useCallback(
    (containerX: number) => {
      const minLeftPercent = (minLeft / containerWidth) * 100;
      const maxLeftPercent = 100 - (minRight / containerWidth) * 100;
      return Math.max(
        minLeftPercent,
        Math.min(maxLeftPercent, (containerX / containerWidth) * 100),
      );
    },
    [containerWidth, minLeft, minRight],
  );

  // 分隔条拖拽中（Draggable onDrag 与全局 mousemove 统一出口）：
  // clientX 换算容器相对坐标后实时更新百分比，并清除固定宽度避免与自适应逻辑冲突
  const handleDividerMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current || containerWidth === 0) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      setLeftWidthPercent(clampLeftPercent(clientX - containerRect.left));
      fixedLeftWidthRef.current = null;
    },
    [containerWidth, clampLeftPercent],
  );

  // 分隔条松手：最后一次夹取更新百分比，并通知外部最终宽度（用于持久化等）
  const handleDividerEnd = useCallback(
    (clientX: number) => {
      if (!containerRef.current || containerWidth === 0) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const clampedWidth = clampLeftPercent(clientX - containerRect.left);
      setLeftWidthPercent(clampedWidth);
      // 用户手动拖动后，清除固定宽度，恢复百分比模式
      fixedLeftWidthRef.current = null;
      onResizeEnd?.(clampedWidth);
    },
    [containerWidth, clampLeftPercent, onResizeEnd],
  );

  return (
    <div
      className={`${styles.container} ${className || ''}`}
      style={{
        ...style,
        flexDirection: isStacked ? 'column' : style?.flexDirection,
      }}
      ref={containerRef}
    >
      {shouldRenderLeft && (
        <div
          className={styles.left}
          style={{
            width: isStacked ? '100%' : `${actualLeftPercent}%`,
            height: isStacked ? '50%' : undefined,
            display: leftHidden ? 'none' : undefined,
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
        <ResizeDivider
          position={(leftWidthPercent / 100) * containerWidth}
          minX={minLeft}
          maxX={containerWidth - minRight}
          disabled={disabled}
          dividerHoverColor={dividerHoverColor}
          dividerDraggingColor={dividerDraggingColor}
          onDraggingChange={setIsDragging}
          onDragMove={handleDividerMove}
          onDragEnd={handleDividerEnd}
        />
      )}

      {shouldRenderRight && (
        <div
          className={styles.right}
          style={{
            width: isStacked ? '100%' : `${100 - actualLeftPercent}%`,
            height: isStacked ? '50%' : undefined,
            display: rightHidden ? 'none' : undefined,
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
