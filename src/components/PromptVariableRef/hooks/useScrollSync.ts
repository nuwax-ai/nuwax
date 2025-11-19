import React, { useEffect } from 'react';
import { calculateDropdownPosition } from '../utils/positionUtils';
import { extractSearchTextFromInput } from '../utils/textUtils';

export const useScrollSync = (
  inputRef: React.RefObject<HTMLTextAreaElement>,
  highlightLayerRef: React.RefObject<HTMLDivElement>,
  internalValue: string,
  visible: boolean,
  textCursorPosition: number,
  setCursorPosition: (pos: { x: number; y: number }) => void,
) => {
  // 同步输入框和高亮层的滚动位置 - 增强版本
  useEffect(() => {
    const textarea = inputRef.current;
    const highlightLayer = highlightLayerRef.current;

    if (!textarea || !highlightLayer) return;

    let rafId: number;
    let scrollSyncRafId: number;
    let lastSyncTime = 0;
    const SYNC_INTERVAL = 16; // 约60fps的同步间隔

    // 重新计算下拉框位置
    const recalculateDropdownPosition = () => {
      const textarea = inputRef.current;
      if (!textarea) return;

      const rect = textarea.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight = parseInt(computedStyle.lineHeight) || 20;
      const charWidth = parseFloat(computedStyle.fontSize) * 0.6;

      const textBeforeCursor = internalValue.substring(0, textCursorPosition);
      const lines = textBeforeCursor.split('\n');
      const currentLine = Math.max(0, lines.length - 1);
      const currentCol = Math.max(0, lines[lines.length - 1]?.length || 0);

      // 获取滚动偏移（增强版本）
      const scrollLeft = textarea.scrollLeft || 0;
      const scrollTop = textarea.scrollTop || 0;

      // 计算相对于视口的光标位置（考虑滚动偏移）
      const cursorX = rect.left + currentCol * charWidth - scrollLeft;
      const cursorY =
        rect.top + currentLine * lineHeight + lineHeight - scrollTop;

      console.log('🎯 Recalculate dropdown position:', {
        rectLeft: rect.left,
        rectTop: rect.top,
        currentLine,
        currentCol,
        lineHeight,
        charWidth,
        scrollLeft,
        scrollTop,
        cursorX,
        cursorY,
      });

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

    // 强制同步滚动位置函数
    const forceSyncScroll = () => {
      const currentScrollTop = textarea.scrollTop;
      const currentScrollLeft = textarea.scrollLeft;

      // 立即同步滚动位置
      highlightLayer.scrollTop = currentScrollTop;
      highlightLayer.scrollLeft = currentScrollLeft;

      // 额外的同步确保：考虑尾随换行的情况
      const textAreaRect = textarea.getBoundingClientRect();
      const highlightRect = highlightLayer.getBoundingClientRect();

      const currentTime = Date.now();
      console.log('🔄 Force scroll sync:', {
        scrollTop: currentScrollTop,
        scrollLeft: currentScrollLeft,
        isVisible: visible,
        textAreaHeight: textAreaRect.height,
        highlightHeight: highlightRect.height,
        hasTrailingNewline: internalValue.endsWith('\n'),
        contentLength: internalValue.length,
        timestamp: currentTime,
        deltaTime: currentTime - lastSyncTime,
      });

      lastSyncTime = currentTime;

      // 如果下拉框可见，重新计算位置
      if (visible) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          recalculateDropdownPosition();
        });
      }
    };

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
        }
      });
    };

    // 添加多种滚动事件监听以确保同步
    textarea.addEventListener('scroll', handleScroll, { passive: true });
    textarea.addEventListener('scroll', forceSyncScroll, { passive: true }); // 双重同步
    textarea.addEventListener('wheel', handleScroll, { passive: true });
    textarea.addEventListener('keydown', (e) => {
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
      console.log('📝 Content changed, syncing scroll...');
      forceSyncScroll();
    });
    observer.observe(textarea, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // 使用 ResizeObserver 监听输入框尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      console.log('📐 Size changed, syncing scroll...');
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(forceSyncScroll);
    });
    resizeObserver.observe(textarea);

    // 额外的窗口事件监听
    const handleWindowScroll = () => {
      // 窗口滚动时也同步
      forceSyncScroll();
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    return () => {
      textarea.removeEventListener('scroll', handleScroll);
      textarea.removeEventListener('scroll', forceSyncScroll);
      textarea.removeEventListener('wheel', handleScroll);
      textarea.removeEventListener('keydown', handleScroll);
      window.removeEventListener('scroll', handleWindowScroll);
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollSyncRafId) cancelAnimationFrame(scrollSyncRafId);
      resizeObserver.disconnect();
      observer.disconnect();
    };
  }, [
    visible,
    internalValue,
    textCursorPosition,
    inputRef,
    highlightLayerRef,
    setCursorPosition,
  ]);

  // 当内容变化时，同步一次滚动位置 - 增强版本
  useEffect(() => {
    const textarea = inputRef.current;
    const highlightLayer = highlightLayerRef.current;

    if (!textarea || !highlightLayer) return;

    console.log('📝 Content changed, preparing enhanced sync scroll:', {
      contentLength: internalValue.length,
      scrollTop: textarea.scrollTop,
      scrollLeft: textarea.scrollLeft,
      timestamp: Date.now(),
    });

    // 强制同步滚动位置的函数
    const forceSyncScroll = () => {
      const currentScrollTop = textarea.scrollTop;
      const currentScrollLeft = textarea.scrollLeft;

      highlightLayer.scrollTop = currentScrollTop;
      highlightLayer.scrollLeft = currentScrollLeft;

      console.log('🔄 Enhanced content scroll synced:', {
        scrollTop: currentScrollTop,
        scrollLeft: currentScrollLeft,
        contentLength: internalValue.length,
        timestamp: Date.now(),
      });
    };

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
    }, 100); // 增加延迟时间

    return () => {
      clearTimeout(timeoutId);
    };
  }, [internalValue, inputRef, highlightLayerRef]);
};
