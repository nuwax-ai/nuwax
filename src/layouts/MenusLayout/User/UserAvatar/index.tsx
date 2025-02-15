import type { UserAvatarType } from '@/types/interfaces/layouts';
import { UserOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const UserAvatar: React.FC<UserAvatarType> = ({ onClick }) => {
  return (
    <div
      className={cx('hover-box', 'cursor-pointer')}
      onClick={() => onClick(true)}
    >
      <div
        className={cx(styles.user, 'flex', 'content-center', 'items-center')}
      >
        <UserOutlined />
      </div>
    </div>
  );
};

export default UserAvatar;
