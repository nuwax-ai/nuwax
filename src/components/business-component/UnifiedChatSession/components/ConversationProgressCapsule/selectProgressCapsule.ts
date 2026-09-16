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

export interface ProgressCapsuleModel {
  turnKey: string;
  currentAction: string;
  steps: ProgressCapsuleStep[];
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

/**
 * 从 V2 投影抽取活跃轮的最新 Plan。只有 session 语义上仍在执行时才产出，
 * 因此终态不会遗留历史胶囊。
 */
export function selectProgressCapsule(
  messageList: MessageInfo[] | undefined,
  active: boolean,
): ProgressCapsuleModel | null {
  if (!active) return null;
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

  const runningNode = [...turn.nodes]
    .reverse()
    .find(
      (node) =>
        (node.kind === 'tool' || node.kind === 'subagent') &&
        node.status === 'running',
    );
  const activeStep = steps.find((step) => step.status === 'active');
  // 兜底文案留空，由展示层用 running 词条渲染——选择器保持纯净、不依赖 i18n。
  const currentAction =
    nodeAction(runningNode) || activeStep?.content || nodeAction(planNode);

  return {
    turnKey: turn.key,
    currentAction,
    steps,
    completedCount: steps.filter((step) => step.status === 'completed').length,
    totalCount: steps.length,
  };
}
