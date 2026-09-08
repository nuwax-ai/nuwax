/**
 * ConversationSessionView 聚合选择器合同测试（方案 §5.6）。
 * Interface 即测试 Surface：语义在此冻结，页面切换到 Facade 消费时以本合同为准。
 */
import {
  selectConversationSessionView,
  type ConversationSessionViewInput,
} from '@/features/conversation/domain/sessionView';
import { TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';

const loadingMessage = { status: MessageStatusEnum.Loading } as MessageInfo;
const completeMessage = { status: MessageStatusEnum.Complete } as MessageInfo;

const baseInput = (
  overrides: Partial<ConversationSessionViewInput> = {},
): ConversationSessionViewInput => ({
  conversationId: 1001,
  modelStreamActive: false,
  awaitingChatTerminal: false,
  resumeSubscribed: false,
  taskStatus: undefined,
  messageList: [],
  hasQueuedMessages: false,
  hasPendingIntervention: false,
  ...overrides,
});

describe('selectConversationSessionView', () => {
  it('空闲会话：idle、可发送、可轮询、无停止按钮', () => {
    const view = selectConversationSessionView(
      baseInput({ messageList: [completeMessage] }),
    );

    expect(view.phase).toBe('idle');
    expect(view.canSendNow).toBe(true);
    expect(view.shouldEnqueue).toBe(false);
    expect(view.canPollSnapshot).toBe(true);
    expect(view.shouldShowStop).toBe(false);
    expect(view.shouldShowTaskWait).toBe(false);
    expect(view.shouldShowSuggest).toBe(true);
  });

  it('流式投影活跃：streaming、入队、停止按钮、不显示建议与等待提示', () => {
    const view = selectConversationSessionView(
      baseInput({ messageList: [completeMessage, loadingMessage] }),
    );

    expect(view.phase).toBe('streaming');
    expect(view.canSendNow).toBe(false);
    expect(view.shouldEnqueue).toBe(true);
    expect(view.canPollSnapshot).toBe(true); // 轮询门禁读 model 原始活跃态而非消息投影
    expect(view.shouldShowStop).toBe(true);
    expect(view.shouldShowTaskWait).toBe(false);
    expect(view.shouldShowSuggest).toBe(false);
  });

  it('本地已发送等终态：awaiting-terminal、不可轮询快照', () => {
    const view = selectConversationSessionView(
      baseInput({ awaitingChatTerminal: true }),
    );

    expect(view.phase).toBe('awaiting-terminal');
    expect(view.canPollSnapshot).toBe(false);
  });

  it('流式投影与等终态并存时 phase 取更具体的 streaming', () => {
    const view = selectConversationSessionView(
      baseInput({
        awaitingChatTerminal: true,
        messageList: [loadingMessage],
      }),
    );

    expect(view.phase).toBe('streaming');
  });

  it('sub 恢复订阅中：resuming、不可轮询（sub 接管输出）', () => {
    const view = selectConversationSessionView(
      baseInput({
        resumeSubscribed: true,
        messageList: [loadingMessage],
      }),
    );

    expect(view.phase).toBe('resuming');
    expect(view.canPollSnapshot).toBe(false);
  });

  it('model 活跃态：不可轮询、入队、停止按钮', () => {
    const view = selectConversationSessionView(
      baseInput({ modelStreamActive: true }),
    );

    expect(view.phase).toBe('streaming');
    expect(view.canSendNow).toBe(false);
    expect(view.shouldEnqueue).toBe(true);
    expect(view.canPollSnapshot).toBe(false);
    expect(view.shouldShowStop).toBe(true);
  });

  it('后端任务执行中且流式结束：显示等待提示与停止按钮', () => {
    const view = selectConversationSessionView(
      baseInput({
        taskStatus: TaskStatus.EXECUTING,
        messageList: [completeMessage],
      }),
    );

    expect(view.phase).toBe('idle');
    expect(view.shouldShowTaskWait).toBe(true);
    expect(view.shouldShowStop).toBe(true);
    expect(view.shouldEnqueue).toBe(true);
    // 任务执行中仍在流式输出时不显示等待提示
    const streaming = selectConversationSessionView(
      baseInput({
        taskStatus: TaskStatus.EXECUTING,
        messageList: [completeMessage, loadingMessage],
      }),
    );
    expect(streaming.shouldShowTaskWait).toBe(false);
  });

  it('队列有消息或流式活跃时不显示建议', () => {
    const queued = selectConversationSessionView(
      baseInput({
        messageList: [completeMessage],
        hasQueuedMessages: true,
      }),
    );
    expect(queued.shouldShowSuggest).toBe(false);
  });

  it('待响应干预：只阻塞发送/消费，不阻塞入队语义', () => {
    const view = selectConversationSessionView(
      baseInput({ hasPendingIntervention: true }),
    );

    expect(view.canSendNow).toBe(false);
    expect(view.shouldEnqueue).toBe(false);
    expect(view.queueGate.consumeBlocked).toBe(true);
    expect(view.queueGate.enqueueBlocked).toBe(false);
  });

  it('无会话 ID：不可轮询快照', () => {
    const view = selectConversationSessionView(
      baseInput({ conversationId: undefined }),
    );

    expect(view.canPollSnapshot).toBe(false);
  });
});
