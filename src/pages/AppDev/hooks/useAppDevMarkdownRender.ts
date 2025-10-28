import type { MarkdownCMDRef } from '@/types/interfaces/markdownRender';
import { useEffect, useRef } from 'react';

const GAP_TIME = 50; // 减少延迟，提高响应速度

const handleProcessMessage = (callback: () => void) => {
  setTimeout(() => {
    callback();
  }, GAP_TIME);
};

interface UseAppDevMarkdownRenderProps {
  id: string;
  content: string;
  requestId?: string;
}

/**
 * AppDev 专用的 MarkdownCMD 渲染 Hook
 * 支持流式内容更新和 Plan/ToolCall 组件渲染
 */
export default function useAppDevMarkdownRender({
  // id, // 暂时未使用
  content,
  requestId,
}: UseAppDevMarkdownRenderProps) {
  const markdownRef = useRef<MarkdownCMDRef>(null);
  const lastTextPos = useRef<number>(0);
  const lastRequestId = useRef<string | undefined>(requestId);

  // 当 requestId 变化时，重置位置并清空内容
  useEffect(() => {
    if (lastRequestId.current !== requestId) {
      lastTextPos.current = 0;
      lastRequestId.current = requestId;
      markdownRef.current?.clear();
    }
  }, [requestId]);

  // 处理内容更新
  useEffect(() => {
    handleProcessMessage(() => {
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
  }, [content]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      markdownRef.current?.clear();
      lastTextPos.current = 0;
    };
  }, []);

  return {
    markdownRef,
  };
}
