import {
  loadConversationRendererPreferences,
  resolveConversationRenderer,
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

  it('首次启动清理旧调试设置并启用 V2 默认', () => {
    setConversationRuntimeEnabled(false);
    localStorage.setItem('conversation_renderer_v2', 'v1');
    localStorage.setItem('conversation_renderer_v2_preset', 'detailed');
    localStorage.setItem('conversation_density', 'detailed');
    localStorage.setItem('conversation_page_cache_capacity', '1');
    localStorage.setItem(
      'conversation_renderer_v2_session_overrides',
      JSON.stringify({ 42: 'v1' }),
    );

    expect(migrateConversationDefaultsToV2()).toBe(true);
    expect(isConversationRuntimeEnabled()).toBe(true);
    expect(resolveConversationRenderer()).toBe('v2');
    expect(loadConversationRendererPreferences().preset).toBe('balanced');
    expect(localStorage.getItem('conversation_renderer_v2')).toBeNull();
    expect(
      localStorage.getItem('conversation_renderer_v2_session_overrides'),
    ).toBeNull();
    expect(localStorage.getItem('conversation_density')).toBeNull();
    expect(localStorage.getItem('conversation_page_cache_capacity')).toBeNull();
    expect(localStorage.getItem('conversation_v2_rollout_version')).toBe(
      CONVERSATION_V2_ROLLOUT_VERSION,
    );
  });

  it('同版本只迁移一次，不重复重置运行时设置', () => {
    expect(migrateConversationDefaultsToV2()).toBe(true);
    setConversationRuntimeEnabled(false);

    expect(migrateConversationDefaultsToV2()).toBe(false);
    expect(isConversationRuntimeEnabled()).toBe(false);
    expect(resolveConversationRenderer()).toBe('v2');
  });

  it('URL 紧急回退仍保持最高优先级', () => {
    window.history.replaceState(
      null,
      '',
      '?conversationRuntime=0&conversationRenderer=v1',
    );
    migrateConversationDefaultsToV2();
    expect(isConversationRuntimeEnabled()).toBe(false);
    expect(resolveConversationRenderer()).toBe('v1');
  });
});
