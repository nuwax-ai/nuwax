import agentImage from '@/assets/images/agent_image.png';
import defaultAvatar from '@/assets/images/avatar.png';
import CardWrapper from '@/components/business-component/CardWrapper';
import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { EyeOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AppCardProps {
  publishedItemInfo: SquarePublishedItemInfo;
  onClick: () => void;
}

/**
 * 会话数紧凑格式:<1万原样展示,≥1万展示「x.x万」去尾零
 * (与 ExpertSummonCard 的 formatUsage 同口径;hover title 展示精确值)
 */
const formatConvCount = (count: number): string => {
  if (count < 10000) return String(count);
  const wan = count / 10000;
  const text =
    wan >= 100 ? String(Math.round(wan)) : String(Math.round(wan * 100) / 100);
  return `${text}万`;
};

/**
 * 女娲应用-应用卡片
 * @description 风格对齐广场-网页应用卡片(CardWrapper),点击整卡跳转应用详情;
 * 仅保留会话数统计(眼睛图标 + 紧凑数值),置于应用名称行最右侧,
 * 不再展示用户数/收藏数(底部统计行整体下线)
 */
const AppCard: React.FC<AppCardProps> = ({ publishedItemInfo, onClick }) => {
  const { icon, name, publishUser, description, statistics } =
    publishedItemInfo;
  const convCount = statistics?.convCount || 0;

  return (
    <CardWrapper
      className={cx(styles['app-card'])}
      title={
        <div className={cx('flex', 'items-center', styles['title-row'])}>
          {/* 应用名称:超长省略,hover 展示全名(与描述区的 EllipsisTooltip 同款) */}
          <EllipsisTooltip
            text={name}
            maxLines={1}
            className={cx(styles.title)}
          />
          {/* 会话数:眼睛图标 + 紧凑数值,hover 提示精确值 */}
          <span
            className={cx('flex', 'items-center', styles['conv-count'])}
            title={String(convCount)}
          >
            <EyeOutlined />
            <span>{formatConvCount(convCount)}</span>
          </span>
        </div>
      }
      avatar={publishUser?.avatar || defaultAvatar}
      name={publishUser?.nickName || publishUser?.userName}
      content={description}
      icon={icon}
      defaultIcon={agentImage}
      onClick={onClick}
    />
  );
};

export default AppCard;
