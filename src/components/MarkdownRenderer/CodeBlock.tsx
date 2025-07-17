import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { renderCodePrismInline } from '@/utils/renderCodePrism';
import MarkdownCodeToolbar from '../MarkdownCodeToolbar';
import styles from './index.less';
import type { MermaidProps } from './types';

/**
 * 自定义代码块组件
 * 支持代码高亮、工具栏、折叠等功能
 */
export interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  requestId?: string;
  onCopy?: (content: string) => void;
  codeKey?: string; // 添加稳定的key
  mermaid: React.FC<MermaidProps>; // 修改类型为 React 组件
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  className,
  requestId,
  onCopy,
  codeKey,
  mermaid: MermaidCode,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const classNames = Array.isArray(className) ? className : [className];
  const language =
    classNames?.join(',').replace(/.*language-(\w+).*/, '$1') || 'text';

  // 修复类型问题：安全地获取代码内容
  const theCodeString = React.isValidElement(children)
    ? children.props?.children || ''
    : String(children || '');
  const codeContent = String(theCodeString).replace(/\n$/, '');

  // console.log('CodeBlock', language, codeKey, className, children, rest);

  // 使用稳定的blockId，避免每次渲染都生成新的ID
  const blockId = useMemo(() => {
    if (codeKey) {
      return codeKey;
    }
    // 如果没有提供codeKey，则基于内容生成稳定的ID
    const contentHash = codeContent.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '');
    return `${requestId}-${language}-${contentHash}`;
  }, [codeKey, requestId, language, codeContent]);

  const isMermaid = language === 'mermaid';

  /**
   * CodeElement 代码块渲染组件
   * 说明：根据是否为 mermaid 代码块，选择不同的渲染方式
   * - Mermaid 代码块：调用 mermaid 组件渲染
   * - 其他代码块：使用 Prism 高亮渲染
   */
  const CodeElement = useCallback(
    (props: MermaidProps) => {
      const { value, requestId, id, className, language } = props;
      // 代码内容，去除结尾换行
      const codeContent = String(value).replace(/\n$/, '');
      if (isMermaid) {
        // Mermaid 代码块渲染
        console.log('MermaidCode', codeContent);
        return (
          <code className={className}>
            <MermaidCode
              key={id}
              value={codeContent}
              requestId={requestId}
              id={id}
              language={language}
            />
          </code>
        );
      }
      // 普通代码块渲染，使用 Prism 高亮
      return (
        <code
          className={className}
          dangerouslySetInnerHTML={{
            __html: renderCodePrismInline({
              info: language,
              content: value,
            }),
          }}
        />
      );
    },
    [isMermaid, MermaidCode], // 依赖 MermaidCode 组件
  );
  useEffect(() => {
    console.log('CodeBlock mount', blockId, theCodeString);
    return () => {
      console.log('CodeBlock unmount', blockId, theCodeString);
    };
  }, []);

  return (
    <div key={blockId} className={styles['code-block-wrapper']}>
      <MarkdownCodeToolbar
        title={language}
        language={language}
        containerId={requestId || ''}
        content={codeContent}
        id={blockId}
        collapsible={true}
        defaultCollapsed={isCollapsed}
        onCollapseChange={setIsCollapsed}
        onCopy={onCopy}
      />
      <pre className={className}>
        <CodeElement
          key={`${blockId}-code-element`}
          value={theCodeString}
          requestId={requestId || ''}
          className={className || ''}
          language={language || ''}
          id={blockId || ''}
        />
      </pre>
    </div>
  );
};

export default CodeBlock;
