import { useCallback, useEffect, useState } from 'react';
import { DELAYS, SUPPORTED_LANGUAGES } from './constants';
import type { ContainerPosition, MarkdownCodeToolbarProps } from './types';
import {
  copyTextToClipboard,
  getToolbarData,
  toggleMermaidCodeView,
} from './utils';

/**
 * 容器位置计算 Hook
 * @param containerId 容器ID
 * @param id 目标ID
 * @param innerProps 内部属性
 * @param setInnerProps 设置内部属性的函数
 * @returns 容器位置信息
 */
export const useContainerPosition = (
  containerId: string,
  id: string,
  innerProps: MarkdownCodeToolbarProps,
  setInnerProps: React.Dispatch<React.SetStateAction<MarkdownCodeToolbarProps>>,
) => {
  const [containerPosition, setContainerPosition] = useState<ContainerPosition>(
    {
      top: 0,
      left: 0,
      width: 0,
    },
  );

  /**
   * 计算容器位置
   */
  const calculatePosition = useCallback(
    (_containerId: string, _id: string) => {
      // 通过 id 查找对应的代码块元素
      const targetElement = document.getElementById(_id);
      if (!targetElement) {
        console.warn(`未找到 id: ${_id} 对应的元素`);
        return;
      }

      // 查找最近的 markdown-container 父元素
      const markdownContainer = document.getElementById(_containerId);
      if (!markdownContainer) {
        console.warn('未找到 markdown-container 父元素');
        return;
      }

      // 更新内部属性
      const toolbarData = getToolbarData(_id, {
        content: innerProps.content,
        title: innerProps.title,
        language: innerProps.language,
      });

      setInnerProps((prevProps) => ({
        ...prevProps,
        content: toolbarData.content,
        title: toolbarData.title,
      }));

      // 获取两个元素的边界信息
      const targetRect = targetElement.getBoundingClientRect();
      const containerRect = markdownContainer.getBoundingClientRect();

      // 计算相对位置
      const relativeTop = targetRect.top - containerRect.top;
      const relativeLeft = targetRect.left - containerRect.left;

      console.log('位置计算:', {
        id: _id,
        targetRect: { top: targetRect.top, left: targetRect.left },
        containerRect: { top: containerRect.top, left: containerRect.left },
        relative: { top: relativeTop, left: relativeLeft },
      });

      setContainerPosition({
        width: targetRect.width,
        top: relativeTop,
        left: relativeLeft,
      });
    },
    [innerProps.content, innerProps.title, innerProps.language, setInnerProps],
  );

  useEffect(() => {
    if (!id || !containerId) return;

    // 监听窗口大小变化，重新计算位置
    const handleResize = () => {
      calculatePosition(containerId, id);
    };

    // 设置异步获取位置信息，使用延迟确保DOM完全渲染
    const timer = setTimeout(() => {
      calculatePosition(containerId, id);
      window.addEventListener('resize', handleResize);
    }, DELAYS.POSITION_CALCULATION);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [id, containerId, calculatePosition]);

  return containerPosition;
};

/**
 * 复制功能 Hook
 * @param innerProps 内部属性
 * @returns 复制相关状态和方法
 */
export const useCopyFeature = (innerProps: MarkdownCodeToolbarProps) => {
  const [isCopying, setIsCopying] = useState(false);

  /**
   * 处理复制操作
   */
  const handleCopy = useCallback(async () => {
    if (isCopying) return;

    setIsCopying(true);

    try {
      const toolbarData = getToolbarData(innerProps.id, {
        content: innerProps.content,
        title: innerProps.title,
        language: innerProps.language,
      });

      await copyTextToClipboard(toolbarData.content, innerProps.onCopy);
    } catch (error) {
      console.error('复制失败:', error);
    } finally {
      setIsCopying(false);
    }
  }, [
    isCopying,
    innerProps.id,
    innerProps.content,
    innerProps.title,
    innerProps.language,
    innerProps.onCopy,
  ]);

  return {
    isCopying,
    handleCopy,
  };
};

/**
 * Mermaid 功能 Hook
 * @param innerProps 内部属性
 * @returns Mermaid 相关状态和方法
 */
export const useMermaidFeature = (innerProps: MarkdownCodeToolbarProps) => {
  const [isCodeView, setIsCodeView] = useState(false);

  // 检查是否为 Mermaid 类型
  const isMermaid =
    innerProps.language.toLowerCase() === SUPPORTED_LANGUAGES.MERMAID;

  /**
   * 切换代码视图
   */
  const toggleCodeView = useCallback(
    (chartId: string) => {
      const newCodeView = toggleMermaidCodeView(
        chartId,
        isCodeView,
        innerProps.content,
      );
      setIsCodeView(newCodeView);
    },
    [isCodeView, innerProps.content],
  );

  return {
    isMermaid,
    isCodeView,
    toggleCodeView,
  };
};
