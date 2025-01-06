import { ICON_LOGO } from '@/constants/images.constants';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const Login: React.FC = () => {
  return (
    <div className={cx(styles.container)}>
      <ICON_LOGO />
    </div>
  );
};

export default Login;
