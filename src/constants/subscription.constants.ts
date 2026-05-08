import { dict } from '@/services/i18nRuntime';
import { CreditTypeEnum } from '@/types/interfaces/subscription';

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
