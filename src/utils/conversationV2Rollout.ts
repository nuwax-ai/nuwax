import { clearLegacyConversationDebugSettings } from './conversationRendererPreference';
import { setConversationRuntimeEnabled } from './conversationRuntimeFlag';

/**
 * 会话 V2 默认值的一次性发版迁移。
 *
 * 首次启动时清理开发期面板写入的渲染、密度和缓存容量设置，让 V2 默认生效。
 * URL 调试覆盖不在存储中，仍保持最高优先级。
 */
export const CONVERSATION_V2_ROLLOUT_VERSION = '2026.09.30-v2';
const ROLLOUT_STORAGE_KEY = 'conversation_v2_rollout_version';

export function migrateConversationDefaultsToV2(): boolean {
  try {
    if (
      localStorage.getItem(ROLLOUT_STORAGE_KEY) ===
      CONVERSATION_V2_ROLLOUT_VERSION
    ) {
      return false;
    }

    setConversationRuntimeEnabled(null);
    clearLegacyConversationDebugSettings();
    localStorage.setItem(ROLLOUT_STORAGE_KEY, CONVERSATION_V2_ROLLOUT_VERSION);
    return true;
  } catch {
    // 不写标记，下次启动在 localStorage 可用时继续尝试。
    return false;
  }
}
