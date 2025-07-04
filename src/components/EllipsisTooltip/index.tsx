import type { EllipsisTooltipProps } from '@/types/interfaces/common';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';

/**
 * 溢出检测 Tooltip 组件
 * 只有当文本实际溢出时才显示 tooltip
 */
export const EllipsisTooltip: React.FC<EllipsisTooltipProps> = ({
  className,
  text,
  onClick,
  placement = 'top',
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowed, setIsOverflowed] = useState<boolean>(false);

  useEffect(() => {
    const checkOverflow = () => {
      // 检测文本是否溢出（单行）
      if (textRef.current) {
        // 为 element 指定 HTMLElement 类型，解决类型“never”上不存在属性的问题
        const element = textRef.current as HTMLElement;
        const isOverflow = element.scrollWidth > element.clientWidth;
        setIsOverflowed(isOverflow);
      }
    };

    // 使用 requestAnimationFrame 确保在渲染完成后进行计算
    const frameId = requestAnimationFrame(checkOverflow);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [text]); // 当文本变化时重新检测

  return (
    <div
      className={classNames(className || 'text-ellipsis')}
      ref={textRef}
      onClick={onClick}
    >
      <Tooltip title={isOverflowed ? text : ''} placement={placement}>
        {text}
      </Tooltip>
    </div>
  );
};
