import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 用户管理页面
 */
const UserManage: React.FC = () => {
  return <div className={cx(styles.container)}>用户管理页面</div>;
};

export default UserManage;
