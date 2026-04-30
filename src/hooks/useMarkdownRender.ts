import type { MarkdownCMDRef } from '@/types/interfaces/markdownRender';
import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

const GAP_TIME = 100;

const handleProcessMessage = (callback: () => void) => {
  setTimeout(() => {
    callback();
  }, GAP_TIME);
};

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
  const lastTextPos = useRef<{ thinking: number; answer: number }>({
    thinking: 0,
    answer: 0,
  });
  const lastRawAnswer = useRef('');

  useEffect(() => {
    handleProcessMessage(() => {
      if (answer) {
        // 判断是否是增量更新
        // 如果当前 answer 不是以之前的 answer 开头，说明发生了转换（如分组），需要全量更新
        if (answer.startsWith(lastRawAnswer.current)) {
          // 取出差量部分
          const diffText = answer.slice(lastTextPos.current['answer']);
          if (diffText) {
            lastTextPos.current['answer'] = answer.length;
            // 处理增量渲染
            markdownRef.current?.push(diffText, 'answer');
          }
        } else {
          // 全量更新：先清空，再推入全部内容
          markdownRef.current?.clear();
          // 重置所有位置信息，因为 clear 之后是从头开始
          lastTextPos.current['answer'] = answer.length;
          lastTextPos.current['thinking'] = 0;

          // 如果有思考内容，先推入思考内容
          if (thinking) {
            markdownRef.current?.push(thinking, 'thinking');
            lastTextPos.current['thinking'] = thinking.length;
          }

          // 推入全部 answer
          markdownRef.current?.push(answer, 'answer');
        }
        lastRawAnswer.current = answer;
      }
    });
  }, [answer]);

  useEffect(() => {
    handleProcessMessage(() => {
      if (thinking) {
        // 取出差量部分
        const diffText = thinking.slice(lastTextPos.current['thinking']);
        if (diffText) {
          lastTextPos.current['thinking'] = thinking.length;
          // 处理增量渲染
          markdownRef.current?.push(diffText, 'thinking');
        }
      }
    });
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
