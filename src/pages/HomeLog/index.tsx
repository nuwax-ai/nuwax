import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 日志
const HomeLog: React.FC = () => {
  return <div className={cx(styles.container)}>日志页面</div>;
};

export default HomeLog;
