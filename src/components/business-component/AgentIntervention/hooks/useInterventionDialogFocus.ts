import { useEffect, useRef, type KeyboardEvent } from 'react';

const FOCUSABLE_SELECTOR = [
  'button:not(:disabled)',
  '[href]',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"]):not(:disabled)',
].join(', ');

/**
 * 干预遮罩的焦点管理（aria-modal 的键盘侧承诺）：
 * - 出现时把焦点移入对话框：第一个可聚焦元素，无则容器自身（tabIndex=-1）
 * - 打开期间 Tab / Shift+Tab 在容器内循环，不逃到底下被遮住的会话内容
 * - 关闭时把焦点还原到打开前的元素
 */
export function useInterventionDialogFocus(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const restoreTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }

    restoreTargetRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const first =
      container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? container;
    first.focus();

    return () => {
      const target = restoreTargetRef.current;
      if (target && document.contains(target)) {
        target.focus();
      }
    };
  }, [active]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') {
      return;
    }
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const items = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    );
    if (!items.length) {
      e.preventDefault();
      container.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    // 焦点已在末位前 Tab（或容器外）回到首位；首位前 Shift+Tab（或容器外）跳到末位
    if (!e.shiftKey && (current === last || !container.contains(current))) {
      e.preventDefault();
      first.focus();
    } else if (
      e.shiftKey &&
      (current === first || !container.contains(current))
    ) {
      e.preventDefault();
      last.focus();
    }
  };

  return { containerRef, handleKeyDown };
}
