import { COMPONENT_LIST, TAG_ICON_LIST } from '@/constants/ecosystem.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  EcosystemDataTypeEnum,
  EcosystemShareStatusEnum,
} from '@/types/interfaces/ecosystem';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';
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
  onClick?: () => Promise<void>;
  /** 自定义类名 */
  className?: string;
  /** 是否启用 */
  isEnabled?: boolean;
  /** 分享状态 */
  shareStatus?: EcosystemShareStatusEnum | undefined;
  /** 数据类型 */
  dataType?: EcosystemDataTypeEnum;
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
  footer?: React.ReactNode;
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
  dataType,
  footer,
}) => {
  // 默认信息(组件类型、默认图标、标签图标)
  const [defaultInfo, setDefaultInfo] = useState<{
    name: string;
    defaultImage: string;
    tagIcon: React.ReactNode;
  }>({
    name: '',
    defaultImage: '',
    tagIcon: null,
  });
  // 卡片加载状态
  const [cardLoading, setCardLoading] = useState(false);

  // 获取默认信息
  useEffect(() => {
    // 如果targetType为空，则根据dataType判断，因为dataType为MCP时，targetType可能为空
    const type =
      targetType ||
      (dataType === EcosystemDataTypeEnum.MCP
        ? AgentComponentTypeEnum.MCP
        : null);
    if (!type) {
      return;
    }
    const hitInfo = COMPONENT_LIST.find((item) => item.type === type);
    const defaultImage = hitInfo?.defaultImage || '';
    const tagIcon = TAG_ICON_LIST[type] || null;
    const name = hitInfo?.text || '';
    setDefaultInfo({
      name,
      defaultImage,
      tagIcon,
    });
  }, [targetType, dataType]);

  // 点击卡片
  const handleClickCard = async () => {
    setCardLoading(true);
    onClick?.();
    await onClick?.().finally(() => {
      setCardLoading(false);
    });
  };

  return (
    <div
      className={cx('flex', 'flex-col', 'gap-4', styles.container, className)}
      style={{
        opacity: cardLoading ? 0.7 : 1,
      }}
      onClick={handleClickCard}
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
      <header className={cx('flex', styles.header)}>
        <img
          className={cx(styles.image)}
          src={icon || defaultInfo.defaultImage}
          alt=""
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = defaultInfo.defaultImage;
          }}
        />
        <div
          className={cx(
            'flex-1',
            'flex',
            'flex-col',
            'content-between',
            'overflow-hide',
          )}
        >
          <h3 className={cx('text-ellipsis', styles.title)}>{title}</h3>
          <div
            className={cx(
              'flex',
              'items-center',
              'content-between',
              styles['author-rel-info'],
            )}
          >
            <div
              className={cx('flex', 'items-center', styles['from-author-box'])}
            >
              <span>来自于</span>
              <span className={cx('flex-1', 'text-ellipsis')}>{author}</span>
            </div>
            {shareStatus && <SharedIcon shareStatus={shareStatus} />}
          </div>
        </div>
      </header>
      <p className={cx('text-ellipsis-2', styles.content)}>{description}</p>
      {footer}
    </div>
  );
};

export default EcosystemCard;
