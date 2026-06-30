import { AgentSubTypeEnum } from '@/types/enums/space';
import { describe, expect, it } from 'vitest';
import { getAgentFlowArrangePolicy } from '../arrangePolicy';

describe('getAgentFlowArrangePolicy', () => {
  it('自定义智能体不展示 Hook 设置', () => {
    expect(getAgentFlowArrangePolicy(AgentSubTypeEnum.Custom).showHook).toBe(
      false,
    );
  });

  it('AgentFlow 不展示 Hook 设置', () => {
    expect(getAgentFlowArrangePolicy(AgentSubTypeEnum.Flow).showHook).toBe(
      false,
    );
  });

  it('通用型智能体展示 Hook 设置', () => {
    expect(getAgentFlowArrangePolicy(AgentSubTypeEnum.General).showHook).toBe(
      true,
    );
  });
});
