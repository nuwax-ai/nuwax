import React from 'react';

import styles from './index.less';

/**
 * 自定义段落组件
 * 支持文本选择和复制
 */
export const ParagraphComponent: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <p className={styles['markdown-paragraph']} style={{ userSelect: 'text' }}>
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
}> = ({ href, children }) => {
  const isExternal = href?.startsWith('http');

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={styles['markdown-link']}
    >
      {children}
    </a>
  );
};
