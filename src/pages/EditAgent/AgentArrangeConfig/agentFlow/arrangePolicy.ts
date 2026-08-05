/**
 * AgentFlow / 设备智能体 编排配置策略
 *
 * AgentFlow 的编排即画布本身，不支持外挂插件/MCP/工作流/知识库/数据表等组件。
 * 设备智能体（extra.isDeviceAgent）仅展示插件、工作流、知识库、MCP、选模型、组员、长期记忆等配置。
 * 本模块集中维护展示/隐藏规则，避免业务页散落条件判断。
 */
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentArrangeConfigEnum, AgentSubTypeEnum } from '@/types/enums/space';

/** AgentFlow 下禁止添加或展示的组件类型 */
const HIDDEN_COMPONENT_TYPES = new Set<AgentComponentTypeEnum>([
  AgentComponentTypeEnum.Workflow,
  AgentComponentTypeEnum.Table,
  AgentComponentTypeEnum.Knowledge,
  AgentComponentTypeEnum.Plugin,
  AgentComponentTypeEnum.MCP,
  AgentComponentTypeEnum.Skill,
]);

/** 设备智能体工具区保留的折叠项 */
const DEVICE_AGENT_TOOL_KEYS = new Set<AgentArrangeConfigEnum>([
  AgentArrangeConfigEnum.Plugin,
  AgentArrangeConfigEnum.Workflow,
  AgentArrangeConfigEnum.MCP,
]);

/** 设备智能体「添加组件」弹窗可见 Tab */
const DEVICE_AGENT_CREATED_TABS = new Set<AgentComponentTypeEnum>([
  AgentComponentTypeEnum.Plugin,
  AgentComponentTypeEnum.Workflow,
  AgentComponentTypeEnum.Knowledge,
  AgentComponentTypeEnum.MCP,
  AgentComponentTypeEnum.Agent,
]);

/** 判断是否为 AgentFlow 子类型 */
export const isAgentFlowSubType = (subType?: AgentSubTypeEnum): boolean =>
  subType === AgentSubTypeEnum.Flow;

/** 判断是否为 AgentGroup 子类型 */
export const isAgentGroupSubType = (subType?: AgentSubTypeEnum): boolean =>
  subType === AgentSubTypeEnum.Group;

/** 判断是否为自定义智能体子类型 */
export const isAgentCustomSubType = (subType?: AgentSubTypeEnum): boolean =>
  subType === AgentSubTypeEnum.Custom;

export interface AgentFlowArrangePolicy {
  /** 当前是否为设备智能体 */
  isDeviceAgent: boolean;
  /** 当前是否为 AgentFlow */
  isFlow: boolean;
  /** 是否展示 plan 区（系统提示词 / AgentFlow 画布） */
  showPlanSection: boolean;
  /** 是否展示整块「工具」区（插件 / 工作流 / MCP） */
  showToolsSection: boolean;
  /** 是否展示整块「知识」区 */
  showKnowledgeSection: boolean;
  /** 是否展示整块「技能」区（AgentFlow / AgentGroup 不展示） */
  showSkillSection: boolean;
  /** 是否展示整块「组员」区（仅 AgentGroup / 设备智能体） */
  showGroupMembersSection: boolean;
  /** 群组智能体下仍展示工具/知识区（设备智能体为 true） */
  bypassGroupSubTypeToolKnowledgeHide: boolean;
  /** 是否展示整块「记忆」区 */
  showMemorySection: boolean;
  /** 是否展示整块「对话体验」区 */
  showExperienceSection: boolean;
  /** 是否展示整块「界面配置」区 */
  showPageSection: boolean;
  /** 是否展示「子智能体」折叠项 */
  showSubAgent: boolean;
  /** 记忆区是否展示「变量」 */
  showMemoryVariable: boolean;
  /** 是否展示「长期记忆」折叠项 */
  showLongMemory: boolean;
  /** 记忆区是否展示「版本管理」 */
  showVersionControl: boolean;
  /** 是否展示「允许用户选择自有模型」 */
  showAllowOtherModel: boolean;
  /** 是否展示「允许用户在对话框中选择模式」(agentMode) */
  showAllowChooseMode: boolean;
  /** 是否展示「用户问题建议」 */
  showUserProblemSuggestion: boolean;
  /** 是否展示「允许用户@技能」 */
  showAllowAtSkill: boolean;
  /** 是否展示「允许用户选择个人电脑」 */
  showAllowPrivateSandbox: boolean;
  /** 是否展示「允许询问用户」 */
  showEnableAskQuestion: boolean;
  /** 是否展示「Hook 设置」（AgentFlow / 自定义智能体不展示） */
  showHook: boolean;
  /** 工具区是否展示「工作流」折叠项 */
  showWorkflowTool: boolean;
  /**
   * 记忆区是否展示「数据表」折叠项
   * @param isGroupSubType 是否为群组智能体（群组同样不展示数据表）
   */
  showDataTableSection: (isGroupSubType: boolean) => boolean;
  /** 工具折叠列表 filter：是否保留该项 */
  keepToolCollapseItem: (key: AgentArrangeConfigEnum) => boolean;
  /** TaskAgent「添加」弹窗中，该 Tab 是否可见（不含 Agent Tab 的通用排除） */
  isTaskAgentCreatedTabVisible: (tabKey: AgentComponentTypeEnum) => boolean;
}

// 设备智能体编排策略
const getDeviceAgentArrangePolicy = (): AgentFlowArrangePolicy => ({
  isDeviceAgent: true,
  isFlow: false,
  showPlanSection: false,
  showToolsSection: true,
  showKnowledgeSection: true,
  showSkillSection: false,
  showGroupMembersSection: true,
  bypassGroupSubTypeToolKnowledgeHide: true,
  showMemorySection: true,
  showExperienceSection: true,
  showPageSection: false,
  showSubAgent: false,
  showMemoryVariable: false,
  showLongMemory: true,
  showVersionControl: false,
  showAllowOtherModel: true,
  showAllowChooseMode: false,
  showUserProblemSuggestion: true,
  showAllowAtSkill: false,
  showAllowPrivateSandbox: false,
  showEnableAskQuestion: false,
  showHook: false,
  showWorkflowTool: true,
  showDataTableSection: () => false,
  keepToolCollapseItem: (key) => DEVICE_AGENT_TOOL_KEYS.has(key),
  isTaskAgentCreatedTabVisible: (tabKey) =>
    DEVICE_AGENT_CREATED_TABS.has(tabKey),
});

/**
 * 根据智能体 subType / 是否设备智能体 生成编排策略
 * @param subType 智能体子类型
 * @param isDeviceAgent 是否为设备智能体（extra.isDeviceAgent === true）
 */
export const getAgentFlowArrangePolicy = (
  subType?: AgentSubTypeEnum,
  isDeviceAgent?: boolean,
): AgentFlowArrangePolicy => {
  if (isDeviceAgent) {
    return getDeviceAgentArrangePolicy();
  }

  const isFlow = isAgentFlowSubType(subType);
  const isGroup = isAgentGroupSubType(subType);
  const isCustom = isAgentCustomSubType(subType);
  const showAllowChooseMode =
    subType === AgentSubTypeEnum.General ||
    subType === AgentSubTypeEnum.Flow ||
    isGroup ||
    subType === AgentSubTypeEnum.Custom;

  return {
    isDeviceAgent: false,
    isFlow,
    showPlanSection: true,
    showToolsSection: !isFlow,
    showKnowledgeSection: !isFlow,
    showSkillSection: !isFlow && !isGroup,
    showGroupMembersSection: isGroup,
    bypassGroupSubTypeToolKnowledgeHide: false,
    showMemorySection: true,
    showExperienceSection: true,
    showPageSection: true,
    showSubAgent: !isFlow,
    showMemoryVariable: true,
    showLongMemory: !isFlow,
    showVersionControl: true,
    showAllowOtherModel: !isFlow && !isGroup,
    showAllowChooseMode,
    showUserProblemSuggestion: true,
    showAllowAtSkill: true,
    showAllowPrivateSandbox: true,
    showEnableAskQuestion: true,
    showHook: !isFlow && !isCustom,
    showWorkflowTool: !isFlow,
    showDataTableSection: (isGroupSubType) => !isGroupSubType && !isFlow,
    keepToolCollapseItem: (key) =>
      !(isFlow && key === AgentArrangeConfigEnum.Workflow),
    isTaskAgentCreatedTabVisible: (tabKey) =>
      !isFlow || !HIDDEN_COMPONENT_TYPES.has(tabKey),
  };
};
