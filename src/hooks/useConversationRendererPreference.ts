import type { ConversationRenderPreferencesV2 } from '@/features/conversation/presentation-v2';
import {
  CONVERSATION_RENDERER_EVENT,
  loadConversationRendererPreferences,
  resolveConversationRenderer,
  type ConversationRendererVersion,
} from '@/utils/conversationRendererPreference';
import { useContext, useEffect, useState } from 'react';
import { ConversationRendererRouteSearchContext } from './ConversationRendererRouteSearchContext';

/** URL 调试参数变化时，同步更新当前渲染器。 */
export const useConversationRendererPreference = (): {
  renderer: ConversationRendererVersion;
  preferences: ConversationRenderPreferencesV2;
} => {
  const routeSearch = useContext(ConversationRendererRouteSearchContext);
  const [renderer, setRenderer] = useState(() =>
    resolveConversationRenderer(routeSearch),
  );
  const [preferences] = useState(loadConversationRendererPreferences);

  useEffect(() => {
    const sync = () => {
      setRenderer(resolveConversationRenderer(routeSearch));
    };

    sync();
    window.addEventListener(CONVERSATION_RENDERER_EVENT, sync);
    return () => window.removeEventListener(CONVERSATION_RENDERER_EVENT, sync);
  }, [routeSearch]);

  return { renderer, preferences };
};
