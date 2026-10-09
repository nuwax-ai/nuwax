import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AgentInterventionChatLayer from './index';

// vitest 不会把 .less 当作 CSS modules 处理，mock 成 className 代理（同 tests/interventionDock 惯例）
vi.mock('./AgentInterventionChatLayer.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));
vi.mock('./DockPanel.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  getCurrentLang: () => 'zh-CN',
  dict: (key: string) => key,
  t: (key: string) =>
    ((
      {
        'PC.Components.AgentInterventionChatLayer.dialogLabel':
          '待处理的智能体请求',
      } as Record<string, string>
    )[key] ?? key),
}));

vi.mock('../AcpPermissionCard', () => ({
  __esModule: true,
  default: ({ interaction }: any) => (
    <button type="button">acp:{interaction.intervention.id}</button>
  ),
}));

const createInteraction = (id: string, createdAt: number) => ({
  intervention: {
    id,
    createdAt,
    acp: {
      request: {
        toolCall: {
          toolCallId: `${id}-call`,
          rawInput: null,
        },
      },
    },
  },
  responseStatus: 'pending',
});

const renderWithOneIntervention = () =>
  render(
    <AgentInterventionChatLayer
      messageList={
        [
          {
            id: 'assistant-1',
            index: 1,
            acpPermissionInteractions: [createInteraction('itv-1', 100)],
          },
        ] as any
      }
      onRespondAcpPermission={vi.fn()}
      onRespondMcpAsk={vi.fn()}
    />,
  );

describe('AgentInterventionChatLayer', () => {
  it('renders nothing when no pending interventions', () => {
    const { container } = render(
      <AgentInterventionChatLayer
        messageList={[]}
        onRespondAcpPermission={vi.fn()}
        onRespondMcpAsk={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows stacked approvals and a remaining-count badge when more than two are pending', () => {
    render(
      <AgentInterventionChatLayer
        messageList={
          [
            {
              id: 'assistant-1',
              index: 1,
              acpPermissionInteractions: [createInteraction('itv-1', 100)],
            },
            {
              id: 'assistant-2',
              index: 2,
              acpPermissionInteractions: [createInteraction('itv-2', 200)],
            },
            {
              id: 'assistant-3',
              index: 3,
              acpPermissionInteractions: [createInteraction('itv-3', 300)],
            },
          ] as any
        }
        onRespondAcpPermission={vi.fn()}
        onRespondMcpAsk={vi.fn()}
      />,
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('acp:itv-1')).toBeInTheDocument();
    expect(screen.getByText('acp:itv-2')).toBeInTheDocument();
    expect(screen.getByText('acp:itv-3')).toBeInTheDocument();
  });

  it('有干预时渲染为模态对话框并自动聚焦卡片（aria 语义 + 焦点进入）', () => {
    renderWithOneIntervention();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', '待处理的智能体请求');
    // 焦点自动进入第一个可聚焦元素（卡片按钮），而非留在遮罩外的页面
    expect(document.activeElement).toBe(screen.getByText('acp:itv-1'));
  });

  it('Tab / Shift+Tab 在对话框内循环，不逃到底下被遮住的内容', () => {
    renderWithOneIntervention();

    const card = screen.getByText('acp:itv-1');
    card.focus();
    fireEvent.keyDown(card, { key: 'Tab' });
    // 唯一可聚焦元素：Tab 按下应 preventDefault 并停留，焦点不得落到 body
    expect(document.activeElement).toBe(card);

    fireEvent.keyDown(card, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(card);
  });

  it('干预消失后焦点还原到打开前的元素', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    const { unmount } = renderWithOneIntervention();
    expect(document.activeElement).toBe(screen.getByText('acp:itv-1'));

    unmount();
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });
});
