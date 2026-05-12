/**
 * ExtensionRegistry 单元测试
 */
import { NodeTypeEnum } from '@/types/enums/common';
import { describe, expect, it, vi } from 'vitest';
import { extensionRegistry } from '../registry';
import type { BranchNodeHandler } from '../types';

const createMockHandler = (nodeType: NodeTypeEnum): BranchNodeHandler => ({
  nodeType,
  parseSourcePort: vi.fn(),
  updateConnection: vi.fn(),
});

describe('ExtensionRegistry', () => {
  it('should register and retrieve a handler', () => {
    const handler = createMockHandler(NodeTypeEnum.EvalGate);
    extensionRegistry.register(handler);

    const retrieved = extensionRegistry.get(NodeTypeEnum.EvalGate);
    expect(retrieved).toBe(handler);
  });

  it('should return undefined for unregistered node type', () => {
    const retrieved = extensionRegistry.get(NodeTypeEnum.LLM);
    expect(retrieved).toBeUndefined();
  });

  it('should overwrite handler for same node type', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handler1 = createMockHandler(NodeTypeEnum.HumanInteraction);
    const handler2 = createMockHandler(NodeTypeEnum.HumanInteraction);

    extensionRegistry.register(handler1);
    extensionRegistry.register(handler2);

    expect(warnSpy).toHaveBeenCalledWith(
      '[ExtensionRegistry] Overwriting handler for HumanInteraction',
    );
    expect(extensionRegistry.get(NodeTypeEnum.HumanInteraction)).toBe(handler2);

    warnSpy.mockRestore();
  });

  it('should support multiple node types', () => {
    const evalHandler = createMockHandler(NodeTypeEnum.EvalGate);
    const hitlHandler = createMockHandler(NodeTypeEnum.HumanInteraction);

    extensionRegistry.register(evalHandler);
    extensionRegistry.register(hitlHandler);

    expect(extensionRegistry.get(NodeTypeEnum.EvalGate)).toBe(evalHandler);
    expect(extensionRegistry.get(NodeTypeEnum.HumanInteraction)).toBe(
      hitlHandler,
    );
  });
});
