/**
 * grid 变体卡片：两栏网格技能卡（与能力弹窗简化卡同款）——圆形图标 +
 * 名称/单行描述 + 悬停浮现「选择」+ 常驻启用开关 + 付费 Ribbon 角标。
 */
import { t } from '@/services/i18nRuntime';
import { Badge, Button, Switch } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import SkillIcon from './SkillIcon';
import type { SkillListItem } from './types';

const cx = classNames.bind(styles);

/** 图标底色板（与能力弹窗卡同款 tint 序列） */
export const SKILL_ICON_BACKGROUNDS = [
  'rgba(24, 144, 255, 12%)',
  'rgba(82, 196, 26, 12%)',
  'rgba(114, 46, 209, 12%)',
  'rgba(250, 140, 22, 12%)',
  'rgba(19, 194, 194, 12%)',
  'rgba(235, 47, 150, 12%)',
];

export interface SkillCardBaseProps {
  item: SkillListItem;
  index: number;
  onSelect: (item: SkillListItem) => void;
  onToggleEnable: (item: SkillListItem) => void;
  /** 启用/取消启用请求中的条目 key（开关 loading） */
  enableBusyKeys?: string[];
}

const SkillGridCard: React.FC<SkillCardBaseProps> = ({
  item,
  index,
  onSelect,
  onToggleEnable,
  enableBusyKeys,
}) => {
  const card = (
    <div
      data-skill-key={item.key}
      className={cx(styles.card)}
      onClick={() => onSelect(item)}
    >
      <div className={cx(styles['card-head'])}>
        <SkillIcon
          icon={item.icon}
          name={item.name}
          background={
            SKILL_ICON_BACKGROUNDS[index % SKILL_ICON_BACKGROUNDS.length]
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
          {/* 悬停/键盘聚焦浮现（不占位），方形圆角 tint 底 */}
          <Button
            size="small"
            className={cx(styles['card-hire'], styles['card-select'])}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(item);
            }}
          >
            {t('PC.Components.CapabilityModal.select')}
          </Button>
          <Switch
            className={cx(styles['card-switch'])}
            size="small"
            checked={item.enabled === true}
            loading={enableBusyKeys?.includes(item.key)}
            aria-label={t(
              item.enabled
                ? 'PC.Components.CapabilityModal.unEnable'
                : 'PC.Components.CapabilityModal.enable',
            )}
            onClick={(_, event) => {
              event.stopPropagation();
              onToggleEnable(item);
            }}
          />
        </div>
      </div>
    </div>
  );
  // 付费/已订阅：antd Badge.Ribbon 左上角小号角标（与能力弹窗同口径）
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

export default React.memo(SkillGridCard);
