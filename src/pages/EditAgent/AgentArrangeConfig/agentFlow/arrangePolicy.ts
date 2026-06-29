/**
 * AgentFlow 编排配置策略
 *
 * AgentFlow 的编排即画布本身，不支持外挂插件/MCP/工作流/知识库/数据表等组件。
 * 本模块集中维护 AgentFlow 在 AgentArrangeConfig 中的展示/隐藏规则，避免业务页散落条件判断。
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

/** 判断是否为 AgentFlow 子类型 */
export const isAgentFlowSubType = (subType?: AgentSubTypeEnum): boolean =>
  subType === AgentSubTypeEnum.Flow;

export interface AgentFlowArrangePolicy {
  /** 当前是否为 AgentFlow */
  isFlow: boolean;
  /** 是否展示整块「工具」区（插件 / 工作流 / MCP） */
  showToolsSection: boolean;
  /** 是否展示整块「知识」区 */
  showKnowledgeSection: boolean;
  /** 是否展示整块「技能」区 */
  showSkillSection: boolean;
  /** 是否展示「子智能体」折叠项 */
  showSubAgent: boolean;
  /** 是否展示「长期记忆」折叠项 */
  showLongMemory: boolean;
  /** 是否展示「允许用户选择自有模型」 */
  showAllowOtherModel: boolean;
  /** 是否展示「Hook 设置」 */
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

/**
 * 根据智能体 subType 生成 AgentFlow 编排策略
 * @param subType 智能体子类型
 */
export const getAgentFlowArrangePolicy = (
  subType?: AgentSubTypeEnum,
): AgentFlowArrangePolicy => {
  const isFlow = isAgentFlowSubType(subType);

  return {
    isFlow,
    showToolsSection: !isFlow,
    showKnowledgeSection: !isFlow,
    showSkillSection: !isFlow,
    showSubAgent: !isFlow,
    showLongMemory: !isFlow,
    showAllowOtherModel: !isFlow,
    showHook: !isFlow,
    showWorkflowTool: !isFlow,
    showDataTableSection: (isGroupSubType) => !isGroupSubType && !isFlow,
    keepToolCollapseItem: (key) =>
      !(isFlow && key === AgentArrangeConfigEnum.Workflow),
    isTaskAgentCreatedTabVisible: (tabKey) =>
      !isFlow || !HIDDEN_COMPONENT_TYPES.has(tabKey),
  };
};
