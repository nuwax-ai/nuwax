import { dict } from '@/services/i18nRuntime';

/**
 * 获取收益类型配置映射
 * 包含颜色和多语言文本
 */
export const getRevenueTypeMap = () => ({
  PLAN: {
    color: 'blue',
    text: dict('PC.Pages.SystemManagement.PaymentEarnings.Detail.typePlan'),
  },
  MODEL_CALL: {
    color: 'purple',
    text: dict(
      'PC.Pages.SystemManagement.PaymentEarnings.Detail.typeModelCall',
    ),
  },
  TOOL_CALL: {
    color: 'cyan',
    text: dict('PC.Pages.SystemManagement.PaymentEarnings.Detail.typeToolCall'),
  },
});
