import { FlowKindEnum, NodeTypeEnum } from '@/types/enums/common';
import {
  buildMockAgentFlowDetails,
  isAgentFlowMockEnabled,
} from '@/utils/agentFlowMock';
import { beforeEach, describe, expect, it } from 'vitest';

describe('agentFlowMock', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('should enable mock mode with mockAgentFlow query', () => {
    window.history.pushState(
      {},
      '',
      '/space/1/agent-flow/1?mockAgentFlow=true',
    );

    expect(isAgentFlowMockEnabled()).toBe(true);
  });

  it('should build a local AgentFlow detail payload', () => {
    const details = buildMockAgentFlowDetails({ workflowId: 1, spaceId: 2 });

    expect(details.id).toBe(1);
    expect(details.spaceId).toBe(2);
    expect(details.workflowType).toBe(FlowKindEnum.AgentFlow);
    expect(details.nodes.map((node) => node.type)).toEqual([
      NodeTypeEnum.Start,
      NodeTypeEnum.Loop,
      NodeTypeEnum.HumanInteraction,
      NodeTypeEnum.LLM,
      NodeTypeEnum.End,
    ]);
    expect(details.startNode.nextNodeIds).toEqual([details.nodes[1].id]);
    const loopNode = details.nodes[1];
    expect(loopNode.type).toBe(NodeTypeEnum.Loop);
    expect(loopNode.innerNodes!.length).toBe(4);
    expect(loopNode.innerStartNodeId).toBeTruthy();
    expect(loopNode.innerEndNodeId).toBeTruthy();
  });
});
