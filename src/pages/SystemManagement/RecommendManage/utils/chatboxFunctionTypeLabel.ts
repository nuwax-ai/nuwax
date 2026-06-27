import { dict } from '@/services/i18nRuntime';
import { DisplayRecommendFunctionTypeEnum } from '../types';

/**
 * 对话框 functionType → i18n key（末段小驼峰，符合 I18N_KEY_REGEX）
 */
const CHATBOX_FUNCTION_TYPE_I18N_KEY: Record<
  DisplayRecommendFunctionTypeEnum,
  string
> = {
  [DisplayRecommendFunctionTypeEnum.AgentDev]:
    'PC.Pages.SystemRecommendManage.functionType.agentDev',
  [DisplayRecommendFunctionTypeEnum.PageAppDev]:
    'PC.Pages.SystemRecommendManage.functionType.pageAppDev',
  [DisplayRecommendFunctionTypeEnum.SkillDev]:
    'PC.Pages.SystemRecommendManage.functionType.skillDev',
  [DisplayRecommendFunctionTypeEnum.PluginDev]:
    'PC.Pages.SystemRecommendManage.functionType.pluginDev',
  [DisplayRecommendFunctionTypeEnum.Chat]:
    'PC.Pages.SystemRecommendManage.functionType.chat',
};

/**
 * 获取对话框智能体 functionType 展示文案
 */
export const getChatboxFunctionTypeLabel = (
  type: DisplayRecommendFunctionTypeEnum,
): string => dict(CHATBOX_FUNCTION_TYPE_I18N_KEY[type]);
