import avatarImage from '@/assets/images/avatar.png';
import { dict } from '@/services/i18nRuntime';
import type { UserAvatarType } from '@/types/interfaces/layouts';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const UserAvatar: React.FC<UserAvatarType> = ({ avatar, onClick }) => {
  const avatarLabel = dict('PC.Components.Created.userAvatar');

  return (
    <div
      className={cx('cursor-pointer', styles.user)}
      onClick={onClick}
      aria-label={avatarLabel}
    >
      <img src={avatar || (avatarImage as string)} alt={avatarLabel} />
    </div>
  );
};

export default UserAvatar;
