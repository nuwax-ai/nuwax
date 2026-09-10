/**
 * 会话调试悬浮按钮 / 「会话显示」面板合同测试：
 * debug 入口为原生按钮（aria-label），点击弹出面板收纳「会话密度」三档
 * 与「会话显示」配置；高级配置每个 Select 有关联的可访问名称
 * （label 包裹 + aria-label），Segmented 分组有 aria-label。
 */
import ConversationDebugFab from '@/components/business-component/ChatInputUnified/ConversationDebugFab';
import ConversationDisplaySettings from '@/components/business-component/ChatInputUnified/ConversationDisplaySettings';
import { PROCESS_NODE_KINDS } from '@/features/conversation/presentation-v2';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...values: (string | number)[]) =>
    values.length ? `${key}:${values.join(',')}` : key,
  t: (key: string) => key,
}));
vi.mock('@/components/ChatInputHome/index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('ConversationDisplaySettings', () => {
  it('清除会话覆盖使用原生按钮，面板直出无需触发入口', () => {
    localStorage.setItem(
      'conversation_renderer_v2_session_overrides',
      JSON.stringify({ 1: 'v2' }),
    );
    render(<ConversationDisplaySettings conversationId={1} />);
    expect(
      screen.getByRole('button', {
        name: 'PC.Components.ChatInputHome.conversationDisplayClearSessionOverride',
      }),
    ).toBeInTheDocument();
  });

  it('全局默认控件显示全局值，而不是会话覆盖后的生效值', () => {
    localStorage.setItem('conversation_renderer_v2', 'v1');
    localStorage.setItem(
      'conversation_renderer_v2_session_overrides',
      JSON.stringify({ 1: 'v2' }),
    );
    render(<ConversationDisplaySettings conversationId={1} />);

    const globalGroup = screen.getByRole('radiogroup', {
      name: 'PC.Components.ChatInputHome.conversationDisplayGlobalRenderer',
    });
    const inputs = globalGroup.querySelectorAll('input[type="radio"]');
    expect(inputs[0]).toBeChecked();
    expect(inputs[1]).not.toBeChecked();
  });

  it('会话覆盖未存储时默认选中 V2（与继承链兜底一致）', () => {
    render(<ConversationDisplaySettings conversationId={1} />);
    const sessionGroup = screen.getByRole('radiogroup', {
      name: 'PC.Components.ChatInputHome.conversationDisplaySessionOverride',
    });
    const inputs = sessionGroup.querySelectorAll('input[type="radio"]');
    // 选项顺序：默认(继承) / V1 / V2
    expect(inputs[2]).toBeChecked();
    expect(inputs[0]).not.toBeChecked();
  });

  it('高级配置每个类型 Select 均有可访问名称（label 关联）', () => {
    render(<ConversationDisplaySettings conversationId={1} />);
    // 默认 v2：面板渲染高级配置，每个类型一行 label（dict mock 返回 i18n key）
    const labelFragments = [
      'nodeTitleReasoning',
      'nodeTitleContext',
      'nodeTitleTool',
      'nodeTitleSubagent',
      'nodeTitlePlan',
      'nodeTitleInteractionAsk',
      'nodeTitleUnknown',
    ];
    const labels = [...document.querySelectorAll('label')];
    // antd Select 内部也可能渲染 label，只统计包含行文本的行级 label
    const rowLabels = labels.filter((label) =>
      labelFragments.some((fragment) => label.textContent?.includes(fragment)),
    );
    expect(rowLabels.length).toBe(PROCESS_NODE_KINDS.length);
    labelFragments.forEach((fragment) => {
      expect(
        labels.some((label) => label.textContent?.includes(fragment)),
        `高级配置应有 ${fragment} 的 label 行`,
      ).toBe(true);
    });
    // 每行 label 内含 Select 控件（label 关联即可访问名称）
    rowLabels.forEach((label) => {
      expect(label.querySelector('[role="combobox"]')).not.toBeNull();
    });
    // 渲染线 Segmented 分组具备 aria-label
    const segmented = document.querySelectorAll('[role="radiogroup"]');
    expect(segmented.length).toBeGreaterThanOrEqual(2);
    expect(
      [...segmented].some((group) =>
        (group.getAttribute('aria-label') ?? '').includes(
          'conversationDisplay',
        ),
      ),
    ).toBe(true);
  });
});

describe('ConversationDebugFab', () => {
  it('入口为原生按钮，点击弹出含密度与显示两段的调试面板', async () => {
    const user = userEvent.setup();
    render(<ConversationDebugFab conversationId={1} />);
    const entry = screen.getByTestId('conversation-debug-entry');
    expect(entry.tagName).toBe('BUTTON');
    expect(entry.getAttribute('aria-label')).toBe(
      'PC.Components.ChatInputHome.conversationDebugEntry',
    );
    await user.click(entry);
    expect(screen.getByTestId('conversation-debug-panel')).toBeInTheDocument();
    // 密度三档行
    expect(
      screen.getByText('PC.Components.ChatInputHome.densityCompact'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('PC.Components.ChatInputHome.densityNormal'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('PC.Components.ChatInputHome.densityDetailed'),
    ).toBeInTheDocument();
    // 会话显示配置面板
    expect(
      screen.getByTestId('conversation-display-settings'),
    ).toBeInTheDocument();
  });

  it('点击密度档位即时落盘并高亮当前档', async () => {
    const user = userEvent.setup();
    render(<ConversationDebugFab conversationId={1} />);
    await user.click(screen.getByTestId('conversation-debug-entry'));

    const compactText = screen.getByText(
      'PC.Components.ChatInputHome.densityCompact',
    );
    const compactRow = compactText.closest('button');
    expect(compactRow).not.toBeNull();
    await user.click(compactRow as HTMLButtonElement);
    expect(localStorage.getItem('conversation_density')).toBe('compact');

    const normalText = screen.getByText(
      'PC.Components.ChatInputHome.densityNormal',
    );
    await user.click(normalText.closest('button') as HTMLButtonElement);
    expect(localStorage.getItem('conversation_density')).toBe('normal');
  });
});
