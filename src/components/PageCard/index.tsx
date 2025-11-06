import defaultAvatar from '@/assets/images/avatar.png';
import { SquarePublishedItemInfo } from '@/types/interfaces/square';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 模板组件属性
export interface PageCardProps {
  publishedItemInfo: SquarePublishedItemInfo;
  onClick: () => void;
}

/**
 * 应用页面卡片
 */
const PageCard: React.FC<PageCardProps> = ({ publishedItemInfo, onClick }) => {
  // 图片错误处理
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = defaultAvatar;
  };

  return (
    <div className={cx('flex', 'flex-col', styles.container)} onClick={onClick}>
      <div className={cx(styles['image-wrapper'])}>
        <img
          className={cx(styles.image)}
          src={publishedItemInfo.icon}
          alt="应用页面图标"
        />
        <div
          className={cx(
            styles['image-overlay'],
            'flex',
            'items-center',
            'content-center',
          )}
        >
          <span className={cx(styles['image-overlay-text'])}>开始使用</span>
        </div>
      </div>
      <footer className={cx('flex', 'flex-col', 'gap-4')}>
        <p className={cx(styles.name)}>{publishedItemInfo.name}</p>
        <div className={cx('flex', 'items-center', 'gap-4')}>
          <img
            className={cx(styles.avatar)}
            src={publishedItemInfo?.publishUser?.avatar || defaultAvatar}
            alt="avatar"
            onError={handleError}
          />
          <span className={cx(styles['author-name'])}>
            {publishedItemInfo.publishUser.nickName ||
              publishedItemInfo.publishUser.userName}
          </span>
          <span className={cx(styles.time)}>
            发布于 {dayjs(publishedItemInfo.created).format('YYYY-MM-DD')}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default PageCard;
