/**
 * 会话密度设置（P1-6）单元测试：密度 → 折叠策略映射与偏好存取
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CONVERSATION_DENSITY_EVENT,
  CONVERSATION_DENSITY_STORAGE_KEY,
  loadConversationDensity,
  resolveDensityPolicy,
  saveConversationDensity,
} from '../conversationDensity';

describe('resolveDensityPolicy', () => {
  it('compact：流式中也收起 + 终态聚合 + 自动收起开启', () => {
    expect(resolveDensityPolicy('compact')).toEqual({
      collapseDuringStreaming: true,
      terminalAggregate: true,
      collapseTerminal: true,
      autoCollapseEnabled: true,
    });
  });

  it('normal：流式展开、终态聚合收起（现行默认行为）', () => {
    expect(resolveDensityPolicy('normal')).toEqual({
      collapseDuringStreaming: false,
      terminalAggregate: true,
      collapseTerminal: true,
      autoCollapseEnabled: true,
    });
  });

  it('detailed：恒展开、不聚合、禁用自动收起', () => {
    expect(resolveDensityPolicy('detailed')).toEqual({
      collapseDuringStreaming: false,
      terminalAggregate: false,
      collapseTerminal: false,
      autoCollapseEnabled: false,
    });
  });
});

describe('load/saveConversationDensity', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('无存储时默认 normal', () => {
    expect(loadConversationDensity()).toBe('normal');
  });

  it('非法存储值回退 normal', () => {
    localStorage.setItem(CONVERSATION_DENSITY_STORAGE_KEY, 'loud');
    expect(loadConversationDensity()).toBe('normal');
  });

  it('保存后可读回，并派发全局事件', () => {
    const listener = vi.fn();
    window.addEventListener(CONVERSATION_DENSITY_EVENT, listener);
    saveConversationDensity('detailed');
    expect(loadConversationDensity()).toBe('detailed');
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(CONVERSATION_DENSITY_EVENT, listener);
  });

  it('localStorage 不可用时静默降级', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => saveConversationDensity('compact')).not.toThrow();
    expect(loadConversationDensity()).toBe('normal');
  });
});
