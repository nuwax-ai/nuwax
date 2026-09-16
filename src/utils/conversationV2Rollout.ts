import {
  clearAllSessionRendererOverrides,
  setGlobalRendererVersion,
} from './conversationRendererPreference';
import { setConversationRuntimeEnabled } from './conversationRuntimeFlag';

/**
 * 会话 V2 默认值的一次性发版迁移。
 *
 * 首次启动时清理历史 legacy/V1 锁定，让新默认生效；标记写入后，
 * 用户后续显式选择 legacy/V1 会被保留。URL 调试覆盖不在存储中，一直保持最高优先级。
 */
export const CONVERSATION_V2_ROLLOUT_VERSION = '2026.09.30-v1';
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
    setGlobalRendererVersion(null);
    clearAllSessionRendererOverrides();
    localStorage.setItem(ROLLOUT_STORAGE_KEY, CONVERSATION_V2_ROLLOUT_VERSION);
    return true;
  } catch {
    // 不写标记，下次启动在 localStorage 可用时继续尝试。
    return false;
  }
}
