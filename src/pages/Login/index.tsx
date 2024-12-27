import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const Login: React.FC = () => {
  return <div className={cx(styles.container)}>登录页面</div>;
};

export default Login;
