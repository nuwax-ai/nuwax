/** 折叠状态的 React 绑定；规则与转换集中在 traceDisclosureState.ts。 */
import { useEffect, useReducer } from 'react';
import {
  createTraceDisclosureState,
  reduceTraceDisclosure,
  resolveProcessNodeExpanded,
  resolveSegmentDisclosure,
  resolveToolGroupExpanded,
} from '../traceDisclosureState';
import type { TraceViewModel } from '../traceViewModel';
import type {
  ConversationProcessNode,
  ConversationRenderPreferencesV2,
  ConversationTraceItem,
} from '../types';

type ToolGroup = Extract<ConversationTraceItem, { kind: 'tool-group' }>;
type ProcessSegment = Extract<
  TraceViewModel['segments'][number],
  { kind: 'process-segment' }
>;

export function useTraceDisclosure(
  model: TraceViewModel,
  nodes: ConversationProcessNode[],
  preferences: ConversationRenderPreferencesV2,
  running: boolean,
  traceExpanded: boolean,
) {
  const { activeGroupIds, activeSegmentId } = model;
  const [state, dispatch] = useReducer(
    reduceTraceDisclosure,
    { activeGroupIds, activeSegmentId },
    createTraceDisclosureState,
  );
  useEffect(() => {
    dispatch({ type: 'activity-changed', activeGroupIds, activeSegmentId });
  }, [activeGroupIds, activeSegmentId]);

  return {
    nodeIsExpanded: (node: ConversationProcessNode) =>
      resolveProcessNodeExpanded(node, preferences, state.nodes[node.id]),
    toggleNode: (id: string) => {
      const node = nodes.find((item) => item.id === id);
      dispatch({
        type: 'toggle',
        scope: 'nodes',
        id,
        defaultExpanded: node
          ? resolveProcessNodeExpanded(node, preferences)
          : false,
      });
    },
    groupIsExpanded: (group: ToolGroup) =>
      resolveToolGroupExpanded(group.active, state.groups[group.id]),
    toggleGroup: (group: ToolGroup) =>
      dispatch({
        type: 'toggle',
        scope: 'groups',
        id: group.id,
        defaultExpanded: group.active,
      }),
    segmentDisclosure: (segment: ProcessSegment) =>
      resolveSegmentDisclosure({
        running,
        traceExpanded,
        active: segment.active,
        canCollapse: segment.canCollapse,
        hasPersistentContent: segment.hasPersistentContent,
        manualExpanded: state.segments[segment.id],
      }),
    toggleSegment: (id: string, expanded: boolean) =>
      dispatch({
        type: 'toggle',
        scope: 'segments',
        id,
        defaultExpanded: expanded,
      }),
    revealSegments: () =>
      dispatch({ type: 'reveal-segments', ids: model.hiddenSegmentIds }),
  };
}
