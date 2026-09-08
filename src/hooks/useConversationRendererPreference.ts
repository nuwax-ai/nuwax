import type {
  ConversationProcessNodeKind,
  ConversationRenderPreferencesV2,
  ConversationRendererPreset,
  NodePresentationMode,
} from '@/features/conversation/presentation-v2';
import {
  CONVERSATION_RENDERER_EVENT,
  getSessionRendererOverride,
  loadConversationRendererPreferences,
  resolveConversationRendererDetails,
  saveRendererNodeOverride,
  saveRendererPreset,
  setGlobalRendererVersion,
  setSessionRendererOverride,
  type ConversationRendererSource,
  type ConversationRendererVersion,
} from '@/utils/conversationRendererPreference';
import { useCallback, useEffect, useState } from 'react';

/**
 * V2 会话渲染器偏好 hook：渲染器版本（V1/V2，URL>会话覆盖>全局>默认 V2）
 * 与 V2 偏好（预设 + 逐类覆盖）。变更经全局事件跨组件同步，
 * 输入区「会话显示」入口设置后消息列表即时切换渲染器。
 */
export const useConversationRendererPreference = (
  conversationId?: number | string | null,
): {
  renderer: ConversationRendererVersion;
  globalVersion: ConversationRendererVersion;
  source: ConversationRendererSource;
  preferences: ConversationRenderPreferencesV2;
  sessionOverride: ConversationRendererVersion | undefined;
  setGlobalVersion: (value: ConversationRendererVersion) => void;
  setPreset: (preset: ConversationRendererPreset) => void;
  setNodeOverride: (
    kind: ConversationProcessNodeKind,
    mode: NodePresentationMode | null,
  ) => void;
  setSessionVersion: (value: ConversationRendererVersion | null) => void;
} => {
  const [rendererDetails, setRendererDetails] = useState(() =>
    resolveConversationRendererDetails(conversationId),
  );
  const [sessionOverride, setSessionOverrideState] = useState<
    ConversationRendererVersion | undefined
  >(() => getSessionRendererOverride(conversationId));
  const [preferences, setPreferencesState] =
    useState<ConversationRenderPreferencesV2>(
      loadConversationRendererPreferences,
    );

  useEffect(() => {
    // 会话切换后重读（URL/覆盖均按 conversationId 求值）
    setRendererDetails(resolveConversationRendererDetails(conversationId));
    setSessionOverrideState(getSessionRendererOverride(conversationId));
  }, [conversationId]);

  useEffect(() => {
    const sync = () => {
      setRendererDetails(resolveConversationRendererDetails(conversationId));
      setSessionOverrideState(getSessionRendererOverride(conversationId));
      setPreferencesState(loadConversationRendererPreferences());
    };
    window.addEventListener(CONVERSATION_RENDERER_EVENT, sync);
    return () => window.removeEventListener(CONVERSATION_RENDERER_EVENT, sync);
  }, [conversationId]);

  const setGlobalVersion = useCallback((value: ConversationRendererVersion) => {
    setGlobalRendererVersion(value);
  }, []);

  const setPreset = useCallback((preset: ConversationRendererPreset) => {
    setPreferencesState((prev) => ({ ...prev, preset }));
    saveRendererPreset(preset);
  }, []);

  const setNodeOverride = useCallback(
    (kind: ConversationProcessNodeKind, mode: NodePresentationMode | null) => {
      setPreferencesState((prev) => {
        const next = { ...prev.nodeOverrides };
        if (mode === null) {
          delete next[kind];
        } else {
          next[kind] = mode;
        }
        return { ...prev, nodeOverrides: next };
      });
      saveRendererNodeOverride(kind, mode);
    },
    [],
  );

  const setSessionVersion = useCallback(
    (value: ConversationRendererVersion | null) => {
      if (conversationId === null || conversationId === undefined) return;
      setSessionRendererOverride(conversationId, value);
    },
    [conversationId],
  );

  return {
    renderer: rendererDetails.renderer,
    globalVersion: rendererDetails.globalVersion,
    source: rendererDetails.source,
    preferences,
    sessionOverride,
    setGlobalVersion,
    setPreset,
    setNodeOverride,
    setSessionVersion,
  };
};
