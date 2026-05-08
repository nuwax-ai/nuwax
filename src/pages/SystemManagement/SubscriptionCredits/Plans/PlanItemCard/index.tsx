import ConditionRender from '@/components/ConditionRender';
import { dict } from '@/services/i18nRuntime';
import { CheckCircleFilled, StarOutlined } from '@ant-design/icons';
import { Button, Switch } from 'antd';
import React from 'react';
import {
  SubscriptionPlanInfo,
  SubscriptionPlanStatusEnum,
} from '../../types/subscription';
import styles from './index.less';

interface PlanItemCardProps {
  planInfo: SubscriptionPlanInfo;
  onToggle: (id: number, enabled: boolean) => void;
  onEdit: (planInfo: SubscriptionPlanInfo) => void;
  onDelete: (id: number) => void;
}

const periodLabelMap = {
  MONTH: '月',
  QUARTER: '季度',
  YEAR: '年',
  FOREVER: '永久',
} as const;

const PlanItemCard: React.FC<PlanItemCardProps> = ({
  planInfo,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const planId = planInfo.id ?? 0;
  const firstPrice = planInfo.firstPrice ?? 0;
  const creditAmount = planInfo.creditAmount ?? 0;
  const periodLabel = periodLabelMap[planInfo.period] || '月';
  const isOnline = planInfo.status === SubscriptionPlanStatusEnum.Online;

  // 权益列表
  const featureList = (planInfo.features || []).map((feature) => {
    const featureText = String(feature || '');
    const badgeMatch = featureText.match(/(限时免费|功能限免|限时尝鲜)/);
    const badge = badgeMatch?.[1] || '';
    const text = featureText
      .replace(/（/g, '(')
      .replace(/）/g, ')')
      .replace(/\((限时免费|功能限免|限时尝鲜)\)/g, '')
      .replace(/(限时免费|功能限免|限时尝鲜)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      text: text || featureText,
      badge,
    };
  });

  return (
    <div className={styles['plan-item-card']}>
      <div className={styles['plan-item-content']}>
        <div className={styles['plan-item-header']}>
          <div className={styles['plan-item-title']}>{planInfo.name}</div>
        </div>

        <div className={styles['plan-item-price-row']}>
          <span className={styles['plan-item-price']}>
            ¥{planInfo.price ?? 0}
          </span>
          <span className={styles['plan-item-period']}>/{periodLabel}</span>

          <ConditionRender condition={firstPrice}>
            <span className={styles['plan-item-first-price']}>
              原价¥{firstPrice}/{periodLabel}
            </span>
          </ConditionRender>
        </div>

        <div className={styles['plan-item-main-feature-row']}>
          <StarOutlined className={styles['plan-item-main-feature-icon']} />
          <span className={styles['plan-item-main-feature-text']}>
            {`每月 ${creditAmount.toLocaleString()} 积分`}
          </span>
        </div>

        <div className={styles['plan-item-divider']} />

        {/* 权益列表 */}
        <div className={styles['plan-item-feature-list']}>
          {featureList.map((feature, index) => (
            <div
              key={`${feature.text}-${index}`}
              className={styles['plan-item-feature-item']}
            >
              <CheckCircleFilled className={styles['plan-item-feature-icon']} />
              <span className={styles['plan-item-feature-text']}>
                {feature.text}
              </span>
              {feature.badge && (
                <span className={styles['plan-item-feature-badge']}>
                  {feature.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 卡片底部操作区域 */}
      <footer className={styles['plan-item-footer']}>
        <div className={styles['plan-item-footer-left']}>
          <span className={styles['plan-item-footer-label']}>
            {dict('PC.Pages.SystemPlans.status')}
          </span>
          <Switch
            checked={isOnline}
            onChange={(value) => onToggle(planId, value)}
          />
        </div>
        <div className={styles['plan-item-footer-actions']}>
          <Button
            type="link"
            size="small"
            className={styles['plan-item-action-btn']}
            onClick={() => onEdit(planInfo)}
          >
            {dict('PC.Common.Global.edit')}
          </Button>
          <Button
            type="link"
            size="small"
            danger
            className={styles['plan-item-action-btn']}
            onClick={() => onDelete(planId)}
          >
            {dict('PC.Common.Global.delete')}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default PlanItemCard;
