/**
 * 输入区「会话显示」入口合同测试（验收返工 P2：无障碍）：
 * 高级配置的每个 Select 有关联的可访问名称（label 包裹 + aria-label），
 * 入口按钮有 aria-label，Segmented 分组有 aria-label。
 */
import ConversationDisplaySettings from '@/components/business-component/UnifiedChatSession/components/ChatInputHomeIndependent/ConversationDisplaySettings';
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
  it('入口与恢复继承均使用原生按钮', async () => {
    localStorage.setItem(
      'conversation_renderer_v2_session_overrides',
      JSON.stringify({ 1: 'v2' }),
    );
    const user = userEvent.setup();
    render(<ConversationDisplaySettings conversationId={1} />);
    const entry = screen.getByTestId('conversation-display-entry');
    expect(entry.tagName).toBe('BUTTON');
    expect(entry.getAttribute('aria-label')).toBe(
      'PC.Components.ChatInputHome.conversationDisplay',
    );
    await user.click(entry);
    expect(
      screen.getByRole('button', {
        name: 'PC.Components.ChatInputHome.conversationDisplayClearSessionOverride',
      }),
    ).toBeInTheDocument();
  });

  it('全局默认控件显示全局值，而不是会话覆盖后的生效值', async () => {
    localStorage.setItem('conversation_renderer_v2', 'v1');
    localStorage.setItem(
      'conversation_renderer_v2_session_overrides',
      JSON.stringify({ 1: 'v2' }),
    );
    const user = userEvent.setup();
    render(<ConversationDisplaySettings conversationId={1} />);
    await user.click(screen.getByTestId('conversation-display-entry'));

    const globalGroup = screen.getByRole('radiogroup', {
      name: 'PC.Components.ChatInputHome.conversationDisplayGlobalRenderer',
    });
    const inputs = globalGroup.querySelectorAll('input[type="radio"]');
    expect(inputs[0]).toBeChecked();
    expect(inputs[1]).not.toBeChecked();
  });

  it('高级配置每个类型 Select 均有可访问名称（label 关联）', async () => {
    const user = userEvent.setup();
    render(<ConversationDisplaySettings conversationId={1} />);
    await user.click(screen.getByTestId('conversation-display-entry'));
    // 默认 v2：面板渲染高级配置，每个类型一行 label（dict mock 返回 i18n key）
    const labelFragments = [
      'nodeTitleReasoning',
      'nodeTitleContext',
      'nodeTitleNarration',
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
