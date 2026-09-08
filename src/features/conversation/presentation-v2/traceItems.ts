/**
 * V2 轨迹展示编排：原子过程节点 → 正文 / 独立节点 / 连续工具组。
 *
 * 分组在预设过滤之前完成，保证被 focused 隐藏的思考、上下文仍能切断
 * 前后工具组；本模块为纯函数，不持有 React 展开状态。
 */
import { getToolPresentationKind } from '@/components/MarkdownCustomProcess/toolPresentation';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { normalizeV2ToolDetail } from './toolDetail';
import type {
  ConversationProcessNode,
  ConversationToolActionKind,
  ConversationTraceItem,
} from './types';

const OPEN_UI_NAME = /nuwax_render_openui|Backend\.Sandbox\.Event\.renderUI/i;

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
  const componentType = node.processing?.type ?? node.componentType;
  const name = node.processing?.name ?? node.title;
  return (
    componentType === AgentComponentTypeEnum.Event && OPEN_UI_NAME.test(name)
  );
};

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
