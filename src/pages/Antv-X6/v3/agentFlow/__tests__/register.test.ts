/**
 * registerAgentFlowHandlers 注册入口单元测试
 */
import { NodeTypeEnum } from '@/types/enums/common';
import { describe, expect, it } from 'vitest';
import { extensionRegistry } from '../../extensions/registry';
import { registerAgentFlowHandlers } from '../register';

describe('registerAgentFlowHandlers', () => {
  it('should register both handlers in the extension registry', () => {
    registerAgentFlowHandlers();

    const evalHandler = extensionRegistry.get(NodeTypeEnum.EvalGate);
    const hitlHandler = extensionRegistry.get(NodeTypeEnum.HumanInteraction);

    expect(evalHandler).toBeDefined();
    expect(evalHandler!.nodeType).toBe(NodeTypeEnum.EvalGate);
    expect(hitlHandler).toBeDefined();
    expect(hitlHandler!.nodeType).toBe(NodeTypeEnum.HumanInteraction);
  });

  it('should be idempotent — calling twice does not change registry', () => {
    const evalBefore = extensionRegistry.get(NodeTypeEnum.EvalGate);
    const hitlBefore = extensionRegistry.get(NodeTypeEnum.HumanInteraction);

    registerAgentFlowHandlers();

    const evalAfter = extensionRegistry.get(NodeTypeEnum.EvalGate);
    const hitlAfter = extensionRegistry.get(NodeTypeEnum.HumanInteraction);

    expect(evalAfter).toBe(evalBefore);
    expect(hitlAfter).toBe(hitlBefore);
  });

  it('should not register handlers for non-AgentFlow node types', () => {
    registerAgentFlowHandlers();

    expect(extensionRegistry.get(NodeTypeEnum.Start)).toBeUndefined();
    expect(extensionRegistry.get(NodeTypeEnum.LLM)).toBeUndefined();
    expect(extensionRegistry.get(NodeTypeEnum.Condition)).toBeUndefined();
  });
});
