/**
 * HumanInteraction 分支处理器单元测试（ask 模式）
 *
 * 覆盖 ask 模式的 options / text / form 行为。
 */
import {
  AnswerTypeEnum,
  HitlModeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import type { PortConfig } from '@/types/interfaces/node';
import { describe, expect, it } from 'vitest';
import { SpecialPortType } from '../../types/enums';
import { humanInteractionHandler } from '../handlers/humanInteraction';

// ========== 测试数据 ==========

const createHitlNode = (
  overrides: Partial<{
    hitlMode: HitlModeEnum;
    answerType: AnswerTypeEnum;
    options: any[];
  }> = {},
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
    hitlMode: overrides.hitlMode ?? HitlModeEnum.Ask,
    question: '',
    answerType:
      overrides.answerType ??
      (overrides.options?.length ? AnswerTypeEnum.SELECT : AnswerTypeEnum.TEXT),
    options: overrides.options ?? [],
  } as any,
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

describe('HumanInteraction Handler (ask mode)', () => {
  describe('generatePorts', () => {
    it('should generate a single normal out port in ask text mode', () => {
      const node = createHitlNode({ answerType: AnswerTypeEnum.TEXT });
      const result = humanInteractionHandler.generatePorts!(node, ctx);

      expect(result).not.toBeNull();
      expect(result!.inputPorts).toHaveLength(1);
      expect(result!.outputPorts).toHaveLength(1);
      expect(result!.outputPorts[0].id).toContain('out');
    });

    it('should generate one option port per option in options mode', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [
          { uuid: 'o1', content: 'A' },
          { uuid: 'o2', content: 'B' },
        ],
      });
      const result = humanInteractionHandler.generatePorts!(node, ctx);

      expect(result!.outputPorts).toHaveLength(2);
      expect(result!.outputPorts[0].id).toContain('hitl-option-o1-out');
      expect(result!.outputPorts[1].id).toContain('hitl-option-o2-out');
    });

    it('should fall back to a single out port when options list is empty', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [],
      });
      const result = humanInteractionHandler.generatePorts!(node, ctx);

      expect(result!.outputPorts).toHaveLength(1);
      expect(result!.outputPorts[0].id).toContain('out');
    });

    it('should always generate one input port', () => {
      const node = createHitlNode({ answerType: AnswerTypeEnum.TEXT });
      const result = humanInteractionHandler.generatePorts!(node, ctx);
      expect(result!.inputPorts).toHaveLength(1);
    });
  });

  describe('parseSourcePort', () => {
    it('should detect hitl-option-{uuid} port', () => {
      const node = createHitlNode({ answerType: AnswerTypeEnum.SELECT });
      const result = humanInteractionHandler.parseSourcePort!(
        node,
        '10-hitl-option-o1-out',
      );

      expect(result).not.toBeNull();
      expect(result!.type).toBe(SpecialPortType.HitlOption);
      expect(result!.uuid).toBe('o1');
    });

    it('should return null for normal out port', () => {
      const node = createHitlNode({ answerType: AnswerTypeEnum.TEXT });
      const result = humanInteractionHandler.parseSourcePort!(node, '10-out');

      expect(result).toBeNull();
    });

    it('should return null for an unrelated port pattern', () => {
      const node = createHitlNode({ answerType: AnswerTypeEnum.TEXT });
      const result = humanInteractionHandler.parseSourcePort!(
        node,
        '10-something-else',
      );

      expect(result).toBeNull();
    });
  });

  describe('updateConnection', () => {
    it('should add targetNodeId to the matched option nextNodeIds', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [{ uuid: 'o1', content: 'A', nextNodeIds: [] }],
      });
      const ok = humanInteractionHandler.updateConnection!(
        node,
        { type: SpecialPortType.HitlOption, uuid: 'o1' },
        5,
        'add',
      );

      expect(ok).toBe(true);
      expect((node.nodeConfig as any).options[0].nextNodeIds).toContain(5);
    });

    it('should remove targetNodeId from the matched option nextNodeIds', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [{ uuid: 'o1', content: 'A', nextNodeIds: [3, 5] }],
      });
      humanInteractionHandler.updateConnection!(
        node,
        { type: SpecialPortType.HitlOption, uuid: 'o1' },
        5,
        'remove',
      );

      expect((node.nodeConfig as any).options[0].nextNodeIds).toEqual([3]);
    });

    it('should not add a duplicate targetNodeId', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [{ uuid: 'o1', content: 'A', nextNodeIds: [5] }],
      });
      humanInteractionHandler.updateConnection!(
        node,
        { type: SpecialPortType.HitlOption, uuid: 'o1' },
        5,
        'add',
      );

      expect((node.nodeConfig as any).options[0].nextNodeIds).toEqual([5]);
    });

    it('should return false for an unknown option uuid', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [],
      });
      const ok = humanInteractionHandler.updateConnection!(
        node,
        { type: SpecialPortType.HitlOption, uuid: 'missing' },
        5,
        'add',
      );

      expect(ok).toBe(false);
    });

    it('should return false for a non-HitlOption port type', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [],
      });
      const ok = humanInteractionHandler.updateConnection!(
        node,
        { type: SpecialPortType.Condition },
        5,
        'add',
      );

      expect(ok).toBe(false);
    });
  });

  describe('cleanupNodeReferences', () => {
    it('should remove the deleted node from every option nextNodeIds', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [
          { uuid: 'o1', content: 'A', nextNodeIds: [3, 5] },
          { uuid: 'o2', content: 'B', nextNodeIds: [5, 8] },
        ],
      });
      humanInteractionHandler.cleanupNodeReferences!(node, 5);

      expect((node.nodeConfig as any).options[0].nextNodeIds).toEqual([3]);
      expect((node.nodeConfig as any).options[1].nextNodeIds).toEqual([8]);
    });

    it('should be a no-op when the deleted node is not referenced', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [{ uuid: 'o1', content: 'A', nextNodeIds: [3] }],
      });
      humanInteractionHandler.cleanupNodeReferences!(node, 9);

      expect((node.nodeConfig as any).options[0].nextNodeIds).toEqual([3]);
    });

    it('should be a no-op when nodeConfig is undefined', () => {
      const node = createHitlNode();
      node.nodeConfig = undefined as any;
      expect(() =>
        humanInteractionHandler.cleanupNodeReferences!(node, 5),
      ).not.toThrow();
    });
  });

  describe('initBranchMap', () => {
    it('should return null in text mode (not a special branch node)', () => {
      const node = createHitlNode({ answerType: AnswerTypeEnum.TEXT });
      const result = humanInteractionHandler.initBranchMap!(node);
      expect(result).toBeNull();
    });

    it('should build a map keyed by hitl-option-{uuid} in options mode', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [
          { uuid: 'o1', content: 'A', nextNodeIds: [3] },
          { uuid: 'o2', content: 'B', nextNodeIds: [5] },
        ],
      });
      const result = humanInteractionHandler.initBranchMap!(node);

      expect(result).not.toBeNull();
      expect(result!.get('hitl-option-o1')).toEqual([3]);
      expect(result!.get('hitl-option-o2')).toEqual([5]);
    });
  });

  describe('resetBranchData', () => {
    it('should clear every option nextNodeIds', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [{ uuid: 'o1', content: 'A', nextNodeIds: [3, 5] }],
      });
      humanInteractionHandler.resetBranchData!(node);

      expect((node.nodeConfig as any).options[0].nextNodeIds).toEqual([]);
    });
  });

  describe('getBranchKey', () => {
    it('should return hitl-option-{uuid} for HitlOption', () => {
      const key = humanInteractionHandler.getBranchKey!({
        type: SpecialPortType.HitlOption,
        uuid: 'o1',
      });
      expect(key).toBe('hitl-option-o1');
    });

    it('should return undefined for an unrelated type', () => {
      const key = humanInteractionHandler.getBranchKey!({
        type: SpecialPortType.Normal,
      });
      expect(key).toBeUndefined();
    });
  });

  describe('mergeBranchData', () => {
    it('should write option nextNodeIds back from the branch map', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [
          { uuid: 'o1', content: 'A', nextNodeIds: [] },
          { uuid: 'o2', content: 'B', nextNodeIds: [] },
        ],
      });
      const branchMap = new Map<string, number[]>();
      branchMap.set('hitl-option-o1', [3, 4]);
      branchMap.set('hitl-option-o2', [5]);

      humanInteractionHandler.mergeBranchData!(node, branchMap);

      expect((node.nodeConfig as any).options[0].nextNodeIds).toEqual([3, 4]);
      expect((node.nodeConfig as any).options[1].nextNodeIds).toEqual([5]);
    });
  });

  describe('isSpecialBranchNode', () => {
    it('should return true in options mode', () => {
      const node = createHitlNode({ answerType: AnswerTypeEnum.SELECT });
      expect(humanInteractionHandler.isSpecialBranchNode!(node)).toBe(true);
    });

    it('should return false in text mode', () => {
      const node = createHitlNode({ answerType: AnswerTypeEnum.TEXT });
      expect(humanInteractionHandler.isSpecialBranchNode!(node)).toBe(false);
    });
  });

  describe('handleSpecialNextIndex', () => {
    it('should add newNodeId to the matched option nextNodeIds', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [{ uuid: 'o1', content: 'A', nextNodeIds: [] }],
      });
      const result = humanInteractionHandler.handleSpecialNextIndex!(
        node,
        '10-hitl-option-o1-out',
        20,
      );

      expect(result).not.toBeNull();
      expect((result!.nodeConfig as any).options[0].nextNodeIds).toContain(20);
    });

    it('should replace an existing targetNode id with newNodeId', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [{ uuid: 'o1', content: 'A', nextNodeIds: [3] }],
      });
      const targetNode = { id: 3 } as ChildNode;
      const result = humanInteractionHandler.handleSpecialNextIndex!(
        node,
        '10-hitl-option-o1-out',
        20,
        targetNode,
      );

      expect((result!.nodeConfig as any).options[0].nextNodeIds).toEqual([20]);
    });

    it('should return null for an unknown port pattern', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [],
      });
      const result = humanInteractionHandler.handleSpecialNextIndex!(
        node,
        '10-unknown',
        20,
      );

      expect(result).toBeNull();
    });

    it('should not mutate the original node', () => {
      const node = createHitlNode({
        answerType: AnswerTypeEnum.SELECT,
        options: [{ uuid: 'o1', content: 'A', nextNodeIds: [] }],
      });
      const original = [...(node.nodeConfig as any).options[0].nextNodeIds];
      humanInteractionHandler.handleSpecialNextIndex!(
        node,
        '10-hitl-option-o1-out',
        20,
      );

      expect((node.nodeConfig as any).options[0].nextNodeIds).toEqual(original);
    });
  });
});
