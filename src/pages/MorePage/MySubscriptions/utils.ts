import { dict } from '@/services/i18nRuntime';
import {
  MyPlanPeriodEnum,
  MySubscriptionStatusEnum,
} from '@/types/interfaces/subscription';

/**
 * 获取周期续费文案 (如: 每月, 每季, 每年)
 */
export const getPeriodRenewText = (period: MyPlanPeriodEnum) => {
  switch (period) {
    case MyPlanPeriodEnum.Month:
      return dict('PC.Common.Subscription.Period.renewMonth');
    case MyPlanPeriodEnum.Quarter:
      return dict('PC.Common.Subscription.Period.renewQuarter');
    case MyPlanPeriodEnum.Year:
      return dict('PC.Common.Subscription.Period.renewYear');
    default:
      return '';
  }
};

/**
 * 获取订阅状态文案
 */
export const getStatusText = (status: MySubscriptionStatusEnum) => {
  switch (status) {
    case MySubscriptionStatusEnum.Active:
      return dict('PC.Common.Subscription.Status.active');
    case MySubscriptionStatusEnum.Expired:
      return dict('PC.Common.Subscription.Status.expired');
    case MySubscriptionStatusEnum.Cancelled:
      return dict('PC.Common.Subscription.Status.cancelled');
    default:
      return status;
  }
};

/**
 * 获取费用标签文案 (如: 月费, 季费, 年费)
 */
export const getFeeLabel = (period: MyPlanPeriodEnum) => {
  switch (period) {
    case MyPlanPeriodEnum.Month:
      return dict('PC.Pages.MorePage.MySubscriptions.feeMonth');
    case MyPlanPeriodEnum.Quarter:
      return dict('PC.Pages.MorePage.MySubscriptions.feeQuarter');
    case MyPlanPeriodEnum.Year:
      return dict('PC.Pages.MorePage.MySubscriptions.feeYear');
    default:
      return '';
  }
};

/**
 * 获取积分标签文案 (如: 每月积分)
 */
export const getCreditsLabel = () => {
  return dict('PC.Pages.MorePage.MySubscriptions.creditsMonth');
};

/**
 * 获取周期显示文本 (如: 月付, 季付, 年付)
 */
export const getPeriodPayTypeText = (period?: MyPlanPeriodEnum) => {
  switch (period) {
    case MyPlanPeriodEnum.Month:
      return dict('PC.Pages.MorePage.MySubscriptions.monthlyPayment');
    case MyPlanPeriodEnum.Quarter:
      return dict('PC.Pages.MorePage.MySubscriptions.quarterlyPayment');
    case MyPlanPeriodEnum.Year:
      return dict('PC.Pages.MorePage.MySubscriptions.yearlyPayment');
    case MyPlanPeriodEnum.Forever:
      return dict('PC.Pages.MorePage.MySubscriptions.permanentUse');
    default:
      return '-';
  }
};

/**
 * 获取周期单位文本 (如: /月, /季, /年)
 */
export const getPeriodUnitText = (period?: MyPlanPeriodEnum) => {
  switch (period) {
    case MyPlanPeriodEnum.Month:
      return `/${dict('PC.Common.Subscription.Period.month')}`;
    case MyPlanPeriodEnum.Quarter:
      return `/${dict('PC.Common.Subscription.Period.quarter')}`;
    case MyPlanPeriodEnum.Year:
      return `/${dict('PC.Common.Subscription.Period.year')}`;
    default:
      return '';
  }
};
