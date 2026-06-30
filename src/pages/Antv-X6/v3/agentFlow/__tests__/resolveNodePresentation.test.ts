import { describe, expect, it } from 'vitest';
import {
  resolveAgentFlowWorkflowNodeDescription,
  resolveNodeDescriptionWithNameFallback,
} from '../resolveNodePresentation';

describe('resolveNodeDescriptionWithNameFallback', () => {
  it('描述为空时回退到名称', () => {
    expect(resolveNodeDescriptionWithNameFallback('产品知识库', '')).toBe(
      '产品知识库',
    );
  });

  it('名称与描述均为空时返回空字符串', () => {
    expect(resolveNodeDescriptionWithNameFallback('', '')).toBe('');
  });
});

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
