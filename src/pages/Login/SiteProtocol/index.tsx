import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const SiteProtocol: React.FC = () => {
  return (
    <>
      <span className={cx(styles.span)}>已阅读并同意协议：</span>
      <a
        href="https://ucn1y31fvbx4.feishu.cn/wiki/WyjEwj1Y6iegFVkvZnycg1PknNt"
        target="_blank"
        rel="noreferrer"
      >
        女娲使用协议、
      </a>
      <a
        href="https://ucn1y31fvbx4.feishu.cn/wiki/XEMjwrUdmiPcgkkK9FjcewBCnFe"
        target="_blank"
        rel="noreferrer"
      >
        女娲隐私协议
      </a>
    </>
  );
};

export default SiteProtocol;
