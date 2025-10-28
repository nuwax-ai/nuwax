import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

/**
 * HoverScrollbar（参考 AgentSidebar 的实现）
 * - 默认隐藏纵向滚动条，hover 时显示（使用 overflow 切换）
 * - 内部内容采用 absolute 定位并预留右侧 gutter，避免滚动条影响内容宽度
 * - 仅纵向滚动；横向隐藏
 */
export interface HoverScrollbarProps {
  /** 自定义 className */
  className?: string;
  /** 自定义内联样式 */
  style?: React.CSSProperties;
  /** 固定高度（优先于 maxHeight），传 number 时按 px 处理 */
  height?: number | string;
  /** 最大高度，传 number 时按 px 处理 */
  maxHeight?: number | string;
  /** 内容区宽度 */
  bodyWidth: number | string;
  /** 左侧内边距（px），对齐外部内容 */
  // leftPadding?: number;
  // /** 右侧预留空白（px），避免滚动条挤压内容 */
  // gutterWidth?: number;
  /** 内容区 */
  children?: React.ReactNode;
}

const toCssSize = (value?: number | string): string | undefined => {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
};

const HoverScrollbar: React.FC<HoverScrollbarProps> = ({
  className,
  style,
  height,
  maxHeight,
  bodyWidth,
  children,
}) => {
  const mergedStyle: React.CSSProperties = useMemo(
    () => ({
      ...style,
      height:
        height !== undefined
          ? toCssSize(height)
          : maxHeight === undefined
          ? '100%'
          : undefined,
      maxHeight: toCssSize(maxHeight),
    }),
    [style, height, maxHeight],
  );

  return (
    <div
      className={classNames(styles.container, className)}
      style={mergedStyle}
    >
      <div className={styles.content}>
        <div className={styles.body} style={{ width: bodyWidth }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default HoverScrollbar;
