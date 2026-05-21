/**
 * 发放/扣减弹窗积分类型下拉配置
 * - 仅暴露运营可选手动类流水，不含 LOAN、MODEL_CALL 等系统自动类型
 * - buildCreditTypeSelectOptions 将枚举映射为 Ant Design Select options（文案走 i18n）
 */
import { dict } from '@/services/i18nRuntime';
import { CreditFlowTypeEnum } from './types/credit';

/** 发放可选类型：订阅 / 增购 / 活动 / 手动发放（默认 MANUAL） */
export const GRANT_CREDIT_TYPE_OPTIONS: CreditFlowTypeEnum[] = [
  CreditFlowTypeEnum.SUBSCRIPTION,
  CreditFlowTypeEnum.PURCHASE,
  CreditFlowTypeEnum.ACTIVITY,
  CreditFlowTypeEnum.MANUAL,
];

/** 扣减可选类型：在发放基础上增加 MANUAL_DEDUCT（默认 MANUAL_DEDUCT） */
export const DEDUCT_CREDIT_TYPE_OPTIONS: CreditFlowTypeEnum[] = [
  CreditFlowTypeEnum.SUBSCRIPTION,
  CreditFlowTypeEnum.PURCHASE,
  CreditFlowTypeEnum.ACTIVITY,
  CreditFlowTypeEnum.MANUAL,
  CreditFlowTypeEnum.MANUAL_DEDUCT,
];

/** 积分类型筛选下拉：枚举值 → i18n key（不含 LOAN） */
export const CREDIT_FLOW_TYPE_SEARCH_KEYS: Partial<
  Record<CreditFlowTypeEnum, string>
> = {
  [CreditFlowTypeEnum.SUBSCRIPTION]:
    'PC.Pages.SystemCreditRecords.creditTypeSubscription',
  [CreditFlowTypeEnum.PURCHASE]:
    'PC.Pages.SystemCreditRecords.creditTypePurchase',
  [CreditFlowTypeEnum.ACTIVITY]:
    'PC.Pages.SystemCreditRecords.creditTypeActivity',
  [CreditFlowTypeEnum.MANUAL]: 'PC.Pages.SystemCreditRecords.creditTypeManual',
  [CreditFlowTypeEnum.MODEL_CALL]:
    'PC.Pages.SystemCreditRecords.creditTypeModelCall',
  [CreditFlowTypeEnum.AGENT_CALL]:
    'PC.Pages.SystemCreditRecords.creditTypeAgentCall',
  [CreditFlowTypeEnum.TOOL_CALL]:
    'PC.Pages.SystemCreditRecords.creditTypeToolCall',
  [CreditFlowTypeEnum.MANUAL_DEDUCT]:
    'PC.Pages.SystemCreditRecords.creditTypeManualDeduct',
};

/** 将积分类型枚举转为 Select 选项 */
export function buildCreditTypeSelectOptions(types: CreditFlowTypeEnum[]) {
  return types.map((value) => ({
    value,
    label: dict(CREDIT_FLOW_TYPE_SEARCH_KEYS[value] ?? value),
  }));
}
