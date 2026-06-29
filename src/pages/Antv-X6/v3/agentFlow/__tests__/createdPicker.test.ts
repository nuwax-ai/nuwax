import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentSubTypeEnum, AgentTypeEnum } from '@/types/enums/space';
import { describe, expect, it } from 'vitest';
import {
  isAgentFlowSelectableAgent,
  normalizePublishedAgentSubType,
  resolveAgentFlowCreatedModalTabs,
} from '../createdPicker';

describe('createdPicker', () => {
  const workflowTabs = [
    { label: 'Plugin', key: AgentComponentTypeEnum.Plugin },
    { label: 'Workflow', key: AgentComponentTypeEnum.Workflow },
    { label: 'Agent', key: AgentComponentTypeEnum.Agent },
  ];

  it('非 AgentFlow 时保持原 tabs', () => {
    expect(
      resolveAgentFlowCreatedModalTabs(
        false,
        AgentComponentTypeEnum.Workflow,
        workflowTabs,
      ),
    ).toBe(workflowTabs);
  });

  it('AgentFlow 添加工作流节点仅展示工作流 Tab', () => {
    const tabs = resolveAgentFlowCreatedModalTabs(
      true,
      AgentComponentTypeEnum.Workflow,
      workflowTabs,
    );
    expect(tabs).toHaveLength(1);
    expect(tabs[0].key).toBe(AgentComponentTypeEnum.Workflow);
  });

  it('AgentFlow 添加智能体节点仅展示智能体 Tab', () => {
    const tabs = resolveAgentFlowCreatedModalTabs(
      true,
      AgentComponentTypeEnum.Agent,
      workflowTabs,
    );
    expect(tabs).toHaveLength(1);
    expect(tabs[0].key).toBe(AgentComponentTypeEnum.Agent);
  });

  describe('normalizePublishedAgentSubType', () => {
    it('优先识别合法 subType', () => {
      expect(
        normalizePublishedAgentSubType({
          subType: AgentSubTypeEnum.Custom,
        } as any),
      ).toBe(AgentSubTypeEnum.Custom);
    });

    it('无效 subType 时回退 targetSubType / agentType', () => {
      expect(
        normalizePublishedAgentSubType({
          subType: 'invalid',
          targetSubType: 'ChatBot',
        } as any),
      ).toBe(AgentSubTypeEnum.ChatBot);
      expect(
        normalizePublishedAgentSubType({
          subType: '',
          agentType: 'ChatBot',
        } as any),
      ).toBe(AgentSubTypeEnum.ChatBot);
      expect(
        normalizePublishedAgentSubType({
          type: AgentTypeEnum.ChatBot,
        } as any),
      ).toBe(AgentSubTypeEnum.ChatBot);
    });

    it('TaskAgent 无 subType 时视为 General', () => {
      expect(
        normalizePublishedAgentSubType({ agentType: 'TaskAgent' } as any),
      ).toBe(AgentSubTypeEnum.General);
    });
  });

  it('仅 ChatBot / General / Custom 可被 AgentFlow 智能体节点选中', () => {
    expect(
      isAgentFlowSelectableAgent({
        targetSubType: 'ChatBot',
      } as any),
    ).toBe(true);
    expect(
      isAgentFlowSelectableAgent({
        agentType: 'ChatBot',
      } as any),
    ).toBe(true);
    expect(
      isAgentFlowSelectableAgent({
        subType: AgentSubTypeEnum.General,
      } as any),
    ).toBe(true);
    expect(
      isAgentFlowSelectableAgent({
        subType: AgentSubTypeEnum.Custom,
      } as any),
    ).toBe(true);
    expect(
      isAgentFlowSelectableAgent({
        subType: AgentSubTypeEnum.Group,
      } as any),
    ).toBe(false);
    expect(
      isAgentFlowSelectableAgent({
        subType: AgentSubTypeEnum.Flow,
      } as any),
    ).toBe(false);
    expect(
      isAgentFlowSelectableAgent({
        agentType: 'AgentFlow',
      } as any),
    ).toBe(false);
  });
});
