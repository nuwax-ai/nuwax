/**
 * V2 渲染偏好合同测试：预设/逐类覆盖/失败节点恢复/隐藏计数/外层默认态，
 * 以及配置优先级（URL > 会话覆盖 > 全局偏好 > 构建默认 V2）。
 */
import type { ConversationProcessNode } from '@/features/conversation/presentation-v2';
import {
  DEFAULT_V2_PRESET,
  defaultTraceExpanded,
  resolveNodeMode,
  splitNodesByVisibility,
} from '@/features/conversation/presentation-v2';
import {
  CONVERSATION_RENDERER_DEFAULT,
  loadConversationRendererPreferences,
  resolveConversationRenderer,
  resolveConversationRendererDetails,
  saveRendererNodeOverride,
  saveRendererPreset,
  setConversationRendererUrlOverride,
  setGlobalRendererVersion,
  setSessionRendererOverride,
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

  it('focused 隐藏思考/上下文/中间说明，balanced 摘要，detailed 展开', () => {
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
      resolveNodeMode(node('narration'), {
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
    ).toBe('summary');
    expect(
      resolveNodeMode(node('subagent'), {
        preset: 'focused',
        nodeOverrides: {},
      }),
    ).toBe('summary');
    expect(
      resolveNodeMode(node('plan'), { preset: 'detailed', nodeOverrides: {} }),
    ).toBe('summary');
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
      node('tool'),
    ];
    const { visibleNodes, hiddenCount } = splitNodesByVisibility(nodes, {
      preset: 'focused',
      nodeOverrides: {},
    });
    expect(visibleNodes.map((n) => n.kind)).toEqual(['tool', 'tool']);
    expect(hiddenCount).toBe(2);
  });

  it('外层轨迹默认态：运行轮展开；终态 focused/balanced 收起、detailed 展开', () => {
    expect(defaultTraceExpanded({ running: true }, 'focused')).toBe(true);
    expect(defaultTraceExpanded({ running: false }, 'focused')).toBe(false);
    expect(defaultTraceExpanded({ running: false }, 'balanced')).toBe(false);
    expect(defaultTraceExpanded({ running: false }, 'detailed')).toBe(true);
  });
});

describe('conversationRendererPreference 存取', () => {
  afterEach(() => {
    localStorage.clear();
    setSearch('');
    vi.restoreAllMocks();
  });

  it('构建默认 V2；全局偏好可退回 V1；清除回落默认', () => {
    expect(CONVERSATION_RENDERER_DEFAULT).toBe('v2');
    expect(resolveConversationRenderer(123)).toBe('v2');

    setGlobalRendererVersion('v1');
    expect(resolveConversationRenderer(123)).toBe('v1');

    setGlobalRendererVersion(null);
    expect(resolveConversationRenderer(123)).toBe('v2');
  });

  it('会话覆盖压过全局，清除后恢复继承全局', () => {
    setGlobalRendererVersion('v1');
    setSessionRendererOverride(123, 'v2');
    expect(resolveConversationRenderer(123)).toBe('v2');
    expect(resolveConversationRenderer(456)).toBe('v1');

    setSessionRendererOverride(123, null);
    expect(resolveConversationRenderer(123)).toBe('v1');
  });

  it('同时返回全局默认、当前生效值与来源，不把会话覆盖冒充全局值', () => {
    setGlobalRendererVersion('v1');
    setSessionRendererOverride(123, 'v2');

    expect(resolveConversationRendererDetails(123)).toEqual({
      renderer: 'v2',
      globalVersion: 'v1',
      source: 'session',
    });

    setSearch('?conversationRenderer=v1');
    expect(resolveConversationRendererDetails(123)).toEqual({
      renderer: 'v1',
      globalVersion: 'v1',
      source: 'url',
    });
  });

  it('URL 调试参数压过一切：?conversationRenderer=v1', () => {
    setGlobalRendererVersion('v2');
    setSessionRendererOverride(123, 'v2');
    setSearch('?conversationRenderer=v1');
    expect(resolveConversationRenderer(123)).toBe('v1');

    setSearch('?conversationRenderer=v2');
    setGlobalRendererVersion('v1');
    expect(resolveConversationRenderer(123)).toBe('v2');

    setSearch('?conversationRenderer=bogus');
    // URL 非法值忽略：本测试前面已设 123 的会话覆盖 v2，压过全局 v1
    expect(resolveConversationRenderer(123)).toBe('v2');
    expect(resolveConversationRenderer(456)).toBe('v1');
  });

  it('URL 写入器（调试开关）：改写参数保留其余 query，并广播事件供 hook 即时重解析', () => {
    const listener = vi.fn();
    window.addEventListener('conversation-renderer-v2-changed', listener);

    // 无既有参数：新增
    setSearch('?foo=1');
    setConversationRendererUrlOverride('v1');
    expect(location.search).toBe('?foo=1&conversationRenderer=v1');
    expect(resolveConversationRendererDetails(123)).toMatchObject({
      renderer: 'v1',
      source: 'url',
    });

    // 已有参数：原位改写，其余参数不动
    setConversationRendererUrlOverride('v2');
    expect(location.search).toBe('?foo=1&conversationRenderer=v2');
    expect(resolveConversationRenderer(123)).toBe('v2');

    // 每次写入都广播（mock-chat 开关即时切线的依赖）
    expect(listener).toHaveBeenCalledTimes(2);
    window.removeEventListener('conversation-renderer-v2-changed', listener);
  });

  it('偏好持久化：预设与逐类覆盖读写一致，覆盖可清除', () => {
    expect(loadConversationRendererPreferences()).toEqual({
      preset: 'balanced',
      nodeOverrides: {},
    });

    saveRendererPreset('detailed');
    saveRendererNodeOverride('tool', 'expanded');
    expect(loadConversationRendererPreferences()).toEqual({
      preset: 'detailed',
      nodeOverrides: { tool: 'expanded' },
    });

    saveRendererNodeOverride('tool', null);
    expect(loadConversationRendererPreferences().nodeOverrides).toEqual({});
  });

  it('localStorage 不可用时回落默认且不抛异常', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('quota');
      });
    expect(resolveConversationRenderer(1)).toBe('v2');
    expect(loadConversationRendererPreferences().preset).toBe('balanced');
    spy.mockRestore();
  });

  it('损坏的 JSON 覆盖回落默认偏好', () => {
    localStorage.setItem('conversation_renderer_v2_node_overrides', '{oops');
    localStorage.setItem('conversation_renderer_v2_preset', 'not-a-preset');
    const preferences = loadConversationRendererPreferences();
    expect(preferences.preset).toBe('balanced');
    expect(preferences.nodeOverrides).toEqual({});
  });
});
