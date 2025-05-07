import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const SiteFooter: React.FC = () => {
  return (
    <footer className={cx(styles.footer)}>
      <p>版权所有©成都第二空间智能科技有限公司2025</p>
      <a href="https://beian.miit.gov.cn/">蜀ICP备20012194号-4</a>
    </footer>
  );
};

export default SiteFooter;
