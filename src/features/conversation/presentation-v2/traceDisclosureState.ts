/** R-DISCLOSURE：纯折叠规则与状态转换；普通 live/sub 共用，不依赖 React。 */
import { resolveNodeMode } from './renderPreferences';
import type {
  ConversationProcessNode,
  ConversationRenderPreferencesV2,
} from './types';

export interface TraceActivity {
  activeSegmentId?: string;
  activeGroupIds: readonly string[];
}

export interface TraceDisclosureState extends TraceActivity {
  nodes: Record<string, boolean>;
  groups: Record<string, boolean>;
  segments: Record<string, boolean>;
  autoCollapsedGroups: ReadonlySet<string>;
}

export const createTraceDisclosureState = (
  activity: TraceActivity,
): TraceDisclosureState => ({
  ...activity,
  nodes: {},
  groups: {},
  segments: {},
  autoCollapsedGroups: new Set(),
});

export type TraceDisclosureAction =
  | ({ type: 'activity-changed' } & TraceActivity)
  | {
      type: 'toggle';
      scope: 'nodes' | 'groups' | 'segments';
      id: string;
      defaultExpanded: boolean;
    }
  | { type: 'reveal-segments'; ids: readonly string[] };

export function reduceTraceDisclosure(
  state: TraceDisclosureState,
  action: TraceDisclosureAction,
): TraceDisclosureState {
  if (action.type === 'toggle') {
    return {
      ...state,
      [action.scope]: {
        ...state[action.scope],
        [action.id]: !(
          state[action.scope][action.id] ?? action.defaultExpanded
        ),
      },
    };
  }
  if (action.type === 'reveal-segments') {
    const segments = { ...state.segments };
    action.ids.forEach((id) => {
      segments[id] = true;
    });
    return { ...state, segments };
  }
  if (
    state.activeSegmentId === action.activeSegmentId &&
    state.activeGroupIds.length === action.activeGroupIds.length &&
    state.activeGroupIds.every(
      (id, index) => id === action.activeGroupIds[index],
    )
  )
    return state;

  const next: TraceDisclosureState = {
    ...state,
    activeSegmentId: action.activeSegmentId,
    activeGroupIds: action.activeGroupIds,
  };
  if (
    state.activeSegmentId &&
    state.activeSegmentId !== action.activeSegmentId
  ) {
    next.segments = { ...state.segments, [state.activeSegmentId]: false };
  }
  const currentGroups = new Set(action.activeGroupIds);
  const overtaken = state.activeGroupIds.filter(
    (id) => !currentGroups.has(id) && !state.autoCollapsedGroups.has(id),
  );
  if (overtaken.length) {
    const autoCollapsedGroups = new Set(state.autoCollapsedGroups);
    next.groups = { ...state.groups };
    overtaken.forEach((id) => {
      next.groups[id] = false;
      autoCollapsedGroups.add(id);
    });
    next.autoCollapsedGroups = autoCollapsedGroups;
  }
  return next;
}

export const resolveToolGroupExpanded = (
  active: boolean,
  manual?: boolean,
): boolean => manual ?? active;

export const resolveProcessNodeExpanded = (
  node: ConversationProcessNode,
  preferences: ConversationRenderPreferencesV2,
  manual?: boolean,
): boolean =>
  manual ??
  (resolveNodeMode(node, preferences) === 'expanded' &&
    node.status !== 'running');

export function resolveSegmentDisclosure(options: {
  running: boolean;
  traceExpanded: boolean;
  active: boolean;
  canCollapse: boolean;
  hasPersistentContent: boolean;
  manualExpanded?: boolean;
}) {
  const {
    running,
    traceExpanded,
    active,
    canCollapse,
    hasPersistentContent,
    manualExpanded,
  } = options;
  return {
    mounted: traceExpanded || hasPersistentContent,
    expanded: !running || !canCollapse || active || Boolean(manualExpanded),
    showToggle: traceExpanded && running && canCollapse && !active,
  };
}
