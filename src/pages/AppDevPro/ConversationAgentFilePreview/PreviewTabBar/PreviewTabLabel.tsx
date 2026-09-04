import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export interface PreviewTabLabelProps {
  className?: string;
  text: string | number;
}

/**
 * 预览标签栏专用：溢出省略 + 仅溢出时 Tooltip。
 * 与 EllipsisTooltip 逻辑一致，但增加可选中、便于移入气泡的配置，避免改公共组件。
 */
const PreviewTabLabel: React.FC<PreviewTabLabelProps> = ({
  className,
  text,
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowed, setIsOverflowed] = useState(false);
  const displayText = text ? String(text) : '';

  const checkOverflow = useCallback(() => {
    const element = textRef.current;
    if (!element) {
      return;
    }
    setIsOverflowed(element.scrollWidth > element.clientWidth);
  }, []);

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

  if (!displayText) {
    return null;
  }

  return (
    <Tooltip
      title={isOverflowed ? displayText : null}
      placement="top"
      mouseLeaveDelay={0.15}
      classNames={{ root: 'tooltip-blank preview-tab-label-tooltip' }}
      styles={{
        root: { pointerEvents: 'auto' },
        body: {
          maxWidth: 400,
          maxHeight: 280,
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          userSelect: 'text',
          cursor: 'text',
        },
      }}
    >
      <div ref={textRef} className={classNames('text-ellipsis', className)}>
        {displayText}
      </div>
    </Tooltip>
  );
};

export default PreviewTabLabel;
