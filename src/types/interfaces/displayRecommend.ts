export enum DisplayRecommendFunctionTypeEnum {
  AgentDev = 'AgentDev',
  PageAppDev = 'PageAppDev',
  SkillDev = 'SkillDev',
  PluginDev = 'PluginDev',
  Chat = 'Chat',
}

export enum DisplayRecommendTargetTypeEnum {
  Agent = 'Agent',
  PageApp = 'PageApp',
  Skill = 'Skill',
  Plugin = 'Plugin',
  Workflow = 'Workflow',
}

export interface DisplayRecommendInfo {
  id: number;
  tenantId: number;
  targetType: DisplayRecommendTargetTypeEnum | string;
  targetId: number;
  recType: string;
  functionType?: DisplayRecommendFunctionTypeEnum | string | null;
  label: string;
  icon?: string;
  placeholder?: string;
  sort?: number;
  modified?: string;
  created?: string;
}

export interface DisplayRecommendGroup {
  Agent?: DisplayRecommendInfo[];
  PageApp?: DisplayRecommendInfo[];
  Skill?: DisplayRecommendInfo[];
  Plugin?: DisplayRecommendInfo[];
  Workflow?: DisplayRecommendInfo[];
}

export interface DisplayRecommendListData {
  recHome?: DisplayRecommendGroup;
  recChatBoxNav?: DisplayRecommendGroup;
}
