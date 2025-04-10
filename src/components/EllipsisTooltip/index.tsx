import { EllipsisTooltipProps } from '@/types/interfaces/common';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';

// 'Tooltip省略号'组件
export const EllipsisTooltip: React.FC<EllipsisTooltipProps> = ({
  className,
  text,
}) => {
  const textRef = useRef(null);
  const [isOverflowed, setIsOverflowed] = useState(false);

  useEffect(() => {
    // 检测文本是否溢出（单行）
    if (textRef.current) {
      const element = textRef.current;
      const isOverflow = element.scrollWidth > element.clientWidth;
      setIsOverflowed(isOverflow);
    }
  }, [text]); // 当文本变化时重新检测

  return (
    <div className={classNames('text-ellipsis', className)} ref={textRef}>
      {isOverflowed ? <Tooltip title={text}>{text}</Tooltip> : text}
    </div>
  );
};
