import { SiteFooterProps } from '@/types/interfaces/common';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 页脚
const SiteFooter: React.FC<SiteFooterProps> = ({ text }) => {
  // 默认文本
  const defaultText =
    '<p>版权所有©成都第二空间智能科技有限公司2025  <a href="https://beian.miit.gov.cn/" target="_blank">蜀ICP备20012194号-4</a></p>';

  return (
    <footer className={cx(styles.footer)}>
      <div
        dangerouslySetInnerHTML={{
          __html: text || defaultText,
        }}
      />
      <a href="https://nuwax.com" target="_blank" rel="noopener noreferrer">
        Powered by nuwax
      </a>
    </footer>
  );
};

export default SiteFooter;
