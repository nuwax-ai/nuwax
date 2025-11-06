import defaultAvatar from '@/assets/images/avatar.png';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 模板组件属性
export interface PageCardProps {
  icon: string;
  name: string;
  avatar: string;
  userName: string;
  created: string;
  overlayText?: string;
  /** 是否启用 */
  isEnabled?: boolean;
  /** 是否是新版本 */
  isNewVersion?: boolean;
  onClick: () => void;
}

/**
 * 应用页面卡片
 */
const PageCard: React.FC<PageCardProps> = ({
  icon,
  name,
  avatar,
  userName,
  created,
  overlayText,
  isEnabled,
  isNewVersion,
  onClick,
}) => {
  // 图片错误处理
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = defaultAvatar;
  };

  return (
    <div
      className={cx('flex', 'flex-col', 'relative', styles.container)}
      onClick={onClick}
    >
      {isEnabled && (
        <div
          className={cx(styles['position-top-right'], styles['activated-text'])}
        >
          已启用
        </div>
      )}
      {isNewVersion && (
        <div
          className={cx(
            styles['position-top-right'],
            styles['new-version-text'],
          )}
        >
          有版本更新
        </div>
      )}
      <div className={cx(styles['image-wrapper'])}>
        <img className={cx(styles.image)} src={icon} alt="应用页面图标" />
        <div
          className={cx(
            styles['image-overlay'],
            'flex',
            'items-center',
            'content-center',
          )}
        >
          <span className={cx(styles['image-overlay-text'])}>
            {overlayText || '开始使用'}
          </span>
        </div>
      </div>
      <footer className={cx('flex', 'flex-col', 'gap-4')}>
        <p className={cx(styles.name)}>{name}</p>
        <div className={cx('flex', 'items-center', 'gap-4')}>
          <img
            className={cx(styles.avatar)}
            src={avatar || defaultAvatar}
            alt="avatar"
            onError={handleError}
          />
          <span className={cx(styles['author-name'])}>{userName}</span>
          <span className={cx(styles.time)}>
            发布于 {dayjs(created).format('YYYY-MM-DD')}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default PageCard;
