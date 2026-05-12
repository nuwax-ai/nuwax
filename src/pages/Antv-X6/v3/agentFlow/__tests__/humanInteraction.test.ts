/**
 * HumanInteraction 分支处理器单元测试
 */
import { NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import type { PortConfig } from '@/types/interfaces/node';
import { describe, expect, it } from 'vitest';
import { SpecialPortType } from '../../types/enums';
import { humanInteractionHandler } from '../handlers/humanInteraction';

// ========== 测试数据 ==========

const createHitlNode = (
  hitlMode: 'ask' | 'approve' = 'approve',
): ChildNode => ({
  id: 10,
  type: NodeTypeEnum.HumanInteraction,
  name: 'HumanInteraction',
  description: '',
  workflowId: 1,
  shape: 'custom-react' as any,
  icon: '',
  nextNodeIds: [],
  nodeConfig: {
    hitlMode,
    approveNextNodeIds: [],
    rejectNextNodeIds: [],
  },
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

describe('HumanInteraction Handler', () => {
  describe('generatePorts', () => {
    it('should generate normal out port in ask mode', () => {
      const node = createHitlNode('ask');
      const result = humanInteractionHandler.generatePorts!(node, ctx);

      expect(result).not.toBeNull();
      expect(result!.inputPorts).toHaveLength(1);
      expect(result!.outputPorts).toHaveLength(1);
      expect(result!.outputPorts[0].id).toContain('out');
    });

    it('should generate approve + reject ports in approve mode', () => {
      const node = createHitlNode('approve');
      const result = humanInteractionHandler.generatePorts!(node, ctx);

      expect(result!.outputPorts).toHaveLength(2);
      expect(result!.outputPorts[0].id).toContain('hitl-approve-out');
      expect(result!.outputPorts[1].id).toContain('hitl-reject-out');
    });

    it('should always generate one input port', () => {
      const askResult = humanInteractionHandler.generatePorts!(
        createHitlNode('ask'),
        ctx,
      );
      const approveResult = humanInteractionHandler.generatePorts!(
        createHitlNode('approve'),
        ctx,
      );

      expect(askResult!.inputPorts).toHaveLength(1);
      expect(approveResult!.inputPorts).toHaveLength(1);
    });
  });

  describe('parseSourcePort', () => {
    it('should detect hitl-approve port', () => {
      const node = createHitlNode();
      const result = humanInteractionHandler.parseSourcePort!(
        node,
        '10-hitl-approve-out',
      );

      expect(result).not.toBeNull();
      expect(result!.type).toBe(SpecialPortType.HitlApprove);
    });

    it('should detect hitl-reject port', () => {
      const node = createHitlNode();
      const result = humanInteractionHandler.parseSourcePort!(
        node,
        '10-hitl-reject-out',
      );

      expect(result).not.toBeNull();
      expect(result!.type).toBe(SpecialPortType.HitlReject);
    });

    it('should return null for normal port', () => {
      const node = createHitlNode();
      const result = humanInteractionHandler.parseSourcePort!(node, '10-out');

      expect(result).toBeNull();
    });

    it('should return null for port without hitl pattern', () => {
      const node = createHitlNode();
      const result = humanInteractionHandler.parseSourcePort!(
        node,
        '10-something-else',
      );

      expect(result).toBeNull();
    });
  });

  describe('updateConnection', () => {
    it('should add to approveNextNodeIds', () => {
      const node = createHitlNode();
      humanInteractionHandler.updateConnection!(
        node,
        { type: SpecialPortType.HitlApprove },
        5,
        'add',
      );

      expect((node.nodeConfig as any).approveNextNodeIds).toContain(5);
    });

    it('should add to rejectNextNodeIds', () => {
      const node = createHitlNode();
      humanInteractionHandler.updateConnection!(
        node,
        { type: SpecialPortType.HitlReject },
        5,
        'add',
      );

      expect((node.nodeConfig as any).rejectNextNodeIds).toContain(5);
    });

    it('should remove from approveNextNodeIds', () => {
      const node = createHitlNode();
      (node.nodeConfig as any).approveNextNodeIds = [5, 7];
      humanInteractionHandler.updateConnection!(
        node,
        { type: SpecialPortType.HitlApprove },
        5,
        'remove',
      );

      expect((node.nodeConfig as any).approveNextNodeIds).toEqual([7]);
    });

    it('should not add duplicate to approveNextNodeIds', () => {
      const node = createHitlNode();
      (node.nodeConfig as any).approveNextNodeIds = [5];
      humanInteractionHandler.updateConnection!(
        node,
        { type: SpecialPortType.HitlApprove },
        5,
        'add',
      );

      expect((node.nodeConfig as any).approveNextNodeIds).toEqual([5]);
    });

    it('should return false for unknown port type', () => {
      const node = createHitlNode();
      const result = humanInteractionHandler.updateConnection!(
        node,
        { type: SpecialPortType.Condition },
        5,
        'add',
      );

      expect(result).toBe(false);
    });
  });

  describe('cleanupNodeReferences', () => {
    it('should remove deleted node from both approve and reject lists', () => {
      const node = createHitlNode();
      (node.nodeConfig as any).approveNextNodeIds = [3, 5];
      (node.nodeConfig as any).rejectNextNodeIds = [5, 8];
      humanInteractionHandler.cleanupNodeReferences!(node, 5);

      expect((node.nodeConfig as any).approveNextNodeIds).toEqual([3]);
      expect((node.nodeConfig as any).rejectNextNodeIds).toEqual([8]);
    });

    it('should be no-op when deleted node not in lists', () => {
      const node = createHitlNode();
      (node.nodeConfig as any).approveNextNodeIds = [3];
      (node.nodeConfig as any).rejectNextNodeIds = [8];
      humanInteractionHandler.cleanupNodeReferences!(node, 9);

      expect((node.nodeConfig as any).approveNextNodeIds).toEqual([3]);
      expect((node.nodeConfig as any).rejectNextNodeIds).toEqual([8]);
    });

    it('should be no-op when nodeConfig is undefined', () => {
      const node = createHitlNode();
      node.nodeConfig = undefined as any;
      expect(() =>
        humanInteractionHandler.cleanupNodeReferences!(node, 5),
      ).not.toThrow();
    });
  });

  describe('initBranchMap', () => {
    it('should return null for ask mode (not a special branch)', () => {
      const node = createHitlNode('ask');
      const result = humanInteractionHandler.initBranchMap!(node);

      expect(result).toBeNull();
    });

    it('should return map with hitl-approve and hitl-reject for approve mode', () => {
      const node = createHitlNode('approve');
      (node.nodeConfig as any).approveNextNodeIds = [3];
      (node.nodeConfig as any).rejectNextNodeIds = [5];
      const result = humanInteractionHandler.initBranchMap!(node);

      expect(result).not.toBeNull();
      expect(result!.get('hitl-approve')).toEqual([3]);
      expect(result!.get('hitl-reject')).toEqual([5]);
    });

    it('should handle empty nextNodeIds in approve mode', () => {
      const node = createHitlNode('approve');
      const result = humanInteractionHandler.initBranchMap!(node);

      expect(result!.get('hitl-approve')).toEqual([]);
      expect(result!.get('hitl-reject')).toEqual([]);
    });
  });

  describe('getBranchKey', () => {
    it('should return hitl-approve for HitlApprove', () => {
      const key = humanInteractionHandler.getBranchKey!({
        type: SpecialPortType.HitlApprove,
      });
      expect(key).toBe('hitl-approve');
    });

    it('should return hitl-reject for HitlReject', () => {
      const key = humanInteractionHandler.getBranchKey!({
        type: SpecialPortType.HitlReject,
      });
      expect(key).toBe('hitl-reject');
    });

    it('should return undefined for unknown type', () => {
      const key = humanInteractionHandler.getBranchKey!({
        type: SpecialPortType.Normal,
      });
      expect(key).toBeUndefined();
    });
  });

  describe('mergeBranchData', () => {
    it('should write approve and reject data back to node config', () => {
      const node = createHitlNode('approve');
      const branchMap = new Map<string, number[]>();
      branchMap.set('hitl-approve', [3, 4]);
      branchMap.set('hitl-reject', [5]);

      humanInteractionHandler.mergeBranchData!(node, branchMap);

      expect((node.nodeConfig as any).approveNextNodeIds).toEqual([3, 4]);
      expect((node.nodeConfig as any).rejectNextNodeIds).toEqual([5]);
    });
  });

  describe('isSpecialBranchNode', () => {
    it('should return true in approve mode', () => {
      const node = createHitlNode('approve');
      expect(humanInteractionHandler.isSpecialBranchNode!(node)).toBe(true);
    });

    it('should return false in ask mode', () => {
      const node = createHitlNode('ask');
      expect(humanInteractionHandler.isSpecialBranchNode!(node)).toBe(false);
    });
  });

  describe('handleSpecialNextIndex', () => {
    it('should add to approveNextNodeIds from approve port', () => {
      const node = createHitlNode('approve');
      const result = humanInteractionHandler.handleSpecialNextIndex!(
        node,
        '10-hitl-approve-out',
        20,
      );

      expect(result).not.toBeNull();
      expect((result!.nodeConfig as any).approveNextNodeIds).toContain(20);
    });

    it('should add to rejectNextNodeIds from reject port', () => {
      const node = createHitlNode('approve');
      const result = humanInteractionHandler.handleSpecialNextIndex!(
        node,
        '10-hitl-reject-out',
        20,
      );

      expect((result!.nodeConfig as any).rejectNextNodeIds).toContain(20);
    });

    it('should replace target in approveNextNodeIds', () => {
      const node = createHitlNode('approve');
      (node.nodeConfig as any).approveNextNodeIds = [3];
      const targetNode = { id: 3 } as ChildNode;
      const result = humanInteractionHandler.handleSpecialNextIndex!(
        node,
        '10-hitl-approve-out',
        20,
        targetNode,
      );

      expect((result!.nodeConfig as any).approveNextNodeIds).toEqual([20]);
    });

    it('should return null for unknown port pattern', () => {
      const node = createHitlNode('approve');
      const result = humanInteractionHandler.handleSpecialNextIndex!(
        node,
        '10-unknown',
        20,
      );

      expect(result).toBeNull();
    });

    it('should not mutate the original node', () => {
      const node = createHitlNode('approve');
      const originalApproveIds = [
        ...(node.nodeConfig as any).approveNextNodeIds,
      ];
      humanInteractionHandler.handleSpecialNextIndex!(
        node,
        '10-hitl-approve-out',
        20,
      );

      expect((node.nodeConfig as any).approveNextNodeIds).toEqual(
        originalApproveIds,
      );
    });
  });
});
