import {
  projectConversation,
  type ConversationProcessNode,
} from '@/features/conversation/presentation-v2';
import { normalizeV2ToolDetail } from '@/features/conversation/presentation-v2/toolDetail';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

export type ProgressStepStatus = 'completed' | 'active' | 'pending';

export interface ProgressCapsuleStep {
  content: string;
  status: ProgressStepStatus;
}

/** 胶囊常驻行（终端 / 子智能体），终态保留各自最终状态 */
export interface ProgressCapsuleNode {
  id: string;
  title: string;
  command?: string;
  status: ConversationProcessNode['status'];
}

/** 该轮文件编辑（V2 投影口径：编辑行数，非 git 统计） */
export interface ProgressCapsuleFileEdit {
  id: string;
  /** 单文件路径；多文件节点为空串，展示层用「N 个文件」词条 */
  path: string;
  fileCount: number;
  additions: number;
  deletions: number;
  status: ConversationProcessNode['status'];
}

export interface ProgressCapsuleModel {
  turnKey: string;
  /** 会话语义仍在执行（active && turn.running），决定 spinner / 终态图标 */
  running: boolean;
  /** 轮次终态，仅会话结束后给出 */
  terminalStatus?: 'complete' | 'error' | 'stopped';
  currentAction: string;
  /** 会话最终输出正文（V2 投影 finalAnswer，空串表示无） */
  finalResult: string;
  steps: ProgressCapsuleStep[];
  terminals: ProgressCapsuleNode[];
  subagents: ProgressCapsuleNode[];
  fileEdits: ProgressCapsuleFileEdit[];
  completedCount: number;
  totalCount: number;
}

const normalizeStepStatus = (status: string): ProgressStepStatus => {
  const normalized = status.toLowerCase().replace(/[_\s]+/g, '-');
  if (
    ['completed', 'complete', 'finished', 'success', 'done'].includes(
      normalized,
    )
  ) {
    return 'completed';
  }
  if (['in-progress', 'running', 'executing', 'active'].includes(normalized)) {
    return 'active';
  }
  return 'pending';
};

const nodeAction = (node: ConversationProcessNode | undefined): string =>
  node?.summary?.trim() || node?.title?.trim() || '';

const nodeDisplayTitle = (node: ConversationProcessNode): string =>
  node.title?.trim() || nodeAction(node);

/**
 * 从 V2 投影抽取最近一轮的 Plan / 终端 / 子智能体。
 * 终态常驻：会话结束后继续产出最后一轮内容；只有新消息开出的新轮
 * 尚无任何可展示内容时才返回 null（胶囊隐藏）。
 */
export function selectProgressCapsule(
  messageList: MessageInfo[] | undefined,
  active: boolean,
): ProgressCapsuleModel | null {
  const turns = projectConversation(messageList).turns;
  const turn =
    [...turns].reverse().find((item) => item.running) ?? turns.at(-1);
  if (!turn) return null;

  const planNode = [...turn.nodes]
    .reverse()
    .find((node) => node.kind === 'plan');
  const detail = planNode
    ? normalizeV2ToolDetail({
        componentType: planNode.processing?.type ?? planNode.componentType,
        name: planNode.processing?.name ?? planNode.title,
        result: planNode.processing?.result,
      })
    : null;
  const steps = (detail?.steps ?? [])
    .map((step) => ({
      content: step.content.trim(),
      status: normalizeStepStatus(step.status),
    }))
    .filter((step) => Boolean(step.content));

  const terminals: ProgressCapsuleNode[] = [];
  const subagents: ProgressCapsuleNode[] = [];
  const fileEdits: ProgressCapsuleFileEdit[] = [];
  for (const node of turn.nodes) {
    if (node.kind === 'subagent') {
      subagents.push({
        id: node.id,
        title: nodeDisplayTitle(node),
        status: node.status,
      });
      continue;
    }
    if (node.kind !== 'tool') continue;
    const componentType = node.processing?.type ?? node.componentType;
    const name = node.processing?.name ?? node.title;
    const result = node.processing?.result;
    const detail = normalizeV2ToolDetail({ componentType, name, result });
    if (detail.kind === 'terminal') {
      terminals.push({
        id: node.id,
        title: nodeDisplayTitle(node),
        command: detail.command,
        status: node.status,
      });
    } else if (detail.kind === 'file-edit') {
      fileEdits.push({
        id: node.id,
        path:
          detail.diffs.length > 1
            ? ''
            : detail.diffs[0]?.path || detail.filePath || '',
        fileCount: detail.diffs.length || 1,
        additions: detail.additions,
        deletions: detail.deletions,
        status: node.status,
      });
    }
  }

  const runningNode = [...turn.nodes]
    .reverse()
    .find(
      (node) =>
        (node.kind === 'tool' || node.kind === 'subagent') &&
        node.status === 'running',
    );
  const activeStep = steps.find((step) => step.status === 'active');
  // 终态后取最后执行过的工具/子智能体动作；兜底留空，由展示层用词条渲染。
  const lastActionNode = [...turn.nodes]
    .reverse()
    .find((node) => node.kind === 'tool' || node.kind === 'subagent');
  const running = active && turn.running;
  const currentAction = running
    ? nodeAction(runningNode) || activeStep?.content || nodeAction(planNode)
    : nodeAction(runningNode) ||
      nodeAction(lastActionNode) ||
      activeStep?.content ||
      nodeAction(planNode);

  const finalResult = turn.finalAnswer.text.trim();

  const hasContent =
    steps.length > 0 ||
    terminals.length > 0 ||
    subagents.length > 0 ||
    fileEdits.length > 0 ||
    Boolean(finalResult) ||
    Boolean(currentAction);
  if (!hasContent) return null;

  return {
    turnKey: turn.key,
    running,
    terminalStatus: active ? undefined : turn.terminalStatus,
    currentAction,
    finalResult,
    steps,
    terminals,
    subagents,
    fileEdits,
    completedCount: steps.filter((step) => step.status === 'completed').length,
    totalCount: steps.length,
  };
}
