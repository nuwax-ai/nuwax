import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// ... existing code ...

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  children,
  // ... other props
}) => {
  return (
    <ReactMarkdown
      remarkPlugins={[
        [
          remarkMath,
          {
            // 只保留安全的数学公式分隔符
            delimiters: [
              { left: '\\[', right: '\\]', display: true },
              { left: '$$', right: '$$', display: false },
            ],
          },
        ],
      ]}
      rehypePlugins={[
        [
          rehypeKatex,
          {
            throwOnError: false,
            errorColor: '#cc0000',
            strict: false,
            trust: true,
          },
        ],
      ]}
    >
      {children}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
