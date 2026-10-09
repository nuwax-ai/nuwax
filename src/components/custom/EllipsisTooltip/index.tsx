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
  const rafRef = useRef<number | null>(null);
  const displayText = text ? String(text) : '';

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

  // 复检统一延到 rAF：容器宽度过渡（如侧栏收起/展开）期间 ResizeObserver 每帧齐发，
  // 回调里同步读 scrollWidth/clientHeight 会与渲染写穿插、逐次强制同步布局；
  // 合并进同一帧的 rAF 批次后连续读取至多触发一次布局
  const scheduleCheck = useCallback(() => {
    if (typeof requestAnimationFrame !== 'function') {
      checkOverflow();
      return;
    }
    if (rafRef.current !== null) {
      return;
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      checkOverflow();
    });
  }, [checkOverflow]);

  useEffect(() => {
    const element = textRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return () => {};
    }

    const resizeObserver = new ResizeObserver(scheduleCheck);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [scheduleCheck]);

  if (!displayText) {
    return null;
  }

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
