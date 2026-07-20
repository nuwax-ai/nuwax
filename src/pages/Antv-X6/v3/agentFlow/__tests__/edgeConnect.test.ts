/**
 * AgentFlow 分支拖线辅助函数单元测试
 */
import { NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import { beforeEach, describe, expect, it } from 'vitest';
import { extensionRegistry } from '../../extensions/registry';
import {
  applyAgentFlowBranchEdgeDisconnect,
  isAgentFlowBranchEdgeConnect,
} from '../edgeConnect';
import { HitlAnswerTypeEnum } from '../enums/hitlAnswerType';
import { humanInteractionHandler } from '../handlers/humanInteraction';
import { routeDecisionHandler } from '../handlers/routeDecision';

beforeEach(() => {
  extensionRegistry.register(humanInteractionHandler);
  extensionRegistry.register(routeDecisionHandler);
});

describe('isAgentFlowBranchEdgeConnect', () => {
  it('RouteDecision 任意出口端口走分支路径', () => {
    const node = {
      id: 1,
      type: NodeTypeEnum.RouteDecision,
      nodeConfig: { intentConfigs: [{ uuid: 'r1', nextNodeIds: [] }] },
    } as ChildNode;
    expect(isAgentFlowBranchEdgeConnect(node, '1-route-r1-out')).toBe(true);
  });

  it('HumanInteraction options 端口走分支路径', () => {
    const node = {
      id: 2,
      type: NodeTypeEnum.HumanInteraction,
      nodeConfig: {
        answerType: HitlAnswerTypeEnum.SELECT,
        options: [{ uuid: 'o1', nextNodeIds: [] }],
      },
    } as ChildNode;
    expect(isAgentFlowBranchEdgeConnect(node, '2-hitl-option-o1-out')).toBe(
      true,
    );
  });

  it('HumanInteraction 文本模式走普通边路径', () => {
    const node = {
      id: 3,
      type: NodeTypeEnum.HumanInteraction,
      nodeConfig: { answerType: 'TEXT' },
    } as ChildNode;
    expect(isAgentFlowBranchEdgeConnect(node, '3-out')).toBe(false);
  });

  it('HumanInteraction 表单模式 -out 端口走普通边路径', () => {
    const node = {
      id: 4,
      type: NodeTypeEnum.HumanInteraction,
      nodeConfig: { answerType: HitlAnswerTypeEnum.FORM, formArgs: [{}] },
    } as ChildNode;
    expect(isAgentFlowBranchEdgeConnect(node, '4-out')).toBe(false);
  });

  it('HumanInteraction SELECT 但 options 为空时 -out 走普通边路径', () => {
    const node = {
      id: 5,
      type: NodeTypeEnum.HumanInteraction,
      nodeConfig: { answerType: HitlAnswerTypeEnum.SELECT, options: [] },
    } as ChildNode;
    expect(isAgentFlowBranchEdgeConnect(node, '5-out')).toBe(false);
  });
});

describe('applyAgentFlowBranchEdgeDisconnect', () => {
  it('RouteDecision 路由端口从 intentConfigs 移除目标', () => {
    const node = {
      id: 1,
      type: NodeTypeEnum.RouteDecision,
      nodeConfig: {
        defaultNextNodeIds: [],
        intentConfigs: [{ uuid: 'r1', nextNodeIds: [5, 6] }],
      },
    } as ChildNode;

    const result = applyAgentFlowBranchEdgeDisconnect(
      node,
      5,
      '1-route-r1-out',
    );

    expect(result?.nodeConfig?.intentConfigs?.[0].nextNodeIds).toEqual([6]);
  });

  it('RouteDecision default 端口从 defaultNextNodeIds 移除目标', () => {
    const node = {
      id: 1,
      type: NodeTypeEnum.RouteDecision,
      nodeConfig: {
        defaultNextNodeIds: [8, 9],
        intentConfigs: [],
      },
    } as ChildNode;

    const result = applyAgentFlowBranchEdgeDisconnect(
      node,
      8,
      '1-route-default-out',
    );

    expect(result?.nodeConfig?.defaultNextNodeIds).toEqual([9]);
  });

  it('HumanInteraction options 端口从 options 移除目标', () => {
    const node = {
      id: 2,
      type: NodeTypeEnum.HumanInteraction,
      nodeConfig: {
        answerType: HitlAnswerTypeEnum.SELECT,
        options: [{ uuid: 'o1', nextNodeIds: [3, 4] }],
      },
    } as ChildNode;

    const result = applyAgentFlowBranchEdgeDisconnect(
      node,
      3,
      '2-hitl-option-o1-out',
    );

    expect(result?.nodeConfig?.options?.[0].nextNodeIds).toEqual([4]);
  });

  it('非分支端口返回 null', () => {
    const node = {
      id: 3,
      type: NodeTypeEnum.HumanInteraction,
      nodeConfig: { answerType: 'TEXT' },
    } as ChildNode;

    expect(applyAgentFlowBranchEdgeDisconnect(node, 1, '3-out')).toBeNull();
  });

  it('HumanInteraction 文本模式 disconnect 返回 null（应走 proxy.deleteEdge）', () => {
    const node = {
      id: 6,
      type: NodeTypeEnum.HumanInteraction,
      nodeConfig: { answerType: HitlAnswerTypeEnum.TEXT, nextNodeIds: [9] },
    } as ChildNode;

    expect(applyAgentFlowBranchEdgeDisconnect(node, 9, '6-out')).toBeNull();
  });
});
