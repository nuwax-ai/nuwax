import { RefObject, useEffect } from 'react';
import { calculateDropdownPosition } from '../utils';

interface UseScrollSyncProps {
  inputRef: RefObject<any>;
  highlightLayerRef: RefObject<HTMLDivElement>;
  internalValue: string;
  visible: boolean;
  textCursorPosition: number;
  extractSearchTextFromInput: (text: string, cursorPos: number) => string;
  setCursorPosition: (position: { x: number; y: number }) => void;
}

export const useScrollSync = ({
  inputRef,
  highlightLayerRef,
  internalValue,
  visible,
  textCursorPosition,
  extractSearchTextFromInput,
  setCursorPosition,
}: UseScrollSyncProps) => {
  // 强制同步滚动位置函数
  const forceSyncScroll = () => {
    const textarea = inputRef.current?.resizableTextArea?.textArea;
    const highlightLayer = highlightLayerRef.current;

    if (!textarea || !highlightLayer) return;

    const currentScrollTop = textarea.scrollTop;
    const currentScrollLeft = textarea.scrollLeft;

    // 立即同步滚动位置
    highlightLayer.scrollTop = currentScrollTop;
    highlightLayer.scrollLeft = currentScrollLeft;
  };

  // 重新计算下拉框位置
  const recalculateDropdownPosition = () => {
    const textarea = inputRef.current?.resizableTextArea?.textArea;
    if (!textarea) return;

    const rect = textarea.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseInt(computedStyle.lineHeight) || 20;
    const charWidth = parseFloat(computedStyle.fontSize) * 0.6;

    const textBeforeCursor = internalValue.substring(0, textCursorPosition);
    const lines = textBeforeCursor.split('\n');
    const currentLine = Math.max(0, lines.length - 1);
    const currentCol = Math.max(0, lines[lines.length - 1]?.length || 0);

    // 获取滚动偏移
    const scrollLeft = textarea.scrollLeft || 0;
    const scrollTop = textarea.scrollTop || 0;

    // 计算相对于视口的光标位置（考虑滚动偏移）
    const cursorX = rect.left + currentCol * charWidth - scrollLeft;
    const cursorY =
      rect.top + currentLine * lineHeight + lineHeight - scrollTop;

    // 重新计算下拉框位置
    const { position } = calculateDropdownPosition(
      cursorX,
      cursorY,
      inputRef.current,
      undefined,
      {
        hasSearch: true,
        searchText: extractSearchTextFromInput(
          internalValue,
          textCursorPosition,
        ),
        treeHeight: 240,
      },
    );

    setCursorPosition(position);
  };

  // 同步输入框和高亮层的滚动位置
  useEffect(() => {
    const textarea = inputRef.current?.resizableTextArea?.textArea;
    const highlightLayer = highlightLayerRef.current;

    if (!textarea || !highlightLayer) return;

    let rafId: number;
    let scrollSyncRafId: number;
    let lastSyncTime = 0;
    const SYNC_INTERVAL = 16; // 约60fps的同步间隔

    // 立即执行一次同步
    forceSyncScroll();

    // 防抖的滚动处理函数
    const handleScroll = () => {
      const currentTime = Date.now();

      // 立即同步
      forceSyncScroll();

      // 清除之前的定时器
      if (scrollSyncRafId) {
        cancelAnimationFrame(scrollSyncRafId);
      }

      // 延迟同步以确保同步完成
      scrollSyncRafId = requestAnimationFrame(() => {
        if (currentTime - lastSyncTime > SYNC_INTERVAL) {
          forceSyncScroll();
          lastSyncTime = currentTime;
        }
      });

      // 如果下拉框可见，重新计算位置
      if (visible) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          recalculateDropdownPosition();
        });
      }
    };

    // 添加多种滚动事件监听以确保同步
    textarea.addEventListener('scroll', handleScroll, { passive: true });
    textarea.addEventListener('scroll', forceSyncScroll, { passive: true }); // 双重同步
    textarea.addEventListener('wheel', handleScroll, { passive: true });
    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (
        e.key === 'PageDown' ||
        e.key === 'PageUp' ||
        e.key === 'Home' ||
        e.key === 'End' ||
        (e.ctrlKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp'))
      ) {
        setTimeout(forceSyncScroll, 0);
      }
    });

    // 监听输入框内容变化
    const observer = new MutationObserver(() => {
      forceSyncScroll();
    });
    observer.observe(textarea, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // 使用 ResizeObserver 监听输入框尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(forceSyncScroll);
    });
    resizeObserver.observe(textarea);

    // 额外的窗口事件监听
    const handleWindowScroll = () => {
      forceSyncScroll();
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    return () => {
      textarea.removeEventListener('scroll', handleScroll);
      textarea.removeEventListener('scroll', forceSyncScroll);
      textarea.removeEventListener('wheel', handleScroll);
      textarea.removeEventListener('keydown', handleScroll); // This might be wrong type if not casted
      window.removeEventListener('scroll', handleWindowScroll);
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollSyncRafId) cancelAnimationFrame(scrollSyncRafId);
      resizeObserver.disconnect();
      observer.disconnect();
    };
  }, [visible, internalValue, textCursorPosition, extractSearchTextFromInput]);

  // 当内容变化时，同步一次滚动位置
  useEffect(() => {
    const textarea = inputRef.current?.resizableTextArea?.textArea;
    const highlightLayer = highlightLayerRef.current;

    if (!textarea || !highlightLayer) return;

    // 立即同步一次
    forceSyncScroll();

    // 使用多重 requestAnimationFrame 确保 DOM 更新后再同步
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        forceSyncScroll();
      });
    });

    // 额外的延迟同步，确保复杂布局情况下也能正确同步
    const timeoutId = setTimeout(() => {
      forceSyncScroll();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [internalValue]);

  return { forceSyncScroll };
};
