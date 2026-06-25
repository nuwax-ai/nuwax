/**
 * registerAgentFlowHandlers 注册入口单元测试
 */
import { NodeTypeEnum } from '@/types/enums/common';
import { describe, expect, it } from 'vitest';
import { extensionRegistry } from '../../extensions/registry';
import { registerAgentFlowHandlers } from '../register';

describe('registerAgentFlowHandlers', () => {
  it('should register the HumanInteraction and RouteDecision handlers in the extension registry', () => {
    registerAgentFlowHandlers();

    const hitlHandler = extensionRegistry.get(NodeTypeEnum.HumanInteraction);
    const routeHandler = extensionRegistry.get(NodeTypeEnum.RouteDecision);

    expect(hitlHandler).toBeDefined();
    expect(hitlHandler!.nodeType).toBe(NodeTypeEnum.HumanInteraction);
    expect(routeHandler).toBeDefined();
    expect(routeHandler!.nodeType).toBe(NodeTypeEnum.RouteDecision);
  });

  it('should be idempotent — calling twice does not change registry', () => {
    const hitlBefore = extensionRegistry.get(NodeTypeEnum.HumanInteraction);
    const routeBefore = extensionRegistry.get(NodeTypeEnum.RouteDecision);

    registerAgentFlowHandlers();

    const hitlAfter = extensionRegistry.get(NodeTypeEnum.HumanInteraction);
    const routeAfter = extensionRegistry.get(NodeTypeEnum.RouteDecision);

    expect(hitlAfter).toBe(hitlBefore);
    expect(routeAfter).toBe(routeBefore);
  });

  it('should not register handlers for non-AgentFlow node types', () => {
    registerAgentFlowHandlers();

    expect(extensionRegistry.get(NodeTypeEnum.Start)).toBeUndefined();
    expect(extensionRegistry.get(NodeTypeEnum.LLM)).toBeUndefined();
    expect(extensionRegistry.get(NodeTypeEnum.Condition)).toBeUndefined();
  });
});
