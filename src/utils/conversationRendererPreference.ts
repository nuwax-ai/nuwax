/**
 * V2 会话渲染器偏好存取（specs/nuwax-conversation-renderer-v2.md「配置优先级」）。
 *
 * 优先级：URL `conversationRenderer=v1|v2` > 会话覆盖（可清除）> 全局偏好 > 构建默认 V2。
 * 独立 localStorage 键，不迁移不复用旧 `conversation_density`（V1 三档密度行为原样保留）。
 * 变更通过 CustomEvent 广播，模式与 conversationDensity.ts 一致，渲染层即时生效。
 */
import type {
  ConversationProcessNodeKind,
  ConversationRenderPreferencesV2,
  ConversationRendererPreset,
  NodePresentationMode,
} from '@/features/conversation/presentation-v2';
import {
  DEFAULT_V2_PRESET,
  isNodePresentationMode,
  isRendererPreset,
} from '@/features/conversation/presentation-v2';

export type ConversationRendererVersion = 'v1' | 'v2';

/** 发布默认值：V2 默认开启（可随时按三级路径退回 V1） */
export const CONVERSATION_RENDERER_DEFAULT: ConversationRendererVersion = 'v2';

const URL_PARAM = 'conversationRenderer';
const VERSION_STORAGE_KEY = 'conversation_renderer_v2';
const PRESET_STORAGE_KEY = 'conversation_renderer_v2_preset';
const NODE_OVERRIDES_STORAGE_KEY = 'conversation_renderer_v2_node_overrides';
const SESSION_OVERRIDES_STORAGE_KEY =
  'conversation_renderer_v2_session_overrides';

export const CONVERSATION_RENDERER_EVENT = 'conversation-renderer-v2-changed';

const readFromLocation = (): ConversationRendererVersion | undefined => {
  try {
    const match = window.location.search.match(
      new RegExp(`[?&]${URL_PARAM}=([^&]*)`),
    );
    if (!match) return undefined;
    const value = decodeURIComponent(match[1]);
    return value === 'v1' || value === 'v2' ? value : undefined;
  } catch {
    return undefined;
  }
};

const readGlobalVersion = (): ConversationRendererVersion | undefined => {
  try {
    const value = localStorage.getItem(VERSION_STORAGE_KEY);
    return value === 'v1' || value === 'v2' ? value : undefined;
  } catch {
    return undefined;
  }
};

const readSessionOverrides = (): Record<
  string,
  ConversationRendererVersion
> => {
  try {
    const raw = localStorage.getItem(SESSION_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const result: Record<string, ConversationRendererVersion> = {};
    Object.entries(parsed as Record<string, unknown>).forEach(
      ([key, value]) => {
        if (value === 'v1' || value === 'v2') {
          result[key] = value;
        }
      },
    );
    return result;
  } catch {
    return {};
  }
};

const writeSessionOverrides = (
  overrides: Record<string, ConversationRendererVersion>,
): void => {
  try {
    if (Object.keys(overrides).length === 0) {
      localStorage.removeItem(SESSION_OVERRIDES_STORAGE_KEY);
    } else {
      localStorage.setItem(
        SESSION_OVERRIDES_STORAGE_KEY,
        JSON.stringify(overrides),
      );
    }
  } catch {
    // localStorage 不可用：降级为仅本次会话生效
  }
};

const broadcast = (): void => {
  window.dispatchEvent(new CustomEvent(CONVERSATION_RENDERER_EVENT));
};

/** 解析当前生效的渲染器版本（即时求值，供 hook 与调试） */
export function resolveConversationRenderer(
  conversationId?: number | string | null,
): ConversationRendererVersion {
  const sessionKey =
    conversationId === null || conversationId === undefined
      ? null
      : String(conversationId);
  const sessionOverride = sessionKey
    ? readSessionOverrides()[sessionKey]
    : undefined;
  return (
    readFromLocation() ??
    sessionOverride ??
    readGlobalVersion() ??
    CONVERSATION_RENDERER_DEFAULT
  );
}

/** 会话覆盖来源说明（UI 展示「本会话已单独设置」时使用） */
export function getSessionRendererOverride(
  conversationId: number | string | null | undefined,
): ConversationRendererVersion | undefined {
  if (conversationId === null || conversationId === undefined) return undefined;
  return readSessionOverrides()[String(conversationId)];
}

export function setGlobalRendererVersion(
  value: ConversationRendererVersion | null,
): void {
  try {
    if (value === null) {
      localStorage.removeItem(VERSION_STORAGE_KEY);
    } else {
      localStorage.setItem(VERSION_STORAGE_KEY, value);
    }
  } catch {
    // ignore
  }
  broadcast();
}

export function setSessionRendererOverride(
  conversationId: number | string,
  value: ConversationRendererVersion | null,
): void {
  const key = String(conversationId);
  const overrides = readSessionOverrides();
  if (value === null) {
    delete overrides[key];
  } else {
    overrides[key] = value;
  }
  writeSessionOverrides(overrides);
  broadcast();
}

/** 读取 V2 偏好（预设 + 逐类高级覆盖） */
export function loadConversationRendererPreferences(): ConversationRenderPreferencesV2 {
  let preset: ConversationRendererPreset = DEFAULT_V2_PRESET;
  let nodeOverrides: Partial<
    Record<ConversationProcessNodeKind, NodePresentationMode>
  > = {};
  try {
    const rawPreset = localStorage.getItem(PRESET_STORAGE_KEY);
    if (isRendererPreset(rawPreset)) {
      preset = rawPreset;
    }
    const rawOverrides = localStorage.getItem(NODE_OVERRIDES_STORAGE_KEY);
    if (rawOverrides) {
      const parsed = JSON.parse(rawOverrides);
      if (parsed && typeof parsed === 'object') {
        const next: Partial<
          Record<ConversationProcessNodeKind, NodePresentationMode>
        > = {};
        Object.entries(parsed as Record<string, unknown>).forEach(
          ([kind, mode]) => {
            if (isNodePresentationMode(mode)) {
              next[kind as ConversationProcessNodeKind] = mode;
            }
          },
        );
        nodeOverrides = next;
      }
    }
  } catch {
    // 解析失败回落默认偏好
  }
  return { preset, nodeOverrides };
}

export function saveRendererPreset(preset: ConversationRendererPreset): void {
  try {
    localStorage.setItem(PRESET_STORAGE_KEY, preset);
  } catch {
    // ignore
  }
  broadcast();
}

/** 单类覆盖（mode=null 清除该类，回落预设） */
export function saveRendererNodeOverride(
  kind: ConversationProcessNodeKind,
  mode: NodePresentationMode | null,
): void {
  const preferences = loadConversationRendererPreferences();
  const next = { ...preferences.nodeOverrides };
  if (mode === null) {
    delete next[kind];
  } else {
    next[kind] = mode;
  }
  try {
    localStorage.setItem(NODE_OVERRIDES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  broadcast();
}
