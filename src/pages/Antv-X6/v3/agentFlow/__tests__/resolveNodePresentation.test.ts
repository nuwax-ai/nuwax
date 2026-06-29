import { describe, expect, it } from 'vitest';
import { resolveAgentFlowWorkflowNodeDescription } from '../resolveNodePresentation';

describe('resolveAgentFlowWorkflowNodeDescription', () => {
  it('优先使用非空描述', () => {
    expect(
      resolveAgentFlowWorkflowNodeDescription('工作流A', '  查询商品  '),
    ).toBe('查询商品');
  });

  it('描述为空时回退到节点名称', () => {
    expect(resolveAgentFlowWorkflowNodeDescription('测试工作流专用', '')).toBe(
      '测试工作流专用',
    );
  });

  it('名称与描述均为空时返回默认文案', () => {
    expect(resolveAgentFlowWorkflowNodeDescription('', '')).toContain('工作流');
  });
});
