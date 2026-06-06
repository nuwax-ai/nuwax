/**
 * AgentFlow 本地 mock SSE
 *
 * 后端未就绪时，为前端 E2E 提供可重放的事件流。
 *
 * **开启方式**（任选其一）：
 *   1. URL 加 `?mock=agent-flow`
 *   2. 浏览器控制台执行 `localStorage.setItem('agentFlow:mock', '1')`
 *   3. 代码里调用 `isAgentFlowMockEnabled()` 判断后走 mock 分支
 *
 * 事件 schema 对齐 docs/ch/AgentFlow-Design.md §8。
 */

import type { IgetDetails } from '@/services/workflow';
import {
  AgentNodeModeEnum,
  AnswerTypeEnum,
  DataTypeEnum,
  FlowKindEnum,
  HitlApprovalActionEnum,
  HitlModeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';

const LOCAL_FLAG = 'agentFlow:mock';
const MOCK_START_NODE_ID = 101;
const MOCK_ROUTE_NODE_ID = 108;
const MOCK_AGENT_NODE_ID = 103;
const MOCK_EVAL_NODE_ID = 104;
const MOCK_HITL_APPROVE_NODE_ID = 105;
const MOCK_HITL_ASK_NODE_ID = 109;
const MOCK_CONNECTOR_NODE_ID = 110;
const MOCK_END_NODE_ID = 107;

const now = () => new Date().toISOString();
const uid = () =>
  `mock_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function isAgentFlowMockEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const search = new URLSearchParams(window.location.search);
  if (search.get('mock') === 'agent-flow') return true;
  if (search.get('mockAgentFlow') === 'true') return true;
  try {
    return window.localStorage.getItem(LOCAL_FLAG) === '1';
  } catch {
    return false;
  }
}

const createMockNode = (
  workflowId: number,
  node: Partial<ChildNode> & Pick<ChildNode, 'id' | 'name' | 'type'>,
): ChildNode => ({
  description: '',
  icon: '',
  workflowId,
  shape: NodeShapeEnum.General,
  nextNodeIds: [],
  ...node,
  nodeConfig: {
    extension: { x: 80, y: 120 },
    ...(node.nodeConfig || {}),
  },
});

export function buildMockAgentFlowDetails({
  workflowId,
  spaceId,
}: {
  workflowId: number;
  spaceId: number;
}): IgetDetails {
  const nowAt = now();
  const startNode = createMockNode(workflowId, {
    id: MOCK_START_NODE_ID,
    name: '开始',
    type: NodeTypeEnum.Start,
    nextNodeIds: [MOCK_ROUTE_NODE_ID],
    nodeConfig: {
      extension: { x: 80, y: 200 },
      outputArgs: [
        {
          key: 'userQuestion',
          name: 'userQuestion',
          description: '用户输入',
          dataType: DataTypeEnum.String,
          require: true,
          systemVariable: false,
          bindValue: '',
        },
      ],
    },
  });

  const routeNode = createMockNode(workflowId, {
    id: MOCK_ROUTE_NODE_ID,
    name: '路由决策',
    type: NodeTypeEnum.RouteDecision,
    nextNodeIds: [MOCK_AGENT_NODE_ID, MOCK_CONNECTOR_NODE_ID],
    nodeConfig: {
      extension: { x: 300, y: 200 },
      modelId: undefined,
      extraPrompt: '根据用户意图，选择智能体处理或外部平台处理。',
      routes: [
        {
          uuid: 'route_1',
          routeName: '智能体处理',
          description: '需要AI智能体处理的请求',
          nextNodeIds: [MOCK_AGENT_NODE_ID],
        },
        {
          uuid: 'route_2',
          routeName: '外部平台',
          description: '需要调用外部Dify流程',
          nextNodeIds: [MOCK_CONNECTOR_NODE_ID],
        },
      ],
    },
  });

  const agentNode = createMockNode(workflowId, {
    id: MOCK_AGENT_NODE_ID,
    name: '智能体',
    type: NodeTypeEnum.Agent,
    nextNodeIds: [MOCK_EVAL_NODE_ID],
    nodeConfig: {
      extension: { x: 540, y: 120 },
      agentMode: AgentNodeModeEnum.Platform,
      agentId: 1,
      contextPassMode: 'auto',
      systemPrompt: '',
      contextReads: ['context.userQuestion'],
      contextWrites: ['context.agentAnswer'],
    },
  });

  const evalNode = createMockNode(workflowId, {
    id: MOCK_EVAL_NODE_ID,
    name: '评估验证',
    type: NodeTypeEnum.EvalGate,
    nextNodeIds: [MOCK_HITL_APPROVE_NODE_ID],
    nodeConfig: {
      extension: { x: 760, y: 120 },
      evalItems: [
        {
          uuid: 'eval_1',
          name: '答案完整性',
          weight: 100,
          description: '必须包含明确结论',
        },
      ],
      passThreshold: 80,
      evalOutput: true,
      evalMaxRetry: 3,
      evalFailMsg: '智能体输出结果评估未通过，请仔细甄别',
      branches: [
        {
          uuid: 'auto-pass',
          name: '通过',
          desc: '',
          nextNodeIds: [MOCK_HITL_APPROVE_NODE_ID],
        },
      ],
      // v1 保留
      evalValidators: [],
      passNextNodeIds: [MOCK_HITL_APPROVE_NODE_ID],
    },
  });

  const hitlApproveNode = createMockNode(workflowId, {
    id: MOCK_HITL_APPROVE_NODE_ID,
    name: '人类审批',
    type: NodeTypeEnum.HumanInteraction,
    nextNodeIds: [MOCK_HITL_ASK_NODE_ID],
    nodeConfig: {
      extension: { x: 1000, y: 120 },
      hitlMode: HitlModeEnum.Approve,
      confirmRole: 'user',
      approvalMode: 'approve_reject',
      instruction: '请确认智能体输出是否可发送给用户。',
      branches: [
        {
          uuid: 'approve',
          name: '通过',
          desc: '',
          nextNodeIds: [MOCK_HITL_ASK_NODE_ID],
        },
        {
          uuid: 'reject',
          name: '拒绝',
          desc: '',
          nextNodeIds: [MOCK_AGENT_NODE_ID],
        },
      ],
      // v1 保留
      approveNextNodeIds: [MOCK_HITL_ASK_NODE_ID],
      rejectNextNodeIds: [MOCK_AGENT_NODE_ID],
    },
  });

  const hitlAskNode = createMockNode(workflowId, {
    id: MOCK_HITL_ASK_NODE_ID,
    name: '询问用户',
    type: NodeTypeEnum.HumanInteraction,
    nextNodeIds: [MOCK_END_NODE_ID],
    nodeConfig: {
      extension: { x: 1240, y: 200 },
      hitlMode: HitlModeEnum.Ask,
      replyMode: 'options',
      askConfig: {
        question: '您是否需要额外的帮助？',
        answerType: AnswerTypeEnum.SELECT,
        options: [
          {
            index: 0,
            content: '是',
            uuid: 'opt_yes',
            nextNodeIds: [MOCK_END_NODE_ID],
          },
          {
            index: 1,
            content: '否',
            uuid: 'opt_no',
            nextNodeIds: [MOCK_END_NODE_ID],
          },
        ],
        answerKey: 'needMoreHelp',
        required: true,
      },
    },
  });

  const connectorNode = createMockNode(workflowId, {
    id: MOCK_CONNECTOR_NODE_ID,
    name: 'Dify流程',
    type: NodeTypeEnum.ExternalConnector,
    nextNodeIds: [MOCK_END_NODE_ID],
    nodeConfig: {
      extension: { x: 540, y: 280 },
      connectorProvider: 'dify',
      connectorConfig: {
        endpoint: 'https://api.dify.ai/v1/workflows/run',
        authRef: '{{secrets.difyApiKey}}',
        payloadTemplate:
          '{"inputs": {"query": "{{context.userQuestion}}"}, "user": "{{runId}}"}',
        responseMapping: {
          'context.connectorOutput': 'data.outputs.text',
        },
      },
      autoWirePrevOutput: true,
    },
  });

  const endNode = createMockNode(workflowId, {
    id: MOCK_END_NODE_ID,
    name: '结束',
    type: NodeTypeEnum.End,
    nodeConfig: {
      extension: { x: 1480, y: 200 },
      returnType: 'TEXT',
      text: '{{context.finalAnswer}}',
    },
  });

  return {
    creator: {
      userId: 0,
      userName: 'mock',
      nickName: 'Mock User',
      avatar: '',
    },
    created: nowAt,
    description: 'AgentFlow 本地调试流程',
    endNode,
    icon: '',
    id: workflowId,
    inputArgs: startNode.nodeConfig.outputArgs || [],
    modified: nowAt,
    name: `AgentFlow Mock #${workflowId}`,
    nodes: [
      startNode,
      routeNode,
      agentNode,
      evalNode,
      hitlApproveNode,
      hitlAskNode,
      connectorNode,
      endNode,
    ],
    outputArgs: [],
    publishStatus: '',
    spaceId,
    startNode,
    extension: { size: 8 },
    scope: null,
    workflowType: FlowKindEnum.AgentFlow,
    systemVariables: [],
    editVersion: 1,
  };
}

// 事件 actor 类型（参见设计文档 §8）
export type MockEventActor = 'system' | 'human' | NodeTypeEnum;

export interface MockFlowEvent {
  at: string;
  runId: string;
  type:
    | 'run_started'
    | 'node_started'
    | 'node_chunk'
    | 'node_completed'
    | 'node_failed'
    | 'gate_evaluated'
    | 'gate_routed'
    | 'human_required'
    | 'human_signal_applied'
    | 'context_updated'
    | 'run_completed'
    | 'run_failed'
    | 'run_cancelled';
  actor: MockEventActor;
  payload: Record<string, unknown>;
}

export type MockScenario =
  // 一次性走完，无回跳，无 HITL
  | 'happy'
  // EvalGate 第一轮失败 → 回到 Agent 重跑 → 第二轮通过
  | 'evalRetry'
  // 触发 HITL ask 暂停（需要外部 resumeMock 才能继续）
  | 'humanAsk'
  // 触发 HITL approve 暂停
  | 'humanApprove';

export interface StartMockRunOptions {
  runId?: string;
  flowId: string | number;
  scenario?: MockScenario;
  // 每条事件之间的间隔（ms），默认 300
  intervalMs?: number;
  onMessage: (event: MockFlowEvent) => void;
  onClose?: () => void;
}

export interface MockRunHandle {
  abort: () => void;
  // 模拟用户对 human_required 提交 signal：恢复后续事件
  resume: (signal: {
    mode: HitlModeEnum;
    action: HitlApprovalActionEnum | 'answer';
    content?: string;
    selectedOption?: string;
  }) => void;
}

/**
 * 启动一次 mock run。返回一个 handle，可 abort，可 resume HITL。
 *
 * 事件序列与设计文档 §6/§15 中描述的端到端验证序列对齐。
 */
export function startMockAgentFlowRun(
  options: StartMockRunOptions,
): MockRunHandle {
  const {
    runId = uid(),
    flowId,
    scenario = 'happy',
    intervalMs = 300,
    onMessage,
    onClose,
  } = options;

  let aborted = false;
  let pendingResume: ((s: any) => void) | null = null;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const emit = (event: MockFlowEvent) => {
    if (aborted) return;
    onMessage(event);
  };

  const schedule = (delay: number, fn: () => void) => {
    const tid = setTimeout(() => {
      if (!aborted) fn();
    }, delay);
    timers.push(tid);
  };

  const baseRun = { runId, flowId, flowKind: FlowKindEnum.AgentFlow };

  // ---- 公共序列拼装 ----
  const emitRunStarted = (t: number) =>
    schedule(t, () =>
      emit({
        at: now(),
        runId,
        type: 'run_started',
        actor: 'system',
        payload: baseRun,
      }),
    );

  const emitNode = (
    t: number,
    nodeKind: NodeTypeEnum,
    nodeId: string,
    extra: Partial<Record<'output' | 'round', unknown>> = {},
  ) => {
    schedule(t, () =>
      emit({
        at: now(),
        runId,
        type: 'node_started',
        actor: nodeKind,
        payload: { nodeId, round: extra.round ?? 1 },
      }),
    );
    schedule(t + intervalMs, () =>
      emit({
        at: now(),
        runId,
        type: 'node_completed',
        actor: nodeKind,
        payload: {
          nodeId,
          output: extra.output ?? { text: `mock output of ${nodeId}` },
          tokens: 42,
          cost: 0.0001,
        },
      }),
    );
  };

  const emitRunCompleted = (t: number, finalText: string) =>
    schedule(t, () => {
      emit({
        at: now(),
        runId,
        type: 'run_completed',
        actor: 'system',
        payload: { ...baseRun, finalOutput: { text: finalText } },
      });
      onClose?.();
    });

  // ---- 按场景出招 ----
  const step = intervalMs;
  let cursor = 0;
  emitRunStarted((cursor += step));

  switch (scenario) {
    case 'happy': {
      cursor += step;
      emitNode(cursor, NodeTypeEnum.Agent, String(MOCK_AGENT_NODE_ID));
      cursor += step * 2;
      emitRunCompleted(cursor + step, 'mock final answer');
      break;
    }

    case 'evalRetry': {
      // round 1
      cursor += step;
      emitNode(cursor, NodeTypeEnum.Agent, String(MOCK_AGENT_NODE_ID), {
        round: 1,
      });
      cursor += step * 2;
      schedule(cursor, () =>
        emit({
          at: now(),
          runId,
          type: 'gate_evaluated',
          actor: 'system',
          payload: {
            nodeId: String(MOCK_EVAL_NODE_ID),
            passed: false,
            failures: [
              {
                validator: 'validator_1',
                reason: '资料不全',
              },
            ],
          },
        }),
      );
      cursor += step;
      schedule(cursor, () =>
        emit({
          at: now(),
          runId,
          type: 'gate_routed',
          actor: 'system',
          payload: {
            fromNodeId: String(MOCK_EVAL_NODE_ID),
            toNodeId: String(MOCK_AGENT_NODE_ID),
            validator: 'validator_1',
            appendPrompt: '请补充客户的订单号',
            round: 2,
          },
        }),
      );
      // round 2
      cursor += step;
      emitNode(cursor, NodeTypeEnum.Agent, String(MOCK_AGENT_NODE_ID), {
        round: 2,
        output: { text: '已补充订单号 ORD-12345' },
      });
      cursor += step * 2;
      schedule(cursor, () =>
        emit({
          at: now(),
          runId,
          type: 'gate_evaluated',
          actor: 'system',
          payload: {
            nodeId: String(MOCK_EVAL_NODE_ID),
            passed: true,
            failures: [],
          },
        }),
      );
      cursor += step;
      emitRunCompleted(cursor, 'mock final answer with order id');
      break;
    }

    case 'humanAsk': {
      cursor += step;
      emitNode(cursor, NodeTypeEnum.Agent, String(MOCK_AGENT_NODE_ID));
      cursor += step * 2;
      schedule(cursor, () => {
        emit({
          at: now(),
          runId,
          type: 'node_started',
          actor: NodeTypeEnum.HumanInteraction,
          payload: { nodeId: String(MOCK_HITL_ASK_NODE_ID), round: 1 },
        });
        emit({
          at: now(),
          runId,
          type: 'human_required',
          actor: 'system',
          payload: {
            nodeId: String(MOCK_HITL_ASK_NODE_ID),
            mode: HitlModeEnum.Ask,
            question: 'Confirm your action',
            answerType: AnswerTypeEnum.SELECT,
            options: [
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
            ],
          },
        });
      });
      pendingResume = (signal) => {
        const t = cursor + step;
        schedule(t, () =>
          emit({
            at: now(),
            runId,
            type: 'human_signal_applied',
            actor: 'human',
            payload: { nodeId: String(MOCK_HITL_ASK_NODE_ID), signal },
          }),
        );
        emitRunCompleted(t + step, 'mock final answer with user choice');
      };
      break;
    }

    case 'humanApprove': {
      cursor += step;
      emitNode(cursor, NodeTypeEnum.Agent, String(MOCK_AGENT_NODE_ID), {
        output: { text: 'draft reply for review' },
      });
      cursor += step * 2;
      schedule(cursor, () => {
        emit({
          at: now(),
          runId,
          type: 'node_started',
          actor: NodeTypeEnum.HumanInteraction,
          payload: { nodeId: String(MOCK_HITL_APPROVE_NODE_ID) },
        });
        emit({
          at: now(),
          runId,
          type: 'human_required',
          actor: 'system',
          payload: {
            nodeId: String(MOCK_HITL_APPROVE_NODE_ID),
            mode: HitlModeEnum.Approve,
            draft: 'draft reply for review',
            actions: ['approve', 'edit', 'reject'],
          },
        });
      });
      pendingResume = (signal) => {
        const t = cursor + step;
        schedule(t, () =>
          emit({
            at: now(),
            runId,
            type: 'human_signal_applied',
            actor: 'human',
            payload: { nodeId: String(MOCK_HITL_APPROVE_NODE_ID), signal },
          }),
        );
        if (signal.action === HitlApprovalActionEnum.Reject) {
          schedule(t + step, () => {
            emit({
              at: now(),
              runId,
              type: 'run_failed',
              actor: 'system',
              payload: { ...baseRun, error: 'rejected by reviewer' },
            });
            onClose?.();
          });
        } else {
          emitRunCompleted(t + step, 'mock final approved answer');
        }
      };
      break;
    }
  }

  return {
    abort: () => {
      aborted = true;
      timers.forEach(clearTimeout);
      onClose?.();
    },
    resume: (signal) => {
      if (pendingResume) {
        pendingResume(signal);
        pendingResume = null;
      }
    },
  };
}
