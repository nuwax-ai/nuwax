/**
 * V2 渲染偏好合同测试：默认预设/逐类覆盖/失败节点恢复/隐藏计数/外层默认态，
 * 以及 URL 调试覆盖与构建默认 V2。
 */
import type { ConversationProcessNode } from '@/features/conversation/presentation-v2';
import {
  DEFAULT_V2_PRESET,
  defaultTraceExpanded,
  resolveNodeMode,
  splitNodesByVisibility,
} from '@/features/conversation/presentation-v2';
import {
  clearLegacyConversationDebugSettings,
  CONVERSATION_RENDERER_DEFAULT,
  loadConversationRendererPreferences,
  resolveConversationRenderer,
  setConversationRendererUrlOverride,
} from '@/utils/conversationRendererPreference';
import { afterEach, describe, expect, it, vi } from 'vitest';

const setSearch = (search: string) => {
  window.history.replaceState(null, '', search || location.pathname);
};

const node = (kind: ConversationProcessNode['kind'], failed = false) =>
  ({ kind, failed } as ConversationProcessNode);

describe('renderPreferences', () => {
  it('默认预设 balanced', () => {
    expect(DEFAULT_V2_PRESET).toBe('balanced');
  });

  it('focused 隐藏思考/上下文，balanced 摘要，detailed 展开（narration 已直出无节点档位）', () => {
    expect(
      resolveNodeMode(node('reasoning'), {
        preset: 'focused',
        nodeOverrides: {},
      }),
    ).toBe('hidden');
    expect(
      resolveNodeMode(node('context'), {
        preset: 'focused',
        nodeOverrides: {},
      }),
    ).toBe('hidden');
    expect(
      resolveNodeMode(node('reasoning'), {
        preset: 'balanced',
        nodeOverrides: {},
      }),
    ).toBe('summary');
    expect(
      resolveNodeMode(node('reasoning'), {
        preset: 'detailed',
        nodeOverrides: {},
      }),
    ).toBe('expanded');
    expect(
      resolveNodeMode(node('tool'), { preset: 'detailed', nodeOverrides: {} }),
    ).toBe('expanded');
    expect(
      resolveNodeMode(node('subagent'), {
        preset: 'focused',
        nodeOverrides: {},
      }),
    ).toBe('summary');
    expect(
      resolveNodeMode(node('plan'), { preset: 'detailed', nodeOverrides: {} }),
    ).toBe('expanded');
    expect(
      resolveNodeMode(node('completed-interaction'), {
        preset: 'balanced',
        nodeOverrides: {},
      }),
    ).toBe('summary');
    expect(
      resolveNodeMode(node('unknown'), {
        preset: 'balanced',
        nodeOverrides: {},
      }),
    ).toBe('summary');
  });

  it('高级覆盖压过预设；传 null 的类别回落预设（由存储层清除）', () => {
    expect(
      resolveNodeMode(node('tool'), {
        preset: 'balanced',
        nodeOverrides: { tool: 'expanded' },
      }),
    ).toBe('expanded');
    expect(
      resolveNodeMode(node('reasoning'), {
        preset: 'focused',
        nodeOverrides: { reasoning: 'expanded' },
      }),
    ).toBe('expanded');
  });

  it('失败节点配置隐藏时至少恢复为错误摘要', () => {
    expect(
      resolveNodeMode(node('tool', true), {
        preset: 'balanced',
        nodeOverrides: { tool: 'hidden' },
      }),
    ).toBe('summary');
    expect(
      resolveNodeMode(node('reasoning', true), {
        preset: 'focused',
        nodeOverrides: {},
      }),
    ).toBe('summary');
  });

  it('splitNodesByVisibility 保留可见节点顺序并统计隐藏数', () => {
    const nodes = [
      node('reasoning'),
      node('tool'),
      node('narration'),
      node('context'),
      node('tool'),
    ];
    const { visibleNodes, hiddenCount } = splitNodesByVisibility(nodes, {
      preset: 'focused',
      nodeOverrides: {},
    });
    // narration 穿插直出恒可见（focused 也不隐藏、不计入隐藏数）
    expect(visibleNodes.map((n) => n.kind)).toEqual([
      'tool',
      'narration',
      'tool',
    ]);
    expect(hiddenCount).toBe(2);
  });

  it('外层轨迹默认态：运行轮展开；终态与历史轮均收起', () => {
    expect(defaultTraceExpanded({ running: true }, 'focused')).toBe(true);
    expect(defaultTraceExpanded({ running: false }, 'focused')).toBe(false);
    expect(defaultTraceExpanded({ running: false }, 'balanced')).toBe(false);
    expect(defaultTraceExpanded({ running: false }, 'detailed')).toBe(false);
    expect(defaultTraceExpanded({ running: false }, 'balanced', true)).toBe(
      false,
    );
  });
});

describe('conversationRendererPreference', () => {
  afterEach(() => {
    localStorage.clear();
    setSearch('');
    vi.restoreAllMocks();
  });

  it('构建默认 V2；URL 参数可以切换到 V1 或 V2', () => {
    expect(CONVERSATION_RENDERER_DEFAULT).toBe('v2');
    expect(resolveConversationRenderer()).toBe('v2');

    setSearch('?conversationRenderer=v1');
    expect(resolveConversationRenderer()).toBe('v1');

    setSearch('?conversationRenderer=v2');
    expect(resolveConversationRenderer()).toBe('v2');
  });

  it('忽略无效 URL 值，并使用 V2 默认设置', () => {
    setSearch('?conversationRenderer=invalid');
    expect(resolveConversationRenderer()).toBe('v2');
    expect(loadConversationRendererPreferences()).toEqual({
      preset: 'balanced',
      nodeOverrides: {},
    });
  });

  it('URL 写入器保留其余 query，并广播事件供 hook 即时重解析', () => {
    const listener = vi.fn();
    window.addEventListener('conversation-renderer-v2-changed', listener);

    setSearch('?foo=1');
    setConversationRendererUrlOverride('v1');
    expect(location.search).toBe('?foo=1&conversationRenderer=v1');
    expect(resolveConversationRenderer()).toBe('v1');

    setConversationRendererUrlOverride('v2');
    expect(location.search).toBe('?foo=1&conversationRenderer=v2');
    expect(resolveConversationRenderer()).toBe('v2');

    expect(listener).toHaveBeenCalledTimes(2);
    window.removeEventListener('conversation-renderer-v2-changed', listener);
  });

  it('启动迁移清理旧调试面板持久化的设置', () => {
    [
      'conversation_renderer_v2',
      'conversation_renderer_v2_preset',
      'conversation_renderer_v2_node_overrides',
      'conversation_renderer_v2_session_overrides',
      'conversation_density',
      'conversation_page_cache_capacity',
    ].forEach((key) => localStorage.setItem(key, 'stale'));

    clearLegacyConversationDebugSettings();

    expect(
      [
        'conversation_renderer_v2',
        'conversation_renderer_v2_preset',
        'conversation_renderer_v2_node_overrides',
        'conversation_renderer_v2_session_overrides',
        'conversation_density',
        'conversation_page_cache_capacity',
      ].every((key) => localStorage.getItem(key) === null),
    ).toBe(true);
  });

  it('不读取已废弃的渲染设置 localStorage 键', () => {
    localStorage.setItem('conversation_renderer_v2', 'v1');
    localStorage.setItem('conversation_renderer_v2_preset', 'detailed');
    setSearch('');
    expect(resolveConversationRenderer()).toBe('v2');
    expect(loadConversationRendererPreferences().preset).toBe('balanced');
  });

  it('URL 覆盖仍可直接退回 V1', () => {
    setSearch('?conversationRenderer=v1');
    expect(resolveConversationRenderer()).toBe('v1');
  });
});
