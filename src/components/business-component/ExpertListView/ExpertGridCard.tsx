/**
 * grid 变体卡片：两栏网格专家卡（与能力弹窗简化专家卡同款）——圆角方
 * 图标 + 名称/单行描述 + 右上相对时间（最近召唤）+ 悬停浮现「聘请」+
 * 付费 Ribbon 角标。
 */
import { t } from '@/services/i18nRuntime';
import { formatTimeAgo } from '@/utils/common';
import { Badge, Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import ExpertIcon from './ExpertIcon';
import styles from './index.less';
import type { ExpertListItem } from './types';

const cx = classNames.bind(styles);

/** 图标底色板（与能力弹窗卡同款 tint 序列） */
export const EXPERT_ICON_BACKGROUNDS = [
  'rgba(24, 144, 255, 12%)',
  'rgba(82, 196, 26, 12%)',
  'rgba(114, 46, 209, 12%)',
  'rgba(250, 140, 22, 12%)',
  'rgba(19, 194, 194, 12%)',
  'rgba(235, 47, 150, 12%)',
];

export interface ExpertCardBaseProps {
  item: ExpertListItem;
  index: number;
  onSelect: (item: ExpertListItem) => void;
}

const ExpertGridCard: React.FC<ExpertCardBaseProps> = ({
  item,
  index,
  onSelect,
}) => {
  const card = (
    <div
      data-expert-key={item.key}
      className={cx(styles.card)}
      onClick={() => onSelect(item)}
    >
      <div className={cx(styles['card-head'])}>
        <ExpertIcon
          icon={item.icon}
          name={item.name}
          background={
            EXPERT_ICON_BACKGROUNDS[index % EXPERT_ICON_BACKGROUNDS.length]
          }
          className={cx(styles['card-icon'])}
        />
        <div className={cx(styles['card-heading'])}>
          <span className={cx(styles['card-name'])} title={item.name}>
            {item.name}
          </span>
          <div className={cx(styles['card-desc'])} title={item.description}>
            {item.description}
          </div>
        </div>
        <div className={cx(styles['card-actions'])}>
          {/* 最近召唤时间：卡片右上角相对时间（used 视图条目才有） */}
          {item.usedTime && (
            <span
              className={cx(styles['card-used-time'])}
              title={item.usedTime}
            >
              {formatTimeAgo(item.usedTime)}
            </span>
          )}
          {/* 悬停/键盘聚焦浮现（不占位），方形圆角 tint 底 */}
          <Button
            size="small"
            className={cx(styles['card-hire'], styles['card-select'])}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(item);
            }}
          >
            {t('PC.Components.CapabilityModal.hire')}
          </Button>
        </div>
      </div>
    </div>
  );
  // 付费/已订阅：antd Badge.Ribbon 左上角小号角标（与技能列表同口径）
  if (item.paymentRequired) {
    return (
      <Badge.Ribbon
        placement="start"
        className={cx(styles['paid-ribbon'])}
        text={t(
          item.subscribed
            ? 'PC.Pages.Square.SingleAgent.subscribed'
            : 'PC.Pages.Square.SingleAgent.paid',
        )}
      >
        {card}
      </Badge.Ribbon>
    );
  }
  return card;
};

export default React.memo(ExpertGridCard);
