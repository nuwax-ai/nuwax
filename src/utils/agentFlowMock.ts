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

import {
  FlowKindEnum,
  HitlApprovalActionEnum,
  HitlModeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';

const LOCAL_FLAG = 'agentFlow:mock';

export function isAgentFlowMockEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const search = new URLSearchParams(window.location.search);
  if (search.get('mock') === 'agent-flow') return true;
  try {
    return window.localStorage.getItem(LOCAL_FLAG) === '1';
  } catch {
    return false;
  }
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

const now = () => new Date().toISOString();
const uid = () =>
  `mock_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

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
      emitNode(cursor, NodeTypeEnum.Agent, 'agent_1');
      cursor += step * 2;
      emitRunCompleted(cursor + step, 'mock final answer');
      break;
    }

    case 'evalRetry': {
      // round 1
      cursor += step;
      emitNode(cursor, NodeTypeEnum.Agent, 'agent_1', { round: 1 });
      cursor += step * 2;
      schedule(cursor, () =>
        emit({
          at: now(),
          runId,
          type: 'gate_evaluated',
          actor: 'system',
          payload: {
            nodeId: 'eval_1',
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
            fromNodeId: 'eval_1',
            toNodeId: 'agent_1',
            validator: 'validator_1',
            appendPrompt: '请补充客户的订单号',
            round: 2,
          },
        }),
      );
      // round 2
      cursor += step;
      emitNode(cursor, NodeTypeEnum.Agent, 'agent_1', {
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
          payload: { nodeId: 'eval_1', passed: true, failures: [] },
        }),
      );
      cursor += step;
      emitRunCompleted(cursor, 'mock final answer with order id');
      break;
    }

    case 'humanAsk': {
      cursor += step;
      emitNode(cursor, NodeTypeEnum.Agent, 'agent_1');
      cursor += step * 2;
      schedule(cursor, () => {
        emit({
          at: now(),
          runId,
          type: 'node_started',
          actor: NodeTypeEnum.HumanInteraction,
          payload: { nodeId: 'hitl_1', round: 1 },
        });
        emit({
          at: now(),
          runId,
          type: 'human_required',
          actor: 'system',
          payload: {
            nodeId: 'hitl_1',
            mode: HitlModeEnum.Ask,
            question: 'Confirm your action',
            answerType: 'select',
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
            payload: { nodeId: 'hitl_1', signal },
          }),
        );
        emitRunCompleted(t + step, 'mock final answer with user choice');
      };
      break;
    }

    case 'humanApprove': {
      cursor += step;
      emitNode(cursor, NodeTypeEnum.Agent, 'agent_1', {
        output: { text: 'draft reply for review' },
      });
      cursor += step * 2;
      schedule(cursor, () => {
        emit({
          at: now(),
          runId,
          type: 'node_started',
          actor: NodeTypeEnum.HumanInteraction,
          payload: { nodeId: 'hitl_1' },
        });
        emit({
          at: now(),
          runId,
          type: 'human_required',
          actor: 'system',
          payload: {
            nodeId: 'hitl_1',
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
            payload: { nodeId: 'hitl_1', signal },
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
