import agentImage from '@/assets/images/agent_image.png';
import defaultAvatar from '@/assets/images/avatar.png';
import CardWrapper from '@/components/business-component/CardWrapper';
import {
  ICON_MESSAGE,
  ICON_STAR,
  ICON_USER,
} from '@/constants/images.constants';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AppCardProps {
  publishedItemInfo: SquarePublishedItemInfo;
  onClick: () => void;
}

/**
 * 女娲应用-应用卡片
 * @description 风格对齐广场-网页应用卡片(CardWrapper + 统计信息),点击整卡跳转应用详情
 */
const AppCard: React.FC<AppCardProps> = ({ publishedItemInfo, onClick }) => {
  const { icon, name, publishUser, description, statistics } =
    publishedItemInfo;

  return (
    <CardWrapper
      className={cx(styles['app-card'])}
      title={name}
      avatar={publishUser?.avatar || defaultAvatar}
      name={publishUser?.nickName || publishUser?.userName}
      content={description}
      icon={icon}
      defaultIcon={agentImage}
      onClick={onClick}
      footer={
        <footer className={cx('flex', 'items-center', styles.footer)}>
          <div className={cx('flex', 'items-center', styles['count-box'])}>
            {/* 用户人数 */}
            <span className={cx(styles.text)}>
              <ICON_USER />
              <span>{statistics?.userCount || 0}</span>
            </span>
            {/* 会话次数 */}
            <span className={cx(styles.text)}>
              <ICON_MESSAGE />
              <span>{statistics?.convCount || 0}</span>
            </span>
            {/* 收藏次数 */}
            <span className={cx(styles.text)}>
              <ICON_STAR />
              <span>{statistics?.collectCount || 0}</span>
            </span>
          </div>
        </footer>
      }
    />
  );
};

export default AppCard;
