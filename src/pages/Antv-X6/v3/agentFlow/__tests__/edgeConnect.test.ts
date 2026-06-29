/**
 * AgentFlow 分支拖线辅助函数单元测试
 */
import { NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import { beforeEach, describe, expect, it } from 'vitest';
import { extensionRegistry } from '../../extensions/registry';
import { isAgentFlowBranchEdgeConnect } from '../edgeConnect';
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
});
