import { UserOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const User: React.FC = () => {
  const handlerClick = () => {
    // todo
    console.log('admin');
  };
  return (
    <div className={cx('hover-box', 'cursor-pointer')} onClick={handlerClick}>
      <div
        className={cx(styles.user, 'flex', 'content-center', 'items-center')}
      >
        <UserOutlined />
      </div>
    </div>
  );
};

export default User;
