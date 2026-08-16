/**
 * 会话双线切换 flag 合同测试（双线方案 §3.3）。
 * 优先级：URL param > localStorage > 构建常量默认（legacy）。
 */
import {
  CONVERSATION_RUNTIME_DEFAULT,
  isConversationRuntimeEnabled,
  setConversationRuntimeEnabled,
} from '@/utils/conversationRuntimeFlag';
import { afterEach, describe, expect, it, vi } from 'vitest';

const setSearch = (search: string) => {
  window.history.replaceState(null, '', search || location.pathname);
};

describe('conversationRuntimeFlag', () => {
  afterEach(() => {
    localStorage.clear();
    setSearch('');
    vi.restoreAllMocks();
  });

  it('默认 legacy：不设置任何开关时为 false', () => {
    expect(CONVERSATION_RUNTIME_DEFAULT).toBe(false);
    expect(isConversationRuntimeEnabled()).toBe(false);
  });

  it('localStorage 开启后粘性生效', () => {
    setConversationRuntimeEnabled(true);
    expect(isConversationRuntimeEnabled()).toBe(true);

    setConversationRuntimeEnabled(false);
    expect(isConversationRuntimeEnabled()).toBe(false);
  });

  it('URL param 覆盖 localStorage：?conversationRuntime=1 强制新线', () => {
    setConversationRuntimeEnabled(false);
    setSearch('?conversationRuntime=1');
    expect(isConversationRuntimeEnabled()).toBe(true);
  });

  it('URL param 显式关闭：?conversationRuntime=0 压过 localStorage=true', () => {
    setConversationRuntimeEnabled(true);
    setSearch('?conversationRuntime=0');
    expect(isConversationRuntimeEnabled()).toBe(false);
  });

  it('清除 localStorage 回落默认 legacy', () => {
    setConversationRuntimeEnabled(true);
    setConversationRuntimeEnabled(null);
    expect(isConversationRuntimeEnabled()).toBe(false);
  });
});
