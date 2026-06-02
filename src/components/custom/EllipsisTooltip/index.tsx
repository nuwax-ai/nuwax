import TooltipIcon from '@/components/custom/TooltipIcon';
import { TooltipTitleTypeEnum } from '@/types/enums/common';
import type { EllipsisTooltipProps } from '@/types/interfaces/common';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

/**
 * 溢出检测 Tooltip 组件
 * 只有当文本实际溢出时才显示 tooltip
 */
export const EllipsisTooltip: React.FC<EllipsisTooltipProps> = ({
  className,
  text,
  onClick,
  maxLines = 1,
  maxWidth = 400,
  maxHeight = 280,
  placement = 'top',
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowed, setIsOverflowed] = useState<boolean>(false);
  const displayText = String(text);

  const checkOverflow = useCallback(() => {
    if (!textRef.current) {
      return;
    }

    const element = textRef.current;
    const isOverflow =
      maxLines === 1
        ? element.scrollWidth > element.clientWidth
        : element.scrollHeight > element.clientHeight + 1;
    setIsOverflowed(isOverflow);
  }, [maxLines]);

  useLayoutEffect(() => {
    checkOverflow();
  }, [displayText, checkOverflow]);

  useEffect(() => {
    const element = textRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return () => {};
    }

    const resizeObserver = new ResizeObserver(() => checkOverflow());
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [checkOverflow]);

  return (
    <TooltipIcon
      type={TooltipTitleTypeEnum.Blank}
      placement={placement}
      title={isOverflowed ? displayText : null}
      tooltipStyles={{
        body: {
          maxWidth,
          maxHeight,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        },
      }}
    >
      <div
        className={classNames(
          maxLines === 2 ? 'text-ellipsis-2' : 'text-ellipsis',
          className,
        )}
        ref={textRef}
        onClick={onClick}
      >
        {displayText}
      </div>
    </TooltipIcon>
  );
};
