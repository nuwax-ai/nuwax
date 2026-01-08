import type { MarkdownCMDRef } from '@/types/interfaces/markdownRender';
import { useCallback, useEffect, useRef } from 'react';

/**
 * 使用 requestAnimationFrame 优化渲染
 * 将回调合并到浏览器的下一个渲染帧，避免频繁的 setTimeout 回调堆积
 */
const useRAFCallback = () => {
  const rafIdRef = useRef<number | null>(null);
  const callbacksRef = useRef<Array<() => void>>([]);

  const scheduleCallback = useCallback((callback: () => void) => {
    callbacksRef.current.push(callback);

    // 如果已经安排了 RAF，直接返回
    if (rafIdRef.current !== null) {
      return;
    }

    // 安排下一帧执行所有回调
    rafIdRef.current = requestAnimationFrame(() => {
      const callbacks = callbacksRef.current;
      callbacksRef.current = [];
      rafIdRef.current = null;

      // 执行所有累积的回调
      callbacks.forEach((cb) => cb());
    });
  }, []);

  // 清理函数
  const cleanup = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    callbacksRef.current = [];
  }, []);

  return { scheduleCallback, cleanup };
};

interface UseAppDevMarkdownRenderProps {
  id: string;
  content: string;
  requestId?: string;
}

/**
 * AppDev 专用的 MarkdownCMD 渲染 Hook
 * 支持流式内容更新和 Plan/ToolCall 组件渲染
 *
 * 优化说明：
 * - 使用 requestAnimationFrame 代替 setTimeout，与浏览器渲染周期同步
 * - 避免高频消息导致的回调堆积问题
 * - 保证渲染流畅性，减少卡顿
 */
export default function useAppDevMarkdownRender({
  // id, // 暂时未使用
  content,
  requestId,
}: UseAppDevMarkdownRenderProps) {
  const markdownRef = useRef<MarkdownCMDRef>(null);
  const lastTextPos = useRef<number>(0);
  const lastRequestId = useRef<string | undefined>(requestId);

  // 使用 RAF 优化回调
  const { scheduleCallback, cleanup } = useRAFCallback();

  // 当 requestId 变化时，重置位置并清空内容
  useEffect(() => {
    if (lastRequestId.current !== requestId) {
      lastTextPos.current = 0;
      lastRequestId.current = requestId;
      markdownRef.current?.clear();
    }
  }, [requestId]);

  // 处理内容更新 - 使用 RAF 优化
  useEffect(() => {
    scheduleCallback(() => {
      if (content && markdownRef.current) {
        // 取出差量部分
        const diffText = content.slice(lastTextPos.current);
        lastTextPos.current = content.length;

        // 推送增量内容
        if (diffText) {
          markdownRef.current.push(diffText, 'answer');
        }
      }
    });
  }, [content, scheduleCallback]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanup();
      markdownRef.current?.clear();
      lastTextPos.current = 0;
    };
  }, [cleanup]);

  return {
    markdownRef,
  };
}
