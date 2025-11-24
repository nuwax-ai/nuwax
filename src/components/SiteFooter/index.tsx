import { SiteFooterProps } from '@/types/interfaces/common';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 页脚
const SiteFooter: React.FC<SiteFooterProps> = () => {
  return (
    <footer className={cx(styles.footer)}>
      <div
        dangerouslySetInnerHTML={{
          __html: '技术支持，正元智慧集团股份有限公司，型号：V1.0',
        }}
      />
    </footer>
  );
};

export default SiteFooter;
