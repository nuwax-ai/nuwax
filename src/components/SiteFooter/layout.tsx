import { SiteFooterProps } from '@/types/interfaces/common';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 页脚
const SiteFooterLayout: React.FC<SiteFooterProps> = () => {
  return (
    <footer className={cx(styles.footerLayout)}>
      <div
        dangerouslySetInnerHTML={{
          __html: '技术支持，正元智慧集团股份有限公司<br/>型号：V1.0',
        }}
      />
    </footer>
  );
};

export default SiteFooterLayout;
