/** 正常正文分隔的连续过程段；在偏好过滤前分段，保持真实顺序和稳定键。 */
import type {
  ConversationProcessNode,
  ConversationTurnPresentationV2,
} from './types';

export type ConversationTraceSegment =
  | { kind: 'narration'; id: string; node: ConversationProcessNode }
  | {
      kind: 'process-segment';
      id: string;
      nodes: ConversationProcessNode[];
      active: boolean;
      metrics: Pick<
        ConversationTurnPresentationV2['metrics'],
        'toolCount' | 'messageCount' | 'elapsedMs'
      >;
    };

const getSegmentMetrics = (
  nodes: ConversationProcessNode[],
): Extract<
  ConversationTraceSegment,
  { kind: 'process-segment' }
>['metrics'] => {
  const toolIds = new Set(
    nodes
      .filter((node) => node.kind === 'tool' || node.kind === 'subagent')
      .map((node) => node.executeId ?? node.id),
  );
  const messageCount = nodes.filter(
    (node) =>
      node.kind === 'reasoning' ||
      node.kind === 'context' ||
      node.kind === 'completed-interaction',
  ).length;
  // 仅使用同一节点内的完整可信时间窗，不把缺少起止的不同节点拼成耗时。
  const timedNodes = nodes.filter(
    (node) =>
      Number.isFinite(node.startTime) &&
      Number.isFinite(node.endTime) &&
      node.endTime! >= node.startTime!,
  );
  const elapsedMs = timedNodes.length
    ? Math.max(...timedNodes.map((node) => node.endTime!)) -
      Math.min(...timedNodes.map((node) => node.startTime!))
    : undefined;
  return { toolCount: toolIds.size, messageCount, elapsedMs };
};

export function composeConversationTraceSegments(
  turn: Pick<
    ConversationTurnPresentationV2,
    'nodes' | 'running' | 'finalAnswer'
  >,
): ConversationTraceSegment[] {
  const segments: ConversationTraceSegment[] = [];
  let pending: ConversationProcessNode[] = [];
  const flush = () => {
    if (!pending.length) return;
    segments.push({
      kind: 'process-segment',
      id: `trace-segment:${pending[0].id}`,
      nodes: pending,
      active: false,
      metrics: getSegmentMetrics(pending),
    });
    pending = [];
  };

  turn.nodes.forEach((node) => {
    if (node.kind !== 'narration') {
      pending.push(node);
      return;
    }
    flush();
    segments.push({ kind: 'narration', id: node.id, node });
  });
  flush();
  const tail = segments[segments.length - 1];
  if (tail?.kind === 'process-segment') {
    // 最新流式正文被投影到 finalAnswer，不一定出现在 narration 序列中。
    tail.active = turn.running && !turn.finalAnswer.text.trim();
  }
  return segments;
}
