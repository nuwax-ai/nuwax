import { describe, expect, it } from 'vitest';

import {
  extractConversationIdFromPath,
  isConversationDetailPath,
  isTaskConversationActive,
  resolveNavHighlightTab,
} from './sidebarSelectionPolicy';

describe('isConversationDetailPath', () => {
  it('命中 /home/chat 前缀（含带 id 与恰好结尾两种）', () => {
    expect(isConversationDetailPath('/home/chat/1562087/2592')).toBe(true);
    expect(isConversationDetailPath('/home/chat/1')).toBe(true);
    expect(isConversationDetailPath('/home/chat')).toBe(true);
  });

  it('非会话详情路由不误伤（/home、其他前缀、相似路径段）', () => {
    expect(isConversationDetailPath('/home')).toBe(false);
    expect(isConversationDetailPath('/home/chatx/1')).toBe(false);
    expect(isConversationDetailPath('/space/1/app-pro')).toBe(false);
    expect(isConversationDetailPath('')).toBe(false);
  });
});

describe('extractConversationIdFromPath', () => {
  it('提取第一段会话 id（数字 id 以字符串返回）', () => {
    expect(extractConversationIdFromPath('/home/chat/1562087/2592')).toBe(
      '1562087',
    );
    expect(extractConversationIdFromPath('/home/chat/42')).toBe('42');
  });

  it('非会话详情路由返回 null', () => {
    expect(extractConversationIdFromPath('/home')).toBeNull();
    expect(extractConversationIdFromPath('/space/1')).toBeNull();
  });

  it('app-pro 路由从路径段取 conversationId', () => {
    expect(extractConversationIdFromPath('/space/752/app-pro/29/1562236')).toBe(
      '1562236',
    );
    expect(extractConversationIdFromPath('/space/752/app-pro/29')).toBeNull();
    expect(extractConversationIdFromPath('/space/752/app-project-detail/29')).toBeNull();
  });

  it('其他工作空间域路由仍从 query 取 conversationId', () => {
    expect(
      extractConversationIdFromPath('/space/752', '?conversationId=42'),
    ).toBe('42');
    expect(
      extractConversationIdFromPath(
        '/space/752/agent-dev',
        '?agentId=29&conversationId=1562236',
      ),
    ).toBe('1562236');
  });
});

describe('resolveNavHighlightTab', () => {
  it('会话详情路由下抑制 homepage 兜底高亮', () => {
    expect(resolveNavHighlightTab('homepage', '/home/chat/1/2')).toBe('');
  });

  it('主页路由保持 homepage 高亮', () => {
    expect(resolveNavHighlightTab('homepage', '/home')).toBe('homepage');
  });

  it('其他激活码不受影响（含会话详情路由与空值透传）', () => {
    expect(resolveNavHighlightTab('space', '/home/chat/1/2')).toBe('space');
    expect(resolveNavHighlightTab('system_manage', '/home')).toBe(
      'system_manage',
    );
    expect(resolveNavHighlightTab('', '/home/chat/1/2')).toBe('');
  });

  it('会话行命中时导航高亮整体让位（任意激活码，2026-09-15 定调优先级）', () => {
    expect(
      resolveNavHighlightTab('workspace', '/space/752/app-pro', true),
    ).toBe('');
    expect(resolveNavHighlightTab('homepage', '/home/chat/1/2', true)).toBe('');
  });

  it('应用标签命中时导航高亮整体让位（任意激活码，含 /agent 强制 homepage 与兜底）', () => {
    expect(
      resolveNavHighlightTab('homepage', '/user-app/12', false, true),
    ).toBe('');
    expect(resolveNavHighlightTab('homepage', '/agent/34', false, true)).toBe(
      '',
    );
    expect(resolveNavHighlightTab('space', '/user-app/12', false, true)).toBe(
      '',
    );
  });

  it('应用标签未命中时不影响既有决策（不传第 4 参行为与旧签名一致）', () => {
    expect(resolveNavHighlightTab('homepage', '/user-app/12')).toBe('homepage');
    expect(
      resolveNavHighlightTab('homepage', '/user-app/12', false, false),
    ).toBe('homepage');
    expect(
      resolveNavHighlightTab('workspace', '/space/752/app-pro', false),
    ).toBe('workspace');
  });

  it('会话行未命中时导航菜单照常兜底（workspace 透传）', () => {
    expect(
      resolveNavHighlightTab('workspace', '/space/752/app-pro', false),
    ).toBe('workspace');
    expect(resolveNavHighlightTab('workspace', '/space/752/app-pro')).toBe(
      'workspace',
    );
  });
});

describe('isTaskConversationActive', () => {
  it('命中路由会话且不属于项目时高亮（数字 id 字符串化比对）', () => {
    expect(isTaskConversationActive('123', 123, null)).toBe(true);
    expect(isTaskConversationActive('123', '123', null)).toBe(true);
  });

  it('会话已被反查为项目子会话时互斥不高亮', () => {
    expect(isTaskConversationActive('123', 123, '123')).toBe(false);
  });

  it('路由会话缺失或条目无 id 时恒不高亮', () => {
    expect(isTaskConversationActive(undefined, 123, null)).toBe(false);
    expect(isTaskConversationActive('123', undefined, null)).toBe(false);
  });

  it('路由会话与条目不一致不高亮', () => {
    expect(isTaskConversationActive('123', 456, null)).toBe(false);
  });
});
