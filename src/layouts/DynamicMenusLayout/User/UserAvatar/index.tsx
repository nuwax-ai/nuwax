import avatarImage from '@/assets/images/avatar.png';
import { dict } from '@/services/i18nRuntime';
import type { UserAvatarType } from '@/types/interfaces/layouts';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 用户头像
 */
const UserAvatar: React.FC<UserAvatarType> = ({ avatar, onClick }) => {
  const avatarLabel = dict('PC.Components.Created.userAvatar');

  // 图片错误处理
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = avatarImage;
  };

  return (
    <div
      className={cx('cursor-pointer', styles.user)}
      onClick={onClick}
      aria-label={avatarLabel}
    >
      <img
        src={avatar || avatarImage}
        alt={avatarLabel}
        onError={handleError}
      />
    </div>
  );
};

export default UserAvatar;
