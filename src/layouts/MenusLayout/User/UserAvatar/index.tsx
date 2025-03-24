import type { UserAvatarType } from '@/types/interfaces/layouts';
import { UserOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const UserAvatar: React.FC<UserAvatarType> = ({ avatar, onClick }) => {
  return (
    <div className={cx('hover-box', 'cursor-pointer')} onClick={onClick}>
      {avatar ? (
        <img src={avatar} className={cx(styles.user)} alt="" />
      ) : (
        <div
          className={cx(
            styles.user,
            styles.default,
            'flex',
            'content-center',
            'items-center',
          )}
        >
          <UserOutlined />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
