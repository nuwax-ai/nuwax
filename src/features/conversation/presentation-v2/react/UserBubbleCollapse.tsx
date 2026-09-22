/**
 * 用户输入气泡折叠（bug 2529/2470，视觉走查定稿）：气泡正文超过
 * USER_BUBBLE_COLLAPSE_LINES（10 行）才默认收起，收起态保留
 * USER_BUBBLE_COLLAPSED_LINES（3 行）可见；行数不足一律全文展示、不出现控件。
 * 仅作用于 V2 渲染线的用户消息气泡，V1 线不受影响。
 *
 * 实现要点：
 * - 行数只测气泡正文（ChatView 用户消息内的 .ds-markdown-answer）：
 *   正文 scrollHeight / 行高，排除附件与气泡外操作行——行数不足即使带高附件
 *   也不出现折叠入口；截断同样只作用于正文节点（3×行高，整行截断），
 *   附件与复制按钮行保持完整可见；
 * - 切换控件为圆形 chevron 按钮（收起朝下/展开朝上），经 React portal 挂进
 *   气泡框（正文所在的 .chat-content 灰底气泡）尾部，文档流底部居中、
 *   留在气泡背景内；
 * - 行高取正文节点 getComputedStyle（取不到时用兜底值）；ResizeObserver
 *   兜底字体/图片加载后的高度变化，并顺带处理子树重挂后的节点重定位。
 */
import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 收起触发行数：气泡正文超过该行数才折叠出切换控件 */
export const USER_BUBBLE_COLLAPSE_LINES = 15;

/** 收起态保留可见行数（视觉走查定稿） */
export const USER_BUBBLE_COLLAPSED_LINES = 15;

/** 行高兜底值（px）：正文节点 getComputedStyle 取不到行高时使用（单测环境） */
export const USER_BUBBLE_FALLBACK_LINE_HEIGHT = 24;

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

/** 正文行数：正文高 / 行高，向上取整（不满一行也算一行） */
const countLines = (body: HTMLElement): number => {
  const lineHeight =
    parseFloat(window.getComputedStyle(body).lineHeight) ||
    USER_BUBBLE_FALLBACK_LINE_HEIGHT;
  return Math.ceil(body.scrollHeight / lineHeight);
};

const UserBubbleCollapse: React.FC<UserBubbleCollapseProps> = ({
  children,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const [nodes, setNodes] = useState<BubbleNodes | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState(
    USER_BUBBLE_COLLAPSED_LINES * USER_BUBBLE_FALLBACK_LINE_HEIGHT,
  );
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
      if (!current) {
        setOverflowing(false);
        return;
      }
      const lineHeight =
        parseFloat(window.getComputedStyle(current.body).lineHeight) ||
        USER_BUBBLE_FALLBACK_LINE_HEIGHT;
      setCollapsedHeight(
        Math.max(1, Math.round(lineHeight * USER_BUBBLE_COLLAPSED_LINES)),
      );
      setOverflowing(countLines(current.body) > USER_BUBBLE_COLLAPSE_LINES);
    };

    sync();
    if (typeof ResizeObserver === 'undefined') return;
    // 观察外层容器（高度随气泡内容变化；截断态 overflowing 已为真无需再翻转）
    const observer = new ResizeObserver(sync);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const collapsed = overflowing && !expanded;

  const handleToggle = useCallback(() => {
    setExpanded((value) => !value);
  }, []);

  // 展开后正文显著变高，气泡尾部的收起控件会随之下移出视口；
  // 以 nearest 最小滚动把它带回可视区（收起态不额外滚动）
  useEffect(() => {
    if (expanded) toggleRef.current?.scrollIntoView({ block: 'nearest' });
  }, [expanded, nodes]);

  // 截断只作用于正文节点（ChatView 对该节点无受控 style，本层独占管理）；
  // 按 3×行高整行截断，收起态圆形控件位于气泡内尾部、不被裁剪
  useEffect(() => {
    const body = nodes?.body;
    if (!body) return;
    if (collapsed) {
      body.style.maxHeight = `${collapsedHeight}px`;
      body.style.overflow = 'hidden';
    } else {
      body.style.maxHeight = '';
      body.style.overflow = '';
    }
  }, [nodes, collapsed, collapsedHeight]);

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
            ref={toggleRef}
            className={cx(styles['user-bubble-toggle'])}
            data-testid="v2-user-bubble-toggle"
            aria-expanded={expanded}
            aria-label={
              expanded
                ? dict('PC.Components.ConversationRendererV2.userBubbleCollapse')
                : dict('PC.Components.ConversationRendererV2.userBubbleExpand')
            }
            onClick={handleToggle}
          >
            <SvgIcon
              name={
                expanded ? 'icons-common-caret_up' : 'icons-common-caret_down'
              }
              style={{ fontSize: 12 }}
            />
          </button>,
          nodes.bubble,
        )}
    </div>
  );
};

export default UserBubbleCollapse;
