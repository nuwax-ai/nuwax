import CustomPopover from '@/components/CustomPopover';
import { dict } from '@/services/i18nRuntime';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { PricingPlanInfo } from '@/types/interfaces/subscription';
import { PricingCycleEnum } from '@/types/interfaces/subscription';
import { MoreOutlined } from '@ant-design/icons';
import { Switch, Tag } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

enum PlanActionEnum {
  Edit = 'edit',
  Delete = 'delete',
}

interface Props {
  plan: PricingPlanInfo;
  onEdit: (plan: PricingPlanInfo) => void;
  onDelete: (plan: PricingPlanInfo) => void;
  onToggle: (plan: PricingPlanInfo, enabled: boolean) => void;
}

const PricingPlanItem: React.FC<Props> = ({
  plan,
  onEdit,
  onDelete,
  onToggle,
}) => {
  const cycleLabel = useMemo(
    () => ({
      [PricingCycleEnum.Monthly]: dict(
        'PC.Pages.SpaceResourcePricing.cycleMonthly',
      ),
      [PricingCycleEnum.Quarterly]: dict(
        'PC.Pages.SpaceResourcePricing.cycleQuarterly',
      ),
      [PricingCycleEnum.Yearly]: dict(
        'PC.Pages.SpaceResourcePricing.cycleYearly',
      ),
    }),
    [],
  );

  const moreActions: CustomPopoverItem[] = useMemo(
    () => [
      { value: PlanActionEnum.Edit, label: dict('PC.Common.Global.edit') },
      { value: PlanActionEnum.Delete, label: dict('PC.Common.Global.delete') },
    ],
    [],
  );

  const handleClickMore = (item: CustomPopoverItem) => {
    if (item.value === PlanActionEnum.Edit) onEdit(plan);
    else if (item.value === PlanActionEnum.Delete) onDelete(plan);
  };

  return (
    <div className={cx(styles.card)}>
      <div className={cx(styles['card-header'])}>
        <span className={cx(styles.name)}>{plan.name}</span>
        <div className={cx(styles.actions)}>
          <Switch
            size="small"
            checked={plan.enabled}
            onChange={(checked) => onToggle(plan, checked)}
          />
          <CustomPopover list={moreActions} onClick={handleClickMore}>
            <MoreOutlined className={cx(styles['more-icon'])} />
          </CustomPopover>
        </div>
      </div>
      {plan.description && (
        <p className={cx(styles.desc)}>{plan.description}</p>
      )}
      <div className={cx(styles.footer)}>
        <span className={cx(styles.price)}>
          <strong>
            {dict('PC.Common.Global.currencySymbol')}
            {plan.price}
          </strong>
          <span className={cx(styles.cycle)}>/{cycleLabel[plan.cycle]}</span>
        </span>
        <Tag color={plan.enabled ? 'success' : 'default'}>
          {plan.enabled
            ? dict('PC.Pages.SpaceResourcePricing.statusEnabled')
            : dict('PC.Pages.SpaceResourcePricing.statusDisabled')}
        </Tag>
      </div>
    </div>
  );
};

export default PricingPlanItem;
