import { useState } from 'react';

// 从 CSS 变量或主题中获取弹窗配置
const getPopoverConfig = () => {
  // 可以从 CSS 变量中读取，或者使用默认值
  const style = getComputedStyle(document.documentElement);

  return {
    width: parseInt(style.getPropertyValue('--popover-width')) || 200,
    height: parseInt(style.getPropertyValue('--popover-height')) || 300,
    padding: parseInt(style.getPropertyValue('--popover-padding')) || 8,
    minMargin: 10,
    verticalOffset: 5,
  };
};

// 弹窗配置常量
export const POPOVER_CONFIG = {
  width: 200,
  height: 300,
  padding: 8,
  minMargin: 10, // 最小边距
  verticalOffset: 5, // 垂直偏移量
} as const;

/**
 * 计算弹窗位置，支持左右对齐检测
 * @param targetRect 目标元素的位置信息
 * @param options 配置选项
 * @returns 计算后的位置坐标
 */
export const calculatePopoverPosition = (
  targetRect: DOMRect,
  options: {
    width?: number;
    minMargin?: number;
    verticalOffset?: number;
  } = {},
) => {
  // 动态获取配置，支持主题切换
  const config = getPopoverConfig();

  const {
    width = config.width,
    minMargin = config.minMargin,
    verticalOffset = config.verticalOffset,
  } = options;

  const viewportWidth = window.innerWidth;
  let left = targetRect.left + window.scrollX;

  // 检测是否会超出右边界
  if (left + width > viewportWidth) {
    // 右对齐：将弹窗右边缘对齐到目标元素右边缘
    left = targetRect.right + window.scrollX - width;

    // 如果右对齐后还是超出左边界，则强制左对齐到视窗边缘
    if (left < minMargin) {
      left = minMargin;
    }
  }

  return {
    top: targetRect.bottom + window.scrollY + verticalOffset,
    left: left,
  };
};

/**
 * 获取光标位置的弹窗坐标
 */
export const getCursorPopoverPosition = () => {
  const range = window.getSelection()?.getRangeAt(0);
  const rect = range?.getBoundingClientRect();

  if (!rect) {
    return null;
  }

  return calculatePopoverPosition(rect);
};

/**
 * 获取编辑器位置的弹窗坐标
 */
export const getEditorPopoverPosition = (editorElement: HTMLElement) => {
  const rect = editorElement.getBoundingClientRect();
  return calculatePopoverPosition(rect);
};

/**
 * 弹窗位置管理 Hook
 */
export const usePopoverPosition = () => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePositionFromCursor = () => {
    setTimeout(() => {
      const newPosition = getCursorPopoverPosition();
      if (newPosition) {
        setPosition(newPosition);
      }
    }, 0);
  };

  const updatePositionFromEditor = (editorElement: HTMLElement) => {
    setTimeout(() => {
      const newPosition = getEditorPopoverPosition(editorElement);
      setPosition(newPosition);
    }, 0);
  };

  return {
    position,
    setPosition,
    updatePositionFromCursor,
    updatePositionFromEditor,
  };
};
