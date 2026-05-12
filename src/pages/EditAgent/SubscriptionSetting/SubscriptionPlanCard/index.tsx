import {
  SubscriptionPlanInfo,
  SubscriptionPlanStatusEnum,
} from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
import { Button, Switch } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlanInfo;
  onToggle: (planId: number, checked: boolean) => void;
  onEdit: (plan: SubscriptionPlanInfo) => void;
  onDelete: (planId: number) => void;
}

/**
 * 套餐卡片
 */
const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  onToggle,
  onEdit,
  onDelete,
}) => {
  return (
    <div className={cx(styles.planCard)}>
      <div className={cx(styles.cardTopLine)} />
      <div className={cx(styles.cardHeader)}>
        <div className={cx(styles.planName)}>{plan.name}</div>
        <span className={cx(styles.packageTag)}>包千价</span>
      </div>
      <div className={cx(styles.planDesc)}>{plan.description || '-'}</div>
      <div className={cx(styles.priceBox)}>
        <span className={cx(styles.currency)}>¥</span>
        <span className={cx(styles.priceValue)}>{plan.price}</span>
        <span className={cx(styles.priceUnit)}>{plan.period}</span>
      </div>
      <div className={cx(styles.planMeta)}>
        {plan.callLimitCount === -1
          ? '不限次数'
          : `${plan.callLimitCount ?? 0} 次`}
      </div>
      <div className={cx(styles.cardFooter)}>
        <Switch
          size="small"
          checked={plan.status === SubscriptionPlanStatusEnum.Online}
          onChange={(checked) => onToggle(plan.id || 0, checked)}
        />
        <div className={cx(styles.footerActions)}>
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
