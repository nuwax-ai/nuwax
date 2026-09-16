import {
  getSessionRendererOverride,
  loadConversationRendererPreferences,
  resolveConversationRenderer,
  saveRendererPreset,
  setGlobalRendererVersion,
  setSessionRendererOverride,
} from '@/utils/conversationRendererPreference';
import {
  isConversationRuntimeEnabled,
  setConversationRuntimeEnabled,
} from '@/utils/conversationRuntimeFlag';
import {
  CONVERSATION_V2_ROLLOUT_VERSION,
  migrateConversationDefaultsToV2,
} from '@/utils/conversationV2Rollout';
import { beforeEach, describe, expect, it } from 'vitest';

describe('会话 V2 大版本一次性迁移', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', location.pathname);
  });

  it('首次启动清理历史 legacy/V1 锁定，保留 V2 展示偏好', () => {
    setConversationRuntimeEnabled(false);
    setGlobalRendererVersion('v1');
    setSessionRendererOverride(42, 'v1');
    saveRendererPreset('detailed');

    expect(migrateConversationDefaultsToV2()).toBe(true);
    expect(isConversationRuntimeEnabled()).toBe(true);
    expect(resolveConversationRenderer(42)).toBe('v2');
    expect(getSessionRendererOverride(42)).toBeUndefined();
    expect(loadConversationRendererPreferences().preset).toBe('detailed');
    expect(localStorage.getItem('conversation_v2_rollout_version')).toBe(
      CONVERSATION_V2_ROLLOUT_VERSION,
    );
  });

  it('同版本只迁移一次，后续用户显式回退会被保留', () => {
    expect(migrateConversationDefaultsToV2()).toBe(true);
    setConversationRuntimeEnabled(false);
    setGlobalRendererVersion('v1');
    setSessionRendererOverride(42, 'v1');

    expect(migrateConversationDefaultsToV2()).toBe(false);
    expect(isConversationRuntimeEnabled()).toBe(false);
    expect(resolveConversationRenderer(42)).toBe('v1');
  });

  it('URL 紧急回退仍保持最高优先级', () => {
    window.history.replaceState(
      null,
      '',
      '?conversationRuntime=0&conversationRenderer=v1',
    );
    migrateConversationDefaultsToV2();
    expect(isConversationRuntimeEnabled()).toBe(false);
    expect(resolveConversationRenderer(42)).toBe('v1');
  });
});
