import { afterEach, describe, expect, it } from 'vitest';

import {
  clearDraft,
  loadDraft,
  resolveDraftSurface,
  saveDraft,
} from './draftStorage';

const storageKey = (scope: string) => `chat_draft:${scope}`;
const attachment = {
  uid: 'uploaded-pdf',
  name: '报告.pdf',
  type: 'application/pdf',
  size: 2048,
  url: 'https://cdn.example.com/report.pdf',
  key: 'tmp/report.pdf',
};

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

  it('没有文字的已上传附件也属于草稿，重新读取后保留发送元数据', () => {
    saveDraft('chat:101', { version: 1, text: '', files: [attachment] });
    expect(loadDraft('chat:101')?.files).toEqual([attachment]);
    clearDraft('chat:101');
    expect(loadDraft('chat:101')).toBeNull();
  });

  it('只持久化附件元数据，不保存本地 File 和上传响应', () => {
    const uploaded = {
      ...attachment,
      originFileObj: new File(['content'], attachment.name),
      response: { data: attachment },
      status: 'done',
      percent: 100,
    };
    saveDraft('chat:101', { version: 1, text: '待发送', files: [uploaded] });
    const stored = JSON.parse(localStorage.getItem(storageKey('chat:101'))!);
    expect(stored.files).toEqual([attachment]);
  });

  it('非法附件被忽略，仍可恢复旧版文字草稿', () => {
    localStorage.setItem(
      storageKey('chat:101'),
      JSON.stringify({
        version: 1,
        text: '旧版草稿',
        savedAt: Date.now(),
        files: [null, { ...attachment, key: '' }, { ...attachment, size: -1 }],
      }),
    );
    expect(loadDraft('chat:101')?.text).toBe('旧版草稿');
    expect(loadDraft('chat:101')?.files ?? []).toEqual([]);
  });

  it('附件草稿超过 24 小时仍按已有策略清理', () => {
    localStorage.setItem(
      storageKey('chat:101'),
      JSON.stringify({
        version: 1,
        text: '',
        files: [attachment],
        savedAt: Date.now() - 24 * 60 * 60 * 1000 - 1,
      }),
    );
    expect(loadDraft('chat:101')).toBeNull();
    expect(localStorage.getItem(storageKey('chat:101'))).toBeNull();
  });
});
