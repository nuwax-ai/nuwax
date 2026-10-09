import { reconcileConversationSnapshotMessages } from '@/models/conversationInfoMessageList';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';

const message = (status: string, revision = 1) =>
  ({
    id: 1,
    role: 'ASSISTANT',
    text: '问题',
    mcpAskInteractions: [
      { responseStatus: status, input: { requestId: 'ask', revision } },
    ],
  } as unknown as MessageInfo);

describe('问答已处理状态的快照归并', () => {
  it('旧 pending 快照保留本地 submitted，不依赖正文终态或 clientRenderKey', () => {
    const result = reconcileConversationSnapshotMessages(
      [message('submitted')],
      [message('pending')],
    );
    expect(result[0].mcpAskInteractions?.[0].responseStatus).toBe('submitted');
  });
  it('同 requestId 的新 revision 正常 pending', () => {
    const result = reconcileConversationSnapshotMessages(
      [message('submitted')],
      [message('pending', 2)],
    );
    expect(result[0].mcpAskInteractions?.[0].responseStatus).toBe('pending');
  });
});
