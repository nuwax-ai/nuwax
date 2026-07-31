import { AgentSubTypeEnum } from '@/types/enums/space';
import { describe, expect, it } from 'vitest';
import { getAgentFlowArrangePolicy } from '../arrangePolicy';

/** 非设备智能体：整块区域默认全部展示（与改前一致） */
const expectDefaultSectionVisibility = (
  policy: ReturnType<typeof getAgentFlowArrangePolicy>,
) => {
  expect(policy.isDeviceAgent).toBe(false);
  expect(policy.showPlanSection).toBe(true);
  expect(policy.showMemorySection).toBe(true);
  expect(policy.showExperienceSection).toBe(true);
  expect(policy.showPageSection).toBe(true);
  expect(policy.showMemoryVariable).toBe(true);
  expect(policy.showVersionControl).toBe(true);
  expect(policy.showUserProblemSuggestion).toBe(true);
  expect(policy.showAllowAtSkill).toBe(true);
  expect(policy.showAllowPrivateSandbox).toBe(true);
  expect(policy.showEnableAskQuestion).toBe(true);
  expect(policy.bypassGroupSubTypeToolKnowledgeHide).toBe(false);
};

describe('getAgentFlowArrangePolicy', () => {
  it('仅 extra.isDeviceAgent === true 时走设备策略', () => {
    expect(
      getAgentFlowArrangePolicy(AgentSubTypeEnum.General).isDeviceAgent,
    ).toBe(false);
    expect(
      getAgentFlowArrangePolicy(AgentSubTypeEnum.General, false).isDeviceAgent,
    ).toBe(false);
    expect(
      getAgentFlowArrangePolicy(AgentSubTypeEnum.Flow, true).isDeviceAgent,
    ).toBe(true);
  });

  it('自定义智能体不展示 Hook 设置', () => {
    const policy = getAgentFlowArrangePolicy(AgentSubTypeEnum.Custom);
    expectDefaultSectionVisibility(policy);
    expect(policy.showHook).toBe(false);
    expect(policy.showAllowChooseMode).toBe(true);
  });

  it('AgentFlow 不展示 Hook 设置', () => {
    const policy = getAgentFlowArrangePolicy(AgentSubTypeEnum.Flow);
    expectDefaultSectionVisibility(policy);
    expect(policy.showHook).toBe(false);
    expect(policy.showToolsSection).toBe(false);
    expect(policy.showKnowledgeSection).toBe(false);
    expect(policy.showSkillSection).toBe(false);
    expect(policy.showLongMemory).toBe(false);
    expect(policy.showAllowOtherModel).toBe(false);
    expect(policy.showAllowChooseMode).toBe(true);
  });

  it('通用型智能体展示 Hook 设置', () => {
    const policy = getAgentFlowArrangePolicy(AgentSubTypeEnum.General);
    expectDefaultSectionVisibility(policy);
    expect(policy.showHook).toBe(true);
    expect(policy.showToolsSection).toBe(true);
    expect(policy.showKnowledgeSection).toBe(true);
    expect(policy.showSkillSection).toBe(true);
    expect(policy.showGroupMembersSection).toBe(false);
    expect(policy.showLongMemory).toBe(true);
    expect(policy.showAllowOtherModel).toBe(true);
    expect(policy.showAllowChooseMode).toBe(true);
  });

  it('AgentGroup 展示组员区且不展示技能/选模型', () => {
    const policy = getAgentFlowArrangePolicy(AgentSubTypeEnum.Group);
    expectDefaultSectionVisibility(policy);
    expect(policy.showGroupMembersSection).toBe(true);
    expect(policy.showSkillSection).toBe(false);
    expect(policy.showAllowOtherModel).toBe(false);
    expect(policy.showAllowChooseMode).toBe(true);
    expect(policy.showDataTableSection(true)).toBe(false);
  });

  it('设备智能体仅展示指定编排项', () => {
    const policy = getAgentFlowArrangePolicy(undefined, true);
    expect(policy.isDeviceAgent).toBe(true);
    expect(policy.showPlanSection).toBe(false);
    expect(policy.showToolsSection).toBe(true);
    expect(policy.showSkillSection).toBe(false);
    expect(policy.showKnowledgeSection).toBe(true);
    expect(policy.showGroupMembersSection).toBe(true);
    expect(policy.showLongMemory).toBe(true);
    expect(policy.showAllowOtherModel).toBe(true);
    expect(policy.showAllowChooseMode).toBe(true);
    expect(policy.showPageSection).toBe(false);
    expect(policy.showMemoryVariable).toBe(false);
    expect(policy.showUserProblemSuggestion).toBe(true);
  });
});
