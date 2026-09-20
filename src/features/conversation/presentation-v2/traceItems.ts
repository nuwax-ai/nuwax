/**
 * V2 轨迹展示编排：原子过程节点 → 正文 / 独立节点 / 连续工具组。
 *
 * 分组在预设过滤之前完成，保证被 focused 隐藏的思考、上下文仍能切断
 * 前后工具组；本模块为纯函数，不持有 React 展开状态。
 */
import { getToolPresentationKind } from '@/components/MarkdownCustomProcess/toolPresentation';
import { resolveOpenUiDisplayState } from '@/utils/openUiArtifact';
import { normalizeV2ToolDetail } from './toolDetail';
import type {
  ConversationProcessNode,
  ConversationToolActionKind,
  ConversationTraceItem,
} from './types';

// OpenUI 渲染工具名：仅考虑后端下发的 Backend.Sandbox.Event.renderUI（大小写变体）
const OPEN_UI_NAME = /Backend\.Sandbox\.Event\.renderUI/i;

export interface ConversationPlanStep {
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  content: string;
}

/**
 * 提取 Plan 工具的结构化任务清单：result.data = [{status, content}]
 * （与 V1 MarkdownCustomProcess 任务列表、utils getPlanProgress 同源契约）。
 * 非数组或无有效项（content 缺失）返回 null，调用方回落普通轨迹行。
 */
export const readPlanSteps = (
  result: unknown,
): ConversationPlanStep[] | null => {
  const data = (result as { data?: unknown } | null | undefined)?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const steps: ConversationPlanStep[] = [];
  for (const entry of data) {
    if (!entry || typeof entry !== 'object') continue;
    const step = entry as { status?: unknown; content?: unknown };
    if (typeof step.content !== 'string' || !step.content.trim()) continue;
    const status =
      step.status === 'completed' ||
      step.status === 'in_progress' ||
      step.status === 'pending' ||
      step.status === 'failed'
        ? step.status
        : 'pending';
    steps.push({ status, content: step.content });
  }
  return steps.length > 0 ? steps : null;
};

/** 待办卡接管判定：Plan 节点且能提取非空结构化步骤（否则回落 ProcessNodeRow） */
export const isTodoTraceNode = (node: ConversationProcessNode): boolean =>
  node.kind === 'plan' && readPlanSteps(node.processing?.result) !== null;

export const getNodeToolActionKind = (
  node: ConversationProcessNode,
): ConversationToolActionKind =>
  getToolPresentationKind({
    componentType: node.processing?.type ?? node.componentType,
    name: node.processing?.name ?? node.title,
    result: node.processing?.result,
  });

export const isOpenUiToolNode = (node: ConversationProcessNode): boolean => {
  if (node.kind !== 'tool') return false;
  // 只认工具名（对齐 V1 isOpenUiRenderToolName 口径）：流式 applier
  // （applyOpenUiToolCallSseEvent）把 RENDER_UI 项 type 记为 ToolCall，
  // 历史 finalResult 里可能保留 Event——两种 componentType 都需独立展示。
  const name = node.processing?.name ?? node.title;
  return OPEN_UI_NAME.test(name);
};

/**
 * 是否由 OpenUI 渲染元素接管：产物 presentation 为 inline / sidecar 两种形态之一
 * （resolveOpenUiDisplayState 的 ready / input-only 均已按 mode 校验）。
 * 生成中无产物、失败、终态退化一律回落普通轨迹行（动作词条替代协议名）。
 */
export const isOpenUiRenderElementNode = (
  node: ConversationProcessNode,
): boolean =>
  isOpenUiToolNode(node) &&
  resolveOpenUiDisplayState(node.processing?.result).status !== 'absent';

export const isGroupableToolNode = (node: ConversationProcessNode): boolean =>
  node.kind === 'tool' &&
  !isOpenUiToolNode(node) &&
  getNodeToolActionKind(node) !== 'todo';

export const getToolGroupStatus = (
  nodes: ConversationProcessNode[],
): ConversationProcessNode['status'] => {
  if (nodes.some((node) => node.status === 'running')) return 'running';
  if (nodes.some((node) => node.failed || node.status === 'failed')) {
    return 'failed';
  }
  return 'finished';
};

export const getToolGroupActionKinds = (
  nodes: ConversationProcessNode[],
): ConversationToolActionKind[] => {
  const seen = new Set<ConversationToolActionKind>();
  const result: ConversationToolActionKind[] = [];
  nodes.forEach((node) => {
    const kind = getNodeToolActionKind(node);
    if (seen.has(kind)) return;
    seen.add(kind);
    result.push(kind);
  });
  return result;
};

const standaloneItem = (
  node: ConversationProcessNode,
): ConversationTraceItem => ({
  kind: node.kind === 'narration' ? 'narration' : 'standalone',
  id: node.id,
  node,
});

export function composeConversationTraceItems(
  nodes: ConversationProcessNode[],
  running: boolean,
): ConversationTraceItem[] {
  const items: ConversationTraceItem[] = [];
  let pendingTools: ConversationProcessNode[] = [];

  const flushTools = () => {
    if (!pendingTools.length) return;
    if (pendingTools.length === 1) {
      items.push(standaloneItem(pendingTools[0]));
    } else {
      items.push({
        kind: 'tool-group',
        id: `tool-group:${pendingTools[0].id}`,
        nodes: pendingTools,
        actionKinds: getToolGroupActionKinds(pendingTools),
        status: getToolGroupStatus(pendingTools),
        active: false,
      });
    }
    pendingTools = [];
  };

  nodes.forEach((node) => {
    if (isGroupableToolNode(node)) {
      pendingTools.push(node);
      return;
    }
    flushTools();
    items.push(standaloneItem(node));
  });
  flushTools();

  const lastItemIndex = items.length - 1;
  return items.map((item, index) =>
    item.kind === 'tool-group'
      ? { ...item, active: running && index === lastItemIndex }
      : item,
  );
}

/** 是否存在可逐层展开的有效详情；空协议节点不渲染假箭头。 */
export const hasProcessNodeDetail = (
  node: ConversationProcessNode,
): boolean => {
  if (node.kind === 'reasoning') return Boolean(node.thinkText?.trim());
  if (node.kind === 'context' || node.kind === 'unknown') {
    return Boolean(node.text?.trim());
  }
  if (node.kind === 'completed-interaction') {
    return Boolean(
      node.interaction?.title?.trim() ||
        node.interaction?.answerSummary?.trim(),
    );
  }
  if (
    node.kind === 'tool' ||
    node.kind === 'subagent' ||
    node.kind === 'plan'
  ) {
    const detail = normalizeV2ToolDetail({
      componentType: node.processing?.type ?? node.componentType,
      name: node.processing?.name ?? node.title,
      result: node.processing?.result,
    });
    return Boolean(
      detail.command ||
        detail.description ||
        detail.filePath ||
        detail.query ||
        detail.url ||
        detail.resultTitle ||
        detail.resultSummary ||
        detail.skillContent ||
        typeof detail.exitCode === 'number' ||
        detail.inputText ||
        detail.output ||
        detail.steps.length ||
        detail.diffs.length,
    );
  }
  return false;
};
