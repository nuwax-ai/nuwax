import { afterEach, describe, expect, it } from 'vitest';

import {
  clearDraft,
  loadDraft,
  resolveDraftSurface,
  saveDraft,
} from './draftStorage';

const storageKey = (scope: string) => `chat_draft:${scope}`;

describe('resolveDraftSurface（会话页面地址分桶）', () => {
  it('三类会话路由面各归各桶', () => {
    expect(resolveDraftSurface('/home/chat/1562087/2592')).toBe('chat');
    expect(resolveDraftSurface('/home/chat')).toBe('chat');
    expect(resolveDraftSurface('/agent/2592')).toBe('agent');
    expect(resolveDraftSurface('/space/752/app-pro')).toBe('apppro');
    expect(resolveDraftSurface('/space')).toBe('apppro');
  });

  it('其余承载面（插件/技能/EditAgent 预览等）落 page 兜底桶', () => {
    expect(resolveDraftSurface('/home')).toBe('page');
    expect(resolveDraftSurface('/space-plugin/3/tool')).toBe('page');
    expect(resolveDraftSurface('')).toBe('page');
  });
});

describe('草稿存取（作用域 = 路由面 × 会话 id）', () => {
  afterEach(() => {
    localStorage.removeItem(storageKey('chat:101'));
    localStorage.removeItem(storageKey('apppro:101'));
  });

  it('同会话不同路由面互不串扰', () => {
    saveDraft('chat:101', { version: 1, text: '会话页草稿' });
    saveDraft('apppro:101', { version: 1, text: 'IDE 面板草稿' });
    expect(loadDraft('chat:101')?.text).toBe('会话页草稿');
    expect(loadDraft('apppro:101')?.text).toBe('IDE 面板草稿');
    // 各自清除不影响另一桶
    clearDraft('chat:101');
    expect(loadDraft('chat:101')).toBeNull();
    expect(loadDraft('apppro:101')?.text).toBe('IDE 面板草稿');
  });

  it('空文本落盘删除存储键；纯空白文本读取视为无草稿', () => {
    saveDraft('chat:101', { version: 1, text: '先有内容' });
    saveDraft('chat:101', { version: 1, text: '   ' });
    expect(localStorage.getItem(storageKey('chat:101'))).toBeNull();
  });
});
