import { EcosystemShareStatusEnum } from '@/types/interfaces/ecosystem';
import { Card } from 'antd';
import classNames from 'classnames';
import React from 'react';
import ActivatedIcon from './ActivatedIcon';
import styles from './index.less';
import NewVersionIcon from './NewVersionIcon';
import SharedIcon from './SharedIcon';

const cx = classNames.bind(styles);
/**
 * 插件卡片组件接口
 */
export interface EcosystemCardProps {
  /** 插件图标URL */
  icon: string;
  /** 插件作者 */
  author: string;
  /** 插件标题 */
  title: string;
  /** 插件描述 */
  description: string;
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
const EcosystemCard: React.FC<EcosystemCardProps> = ({
  icon,
  author,
  title,
  description,
  onClick,
  className,
  isEnabled,
  shareStatus,
  isNewVersion,
}) => {
  return (
    <Card
      className={cx(styles.ecosystemCard, className)}
      hoverable
      onClick={onClick}
    >
      <div className={cx(styles.cardContent)}>
        <div className={cx(styles.iconWrapper)}>
          <img src={icon} alt={title} className={styles.icon} />
          {isEnabled && <ActivatedIcon enabled={isEnabled} />}
        </div>
        <div className={cx(styles.infoWrapper)}>
          <h3 className={cx(styles.title)}>{title}</h3>
          <p className={cx(styles.author)}>{author}</p>
          <div className={cx(styles.descriptionWrapper)}>
            <p className={cx(styles.description)}>{description}</p>
          </div>
        </div>
        {shareStatus && <SharedIcon shareStatus={shareStatus} />}
        {isNewVersion && <NewVersionIcon />}
      </div>
    </Card>
  );
};

export default EcosystemCard;
