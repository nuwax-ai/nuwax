/** R-GROUP / R-VISIBILITY：先按真实时间线分组，再过滤，最后关联过程段。 */
import { splitNodesByVisibility } from './renderPreferences';
import {
  composeConversationTraceItems,
  getToolGroupActionKinds,
  getToolGroupStatus,
  isOpenUiRenderElementNode,
} from './traceItems';
import { composeConversationTraceSegments } from './traceSegments';
import type {
  ConversationRenderPreferencesV2,
  ConversationTraceItem,
  ConversationTurnPresentationV2,
} from './types';

export function buildTraceViewModel(
  turn: Pick<
    ConversationTurnPresentationV2,
    'nodes' | 'running' | 'finalAnswer'
  >,
  preferences: ConversationRenderPreferencesV2,
  revealHidden: boolean,
) {
  const traceItems = composeConversationTraceItems(
    turn.nodes,
    turn.running && !turn.finalAnswer.text.trim(),
  );
  const segments = composeConversationTraceSegments(turn);
  const { visibleNodes, hiddenCount } = splitNodesByVisibility(
    turn.nodes,
    preferences,
  );
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const shownItems = revealHidden
    ? traceItems
    : traceItems.flatMap<ConversationTraceItem>((item) => {
        if (item.kind !== 'tool-group')
          return visibleIds.has(item.node.id) ? [item] : [];
        const nodes = item.nodes.filter((node) => visibleIds.has(node.id));
        if (!nodes.length) return [];
        return [
          {
            ...item,
            nodes,
            actionKinds: getToolGroupActionKinds(nodes),
            status: getToolGroupStatus(nodes),
          },
        ];
      });

  const segmentByNode = new Map<string, string>();
  segments.forEach((segment) => {
    if (segment.kind === 'process-segment') {
      segment.nodes.forEach((node) => segmentByNode.set(node.id, segment.id));
    }
  });
  const itemsBySegment = new Map<string, ConversationTraceItem[]>();
  shownItems.forEach((item) => {
    const node = item.kind === 'tool-group' ? item.nodes[0] : item.node;
    const segmentId = segmentByNode.get(node.id);
    if (!segmentId) return;
    const items = itemsBySegment.get(segmentId) ?? [];
    items.push(item);
    itemsBySegment.set(segmentId, items);
  });

  return {
    hiddenCount,
    // 活动状态来自过滤前的时间线，隐藏思考仍会结束旧工具组。
    activeGroupIds: traceItems
      .filter((item) => item.kind === 'tool-group' && item.active)
      .map((item) => item.id),
    activeSegmentId: segments.find(
      (segment) => segment.kind === 'process-segment' && segment.active,
    )?.id,
    hiddenSegmentIds: segments
      .filter(
        (segment) =>
          segment.kind === 'process-segment' &&
          segment.nodes.some((node) => !visibleIds.has(node.id)),
      )
      .map((segment) => segment.id),
    segments: segments.map((segment) => {
      if (segment.kind === 'narration') return segment;
      const items = itemsBySegment.get(segment.id) ?? [];
      return {
        ...segment,
        items,
        canCollapse:
          items.reduce(
            (count, item) =>
              count + (item.kind === 'tool-group' ? item.nodes.length : 1),
            0,
          ) > 1,
        failed: segment.nodes.some(
          (node) => node.failed || node.status === 'failed',
        ),
        // R-OPENUI：常显产物保留父路径，折叠过程时不卸载表单/iframe。
        hasPersistentContent: items.some(
          (item) =>
            item.kind === 'standalone' && isOpenUiRenderElementNode(item.node),
        ),
      };
    }),
  };
}

export type TraceViewModel = ReturnType<typeof buildTraceViewModel>;
