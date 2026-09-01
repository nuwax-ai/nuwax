/**
 * V2 可控会话渲染 · 投影纯函数层出口（无 React 依赖）。
 * React 层入口见 ./react；页面/组件消费约定见 eslint no-restricted-imports。
 */
export { parseMessageSegments, stripCustomTags } from './parseMessageSegments';
export { projectConversation } from './projectConversation';
export {
  DEFAULT_V2_PRESET,
  PRESET_NODE_MODES,
  PROCESS_NODE_KINDS,
  defaultTraceExpanded,
  isNodePresentationMode,
  isRendererPreset,
  resolveNodeMode,
  splitNodesByVisibility,
} from './renderPreferences';
export type { RowNodeKind } from './renderPreferences';
export type {
  CompletedInteractionPayload,
  ConversationFinalAnswer,
  ConversationPresentationV2,
  ConversationProcessNode,
  ConversationProcessNodeKind,
  ConversationRenderPreferencesV2,
  ConversationRendererPreset,
  ConversationTurnPresentationV2,
  NodePresentationMode,
} from './types';
