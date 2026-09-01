/**
 * 用户输入气泡折叠（V2 样式走查需求）：内容渲染高超限（默认 200px）时默认收起，
 * 「展开/收起」可点击切换。仅作用于 V2 渲染线的用户消息气泡，V1 线不受影响。
 *
 * 测高用内容元素自身的 scrollHeight（max-height 截断不影响 scrollHeight，
 * 天然取到完整内容高）；ResizeObserver 兜底图片/字体加载后的高度增长。
 */
import { dict } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 收起阈值（px）：内容渲染高超过该值才出现折叠与切换入口 */
export const USER_BUBBLE_COLLAPSE_MAX = 200;

export interface UserBubbleCollapseProps {
  children: React.ReactNode;
}

const UserBubbleCollapse: React.FC<UserBubbleCollapseProps> = ({
  children,
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => {
      setOverflowing(el.scrollHeight > USER_BUBBLE_COLLAPSE_MAX);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const collapsed = overflowing && !expanded;

  return (
    <div className={cx(styles['user-bubble-collapse'])}>
      <div
        ref={contentRef}
        className={cx(styles['user-bubble-content'])}
        data-testid="v2-user-bubble-content"
        data-collapsed={collapsed ? 'true' : undefined}
        style={
          collapsed
            ? { maxHeight: USER_BUBBLE_COLLAPSE_MAX, overflow: 'hidden' }
            : undefined
        }
      >
        {children}
      </div>
      {overflowing && (
        <button
          type="button"
          className={cx(styles['user-bubble-toggle'])}
          data-testid="v2-user-bubble-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded
            ? dict('PC.Components.ConversationRendererV2.userBubbleCollapse')
            : dict('PC.Components.ConversationRendererV2.userBubbleExpand')}
        </button>
      )}
    </div>
  );
};

export default UserBubbleCollapse;
