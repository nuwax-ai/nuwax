import { MarkdownCMDRef } from 'ds-markdown';
import { useEffect, useRef } from 'react';
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
  const messageIdRef = useRef<string>(uuidv4());
  const lastTextPos = useRef<{ thinking: number; answer: number }>({
    thinking: 0,
    answer: 0,
  });

  useEffect(() => {
    if (answer) {
      //取出差量部分
      const diffText = answer.slice(lastTextPos.current['answer']);
      lastTextPos.current['answer'] = answer.length;
      // 处理增量渲染
      markdownRef.current?.push(diffText, 'answer');
    }
  }, [answer]);

  useEffect(() => {
    if (thinking) {
      //取出差量部分
      const diffText = thinking.slice(lastTextPos.current['thinking']);
      lastTextPos.current['thinking'] = thinking.length;
      // 处理增量渲染
      markdownRef.current?.push(diffText, 'thinking');
    }
  }, [thinking]);

  useEffect(() => {
    if (id) {
      messageIdRef.current = String(id);
    }
  }, [id]);

  useEffect(() => {
    return () => {
      markdownRef.current?.clear();
      lastTextPos.current = {
        thinking: 0,
        answer: 0,
      };
      messageIdRef.current = '';
    };
  }, []);
  return {
    markdownRef,
    messageIdRef,
  };
}
