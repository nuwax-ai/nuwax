import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AgentInterventionChatLayer from './index';

describe('AgentInterventionChatLayer', () => {
  it('renders nothing when no pending interventions', () => {
    const { container } = render(
      <AgentInterventionChatLayer
        messageList={[]}
        onRespondAcpPermission={vi.fn()}
        onRespondMcpAsk={vi.fn()}
        injectMockAcpPermission={vi.fn()}
        injectMockMcpAsk={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe('');
  });
});
