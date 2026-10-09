import AgentInterventionChatLayer from '@/components/business-component/AgentIntervention/AgentInterventionChatLayer';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/components/business-component/AgentIntervention/AgentInterventionChatLayer/AgentInterventionChatLayer.less',
  () => ({ default: new Proxy({}, { get: () => 'cls' }) }),
);
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));
vi.mock(
  '@/components/business-component/AgentIntervention/AgentInterventionChatLayer/DockPanel',
  () => ({
    default: ({ items, onRespondMcpAsk }: any) =>
      items.map((item: any) => (
        <button
          type="button"
          key={item.interaction.input.requestId}
          onClick={() =>
            void onRespondMcpAsk(item.interaction, { action: 'submit' })
          }
        >
          确认
        </button>
      )),
  }),
);
const messages = (status = 'pending', revision = 1) =>
  [
    {
      id: 1,
      mcpAskInteractions: [
        {
          responseStatus: status,
          input: {
            requestId: 'ask',
            revision,
            title: '测试',
            ui: { title: '测试', fields: [] },
          },
        },
      ],
    },
  ] as any;

describe('问答卡片消失与会话隔离', () => {
  it('提交后经过空队列、旧快照仍不复活，新 revision 和新会话正常出现', async () => {
    const respond = vi.fn().mockResolvedValue(undefined);
    const props = { onRespondMcpAsk: respond, onRespondAcpPermission: vi.fn() };
    const { rerender } = render(
      <AgentInterventionChatLayer
        {...props}
        conversationId={1}
        messageList={messages()}
      />,
    );
    await act(async () => fireEvent.click(screen.getByText('确认')));
    rerender(
      <AgentInterventionChatLayer
        {...props}
        conversationId={1}
        messageList={messages('submitted')}
      />,
    );
    rerender(
      <AgentInterventionChatLayer
        {...props}
        conversationId={1}
        messageList={messages()}
      />,
    );
    expect(screen.queryByText('确认')).toBeNull();
    rerender(
      <AgentInterventionChatLayer
        {...props}
        conversationId={1}
        messageList={messages('pending', 2)}
      />,
    );
    expect(screen.getByText('确认')).toBeInTheDocument();
    rerender(
      <AgentInterventionChatLayer
        {...props}
        conversationId={2}
        messageList={messages()}
      />,
    );
    expect(screen.getByText('确认')).toBeInTheDocument();
    rerender(
      <AgentInterventionChatLayer
        {...props}
        conversationId={1}
        messageList={messages()}
      />,
    );
    expect(screen.queryByText('确认')).toBeNull();
  });
  it('提交前失败恢复卡片，拒绝不会泄漏', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <AgentInterventionChatLayer
        conversationId={1}
        messageList={messages()}
        onRespondAcpPermission={vi.fn()}
        onRespondMcpAsk={vi.fn().mockRejectedValue(new Error('failed'))}
      />,
    );
    await act(async () => fireEvent.click(screen.getByText('确认')));
    expect(screen.getByText('确认')).toBeInTheDocument();
    log.mockRestore();
  });
});
