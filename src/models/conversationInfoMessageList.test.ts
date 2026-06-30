import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';
import { appendOutgoingConversationMessages } from './conversationInfoMessageList';

describe('appendOutgoingConversationMessages', () => {
  it('preserves submitted ask/question state when appending resume messages', () => {
    const existing = {
      id: 'agent-message',
      status: MessageStatusEnum.Complete,
      mcpAskInteractions: [
        {
          input: {
            toolName: 'nuwax_ask_question',
            requestId: 'ask-1',
            prompt: 'fill form',
            schema: {},
            ui: {},
          },
          responseStatus: 'submitted',
          formData: { thesisTitle: 'AI Based Thesis Defense PPT Generator' },
        },
      ],
    } as unknown as MessageInfo;

    const appended = appendOutgoingConversationMessages(
      [existing],
      { id: 'user-message', text: 'resume' } as MessageInfo,
      {
        id: 'assistant-message',
        status: MessageStatusEnum.Loading,
      } as MessageInfo,
    );

    expect(appended).toHaveLength(3);
    expect(appended[0].mcpAskInteractions?.[0].responseStatus).toBe(
      'submitted',
    );
  });

  it('completes incomplete messages without mutating the original item', () => {
    const existing = {
      id: 'agent-message',
      status: MessageStatusEnum.Incomplete,
    } as MessageInfo;

    const appended = appendOutgoingConversationMessages(
      [existing],
      { id: 'user-message' } as MessageInfo,
      { id: 'assistant-message' } as MessageInfo,
    );

    expect(appended[0].status).toBe(MessageStatusEnum.Complete);
    expect(existing.status).toBe(MessageStatusEnum.Incomplete);
  });
});
