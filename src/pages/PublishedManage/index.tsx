import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 已发布管理页面
 */
const PublishedManage: React.FC = () => {
  return <div className={cx(styles.container)}>已发布管理页面</div>;
};

export default PublishedManage;
