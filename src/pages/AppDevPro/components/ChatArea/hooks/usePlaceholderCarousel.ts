import { useEffect, useState } from 'react';

/**
 * 占位符轮播 Hook
 * 用于实现输入框占位符消息的自动轮播功能，带淡入淡出动画效果
 *
 * @param inputValue - 输入框的值，用于判断是否显示占位符
 * @param messages - 占位符消息数组
 * @param interval - 轮播间隔时间（毫秒），默认 5000ms
 * @param fadeDuration - 淡入淡出动画时长（毫秒），默认 300ms
 * @returns 返回占位符轮播的状态和当前显示的文本
 */
export interface UsePlaceholderCarouselReturn {
  /** 当前占位符消息的索引 */
  placeholderIndex: number;
  /** 占位符是否可见（用于控制淡入淡出动画） */
  isPlaceholderVisible: boolean;
  /** 当前显示的占位符文本 */
  currentPlaceholder: string;
}

export function usePlaceholderCarousel(
  inputValue: string | undefined,
  messages: string[],
  interval: number = 5000,
  fadeDuration: number = 300,
): UsePlaceholderCarouselReturn {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);

  // 占位符消息轮播逻辑：每指定时间切换一次
  useEffect(() => {
    // 如果输入框有内容，停止轮播并隐藏占位符
    if (inputValue?.trim()) {
      setIsPlaceholderVisible(false);
      return;
    }

    // 输入框为空时，显示占位符并开始轮播
    setIsPlaceholderVisible(true);

    const timer = setInterval(() => {
      // 先淡出
      setIsPlaceholderVisible(false);
      // 淡出完成后切换内容并淡入
      setTimeout(() => {
        setPlaceholderIndex((prevIndex) => (prevIndex + 1) % messages.length);
        setIsPlaceholderVisible(true);
      }, fadeDuration); // 使用淡出动画时长的一半，确保动画流畅
    }, interval);

    return () => clearInterval(timer);
  }, [inputValue, messages.length, interval, fadeDuration]);

  return {
    placeholderIndex,
    isPlaceholderVisible,
    currentPlaceholder: messages[placeholderIndex] || '',
  };
}
