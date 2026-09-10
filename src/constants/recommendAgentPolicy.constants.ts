import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  DisplayRecommendFunctionTypeEnum,
  type DisplayRecommendInfo,
} from '@/types/interfaces/displayRecommend';

/**
 * 推荐位智能体策略单源（收编原 src/pages/Home/index.tsx 三个内联映射，
 * 2026-09-10 上框需求起上移至此，行为不变；后续弹窗选择（专家）/
 * 弹窗选择（专家+智能体）等场景复用同一判断，勿在入口散落副本）。
 */

/** 推荐位功能类型 → 项目类型（决定首页发送走建项目分支） */
const FUNCTION_TYPE_PROJECT_TYPE_MAP: Partial<
  Record<DisplayRecommendFunctionTypeEnum | string, AgentComponentTypeEnum>
> = {
  [DisplayRecommendFunctionTypeEnum.AgentDev]: AgentComponentTypeEnum.Agent,
  [DisplayRecommendFunctionTypeEnum.PageAppDev]: AgentComponentTypeEnum.PageApp,
  [DisplayRecommendFunctionTypeEnum.SkillDev]: AgentComponentTypeEnum.Skill,
  [DisplayRecommendFunctionTypeEnum.PluginDev]: AgentComponentTypeEnum.Plugin,
  [DisplayRecommendFunctionTypeEnum.UserAppDev]: AgentComponentTypeEnum.UserApp,
  [DisplayRecommendFunctionTypeEnum.NormalProjectDev]:
    AgentComponentTypeEnum.NormalProject,
};

/** 选中推荐（而非租户默认）时按任务智能体形态生效的功能类型集合 */
const TASK_AGENT_FUNCTION_TYPES = new Set<string>([
  DisplayRecommendFunctionTypeEnum.AgentDev,
  DisplayRecommendFunctionTypeEnum.SkillDev,
  DisplayRecommendFunctionTypeEnum.PluginDev,
  DisplayRecommendFunctionTypeEnum.UserAppDev,
  DisplayRecommendFunctionTypeEnum.NormalProjectDev,
]);

/** 需要展示空间选择器的功能类型集合 */
const SPACE_SELECTOR_FUNCTION_TYPES = new Set<string>([
  DisplayRecommendFunctionTypeEnum.AgentDev,
  DisplayRecommendFunctionTypeEnum.PageAppDev,
  DisplayRecommendFunctionTypeEnum.SkillDev,
  DisplayRecommendFunctionTypeEnum.PluginDev,
  DisplayRecommendFunctionTypeEnum.UserAppDev,
  DisplayRecommendFunctionTypeEnum.NormalProjectDev,
]);

/** 推荐位功能类型 → 项目类型；非项目类（对话型等）返回 undefined */
export const getProjectTypeByFunctionType = (
  functionType?: DisplayRecommendFunctionTypeEnum | string | null,
): AgentComponentTypeEnum | undefined =>
  functionType ? FUNCTION_TYPE_PROJECT_TYPE_MAP[functionType] : undefined;

/** 该功能类型的推荐是否按任务智能体形态生效（选中推荐时用） */
export const isTaskAgentFunctionType = (
  functionType?: DisplayRecommendFunctionTypeEnum | string | null,
): boolean =>
  functionType ? TASK_AGENT_FUNCTION_TYPES.has(functionType) : false;

/** 该功能类型的推荐是否需要展示空间选择器 */
export const showSpaceSelectorForFunctionType = (
  functionType?: DisplayRecommendFunctionTypeEnum | string | null,
): boolean =>
  functionType ? SPACE_SELECTOR_FUNCTION_TYPES.has(functionType) : false;

/**
 * 智能体可选范围上下文：携带上框/绑定项目即受限，undefined = 不受限（全量可选）。
 * 首页项目上框是首个消费方；专家/智能体选择弹窗复用同一切面做单项可选判断。
 */
export interface AgentSelectableContext {
  /** 上框/绑定项目类型（UserApp / NormalProject） */
  projectType?: AgentComponentTypeEnum;
  /** 项目绑定的调试智能体 ID（契约先行：缺失=无法默认命中） */
  devAgentId?: number;
}

/** 项目类型 → 允许的推荐位功能类型（只能切换同类型智能体） */
const PROJECT_TYPE_ALLOWED_FUNCTION_TYPE: Partial<
  Record<AgentComponentTypeEnum, DisplayRecommendFunctionTypeEnum>
> = {
  [AgentComponentTypeEnum.UserApp]: DisplayRecommendFunctionTypeEnum.UserAppDev,
  [AgentComponentTypeEnum.NormalProject]:
    DisplayRecommendFunctionTypeEnum.NormalProjectDev,
};

/** 读取上下文允许的推荐位功能类型；无上下文或未登记类型返回 undefined（=不受限） */
export const getAllowedFunctionType = (
  context?: AgentSelectableContext,
): DisplayRecommendFunctionTypeEnum | undefined =>
  context?.projectType
    ? PROJECT_TYPE_ALLOWED_FUNCTION_TYPE[context.projectType]
    : undefined;

/** 单项是否可选（弹窗场景直接用它做禁用/隐藏判断） */
export const isAgentSelectable = (
  item: Pick<DisplayRecommendInfo, 'functionType'>,
  context?: AgentSelectableContext,
): boolean => {
  const allowed = getAllowedFunctionType(context);
  return !allowed || item.functionType === allowed;
};

/** 列表过滤（首页推荐列表 / 弹窗列表共用） */
export const filterSelectableAgents = <
  T extends Pick<DisplayRecommendInfo, 'functionType'>,
>(
  list: T[],
  context?: AgentSelectableContext,
): T[] => {
  const allowed = getAllowedFunctionType(context);
  return allowed ? list.filter((item) => item.functionType === allowed) : list;
};

/**
 * 默认命中：仅全栈（UserApp）且上下文带 devAgentId 时按 targetId 命中推荐项；
 * 常规项目不默认命中、devAgentId 缺失或未命中均返回 undefined（调用方决定是否提示）。
 */
export const findDefaultAgent = <
  T extends Pick<DisplayRecommendInfo, 'targetId'>,
>(
  list: T[],
  context?: AgentSelectableContext,
): T | undefined => {
  if (
    context?.projectType !== AgentComponentTypeEnum.UserApp ||
    !context.devAgentId
  ) {
    return undefined;
  }
  return list.find((item) => item.targetId === context.devAgentId);
};

/**
 * 类型兜底命中：devAgentId 契约未 ready 或精确未命中时，按项目类型挑
 * 唯一同类型推荐项自动选中（等价替用户手点）；同类型 0 个或多个均不命中
 * （多个时无法猜测绑定哪个，回落手选提示）。调用方决定是否提示。
 */
export const findTypeFallbackAgent = <
  T extends Pick<DisplayRecommendInfo, 'functionType'>,
>(
  list: T[],
  projectType?: AgentComponentTypeEnum,
): T | undefined => {
  const allowed = getAllowedFunctionType({ projectType });
  if (!allowed) {
    return undefined;
  }
  const matches = list.filter((item) => item.functionType === allowed);
  return matches.length === 1 ? matches[0] : undefined;
};
