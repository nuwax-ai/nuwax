import type { MarkdownCMDRef } from '@/types/interfaces/markdownRender';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function useMarkdownRender({
  answer,
  thinking,
  id,
}: {
  id: string | number;
  answer: string;
  thinking: string;
}) {
  const markdownRef = useRef<MarkdownCMDRef>(null);
  const messageIdRef = useRef<string>(id ? String(id) : uuidv4());
  const currentIdRef = useRef<string>(messageIdRef.current);
  // 消费方在 render 中用该标识作为 Markdown key，不能等 effect 才更新。
  if (id) messageIdRef.current = String(id);
  const flushFrameRef = useRef<number | null>(null);
  const latestAnswerRef = useRef(answer);
  const latestThinkingRef = useRef(thinking);
  const lastTextPos = useRef<{ thinking: number; answer: number }>({
    thinking: 0,
    answer: 0,
  });
  const lastRawAnswer = useRef('');

  const clearPendingFlush = useCallback(() => {
    if (flushFrameRef.current !== null) {
      window.cancelAnimationFrame(flushFrameRef.current);
      flushFrameRef.current = null;
    }
  }, []);

  const resetRenderState = useCallback(() => {
    lastTextPos.current = {
      thinking: 0,
      answer: 0,
    };
    lastRawAnswer.current = '';
  }, []);

  const flushLatestMarkdown = useCallback(() => {
    if (!markdownRef.current) return;
    const latestAnswer = latestAnswerRef.current;
    const latestThinking = latestThinkingRef.current;
    let hasResetAnswer = false;

    if (latestAnswer) {
      // 判断是否是增量更新
      // 如果当前 answer 不是以之前的 answer 开头，说明发生了转换（如分组），需要全量更新
      if (latestAnswer.startsWith(lastRawAnswer.current)) {
        // 取出差量部分
        const diffText = latestAnswer.slice(lastTextPos.current['answer']);
        if (diffText) {
          lastTextPos.current['answer'] = latestAnswer.length;
          // 处理增量渲染
          markdownRef.current?.push(diffText, 'answer');
        }
      } else {
        // 全量更新：先清空，再推入全部内容
        markdownRef.current?.clear();
        hasResetAnswer = true;
        // 重置所有位置信息，因为 clear 之后是从头开始
        lastTextPos.current['answer'] = latestAnswer.length;
        lastTextPos.current['thinking'] = 0;

        // 如果有思考内容，先推入思考内容
        if (latestThinking) {
          markdownRef.current?.push(latestThinking, 'thinking');
          lastTextPos.current['thinking'] = latestThinking.length;
        }

        // 推入全部 answer
        markdownRef.current?.push(latestAnswer, 'answer');
      }
      lastRawAnswer.current = latestAnswer;
    }

    if (latestThinking && !hasResetAnswer) {
      // 取出差量部分
      const diffText = latestThinking.slice(lastTextPos.current['thinking']);
      if (diffText) {
        lastTextPos.current['thinking'] = latestThinking.length;
        // 处理增量渲染
        markdownRef.current?.push(diffText, 'thinking');
      }
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    // 流式 chunk 高频到达时，只更新 latest refs，不取消已安排的刷新。
    // 这样不会退化成 debounce，页面仍会按 MarkdownCMD 的节奏持续输出。
    if (flushFrameRef.current !== null) {
      return;
    }

    flushFrameRef.current = window.requestAnimationFrame(() => {
      flushFrameRef.current = null;
      flushLatestMarkdown();
    });
  }, [flushLatestMarkdown]);

  useLayoutEffect(() => {
    latestAnswerRef.current = answer;
    latestThinkingRef.current = thinking;
    const nextId = id ? String(id) : currentIdRef.current;
    const idChanged = !!nextId && nextId !== currentIdRef.current;
    const contentReplaced =
      !answer.startsWith(lastRawAnswer.current) ||
      thinking.length < lastTextPos.current.thinking;
    if (idChanged || contentReplaced) {
      clearPendingFlush();
      markdownRef.current?.clear();
      resetRenderState();
      currentIdRef.current = nextId;
      messageIdRef.current = nextId;
    }
    // 首次正文与非增量替换在浏览器绘制前写入；旧正文不能留到下一个 rAF。
    // 已安排的流式追加仍按帧合并，避免每个 SSE 分片都触发一次 Markdown 解析。
    const firstContent =
      flushFrameRef.current === null &&
      lastTextPos.current.answer === 0 &&
      lastTextPos.current.thinking === 0;
    if (markdownRef.current && (idChanged || contentReplaced || firstContent)) {
      flushLatestMarkdown();
    } else {
      scheduleFlush();
    }
  }, [
    answer,
    thinking,
    id,
    clearPendingFlush,
    resetRenderState,
    flushLatestMarkdown,
    scheduleFlush,
  ]);

  useEffect(() => {
    return () => {
      clearPendingFlush();
    };
  }, [clearPendingFlush]);

  return {
    markdownRef,
    messageIdRef,
  };
}
