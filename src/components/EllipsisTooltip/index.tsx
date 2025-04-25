import type { EllipsisTooltipProps } from '@/types/interfaces/common';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';

// 'Tooltip省略号'组件
export const EllipsisTooltip: React.FC<EllipsisTooltipProps> = ({
  className,
  text,
  onClick,
  placement = 'top',
}) => {
  const textRef = useRef(null);
  const [isOverflowed, setIsOverflowed] = useState(false);

  useEffect(() => {
    // 检测文本是否溢出（单行）
    if (textRef.current) {
      // 为 element 指定 HTMLElement 类型，解决类型“never”上不存在属性的问题
      const element = textRef.current as HTMLElement;
      const isOverflow = element.scrollWidth > element.clientWidth;
      setIsOverflowed(isOverflow);
    }
  }, [text]); // 当文本变化时重新检测

  return (
    <div
      className={classNames('text-ellipsis', className)}
      ref={textRef}
      onClick={onClick}
    >
      {isOverflowed ? (
        <Tooltip title={text} placement={placement}>
          {text}
        </Tooltip>
      ) : (
        text
      )}
    </div>
  );
};
