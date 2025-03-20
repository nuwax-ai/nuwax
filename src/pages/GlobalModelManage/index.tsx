import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 全局模型管理页面
 */
const GlobalModelManage: React.FC = () => {
  return <div className={cx(styles.container)}>全局模型管理页面</div>;
};

export default GlobalModelManage;
