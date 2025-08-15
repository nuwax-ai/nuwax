import type { MarkdownCMDRef } from 'ds-markdown';

export type { MarkdownCMDRef };

// 组件 Props 类型
export interface MarkdownRendererProps {
  id: string;
  className?: string;
  disableTyping?: boolean;
  theme?: 'light' | 'dark';
  answerType?: 'answer' | 'thinking';
  markdownRef: React.RefObject<MarkdownCMDRef>;
  headerActions?: boolean;
}
