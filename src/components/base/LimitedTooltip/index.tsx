import { Tooltip } from 'antd';
import React from 'react';

/**
 * 带最大高度限制的 Tooltip 组件
 * 用于表格列中显示长文本，超出最大高度时在 tips 内部滚动
 *
 * @param {React.ReactNode} children - 要显示的内容
 * @param {number} maxWidth - Tooltip 最大宽度（默认 520px）
 * @param {number} maxHeight - Tooltip 最大高度（默认 280px）
 * @param {string} emptyText - 内容为空时显示的文本（默认 '-'）
 * @param {boolean} formatJson - 是否格式化 JSON（默认 false，直接显示原始内容）
 */
export interface LimitedTooltipProps {
  children?: React.ReactNode;
  maxWidth?: number;
  maxHeight?: number;
  emptyText?: string;
  formatJson?: boolean;
}

/**
 * 格式化文本：支持对象/数组，避免出现 [object Object]
 */
const formatText = (val: any): string => {
  if (val === null || val === undefined) {
    return '';
  }
  if (typeof val === 'string') {
    return val;
  }
  try {
    return JSON.stringify(val, null, 2);
  } catch (e) {
    return String(val);
  }
};

const LimitedTooltip: React.FC<LimitedTooltipProps> = ({
  children,
  maxWidth = 520,
  maxHeight = 280,
  emptyText = '-',
  formatJson = false,
}) => {
  if (!children) {
    return <span>{emptyText}</span>;
  }

  // 如果需要格式化 JSON 或内容不是字符串，先处理内容
  const displayText =
    formatJson ||
    (typeof children !== 'string' &&
      children !== null &&
      children !== undefined)
      ? formatText(children)
      : children;

  return (
    <Tooltip
      title={
        <pre
          style={{
            maxWidth,
            maxHeight,
            overflowY: 'auto',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {displayText}
        </pre>
      }
      overlayInnerStyle={{
        maxWidth,
        maxHeight,
        overflow: 'hidden',
      }}
    >
      <div className="text-ellipsis">{displayText}</div>
    </Tooltip>
  );
};

export default LimitedTooltip;
