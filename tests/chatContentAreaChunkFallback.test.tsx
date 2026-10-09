/**
 * ChatContentArea V2 懒加载 chunk 失败回退合同测试（评审 P1）：
 * 发版后旧 tab 请求已删除 hash / 弱网时 import() reject——V2 内部
 * ErrorBoundary 尚未加载，须由 ChatContentArea 本地 boundary 兜底回退
 * V1 ChatView 列表，禁止整页白屏。
 */
import ChatContentArea from '@/components/business-component/UnifiedChatSession/components/ChatContentArea';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));
vi.mock(
  '@/components/business-component/UnifiedChatSession/components/ChatContentArea/index.less',
  () => ({ default: new Proxy({}, { get: () => 'cls' }) }),
);
vi.mock('@/components/AgentChatEmpty', () => ({ default: () => null }));
vi.mock('@/components/NewConversationSet', () => ({ default: () => null }));
vi.mock('@/components/RecommendList', () => ({ default: () => null }));
vi.mock('@/components/ChatView', () => ({
  default: ({ messageInfo }: { messageInfo: MessageInfo }) => (
    <div data-testid="chat-view" data-message-id={String(messageInfo.id)} />
  ),
}));
// 模拟 chunk 拉取失败（React.lazy 抛错 → 本地 V2RendererLoadBoundary 兜底）
vi.mock('@/features/conversation/presentation-v2/react', () =>
  Promise.reject(new Error('ChunkLoadError: missing hash chunk')),
);

const msg = (id: string, role: AssistantRoleEnum): MessageInfo =>
  ({
    id,
    role,
    text: '文本',
    time: '',
    componentExecutedList: [],
    messageType: 'ASSISTANT',
    index: 0,
    tenantId: 1,
    senderType: 'User',
    senderId: 'u',
    userId: 1,
    agentId: 1,
    status: MessageStatusEnum.Complete,
  } as MessageInfo);

const baseProps = {
  messageViewRef: { current: null } as React.RefObject<HTMLDivElement>,
  handleMouseEnter: () => {},
  handleMouseLeave: () => {},
  isLoading: false,
  effectiveRoleInfo: {
    assistant: { name: 'A', avatar: '' },
    system: { name: 'S', avatar: '' },
  },
  shouldShowSessionSuggest: false,
  handleMessageSend: () => {},
  showTaskExecutingWait: false,
  loadMoreRef: { current: null },
};

const list = [
  msg('u1', AssistantRoleEnum.USER),
  msg('a1', AssistantRoleEnum.ASSISTANT),
];

describe('ChatContentArea · V2 chunk 失败回退', () => {
  it("messageRenderer='v2' 但 chunk 拉取失败：不白屏，回退 V1 ChatView 并记录诊断", async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    render(
      <ChatContentArea
        {...baseProps}
        messageList={list}
        messageRenderer="v2"
      />,
    );
    await waitFor(() => {
      expect(screen.getAllByTestId('chat-view')).toHaveLength(2);
    });
    expect(screen.queryByTestId('conversation-renderer-v2')).toBeNull();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
