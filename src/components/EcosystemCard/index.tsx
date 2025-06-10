import { COMPONENT_LIST, TAG_ICON_LIST } from '@/constants/ecosystem.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { EcosystemShareStatusEnum } from '@/types/interfaces/ecosystem';
import { Card, Tag } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
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
  onClick?: () => Promise<boolean>;
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
  /** 组件类型 */
  targetType: AgentComponentTypeEnum;
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
  targetType,
}) => {
  const [targetInfo, setTargetInfo] = useState<any>({
    icon: icon,
    name: '',
    tagIcon: null,
  });
  const [cardLoading, setCardLoading] = useState(false);
  useEffect(() => {
    if (!targetType) {
      return;
    }
    const hitInfo = COMPONENT_LIST.find((item) => item.type === targetType);
    const iconUrl =
      icon ||
      hitInfo?.defaultImage ||
      'https://agent-1251073634.cos.ap-chengdu.myqcloud.com/store/b5fdb62e8b994a418d0fdfae723ee827.png';
    const tagIcon = TAG_ICON_LIST[targetType];
    const name = hitInfo?.text || '';
    setTargetInfo({
      icon: iconUrl,
      name,
      tagIcon,
    });
    return () => {
      setTargetInfo({
        icon: '',
        name: '',
        tagIcon: null,
      });
    };
  }, [targetType, icon]);
  return (
    <Card
      className={cx(styles.ecosystemCard, className)}
      hoverable
      style={{
        opacity: cardLoading ? 0.5 : 1,
      }}
      onClick={() => {
        setCardLoading(true);
        onClick?.().finally(() => {
          setCardLoading(false);
        });
      }}
    >
      <div className={cx(styles.cardContent)}>
        <div className={cx(styles.iconWrapper)}>
          <img src={targetInfo.icon} alt={title} className={styles.icon} />
          {isEnabled && <ActivatedIcon enabled={isEnabled} />}
        </div>
        <div className={cx(styles.infoWrapper)}>
          <h3 className={cx(styles.title)}>
            {title}{' '}
            {targetInfo.tagIcon && (
              <Tag icon={targetInfo.tagIcon} bordered={false}>
                {targetInfo.name}
              </Tag>
            )}
          </h3>
          <p className={cx(styles.author)}>来自{author}</p>
          <div className={cx(styles.descriptionWrapper)}>
            <p className={cx(styles.description, 'text-ellipsis-3')}>
              {description}
            </p>
          </div>
        </div>
        {shareStatus && <SharedIcon shareStatus={shareStatus} />}
        {isNewVersion && <NewVersionIcon />}
      </div>
    </Card>
  );
};

export default EcosystemCard;
