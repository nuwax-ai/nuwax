/**
 * 用户输入气泡折叠（bug 2529/2470）：气泡正文渲染高超限（默认 200px）时默认收起，
 * 「展开/收起」控件渲染在气泡框内尾部；正文未超限（字数不多）一律不出现控件。
 * 仅作用于 V2 渲染线的用户消息气泡，V1 线不受影响。
 *
 * 实现要点：
 * - 阈值只测气泡正文（ChatView 用户消息内的 .ds-markdown-answer），排除附件与
 *   气泡外操作行——短文案即使带高附件也不会出现折叠入口；截断同样只作用于
 *   正文节点，附件与复制按钮行保持完整可见；
 * - 控件经 React portal 挂进气泡框（正文所在的 .chat-content 灰底气泡）尾部，
 *   贴内容右下、留在气泡背景内（不再在气泡外独立成行）；
 * - 测高用正文节点 scrollHeight（max-height 截断不影响 scrollHeight）；
 *   ResizeObserver 兜底字体加载后的高度变化，并顺带处理子树重挂后的节点重定位。
 */
import { dict } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 收起阈值（px）：气泡正文渲染高超过该值才出现折叠与切换入口 */
export const USER_BUBBLE_COLLAPSE_MAX = 200;

/** 折叠作用的目标节点：正文（阈值测量/截断对象）与气泡框（控件挂载点） */
interface BubbleNodes {
  bubble: HTMLElement;
  body: HTMLElement;
}

export interface UserBubbleCollapseProps {
  children: React.ReactNode;
}

/**
 * 在包裹范围内定位用户气泡目标节点。
 * ChatView 用户消息正文容器为 .ds-markdown-answer（全局类；范围内仅此一条
 * 用户消息），气泡框 = 正文所在的灰底气泡（.chat-content.user，全局类 ds-markdown）。
 */
const locateBubbleNodes = (root: HTMLElement): BubbleNodes | null => {
  const body = root.querySelector<HTMLElement>('.ds-markdown-answer');
  if (!body) return null;
  const bubble = body.closest<HTMLElement>('.ds-markdown');
  if (!bubble || !root.contains(bubble)) return null;
  return { bubble, body };
};

const UserBubbleCollapse: React.FC<UserBubbleCollapseProps> = ({
  children,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<BubbleNodes | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sync = () => {
      // 每次同步重新定位：子树重挂后目标节点实例会更换
      const current = locateBubbleNodes(root);
      setNodes((prev) =>
        prev && current && prev.bubble === current.bubble && prev.body === current.body
          ? prev
          : current,
      );
      setOverflowing(
        current
          ? current.body.scrollHeight > USER_BUBBLE_COLLAPSE_MAX
          : false,
      );
    };

    sync();
    if (typeof ResizeObserver === 'undefined') return;
    // 观察外层容器（高度随气泡内容变化；截断态 overflowing 已为真无需再翻转）
    const observer = new ResizeObserver(sync);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const collapsed = overflowing && !expanded;

  // 截断只作用于正文节点（ChatView 对该节点无受控 style，本层独占管理）
  useEffect(() => {
    const body = nodes?.body;
    if (!body) return;
    if (collapsed) {
      body.style.maxHeight = `${USER_BUBBLE_COLLAPSE_MAX}px`;
      body.style.overflow = 'hidden';
    } else {
      body.style.maxHeight = '';
      body.style.overflow = '';
    }
  }, [nodes, collapsed]);

  return (
    <div
      className={cx(styles['user-bubble-collapse'])}
      ref={rootRef}
      data-testid="v2-user-bubble-content"
      data-collapsed={collapsed ? 'true' : undefined}
    >
      {children}
      {nodes &&
        overflowing &&
        createPortal(
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
          </button>,
          nodes.bubble,
        )}
    </div>
  );
};

export default UserBubbleCollapse;
