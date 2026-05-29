import type { MarkdownCMDRef } from '@/types/interfaces/markdownRender';
import { useCallback, useEffect, useRef } from 'react';
import { groupAppDevProcesses } from '../components/ChatArea/utils';

/**
 * 使用 requestAnimationFrame 优化渲染
 * 将回调合并到浏览器的下一个渲染帧，避免频繁的 setTimeout 回调堆积
 */
function useRAFCallback() {
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
      callbacks.forEach((cb: () => void) => {
        cb();
      });
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
}

/**
 * AppDev 专用的 MarkdownCMD 渲染 Hook
 * 支持流式内容更新和 Plan/ToolCall 组件渲染
 * 使用 requestAnimationFrame 优化渲染，减少卡顿
 */
export default function useAppDevMarkdownRender({
  content,
  requestId,
}: {
  content: string;
  requestId?: string;
}) {
  const markdownRef = useRef<MarkdownCMDRef>(null);
  // 记录已经渲染的文本长度（在 processedContent 中的位置）
  const lastTextPos = useRef<number>(0);
  // 记录上一次的 requestId，用于检测是否需要重置
  const lastRequestId = useRef<string | undefined>(requestId);
  // 记录上一次处理后的内容（经过 groupAppDevProcesses）
  const lastProcessedContent = useRef<string>('');

  // 使用 requestAnimationFrame 优化回调
  const { scheduleCallback, cleanup } = useRAFCallback();

  // 当 requestId 变化时，重置位置并清空内容
  useEffect(() => {
    if (lastRequestId.current !== requestId) {
      lastTextPos.current = 0;
      lastRequestId.current = requestId;
      lastProcessedContent.current = '';
      markdownRef.current?.clear();
    }
  }, [requestId]);

  // 处理内容更新 - 使用 RAF 优化
  useEffect(() => {
    scheduleCallback(() => {
      if (content && markdownRef.current) {
        // 应用分组逻辑（合并连续的 ToolCall 标签等）
        const processedContent = groupAppDevProcesses(content);

        // 判断是否是增量更新
        // 如果 processedContent 不是以 lastProcessedContent 开头，则需要清空并重新全量推送
        // 这种情况发生在分组结构发生变化时（例如从分组变回单个标签）
        if (
          lastProcessedContent.current &&
          !processedContent.startsWith(lastProcessedContent.current)
        ) {
          markdownRef.current.clear();
          lastTextPos.current = 0;
        }

        // 更新记录
        lastProcessedContent.current = processedContent;

        // 取出差量部分（需要推送的新内容）
        const diffText = processedContent.slice(lastTextPos.current);
        lastTextPos.current = processedContent.length;

        // 推送增量内容
        if (diffText) {
          // 第二个参数 'answer' 表示这是答案内容（不是思考过程）
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
    };
  }, [cleanup]);

  return {
    markdownRef,
  };
}
