import defaultAvatar from '@/assets/images/avatar.png';
import classNames from 'classnames';
import styles from './index.less';

const cx = classNames.bind(styles);

interface AuthorInfoProps {
  avatar: string;
  name: string;
}

// 图片错误处理
const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = defaultAvatar;
};

/**
 * 作者信息
 * @param avatar 头像
 * @param name 名称
 * @returns
 */
const AuthorInfo: React.FC<AuthorInfoProps> = ({ avatar, name }) => {
  return (
    <div
      className={cx('flex', 'items-center', 'overflow-hide', styles.container)}
    >
      <img
        className={cx(styles.avatar)}
        src={avatar || defaultAvatar}
        alt=""
        onError={handleError}
      />
      <span className={cx('text-ellipsis', styles.name)}>{name}</span>
    </div>
  );
};

export default AuthorInfo;
