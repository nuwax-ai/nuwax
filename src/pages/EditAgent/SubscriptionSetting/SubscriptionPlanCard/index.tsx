import {
  SubscriptionPlanInfo,
  SubscriptionPlanPeriodEnum,
  SubscriptionPlanStatusEnum,
} from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
import { Button, Switch } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);
const periodLabelMap: Record<SubscriptionPlanPeriodEnum, string> = {
  [SubscriptionPlanPeriodEnum.MONTH]: '月',
  [SubscriptionPlanPeriodEnum.QUARTER]: '季度',
  [SubscriptionPlanPeriodEnum.YEAR]: '年',
  [SubscriptionPlanPeriodEnum.FOREVER]: '永久',
};

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlanInfo;
  updateLoading?: boolean;
  // 切换套餐状态
  onToggle: (planId: number, checked: boolean) => void;
  // 编辑套餐
  onEdit: (plan: SubscriptionPlanInfo) => void;
  // 删除套餐
  onDelete: (planId: number) => void;
}

/**
 * 套餐卡片
 */
const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  updateLoading,
  onToggle,
  onEdit,
  onDelete,
}) => {
  return (
    <div className={cx(styles['plan-card'])}>
      <div className={cx(styles['card-top-line'])} />
      <div className={cx(styles['card-header'])}>
        <div className={cx(styles['plan-name'])}>{plan.name}</div>
        <span className={cx(styles['package-tag'])}>包千价</span>
      </div>
      <div className={cx(styles['plan-desc'], 'text-ellipsis-2')}>
        {plan.description}
      </div>
      <div className={cx(styles['price-box'])}>
        <span className={cx(styles.currency)}>¥</span>
        <span className={cx(styles['price-value'])}>{plan.price}</span>
        <span className={cx(styles['price-unit'])}>
          {`/${periodLabelMap[plan.period] || '-'}`}
        </span>
      </div>
      <div className={cx(styles['plan-meta'])}>
        {plan.callLimitCount === -1
          ? '不限次数'
          : `${plan.callLimitCount ?? 0} 次`}
      </div>
      <div className={cx(styles['card-footer'])}>
        <Switch
          size="small"
          loading={updateLoading}
          checked={plan.status === SubscriptionPlanStatusEnum.Online}
          onChange={(checked) => onToggle(plan.id || 0, checked)}
        />
        <div className={cx(styles['footer-actions'])}>
          <Button size="small" onClick={() => onEdit(plan)}>
            编辑
          </Button>
          <Button size="small" danger onClick={() => onDelete(plan.id || 0)}>
            删除
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanCard;
