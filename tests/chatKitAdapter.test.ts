import {
  toChatKitConversation,
  toChatKitMessage,
} from '@/adapters/chatKitAdapter';
import type {
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';

describe('Nuwax chat-kit adapter', () => {
  it('preserves rich message parts and normalizes ids', () => {
    const message = {
      id: 12,
      index: 3,
      role: 'ASSISTANT',
      status: 'loading',
      text: 'answer',
      think: 'reasoning',
      time: '2026-07-21T00:00:00.000Z',
      attachments: [
        {
          fileKey: 'file-1',
          fileUrl: '/file/1',
          fileName: 'notes.txt',
          mimeType: 'text/plain',
        },
      ],
      processingList: [
        { executeId: 'tool-1', name: 'Search', status: 'EXECUTING' },
      ],
    } as MessageInfo;

    const result = toChatKitMessage(message, 99);
    expect(result.id).toBe('12:3');
    expect(result.conversationId).toBe('99');
    expect(result.role).toBe('assistant');
    expect(result.status).toBe('streaming');
    expect(result.parts.map((part) => part.type)).toEqual([
      'thinking',
      'text',
      'attachment',
      'tool',
    ]);
  });

  it('maps conversation identity and executing state', () => {
    const result = toChatKitConversation({
      id: 7,
      agentId: 8,
      uid: 'conversation-uid',
      topic: 'Shared chat',
      summary: 'Summary',
      created: '2026-07-20T00:00:00.000Z',
      modified: '2026-07-21T00:00:00.000Z',
      taskStatus: 'EXECUTING',
    } as ConversationInfo);

    expect(result).toMatchObject({
      id: '7',
      agentId: '8',
      title: 'Shared chat',
      status: 'executing',
    });
  });
});
