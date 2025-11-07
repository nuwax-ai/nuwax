import defaultAvatar from '@/assets/images/avatar.png';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import ConditionRender from '../ConditionRender';
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
  /** 是否已发布 */
  buildRunning?: boolean;
  footerInner?: React.ReactNode;
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
  buildRunning,
  footerInner,
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
      {/* 状态区域 */}
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
      {buildRunning && (
        <div
          className={cx(
            styles['position-top-right'],
            styles['new-version-text'],
          )}
        >
          已发布
        </div>
      )}
      {/* 图片区域 */}
      <div className={cx(styles['image-wrapper'])}>
        <img className={cx(styles.image)} src={icon} alt="应用页面图标" />
        {/* 阴影覆盖区域 */}
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
      {/* footer 底部区域 */}
      <footer className={cx('flex', 'items-center', 'gap-4')}>
        <div className={cx('flex', 'flex-col', 'flex-1', 'overflow-hide')}>
          {/* 页面名称 */}
          <p className={cx(styles.name, 'text-ellipsis')}>{name}</p>
          {/* 作者信息 */}
          <div
            className={cx(
              'flex',
              'items-center',
              'gap-4',
              'flex-1',
              styles['footer-box'],
            )}
          >
            {/* 作者头像 */}
            <img
              className={cx(styles.avatar)}
              src={avatar || defaultAvatar}
              alt="avatar"
              onError={handleError}
            />
            {/* 作者名称 */}
            <span className={cx(styles['author-name'], 'text-ellipsis')}>
              {userName}
            </span>
            {/* 创建时间 */}
            <ConditionRender condition={created}>
              <span className={cx(styles.time, 'text-ellipsis')}>
                创建于 {dayjs(created).format('YYYY-MM-DD')}
              </span>
            </ConditionRender>
          </div>
        </div>
        {/* 更多操作区域 */}
        {footerInner}
      </footer>
    </div>
  );
};

export default PageCard;
