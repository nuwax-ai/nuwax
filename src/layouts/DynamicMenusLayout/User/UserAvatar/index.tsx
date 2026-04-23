import avatarImage from '@/assets/images/avatar.png';
import { dict } from '@/services/i18nRuntime';
import type { UserAvatarType } from '@/types/interfaces/layouts';
import { isKeyboardActivation } from '@/utils/a11y';
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
      onKeyDown={(e) => {
        if (isKeyboardActivation(e)) {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={avatarLabel}
    >
      <img src={avatar || (avatarImage as string)} alt={avatarLabel} />
    </div>
  );
};

export default UserAvatar;
