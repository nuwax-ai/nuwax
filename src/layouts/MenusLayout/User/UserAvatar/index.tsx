import avatarImage from '@/assets/images/avatar.png';
import type { UserAvatarType } from '@/types/interfaces/layouts';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const UserAvatar: React.FC<UserAvatarType> = ({ avatar, onClick }) => {
  return (
    <div className={cx('cursor-pointer', styles.user)} onClick={onClick}>
      <img src={avatar || (avatarImage as string)} alt="" />
    </div>
  );
};

export default UserAvatar;
