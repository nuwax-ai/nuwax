import {
  ConversationSessionProvider,
  useConversationSession,
} from '@/features/conversation/react/ConversationSessionProvider';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useMemo, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useAgentInterventionHandlers } from '../hooks/useAgentInterventionHandlers';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '../types/mcpAskIntervention';
import { hydrateMcpAskInteractionsInMessageList } from '../utils/mcpAskHydrateMessage';
import AgentInterventionChatLayer from './index';

const { apiRespond, onPayload } = vi.hoisted(() => ({
  apiRespond: vi.fn(),
  onPayload: vi.fn(),
}));
vi.mock('@/services/agentConfig', () => ({
  apiAgentInterventionRespond: apiRespond,
}));
vi.mock('@/components/business-component/MessageQueue', () => ({
  useUnifiedChatQueue: () => ({ hasQueuedMessages: false }),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, title?: string) =>
    key.endsWith('.resumeSubmitted')
      ? `我已填写「${title}」，表单内容如下：`
      : key,
  getCurrentLang: () => 'zh-CN',
  t: (key: string) =>
    ({
      'PC.Components.McpAskQuestionCard.fieldRequired': '请填写此项',
      'PC.Components.McpAskQuestionCard.multiSelectMin': '请至少选择一项',
    }[key] ?? key),
}));
vi.mock('./AgentInterventionChatLayer.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));
vi.mock('./DockPanel.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));
vi.mock('../McpAskQuestionCard/index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));
vi.mock('../McpAskQuestionCard/McpAskFormField.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

const input = {
  toolName: 'nuwax_ask_question',
  schemaVersion: 'nuwax.mcp_ask.v2',
  requestId: 'ask-dock-zero-mcp',
  revision: 1,
  sessionId: 'session-zero-mcp',
  title: '发布演练确认',
  ui: {
    version: 'nuwax.interaction.v2',
    presentation: 'inline',
    title: '发布演练确认',
    fields: [
      {
        name: 'environment',
        title: '环境',
        widget: 'radio',
        required: true,
        options: [
          { value: 'test', label: '测试' },
          { value: 'staging', label: '预发' },
        ],
      },
      {
        name: 'channels',
        title: '通知渠道',
        widget: 'checkboxes',
        type: 'array',
        required: true,
        options: [
          { value: 'inbox', label: '站内' },
          { value: 'email', label: '邮件' },
        ],
      },
      { name: 'note', title: '备注', widget: 'textarea', required: true },
    ],
    submitLabel: '提交',
    cancelLabel: '取消',
  },
};
const source = {
  id: 'assistant-skill',
  index: 1,
  role: AssistantRoleEnum.ASSISTANT,
  status: MessageStatusEnum.Complete,
  text: `请选择。\n\n\`\`\`nuwax-ask-question\n${JSON.stringify(
    input,
  )}\n\`\`\``,
} as MessageInfo;

function PendingState() {
  const context = useConversationSession();
  return (
    <output data-testid="pending-state">
      {String(context?.hasPendingIntervention)}
    </output>
  );
}

function Harness({ send }: { send: (text: string) => Promise<void> }) {
  const [messages, setMessages] = useState([source]);
  const handlers = useAgentInterventionHandlers({
    setMessageList: setMessages,
    conversationId: 42,
  });
  const rendered = useMemo(
    () => hydrateMcpAskInteractionsInMessageList(messages),
    [messages],
  );
  const respond = async (
    interaction: McpAskInteraction,
    payload: McpAskRespondPayload,
  ) => {
    onPayload(payload);
    const result = await handlers.respondMcpAsk(interaction, payload);
    try {
      await send(result.text);
    } catch (error) {
      result.rollback?.();
      throw error;
    }
  };
  return (
    <ConversationSessionProvider conversationId={42} messageList={messages}>
      <PendingState />
      <AgentInterventionChatLayer
        conversationId={42}
        messageList={rendered}
        onRespondAcpPermission={vi.fn()}
        onRespondMcpAsk={respond}
      />
    </ConversationSessionProvider>
  );
}

describe('零 MCP skill → 真实 ask-question Dock → 原会话回复', () => {
  // 真实 Ant Design 表单的样式初始化在 CI 较慢，单独分配集成执行预算。
  it('复用真实必填、单选、多选与提交；回复为 label，交互状态物化，刷新不重开', async () => {
    const send = vi.fn(async (_text: string) => undefined);
    const { container, unmount } = render(<Harness send={send} />);
    expect(
      container.querySelector('[data-agent-intervention-dock]'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('pending-state')).toHaveTextContent('true');
    fireEvent.click(screen.getByRole('button', { name: /提交/ }));
    await screen.findAllByText('请填写此项');
    expect(send).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('radio', { name: '预发' }));
    fireEvent.click(screen.getByRole('checkbox', { name: '站内' }));
    fireEvent.click(screen.getByRole('checkbox', { name: '邮件' }));
    fireEvent.change(screen.getByRole('textbox', { name: '备注' }), {
      target: { value: 'GUI_ONLY，不发布 npm。' },
    });
    fireEvent.click(screen.getByRole('button', { name: /提交/ }));

    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    const text = send.mock.calls[0][0];
    expect(text).toContain('环境：预发');
    expect(text).toContain('通知渠道：站内、邮件');
    expect(text).toContain('备注：GUI_ONLY，不发布 npm。');
    expect(text).toContain('我已填写「发布演练确认」，表单内容如下：');
    expect(onPayload).toHaveBeenCalledWith(
      expect.objectContaining({
        interventionId: 'ask-dock-zero-mcp',
        revision: 1,
        formData: {
          environment: 'staging',
          channels: ['inbox', 'email'],
          note: 'GUI_ONLY，不发布 npm。',
        },
      }),
    );
    expect(apiRespond).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('pending-state')).toHaveTextContent('false');

    unmount();
    const refreshed = hydrateMcpAskInteractionsInMessageList([
      source,
      {
        id: 'user-reply',
        index: 2,
        role: AssistantRoleEnum.USER,
        text,
      } as MessageInfo,
    ]);
    expect(refreshed[0].mcpAskInteractions?.[0].responseStatus).toBe(
      'submitted',
    );
    render(
      <AgentInterventionChatLayer
        conversationId={42}
        messageList={refreshed}
        onRespondAcpPermission={vi.fn()}
        onRespondMcpAsk={vi.fn()}
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  }, 20_000);
});
