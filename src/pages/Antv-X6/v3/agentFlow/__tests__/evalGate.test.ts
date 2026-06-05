/**
 * EvalGate 分支处理器单元测试
 */
import { EvalValidatorTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import type { PortConfig } from '@/types/interfaces/node';
import { describe, expect, it } from 'vitest';
import { SpecialPortType } from '../../types/enums';
import { evalGateHandler } from '../handlers/evalGate';

// ========== 测试数据 ==========

const createEvalGateNode = (overrides: Partial<ChildNode> = {}): ChildNode => ({
  id: 10,
  type: NodeTypeEnum.EvalGate,
  name: 'EvalGate',
  description: '',
  workflowId: 1,
  shape: 'custom-react' as any,
  icon: '',
  nextNodeIds: [],
  nodeConfig: {
    passNextNodeIds: [],
    evalValidators: [
      {
        uuid: 'v1-uuid',
        name: 'Check A',
        type: EvalValidatorTypeEnum.Rule,
        onFail: { targetNodeId: undefined, appendPrompt: '', reason: '' },
      },
      {
        uuid: 'v2-uuid',
        name: 'Check B',
        type: EvalValidatorTypeEnum.Rule,
        onFail: { targetNodeId: undefined, appendPrompt: '', reason: '' },
      },
    ],
  },
  ...overrides,
});

const mockGeneratePortConfig = (config: PortConfig) => ({
  id: `test-${config.idSuffix}`,
  group: config.group,
  zIndex: 99,
  magnet: true,
  args: {
    x: config.xWidth ?? 200,
    y: config.yHeight ?? 16,
    offsetY: config.offsetY ?? 32,
    offsetX: config.offsetX ?? (config.idSuffix === 'in' ? 0 : 200),
  },
});

const ctx = { generatePortConfig: mockGeneratePortConfig };

// ========== 测试用例 ==========

describe('EvalGate Handler', () => {
  describe('generatePorts', () => {
    it('should generate input port, pass port, and fail ports for each validator', () => {
      const node = createEvalGateNode();
      const result = evalGateHandler.generatePorts!(node, ctx);

      expect(result).not.toBeNull();
      expect(result!.inputPorts).toHaveLength(1);
      expect(result!.outputPorts).toHaveLength(3); // pass + 2 fail
    });

    it('should create eval-pass-out port', () => {
      const node = createEvalGateNode();
      const result = evalGateHandler.generatePorts!(node, ctx);

      const passPort = result!.outputPorts[0];
      expect(passPort.id).toContain('eval-pass-out');
    });

    it('should create eval-fail ports with validator UUIDs', () => {
      const node = createEvalGateNode();
      const result = evalGateHandler.generatePorts!(node, ctx);

      const fail1 = result!.outputPorts[1];
      const fail2 = result!.outputPorts[2];
      expect(fail1.id).toContain('eval-fail-v1-uuid-out');
      expect(fail2.id).toContain('eval-fail-v2-uuid-out');
    });

    it('should handle empty validators (only pass port)', () => {
      const node = createEvalGateNode({
        nodeConfig: { passNextNodeIds: [], evalValidators: [] },
      });
      const result = evalGateHandler.generatePorts!(node, ctx);

      expect(result!.outputPorts).toHaveLength(1); // only pass
      expect(result!.outputPorts[0].id).toContain('eval-pass-out');
    });
  });

  describe('parseSourcePort', () => {
    it('should detect eval-pass port', () => {
      const node = createEvalGateNode();
      const result = evalGateHandler.parseSourcePort!(node, '10-eval-pass-out');

      expect(result).not.toBeNull();
      expect(result!.type).toBe(SpecialPortType.EvalGatePass);
    });

    it('should detect eval-fail port and extract uuid', () => {
      const node = createEvalGateNode();
      const result = evalGateHandler.parseSourcePort!(
        node,
        '10-eval-fail-v1-uuid-out',
      );

      expect(result).not.toBeNull();
      expect(result!.type).toBe(SpecialPortType.EvalGateFail);
      expect(result!.uuid).toBe('v1-uuid');
    });

    it('should return null for normal port', () => {
      const node = createEvalGateNode();
      const result = evalGateHandler.parseSourcePort!(node, '10-out');

      expect(result).toBeNull();
    });

    it('should handle port from different node id', () => {
      const node = createEvalGateNode({ id: 99 });
      const result = evalGateHandler.parseSourcePort!(node, '99-eval-pass-out');

      expect(result?.type).toBe(SpecialPortType.EvalGatePass);
    });
  });

  describe('updateConnection', () => {
    it('should add to passNextNodeIds', () => {
      const node = createEvalGateNode();
      evalGateHandler.updateConnection!(
        node,
        { type: SpecialPortType.EvalGatePass },
        5,
        'add',
      );

      expect((node.nodeConfig as any).passNextNodeIds).toContain(5);
    });

    it('should remove from passNextNodeIds', () => {
      const node = createEvalGateNode({
        nodeConfig: {
          passNextNodeIds: [5, 7],
          evalValidators: [],
        },
      });
      evalGateHandler.updateConnection!(
        node,
        { type: SpecialPortType.EvalGatePass },
        5,
        'remove',
      );

      expect((node.nodeConfig as any).passNextNodeIds).toEqual([7]);
    });

    it('should not add duplicate to passNextNodeIds', () => {
      const node = createEvalGateNode({
        nodeConfig: {
          passNextNodeIds: [5],
          evalValidators: [],
        },
      });
      evalGateHandler.updateConnection!(
        node,
        { type: SpecialPortType.EvalGatePass },
        5,
        'add',
      );

      expect((node.nodeConfig as any).passNextNodeIds).toEqual([5]);
    });

    it('should set onFail.targetNodeId for eval-fail', () => {
      const node = createEvalGateNode();
      evalGateHandler.updateConnection!(
        node,
        { type: SpecialPortType.EvalGateFail, uuid: 'v1-uuid' },
        8,
        'add',
      );

      const v = (node.nodeConfig as any).evalValidators.find(
        (v: any) => v.uuid === 'v1-uuid',
      );
      expect(v.onFail.targetNodeId).toBe(8);
    });

    it('should clear onFail.targetNodeId on remove', () => {
      const node = createEvalGateNode();
      (node.nodeConfig as any).evalValidators[0].onFail.targetNodeId = 8;
      evalGateHandler.updateConnection!(
        node,
        { type: SpecialPortType.EvalGateFail, uuid: 'v1-uuid' },
        8,
        'remove',
      );

      const v = (node.nodeConfig as any).evalValidators.find(
        (v: any) => v.uuid === 'v1-uuid',
      );
      expect(v.onFail.targetNodeId).toBeUndefined();
    });

    it('should return false for unmatched validator uuid', () => {
      const node = createEvalGateNode();
      const result = evalGateHandler.updateConnection!(
        node,
        { type: SpecialPortType.EvalGateFail, uuid: 'nonexistent' },
        8,
        'add',
      );

      expect(result).toBe(false);
    });
  });

  describe('cleanupNodeReferences', () => {
    it('should remove deleted node from passNextNodeIds', () => {
      const node = createEvalGateNode({
        nodeConfig: {
          passNextNodeIds: [3, 5, 7],
          evalValidators: [],
        },
      });
      evalGateHandler.cleanupNodeReferences!(node, 5);

      expect((node.nodeConfig as any).passNextNodeIds).toEqual([3, 7]);
    });

    it('should clear onFail targetNodeId if matches deleted node', () => {
      const node = createEvalGateNode();
      (node.nodeConfig as any).evalValidators[0].onFail.targetNodeId = 5;
      evalGateHandler.cleanupNodeReferences!(node, 5);

      expect(
        (node.nodeConfig as any).evalValidators[0].onFail.targetNodeId,
      ).toBeUndefined();
    });

    it('should not affect other validators onFail', () => {
      const node = createEvalGateNode();
      (node.nodeConfig as any).evalValidators[0].onFail.targetNodeId = 5;
      (node.nodeConfig as any).evalValidators[1].onFail.targetNodeId = 6;
      evalGateHandler.cleanupNodeReferences!(node, 5);

      expect(
        (node.nodeConfig as any).evalValidators[1].onFail.targetNodeId,
      ).toBe(6);
    });

    it('should be no-op when nodeConfig is undefined', () => {
      const node = createEvalGateNode({ nodeConfig: undefined as any });
      expect(() =>
        evalGateHandler.cleanupNodeReferences!(node, 5),
      ).not.toThrow();
    });
  });

  describe('initBranchMap', () => {
    it('should create empty map with eval-pass and eval-fail keys', () => {
      const node = createEvalGateNode({
        nodeConfig: {
          passNextNodeIds: [3],
          evalValidators: [
            {
              uuid: 'v1-uuid',
              name: 'A',
              type: EvalValidatorTypeEnum.Rule,
              onFail: { targetNodeId: 5, appendPrompt: '', reason: '' },
            },
          ],
        },
      });
      const map = evalGateHandler.initBranchMap!(node);

      expect(map).not.toBeNull();
      expect(map!.get('eval-pass')).toEqual([]);
      expect(map!.get('eval-fail-v1-uuid')).toEqual([]);
    });

    it('should handle empty passNextNodeIds and no onFail target', () => {
      const node = createEvalGateNode();
      const map = evalGateHandler.initBranchMap!(node);

      expect(map!.get('eval-pass')).toEqual([]);
      expect(map!.get('eval-fail-v1-uuid')).toEqual([]);
    });
  });

  describe('resetBranchData', () => {
    it('should clear passNextNodeIds and validator fail targets', () => {
      const node = createEvalGateNode({
        nodeConfig: {
          passNextNodeIds: [3],
          evalValidators: [
            {
              uuid: 'v1-uuid',
              name: 'A',
              type: EvalValidatorTypeEnum.Rule,
              onFail: { targetNodeId: 5, appendPrompt: '', reason: '' },
            },
          ],
        },
      });

      evalGateHandler.resetBranchData!(node);

      expect((node.nodeConfig as any).passNextNodeIds).toEqual([]);
      expect(
        (node.nodeConfig as any).evalValidators[0].onFail.targetNodeId,
      ).toBeUndefined();
    });
  });

  describe('getBranchKey', () => {
    it('should return eval-pass for EvalGatePass', () => {
      const key = evalGateHandler.getBranchKey!({
        type: SpecialPortType.EvalGatePass,
      });
      expect(key).toBe('eval-pass');
    });

    it('should return eval-fail-{uuid} for EvalGateFail', () => {
      const key = evalGateHandler.getBranchKey!({
        type: SpecialPortType.EvalGateFail,
        uuid: 'v1-uuid',
      });
      expect(key).toBe('eval-fail-v1-uuid');
    });

    it('should return undefined for unknown type', () => {
      const key = evalGateHandler.getBranchKey!({
        type: SpecialPortType.Condition,
      });
      expect(key).toBeUndefined();
    });
  });

  describe('mergeBranchData', () => {
    it('should write passNextNodeIds and onFail back to node config', () => {
      const node = createEvalGateNode();
      const branchMap = new Map<string, number[]>();
      branchMap.set('eval-pass', [3, 4]);
      branchMap.set('eval-fail-v1-uuid', [5]);
      branchMap.set('eval-fail-v2-uuid', []);

      evalGateHandler.mergeBranchData!(node, branchMap);

      expect((node.nodeConfig as any).passNextNodeIds).toEqual([3, 4]);
      expect(
        (node.nodeConfig as any).evalValidators[0].onFail.targetNodeId,
      ).toBe(5);
      expect(
        (node.nodeConfig as any).evalValidators[1].onFail.targetNodeId,
      ).toBeUndefined();
    });

    /**
     * 负面 / 边界：fail 端口语义为 scalar 单值（文档约定）
     * 即使 branchMap 里 eval-fail-* key 推入了多个 id，merge 时也只取 [0]
     * 与 updateConnection 的覆盖式写入行为保持一致
     */
    it('should only keep first id for fail branchMap (scalar targetNodeId)', () => {
      const node = createEvalGateNode();
      const branchMap = new Map<string, number[]>();
      branchMap.set('eval-pass', []);
      branchMap.set('eval-fail-v1-uuid', [5, 7, 9]);

      evalGateHandler.mergeBranchData!(node, branchMap);

      expect(
        (node.nodeConfig as any).evalValidators[0].onFail.targetNodeId,
      ).toBe(5);
      // 防御性：明确 targetNodeId 仍是 scalar，不是 array
      expect(
        Array.isArray(
          (node.nodeConfig as any).evalValidators[0].onFail.targetNodeId,
        ),
      ).toBe(false);
    });
  });

  describe('isSpecialBranchNode', () => {
    it('should always return true', () => {
      const node = createEvalGateNode();
      expect(evalGateHandler.isSpecialBranchNode!(node)).toBe(true);
    });
  });

  describe('handleSpecialNextIndex', () => {
    it('should add to eval-pass nextNodeIds', () => {
      const node = createEvalGateNode();
      const result = evalGateHandler.handleSpecialNextIndex!(
        node,
        '10-eval-pass-out',
        20,
      );

      expect(result).not.toBeNull();
      expect((result!.nodeConfig as any).passNextNodeIds).toContain(20);
    });

    it('should replace target in eval-pass nextNodeIds', () => {
      const node = createEvalGateNode({
        nodeConfig: {
          passNextNodeIds: [3],
          evalValidators: [],
        },
      });
      const targetNode = { id: 3 } as ChildNode;
      const result = evalGateHandler.handleSpecialNextIndex!(
        node,
        '10-eval-pass-out',
        20,
        targetNode,
      );

      expect((result!.nodeConfig as any).passNextNodeIds).toEqual([20]);
    });

    it('should add to eval-fail onFail targetNodeId', () => {
      const node = createEvalGateNode();
      const result = evalGateHandler.handleSpecialNextIndex!(
        node,
        '10-eval-fail-v1-uuid-out',
        20,
      );

      const v = (result!.nodeConfig as any).evalValidators.find(
        (v: any) => v.uuid === 'v1-uuid',
      );
      expect(v.onFail.targetNodeId).toBe(20);
    });

    it('should clear eval-fail onFail when target matches replacement', () => {
      const node = createEvalGateNode();
      (node.nodeConfig as any).evalValidators[0].onFail.targetNodeId = 3;
      const targetNode = { id: 3 } as ChildNode;
      const result = evalGateHandler.handleSpecialNextIndex!(
        node,
        '10-eval-fail-v1-uuid-out',
        3,
        targetNode,
      );

      const v = (result!.nodeConfig as any).evalValidators.find(
        (v: any) => v.uuid === 'v1-uuid',
      );
      expect(v.onFail.targetNodeId).toBeUndefined();
    });

    it('should not mutate the original node', () => {
      const node = createEvalGateNode();
      const originalPassIds = [...(node.nodeConfig as any).passNextNodeIds];
      evalGateHandler.handleSpecialNextIndex!(node, '10-eval-pass-out', 20);

      expect((node.nodeConfig as any).passNextNodeIds).toEqual(originalPassIds);
    });

    it('should return null-like (original unchanged) for unknown port', () => {
      const node = createEvalGateNode();
      const result = evalGateHandler.handleSpecialNextIndex!(
        node,
        '10-unknown',
        20,
      );

      // returns the node spread but without meaningful changes
      expect(result).not.toBeNull();
    });
  });
});
