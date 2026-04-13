import { dict } from '@/services/i18nRuntime';
import { SiteFooterProps } from '@/types/interfaces/common';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 页脚
const SiteFooter: React.FC<SiteFooterProps> = ({ text }) => {
  return (
    <footer className={cx(styles.footer)}>
      <div
        dangerouslySetInnerHTML={{
          __html: text || '',
        }}
      />
      <a
        href={dict('PC.Components.SiteFooter.homeLink')}
        target="_blank"
        rel="noopener noreferrer"
      >
        {dict('PC.Components.SiteFooter.poweredBy')}
      </a>
    </footer>
  );
};

export default SiteFooter;
