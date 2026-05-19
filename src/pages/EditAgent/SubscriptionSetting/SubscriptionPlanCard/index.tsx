import ConditionRender from '@/components/ConditionRender';
import {
  SubscriptionPlanInfo,
  SubscriptionPlanPeriodEnum,
  SubscriptionPlanStatusEnum,
} from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
import { dict } from '@/services/i18nRuntime';
import { Button, Switch } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);
const periodLabelMap: Record<SubscriptionPlanPeriodEnum, string> = {
  [SubscriptionPlanPeriodEnum.MONTH]: dict(
    'PC.Pages.AgentEdit.SubscriptionPlanCard.periodMonth',
  ),
  [SubscriptionPlanPeriodEnum.QUARTER]: dict(
    'PC.Pages.AgentEdit.SubscriptionPlanCard.periodQuarter',
  ),
  [SubscriptionPlanPeriodEnum.YEAR]: dict(
    'PC.Pages.AgentEdit.SubscriptionPlanCard.periodYear',
  ),
  [SubscriptionPlanPeriodEnum.FOREVER]: dict(
    'PC.Pages.AgentEdit.SubscriptionPlanCard.periodForever',
  ),
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
        <div className={cx(styles['plan-name'], 'flex-1', 'text-ellipsis')}>
          {plan.name}
        </div>
        {/* 仅为功能订阅时显示包干价标签 */}
        <ConditionRender condition={plan.functionOnly}>
          <span className={cx(styles['package-tag'])}>
            {dict('PC.Pages.AgentEdit.SubscriptionPlanCard.fixedPrice')}
          </span>
        </ConditionRender>
      </div>
      <div className={cx(styles['plan-desc'], 'text-ellipsis-2')}>
        {plan.description}
      </div>
      <div className={cx(styles['price-box'])}>
        <span className={cx(styles['price-value'])}>¥{plan.price}</span>
        <span className={cx(styles['price-unit'])}>
          {`/ ${periodLabelMap[plan.period] || '-'}`}
        </span>
      </div>
      <div className={cx(styles['plan-meta'])}>
        {plan.callLimitCount === -1
          ? dict('PC.Pages.AgentEdit.SubscriptionPlanCard.unlimited')
          : dict('PC.Pages.AgentEdit.SubscriptionPlanCard.callCount').replace(
              '{0}',
              String(plan.callLimitCount ?? 0),
            )}
      </div>
      <div
        className={cx(styles['card-footer'])}
        onClick={(event) => event.stopPropagation()}
      >
        <Switch
          size="small"
          loading={updateLoading}
          checked={plan.status === SubscriptionPlanStatusEnum.Online}
          onChange={(checked) => onToggle(plan.id || 0, checked)}
        />
        <div className={cx(styles['footer-actions'])}>
          <Button size="small" onClick={() => onEdit(plan)}>
            {dict('PC.Pages.AgentEdit.SubscriptionPlanCard.edit')}
          </Button>
          <Button size="small" danger onClick={() => onDelete(plan.id || 0)}>
            {dict('PC.Pages.AgentEdit.SubscriptionPlanCard.delete')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanCard;
