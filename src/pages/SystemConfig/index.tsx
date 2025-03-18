import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 系统配置页面
 */
const SystemConfig: React.FC = () => {
  return <div className={cx(styles.container)}>系统配置页面</div>;
};

export default SystemConfig;
