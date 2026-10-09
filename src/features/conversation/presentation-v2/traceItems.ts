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

const PLAN_STEP_STATUSES: ReadonlySet<string> = new Set([
  'completed',
  'in_progress',
  'pending',
  'failed',
]);

/** 步骤条目归一：非数组或无有效项（content 非字符串）返回 null */
const normalizePlanStepEntries = (
  entries: unknown,
): ConversationPlanStep[] | null => {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const steps: ConversationPlanStep[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const step = entry as { status?: unknown; content?: unknown };
    if (typeof step.content !== 'string' || !step.content.trim()) continue;
    steps.push({
      status: PLAN_STEP_STATUSES.has(step.status as string)
        ? (step.status as ConversationPlanStep['status'])
        : 'pending',
      content: step.content,
    });
  }
  return steps.length > 0 ? steps : null;
};

const safeJsonParse = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

/** content 包裹文本：data[0] = {type:'content', content:{type:'text', text}} */
const readContentText = (data: unknown): string | null => {
  if (!Array.isArray(data) || data.length === 0) return null;
  const text = (data[0] as { content?: { text?: unknown } } | null)?.content
    ?.text;
  return typeof text === 'string' && text.trim() ? text : null;
};

/**
 * 提取任务清单步骤，按优先级尝试三种载体：
 * 1) Plan 组件契约：result.data = [{status, content}]（与 V1
 *    MarkdownCustomProcess 任务列表、utils getPlanProgress 同源契约）；
 * 2) deepagents TodoWrite：下发 type=ToolCall、清单在 input.todos
 *    （input 可能是对象或 JSON 字符串）；
 * 3) 兜底：result.data[0].content.text 为清单 JSON 文本（数组或 {todos:[...]}）。
 * 全部无有效项返回 null，调用方回落普通轨迹行。
 */
export const readPlanSteps = (
  result: unknown,
): ConversationPlanStep[] | null => {
  const record =
    result && typeof result === 'object'
      ? (result as { data?: unknown; input?: unknown })
      : null;
  const fromData = normalizePlanStepEntries(record?.data);
  if (fromData) return fromData;
  const rawInput = record?.input;
  const parsedInput =
    typeof rawInput === 'string' ? safeJsonParse(rawInput) : rawInput;
  const inputTodos =
    parsedInput && typeof parsedInput === 'object'
      ? (parsedInput as { todos?: unknown }).todos
      : undefined;
  const fromInput = normalizePlanStepEntries(inputTodos);
  if (fromInput) return fromInput;
  const text = readContentText(record?.data);
  if (text) {
    const parsed = safeJsonParse(text);
    const fromText = normalizePlanStepEntries(
      Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object'
        ? (parsed as { todos?: unknown }).todos
        : undefined,
    );
    if (fromText) return fromText;
  }
  return null;
};

export const getNodeToolActionKind = (
  node: ConversationProcessNode,
): ConversationToolActionKind =>
  getToolPresentationKind({
    componentType: node.processing?.type ?? node.componentType,
    name: node.processing?.name ?? node.title,
    result: node.processing?.result,
  });

/**
 * 待办卡接管判定：节点语义是计划且能提取非空结构化步骤（否则回落
 * ProcessNodeRow）。语义计划 = Plan 组件节点，或名称命中 todo 启发式的
 * 工具节点（deepagents TodoWrite 的 ToolCall 调用；启发式与行文案
 * 「已更新计划」同源，语义上本就是计划更新）。
 */
export const isTodoTraceNode = (node: ConversationProcessNode): boolean =>
  (node.kind === 'plan' ||
    (node.kind === 'tool' && getNodeToolActionKind(node) === 'todo')) &&
  readPlanSteps(node.processing?.result) !== null;

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
