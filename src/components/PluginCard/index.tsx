import { EcosystemShareStatusEnum } from '@/types/interfaces/ecosystem';
import { Card, Tag } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import NewVersionIcon from './NewVersionIcon';
import SharedIcon from './SharedIcon';

/**
 * 插件卡片组件接口
 */
export interface PluginCardProps {
  /** 插件图标URL */
  icon: string;
  /** 插件标题 */
  title: string;
  /** 插件描述 */
  description: string;
  /** 标签文本（如"官方推荐"等） */
  tag?: string;
  /** 标签颜色 */
  tagColor?: string;
  /** 点击卡片事件 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 是否启用 */
  isEnabled?: boolean;
  /** 分享状态 */
  shareStatus?: EcosystemShareStatusEnum | undefined;
  /** 使用文档 */
  publishDoc?: string;
  /** 是否是新版本 */
  isNewVersion?: boolean;
  /** 配置信息 */
  configParamJson: string;
  /** 本地配置信息(之前 版本) */
  localConfigParamJson?: string;
}

/**
 * 插件卡片组件
 * 用于展示插件信息的卡片组件，包含图标、标题、描述和标签
 * @param props 组件属性
 * @returns 插件卡片组件
 */
const PluginCard: React.FC<PluginCardProps> = ({
  icon,
  title,
  description,
  tag,
  tagColor = '#ff4d4f',
  onClick,
  className,
  isEnabled,
  shareStatus,
  isNewVersion,
}) => {
  return (
    <Card
      className={classNames(styles.pluginCard, className)}
      hoverable
      onClick={onClick}
    >
      <div className={styles.cardContent}>
        <div className={styles.iconWrapper}>
          <img src={icon} alt={title} className={styles.icon} />
          {tag && isEnabled && (
            <div className={styles.tagWrapper}>
              <Tag color={tagColor} className={styles.tag}>
                {tag}
              </Tag>
            </div>
          )}
        </div>
        <div className={styles.infoWrapper}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
        </div>
        {shareStatus && <SharedIcon shareStatus={shareStatus} />}
        {isNewVersion && <NewVersionIcon />}
      </div>
    </Card>
  );
};

export default PluginCard;
