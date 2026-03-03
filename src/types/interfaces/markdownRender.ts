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
  // 会话 id
  conversationId?: string | number;
  /** 答案内容 */
  answer?: string;
  /** 思考内容 */
  thinking?: string;
}
