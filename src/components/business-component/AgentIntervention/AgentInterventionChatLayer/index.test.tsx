import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AgentInterventionChatLayer from './index';

vi.mock('../AcpPermissionCard', () => ({
  __esModule: true,
  default: ({ interaction }: any) => (
    <div>acp:{interaction.intervention.id}</div>
  ),
}));

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
});
