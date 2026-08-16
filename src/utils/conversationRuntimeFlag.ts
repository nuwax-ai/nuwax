/**
 * 会话双线切换 flag（docs/conversation-dual-track-plan.md §3.3）。
 *
 * 优先级：URL param > localStorage > 构建常量默认。
 * 默认 legacy（false）：不启用时线上行为与旧线完全一致，新线代码不被入口消费。
 * 运行时整体切换：改 URL `?conversationRuntime=1` 或 localStorage，无需发版。
 */

/** 发布默认值：R6 默认值决策前保持 legacy */
export const CONVERSATION_RUNTIME_DEFAULT = false;

const URL_PARAM = 'conversationRuntime';
const STORAGE_KEY = 'conversation_runtime_enabled';

const readFromLocation = (): boolean | undefined => {
  try {
    const match = window.location.search.match(
      new RegExp(`[?&]${URL_PARAM}=([^&]*)`),
    );
    if (!match) {
      return undefined;
    }
    return !['0', 'false', ''].includes(decodeURIComponent(match[1]));
  } catch {
    return undefined;
  }
};

const readFromStorage = (): boolean | undefined => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === null) {
      return undefined;
    }
    return value === '1' || value === 'true';
  } catch {
    return undefined;
  }
};

/** 当前会话是否启用新线（runtime session）。每次调用即时求值。 */
export function isConversationRuntimeEnabled(): boolean {
  return (
    readFromLocation() ?? readFromStorage() ?? CONVERSATION_RUNTIME_DEFAULT
  );
}

/** 用户级粘性开启/关闭（写 localStorage；传 null 清除回落默认） */
export function setConversationRuntimeEnabled(value: boolean | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    // localStorage 不可用（隐私模式等）：忽略，回落 URL/默认值
  }
}
