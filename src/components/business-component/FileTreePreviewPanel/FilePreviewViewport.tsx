import type { FilePreviewReadingPosition } from '@/types/interfaces/fileTree';
import React, { useLayoutEffect, useRef } from 'react';

interface Props {
  identity: string;
  active: boolean;
  position?: FilePreviewReadingPosition;
  onPositionChange?: (position: FilePreviewReadingPosition) => void;
  children: React.ReactNode;
}

/** 记录实际滚动容器（含同源 HTML iframe），内容异步到达后再恢复。 */
export default function FilePreviewViewport({
  identity,
  active,
  position,
  onPositionChange,
  children,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ position, onPositionChange });
  latest.current = { position, onPositionChange };

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !active || !onPositionChange) return;
    let saved = { ...latest.current.position };
    const pending = new Map(Object.entries(saved));
    const cleanups: Array<() => void> = [];
    const frames = new WeakSet<HTMLIFrameElement>();
    let disposed = false;

    const pathOf = (element: Element, parent: Element): string => {
      if (element === parent) return '';
      const path: number[] = [];
      let current: Element | null = element;
      while (current && current !== parent) {
        const container: Element | null = current.parentElement;
        if (!container) return '';
        path.unshift(Array.from(container.children).indexOf(current));
        current = container;
      }
      return path.join('.');
    };
    const find = (parent: Element, path: string): Element | null => {
      let element: Element | null = parent;
      for (const index of path ? path.split('.') : []) {
        element = element?.children[Number(index)] ?? null;
      }
      return element;
    };
    const roots = new Map<string, Element>([['root', root]]);
    const restore = () => {
      if (disposed || root.getClientRects().length === 0) return;
      for (const [key, offset] of pending) {
        const split = key.indexOf(':');
        const parent = roots.get(key.slice(0, split));
        const element = parent ? find(parent, key.slice(split + 1)) : null;
        if (!element || element.clientHeight === 0) continue;
        // 等正文/图片撑开高度，不能把加载中的 0 当成恢复完成。
        element.scrollTop = offset.top;
        element.scrollLeft = offset.left;
        if (
          Math.abs(element.scrollTop - offset.top) < 2 &&
          Math.abs(element.scrollLeft - offset.left) < 2
        )
          pending.delete(key);
      }
    };
    const observe = (parent: Element, name: string) => {
      roots.set(name, parent);
      const onScroll = (event: Event) => {
        const element =
          event.target instanceof Document
            ? event.target.scrollingElement
            : event.target;
        if (
          !element ||
          (element as Element).nodeType !== 1 ||
          root.getClientRects().length === 0
        )
          return;
        const scrollElement = element as Element;
        const key = `${name}:${pathOf(scrollElement, parent)}`;
        if (pending.has(key)) return;
        // 忽略隐藏/加载状态造成的滚动归零，用户滚回顶部仍会记忆。
        if (
          scrollElement.scrollHeight <= scrollElement.clientHeight &&
          scrollElement.scrollWidth <= scrollElement.clientWidth
        )
          return;
        saved = {
          ...saved,
          [key]: {
            top: scrollElement.scrollTop,
            left: scrollElement.scrollLeft,
          },
        };
        latest.current.onPositionChange?.(saved);
      };
      parent.addEventListener('scroll', onScroll, true);
      const mutation = new MutationObserver(restore);
      mutation.observe(parent, { childList: true, subtree: true });
      const resize = new ResizeObserver(restore);
      resize.observe(parent);
      cleanups.push(() => {
        parent.removeEventListener('scroll', onScroll, true);
        mutation.disconnect();
        resize.disconnect();
      });
    };
    const attachFrames = () => {
      root.querySelectorAll('iframe').forEach((frame, index) => {
        if (frames.has(frame)) return;
        frames.add(frame);
        const attach = () => {
          for (const [key, value] of Object.entries(saved)) {
            if (key.startsWith(`frame${index}:`)) pending.set(key, value);
          }
          try {
            const document = frame.contentDocument;
            if (document?.documentElement) {
              observe(document.documentElement, `frame${index}`);
              // document 自身也可能是滚动事件的 target。
              const relay = () => {
                const element = document.scrollingElement;
                const key = `frame${index}:${
                  element ? pathOf(element, document.documentElement) : ''
                }`;
                if (
                  !element ||
                  pending.has(key) ||
                  !root.getClientRects().length
                )
                  return;
                saved = {
                  ...saved,
                  [key]: { top: element.scrollTop, left: element.scrollLeft },
                };
                latest.current.onPositionChange?.(saved);
              };
              document.addEventListener('scroll', relay);
              cleanups.push(() =>
                document.removeEventListener('scroll', relay),
              );
            }
          } catch {
            /* 跨源文件保持原浏览器隔离，不读取其文档。 */
          }
          restore();
        };
        frame.addEventListener('load', attach);
        cleanups.push(() => frame.removeEventListener('load', attach));
        attach();
      });
    };
    observe(root, 'root');
    const observer = new MutationObserver(() => {
      attachFrames();
      // 刷新正文可能替换滚动节点；新节点仍恢复到刚才的位置。
      for (const [key, offset] of Object.entries(saved))
        pending.set(key, offset);
      restore();
    });
    observer.observe(root, { childList: true, subtree: true });
    attachFrames();
    const frame = requestAnimationFrame(restore);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [identity, active, Boolean(onPositionChange)]);

  return (
    <div
      ref={rootRef}
      data-file-preview-viewport={identity}
      className="h-full w-full"
      style={{ minHeight: 0 }}
    >
      {children}
    </div>
  );
}
