import {
  DisplayRecommendFunctionTypeEnum,
  DisplayRecommendTargetTypeEnum,
  DisplayRecTypeEnum,
} from './types';

/** 推荐页配置 */
export interface RecommendPageConfig {
  recType: DisplayRecTypeEnum;
  /** 允许推荐的目标类型 */
  targetTypes: DisplayRecommendTargetTypeEnum[];
  /** 是否按 functionType 分 Tab（对话框智能体） */
  useFunctionTypeTabs?: boolean;
  /** functionType Tab 选项 */
  functionTypes?: DisplayRecommendFunctionTypeEnum[];
  /** 默认 functionType */
  defaultFunctionType?: DisplayRecommendFunctionTypeEnum | '';
}

/** 智能体推荐页配置 */
export const HOME_RECOMMEND_CONFIG: RecommendPageConfig = {
  recType: DisplayRecTypeEnum.Home,
  targetTypes: [DisplayRecommendTargetTypeEnum.Agent],
};

/** 官方推荐页配置 */
export const OFFICIAL_RECOMMEND_CONFIG: RecommendPageConfig = {
  recType: DisplayRecTypeEnum.Official,
  targetTypes: [
    DisplayRecommendTargetTypeEnum.Agent,
    DisplayRecommendTargetTypeEnum.PageApp,
    DisplayRecommendTargetTypeEnum.Skill,
    DisplayRecommendTargetTypeEnum.Plugin,
    DisplayRecommendTargetTypeEnum.Workflow,
  ],
};

/** 对话框智能体推荐页配置 */
export const CHATBOX_RECOMMEND_CONFIG: RecommendPageConfig = {
  recType: DisplayRecTypeEnum.ChatBoxNav,
  targetTypes: [DisplayRecommendTargetTypeEnum.Agent],
  useFunctionTypeTabs: true,
  functionTypes: [
    DisplayRecommendFunctionTypeEnum.AgentDev,
    DisplayRecommendFunctionTypeEnum.PageAppDev,
    DisplayRecommendFunctionTypeEnum.SkillDev,
    DisplayRecommendFunctionTypeEnum.PluginDev,
    DisplayRecommendFunctionTypeEnum.Chat,
  ],
  defaultFunctionType: DisplayRecommendFunctionTypeEnum.AgentDev,
};

/** recType → 页面配置 */
export const RECOMMEND_PAGE_CONFIG_MAP: Record<
  DisplayRecTypeEnum,
  RecommendPageConfig
> = {
  [DisplayRecTypeEnum.Home]: HOME_RECOMMEND_CONFIG,
  [DisplayRecTypeEnum.Official]: OFFICIAL_RECOMMEND_CONFIG,
  [DisplayRecTypeEnum.ChatBoxNav]: CHATBOX_RECOMMEND_CONFIG,
};
