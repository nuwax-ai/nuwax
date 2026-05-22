import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { McpAskInteraction } from '../types';
import AgentInterventionChatLayer from './AgentInterventionChatLayer';

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string, ...values: (string | number)[]) =>
    values.length ? `${key}:${values.join(',')}` : key,
  dict: (key: string, ...values: (string | number)[]) =>
    values.length ? `${key}:${values.join(',')}` : key,
}));
vi.mock('./AgentInterventionChatLayer.less', () => ({
  default: { host: 'host' },
}));
vi.mock('./InterventionDockPanel.less', () => ({
  default: { cardSlot: 'cardSlot', stackRoot: 'stackRoot', stack: 'stack' },
}));
vi.mock('./intervention-dock-card.module.less', () => ({
  default: { root: 'root' },
}));
vi.mock('../mcp-ask/components/McpAskQuestionCard/index.less', () => ({
  default: {
    shell: 'shell',
    header: 'header',
    iconWrap: 'iconWrap',
    headerMain: 'headerMain',
    eyebrow: 'eyebrow',
    title: 'title',
    desc: 'desc',
    formSurface: 'formSurface',
    form: 'form',
    footer: 'footer',
    footerActions: 'footerActions',
    buttonLabel: 'buttonLabel',
    shortcut: 'shortcut',
  },
}));
vi.mock(
  '../mcp-ask/components/McpAskQuestionCard/McpAskFormField.less',
  () => ({
    default: { optionGroup: 'optionGroup', textControl: 'textControl' },
  }),
);

function createAskInteraction(): McpAskInteraction {
  return {
    toolCallId: 'tool-call-1',
    input: {
      toolName: 'nuwax_ask_question',
      schemaVersion: 'nuwaclaw.mcp_ask.v1',
      requestId: 'ask-1',
      revision: 1,
      sessionId: 'session-1',
      title: '毕业论文 PPT 前置信息收集',
      ui: {
        version: 'nuwaclaw.interaction.v1',
        presentation: 'inline',
        title: '毕业论文 PPT 前置信息收集',
        schema: {},
        submitLabel: '确认并开始制作',
      },
    },
    responseStatus: 'pending',
  };
}

function renderLayer(onRespondMcpAsk = vi.fn()) {
  const interaction = createAskInteraction();
  const messageList = [
    {
      id: 'assistant-ask',
      index: 1,
      mcpAskInteractions: [interaction],
    },
  ] as MessageInfo[];

  render(
    <AgentInterventionChatLayer
      messageList={messageList}
      onRespondAcpPermission={vi.fn()}
      onRespondMcpAsk={onRespondMcpAsk}
      injectMockAcpPermission={vi.fn()}
      injectMockMcpAsk={vi.fn()}
    />,
  );

  return { interaction, onRespondMcpAsk };
}

describe('AgentInterventionChatLayer', () => {
  it('dismisses ask/question locally after submit response is sent', async () => {
    const { interaction, onRespondMcpAsk } = renderLayer();

    fireEvent.click(screen.getByRole('button', { name: '确认并开始制作' }));

    await waitFor(() => {
      expect(onRespondMcpAsk).toHaveBeenCalledWith(
        interaction,
        expect.objectContaining({
          action: 'submit',
          interventionId: 'ask-1',
          source: 'mcp_ask',
        }),
      );
      expect(
        screen.queryByRole('region', {
          name: '毕业论文 PPT 前置信息收集',
        }),
      ).not.toBeInTheDocument();
    });
  });

  it('keeps ask/question visible if submit response fails', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const onRespondMcpAsk = vi.fn().mockRejectedValue(new Error('send failed'));
    renderLayer(onRespondMcpAsk);

    fireEvent.click(screen.getByRole('button', { name: '确认并开始制作' }));

    await waitFor(() => {
      expect(
        screen.getByRole('region', {
          name: '毕业论文 PPT 前置信息收集',
        }),
      ).toBeInTheDocument();
    });
    consoleError.mockRestore();
  });
});
