import type { ConversationRenderPreferencesV2 } from '@/features/conversation/presentation-v2';
import { DEFAULT_V2_PRESET } from '@/features/conversation/presentation-v2';

export type ConversationRendererVersion = 'v1' | 'v2';

/** 发布默认值：V2 默认开启，URL 参数仅用于临时调试回退。 */
export const CONVERSATION_RENDERER_DEFAULT: ConversationRendererVersion = 'v2';

const URL_PARAM = 'conversationRenderer';

export const CONVERSATION_RENDERER_EVENT = 'conversation-renderer-v2-changed';

const LEGACY_DEBUG_STORAGE_KEYS = [
  'conversation_renderer_v2',
  'conversation_renderer_v2_preset',
  'conversation_renderer_v2_node_overrides',
  'conversation_renderer_v2_session_overrides',
  'conversation_density',
  'conversation_page_cache_capacity',
] as const;

const readFromLocation = (
  routeSearch?: string,
): ConversationRendererVersion | undefined => {
  try {
    const match = (routeSearch ?? window.location.search).match(
      new RegExp(`[?&]${URL_PARAM}=([^&]*)`),
    );
    if (!match) return undefined;
    const value = decodeURIComponent(match[1]);
    return value === 'v1' || value === 'v2' ? value : undefined;
  } catch {
    return undefined;
  }
};

export function resolveConversationRenderer(
  routeSearch?: string,
): ConversationRendererVersion {
  return readFromLocation(routeSearch) ?? CONVERSATION_RENDERER_DEFAULT;
}

/** 写入 URL 调试覆盖并广播，让已挂载的渲染 hook 即时切换。 */
export function setConversationRendererUrlOverride(
  value: ConversationRendererVersion,
): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(URL_PARAM, value);
    window.history.replaceState(window.history.state, '', url);
  } catch {
    // URL/history 不可用时仅广播，渲染器回落到当前地址或 V2 默认值。
  }
  window.dispatchEvent(new CustomEvent(CONVERSATION_RENDERER_EVENT));
}

/** V2 的运行默认展示设置；面板移除后不再读取持久化调试覆盖。 */
export function loadConversationRendererPreferences(): ConversationRenderPreferencesV2 {
  return { preset: DEFAULT_V2_PRESET, nodeOverrides: {} };
}

/** 清除旧调试面板写入的渲染、密度和缓存容量设置。 */
export function clearLegacyConversationDebugSettings(): void {
  try {
    LEGACY_DEBUG_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}
