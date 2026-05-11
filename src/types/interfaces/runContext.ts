import {
  FlowKindEnum,
  HitlApprovalActionEnum,
  HitlModeEnum,
} from '@/types/enums/common';

// 单节点输出
export interface RunContextNodeOutput {
  text?: string;
  structured?: unknown;
  tokens?: number;
  cost?: number;
  // 允许任意业务字段
  [key: string]: unknown;
}

// EvalGate 失败回跳时附加给目标节点的 prompt 片段
export interface RunContextEvalFeedback {
  reason: string;
  appendPrompt: string;
  fromValidator: string;
  round: number;
}

// HITL 用户提交的 signal
export interface RunContextHumanSignal {
  mode: HitlModeEnum;
  action: HitlApprovalActionEnum | 'answer';
  content?: string;
  selectedOption?: string;
  operator?: string;
  at?: string; // ISO8601
}

// 一次 AgentFlow 运行的可观测上下文（前端版本，与后端 RunContext 同构）
export interface RunContext {
  runId: string;
  flowId: number | string;
  flowKind: FlowKindEnum;
  // 共享变量空间
  variables: Record<string, unknown>;
  // 每个节点输出
  nodeOutputs: Record<string, RunContextNodeOutput>;
  // 每个目标节点的回跳反馈（keyed by target nodeId）
  evalFeedback: Record<string, RunContextEvalFeedback>;
  // 每个节点的累计重试次数
  retryCounts: Record<string, number>;
  // 每个 HITL 节点的最近一次 signal
  humanSignals: Record<string, RunContextHumanSignal>;
  // 当前执行游标
  cursor?: string;
}
