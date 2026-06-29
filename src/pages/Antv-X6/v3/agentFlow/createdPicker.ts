/**
 * AgentFlow 场景下 Created 选择弹窗策略
 *
 * 仅由 WorkflowLayout 在 isAgentFlow 时引用，不影响普通 Workflow。
 */

import { CREATED_TABS } from '@/constants/common.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentSubTypeEnum, AgentTypeEnum } from '@/types/enums/space';
import type { CreatedNodeItem } from '@/types/interfaces/common';

type CreatedTab = { label: string; key: AgentComponentTypeEnum };

/** AgentFlow 添加节点时 Created 顶部 Tab：智能体 / 工作流仅展示对应单一 Tab */
export function resolveAgentFlowCreatedModalTabs(
  isAgentFlow: boolean,
  createdItem: AgentComponentTypeEnum,
  workflowCreatedTabs: CreatedTab[],
): CreatedTab[] {
  if (!isAgentFlow) {
    return workflowCreatedTabs;
  }
  if (createdItem === AgentComponentTypeEnum.Agent) {
    return CREATED_TABS.filter(
      (item) => item.key === AgentComponentTypeEnum.Agent,
    );
  }
  if (createdItem === AgentComponentTypeEnum.Workflow) {
    return CREATED_TABS.filter(
      (item) => item.key === AgentComponentTypeEnum.Workflow,
    );
  }
  return workflowCreatedTabs;
}

type PublishedAgentItem = CreatedNodeItem & {
  subType?: string;
  /** 已发布列表常用：ChatBot / PageApp / TaskAgent / AgentFlow */
  agentType?: string;
};

const AGENT_SUB_TYPE_VALUES = new Set<string>(Object.values(AgentSubTypeEnum));

/** AgentFlow 智能体节点可选子类型：ChatBot / General / Custom */
const AGENT_FLOW_SELECTABLE_SUB_TYPES = new Set<string>([
  AgentSubTypeEnum.ChatBot,
  AgentSubTypeEnum.General,
  AgentSubTypeEnum.Custom,
]);

function isKnownAgentSubType(value: string): value is AgentSubTypeEnum {
  return AGENT_SUB_TYPE_VALUES.has(value);
}

/**
 * 将已发布智能体列表项归一为 AgentSubTypeEnum。
 *
 * 列表接口字段不统一：subType / targetSubType / agentType / type 可能混用；
 * 不能简单 `subType ?? targetSubType`，无效 subType 会挡住后面的 ChatBot 标识。
 */
export function normalizePublishedAgentSubType(
  item: PublishedAgentItem,
): AgentSubTypeEnum | undefined {
  const rawSubType =
    typeof item.subType === 'string' ? item.subType.trim() : '';
  if (rawSubType && isKnownAgentSubType(rawSubType)) {
    return rawSubType;
  }

  if (item.targetSubType === 'ChatBot') {
    return AgentSubTypeEnum.ChatBot;
  }

  const topLevelType = (item as { type?: string }).type;
  const agentType = item.agentType ?? topLevelType;

  if (agentType === AgentTypeEnum.ChatBot || agentType === 'ChatBot') {
    return AgentSubTypeEnum.ChatBot;
  }
  if (agentType === AgentTypeEnum.TaskAgent || agentType === 'TaskAgent') {
    if (rawSubType === AgentSubTypeEnum.Custom) {
      return AgentSubTypeEnum.Custom;
    }
    return AgentSubTypeEnum.General;
  }
  if (agentType === AgentTypeEnum.AgentFlow || agentType === 'AgentFlow') {
    return AgentSubTypeEnum.Flow;
  }
  if (agentType === AgentTypeEnum.AgentGroup || agentType === 'AgentGroup') {
    return AgentSubTypeEnum.Group;
  }

  return undefined;
}

/**
 * AgentFlow「智能体」节点可选范围：当前空间已发布的 ChatBot / General / Custom。
 * 排除 Flow、Group 等形态，避免后端 add 报错。
 */
export function isAgentFlowSelectableAgent(item: CreatedNodeItem): boolean {
  const subType = normalizePublishedAgentSubType(item as PublishedAgentItem);
  if (!subType) {
    return false;
  }
  return AGENT_FLOW_SELECTABLE_SUB_TYPES.has(subType);
}
