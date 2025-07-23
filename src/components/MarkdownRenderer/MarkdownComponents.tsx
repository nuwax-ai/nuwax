import React from 'react';

import styles from './index.less';

/**
 * 自定义段落组件
 * 支持文本选择和复制
 */
export const ParagraphComponent: React.FC<{
  children: React.ReactNode;
  dataKey: string;
}> = ({ children, dataKey }) => {
  return (
    <p
      key={dataKey}
      data-key={dataKey}
      className={styles['markdown-paragraph']}
      style={{ userSelect: 'text' }}
    >
      {children}
    </p>
  );
};

/**
 * 自定义链接组件
 * 支持外部链接安全处理
 */
export const LinkComponent: React.FC<{
  href?: string;
  children: React.ReactNode;
  dataKey: string;
}> = ({ href, children, dataKey }) => {
  const isExternal = href?.startsWith('http');

  return (
    <a
      key={dataKey}
      data-key={dataKey}
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={styles['markdown-link']}
    >
      {children}
    </a>
  );
};
