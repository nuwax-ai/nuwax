import defaultAvatar from '@/assets/images/avatar.png';
import { dict } from '@/services/i18nRuntime';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import ConditionRender from '../ConditionRender';
import styles from './index.less';

const cx = classNames.bind(styles);

// 模板组件属性
export interface PageCardProps {
  // 封面图片
  coverImg: string;
  name: string;
  avatar: string;
  userName: string;
  created: string;
  overlayText?: string;
  /** 是否启用 */
  isEnabled?: boolean;
  /** 是否是新版本 */
  isNewVersion?: boolean;
  footerInner?: React.ReactNode;
  onClick: () => void;
  extra?: React.ReactNode;
}

/**
 * 应用页面卡片
 */
const PageCard: React.FC<PageCardProps> = ({
  coverImg,
  name,
  avatar,
  userName,
  created,
  overlayText,
  isEnabled,
  isNewVersion,
  footerInner,
  onClick,
  extra,
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
          {dict('PC.Components.PageCard.activated')}
        </div>
      )}
      {isNewVersion && (
        <div
          className={cx(
            styles['position-top-right'],
            styles['new-version-text'],
          )}
        >
          {dict('PC.Components.PageCard.newVersion')}
        </div>
      )}
      {extra}
      {/* 图片区域 */}
      <div
        className={cx(styles['image-wrapper'])}
        style={{
          backgroundImage: `url(${coverImg})`,
        }}
      >
        {!coverImg && (
          <div
            className={cx(
              'flex',
              'items-center',
              'content-center',
              styles['no-screenshot'],
            )}
          >
            {dict('PC.Components.PageCard.noPreview')}
          </div>
        )}
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
            {overlayText || dict('PC.Components.PageCard.startUsing')}
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
                {dict('PC.Components.PageCard.createdAt')}{' '}
                {dayjs(created).format('YYYY-MM-DD')}
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
