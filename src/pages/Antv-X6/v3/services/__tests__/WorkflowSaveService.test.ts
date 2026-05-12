/**
 * WorkflowSaveService AgentFlow 保存重建测试
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/common', async () => {
  const { default: cloneDeep } = await import('lodash/cloneDeep');
  return { cloneDeep };
});

import { registerAgentFlowHandlers } from '@/pages/Antv-X6/v3/agentFlow/register';
import {
  EvalValidatorTypeEnum,
  HitlModeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import WorkflowSaveService from '../WorkflowSaveService';

const createNode = (overrides: Partial<ChildNode>): ChildNode => ({
  id: 1,
  type: NodeTypeEnum.Start,
  name: 'Node',
  description: '',
  workflowId: 1,
  shape: 'custom-react' as any,
  icon: '',
  nextNodeIds: [],
  nodeConfig: {},
  ...overrides,
});

describe('WorkflowSaveService AgentFlow branches', () => {
  beforeAll(() => {
    registerAgentFlowHandlers();
  });

  it('should clear stale EvalGate branch targets when canvas edges are removed', () => {
    const service = new WorkflowSaveService();
    const nodes = [
      createNode({
        id: 2,
        type: NodeTypeEnum.EvalGate,
        nodeConfig: {
          passNextNodeIds: [3],
          evalValidators: [
            {
              uuid: 'v1',
              name: 'Check',
              type: EvalValidatorTypeEnum.Rule,
              onFail: { targetNodeId: 4, appendPrompt: '', reason: '' },
            },
          ],
        },
      }),
    ];

    const result = (service as any).computeConnections(nodes, []);
    const evalNode = result[0];

    expect(evalNode.nodeConfig.passNextNodeIds).toEqual([]);
    expect(
      evalNode.nodeConfig.evalValidators[0].onFail.targetNodeId,
    ).toBeUndefined();
  });

  it('should rebuild EvalGate branch targets from canvas edges', () => {
    const service = new WorkflowSaveService();
    const nodes = [
      createNode({
        id: 2,
        type: NodeTypeEnum.EvalGate,
        nodeConfig: {
          passNextNodeIds: [99],
          evalValidators: [
            {
              uuid: 'v1',
              name: 'Check',
              type: EvalValidatorTypeEnum.Rule,
              onFail: { targetNodeId: 98, appendPrompt: '', reason: '' },
            },
          ],
        },
      }),
    ];

    const result = (service as any).computeConnections(nodes, [
      { source: '2', target: '3', sourcePort: '2-eval-pass-out' },
      { source: '2', target: '4', sourcePort: '2-eval-fail-v1-out' },
    ]);
    const evalNode = result[0];

    expect(evalNode.nodeConfig.passNextNodeIds).toEqual([3]);
    expect(evalNode.nodeConfig.evalValidators[0].onFail.targetNodeId).toBe(4);
  });

  it('should not save unmatched EvalGate ports as normal nextNodeIds', () => {
    const service = new WorkflowSaveService();
    const nodes = [
      createNode({
        id: 2,
        type: NodeTypeEnum.EvalGate,
        nodeConfig: {
          passNextNodeIds: [],
          evalValidators: [],
        },
      }),
    ];

    const result = (service as any).computeConnections(nodes, [
      { source: '2', target: '4', sourcePort: '2-eval-fail-missing-out' },
    ]);
    const evalNode = result[0];

    expect(evalNode.nextNodeIds).toEqual([]);
    expect(evalNode.nodeConfig.passNextNodeIds).toEqual([]);
  });

  it('should clear stale HumanInteraction approve and reject targets', () => {
    const service = new WorkflowSaveService();
    const nodes = [
      createNode({
        id: 2,
        type: NodeTypeEnum.HumanInteraction,
        nodeConfig: {
          hitlMode: HitlModeEnum.Approve,
          approveNextNodeIds: [3],
          rejectNextNodeIds: [4],
        },
      }),
    ];

    const result = (service as any).computeConnections(nodes, []);
    const hitlNode = result[0];

    expect(hitlNode.nodeConfig.approveNextNodeIds).toEqual([]);
    expect(hitlNode.nodeConfig.rejectNextNodeIds).toEqual([]);
  });
});
