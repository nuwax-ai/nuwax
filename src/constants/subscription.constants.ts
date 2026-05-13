import { dict } from '@/services/i18nRuntime';
import {
  CreditTypeEnum,
  PayChannelEnum,
  PaymentStatusEnum,
} from '@/types/interfaces/subscription';

/**
 * 积分变动类型映射 (用于 ProTable valueEnum)
 */
export const CREDIT_TYPE_VALUE_ENUM_MAP = {
  [CreditTypeEnum.SUBSCRIPTION]: {
    text: dict('PC.Pages.MorePage.CreditRecords.typeSubscription'),
  },
  [CreditTypeEnum.PURCHASE]: {
    text: dict('PC.Pages.MorePage.CreditRecords.typePurchase'),
  },
  [CreditTypeEnum.ACTIVITY]: {
    text: dict('PC.Pages.MorePage.CreditRecords.typeActivity'),
  },
  [CreditTypeEnum.MANUAL]: {
    text: dict('PC.Pages.MorePage.CreditRecords.typeManual'),
  },
  [CreditTypeEnum.MODEL_CALL]: {
    text: dict('PC.Pages.MorePage.CreditRecords.typeModelCall'),
  },
  [CreditTypeEnum.AGENT_CALL]: {
    text: dict('PC.Pages.MorePage.CreditRecords.typeAgentCall'),
  },
  [CreditTypeEnum.TOOL_CALL]: {
    text: dict('PC.Pages.MorePage.CreditRecords.typeToolCall'),
  },
  [CreditTypeEnum.MANUAL_DEDUCT]: {
    text: dict('PC.Pages.MorePage.CreditRecords.typeManualDeduct'),
  },
};

/**
 * 支付状态配置 (颜色、标签)
 */
export const getPaymentStatusConfig = () => ({
  [PaymentStatusEnum.INIT]: {
    color: 'default',
    label: dict('PC.Pages.SystemManagement.PaymentEarnings.Orders.statusInit'),
  },
  [PaymentStatusEnum.PENDING]: {
    color: 'warning',
    label: dict(
      'PC.Pages.SystemManagement.PaymentEarnings.Orders.statusPending',
    ),
  },
  [PaymentStatusEnum.PAID]: {
    color: 'success',
    label: dict('PC.Pages.SystemManagement.PaymentEarnings.Orders.statusPaid'),
  },
  [PaymentStatusEnum.FAILED]: {
    color: 'error',
    label: dict(
      'PC.Pages.SystemManagement.PaymentEarnings.Orders.statusFailed',
    ),
  },
  [PaymentStatusEnum.CLOSED]: {
    color: 'default',
    label: dict(
      'PC.Pages.SystemManagement.PaymentEarnings.Orders.statusClosed',
    ),
  },
});

/**
 * 支付状态映射 (用于 ProTable valueEnum)
 */
export const getPaymentStatusValueEnum = () => {
  const config = getPaymentStatusConfig();
  return Object.keys(config).reduce((acc, key) => {
    acc[key] = { text: (config as any)[key].label };
    return acc;
  }, {} as any);
};

/**
 * 支付渠道映射 (用于 ProTable valueEnum)
 */
export const getPayChannelValueEnum = () => ({
  [PayChannelEnum.WxPay]: {
    text: dict(
      'PC.Pages.SystemManagement.PaymentEarnings.Orders.payMethodWechat',
    ),
  },
  [PayChannelEnum.AliPay]: {
    text: dict(
      'PC.Pages.SystemManagement.PaymentEarnings.Orders.payMethodAlipay',
    ),
  },
  [PayChannelEnum.UnionPay]: {
    text: dict(
      'PC.Pages.SystemManagement.PaymentEarnings.Orders.payMethodBank',
    ),
  },
});
