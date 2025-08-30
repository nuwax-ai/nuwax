import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const SiteProtocol: React.FC = () => {
  return (
    <>
      <span className={cx(styles.span)}>已阅读并同意协议：</span>
      <a
        href="https://nuwax.com/user-agreement.html"
        target="_blank"
        rel="noreferrer"
      >
        服务使用协议、
      </a>
      <a href="https://nuwax.com/privacy.html" target="_blank" rel="noreferrer">
        隐私协议
      </a>
    </>
  );
};

export default SiteProtocol;
