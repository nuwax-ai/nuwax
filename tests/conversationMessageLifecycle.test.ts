import {
  finalizeMessagesOnStreamClose,
  finalizeMessagesOnTerminalTaskStatus,
  finalizeOwnedMessageOnStaleClose,
  markOwnedMessageStreamError,
} from '@/features/conversation/domain/messageLifecycle';
import { AssistantRoleEnum, TaskStatus } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type {
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';

const message = (value: Partial<MessageInfo>): MessageInfo =>
  value as MessageInfo;
const processing = (id: string): ProcessingInfo =>
  ({ id, status: ProcessingEnum.EXECUTING } as unknown as ProcessingInfo);

describe('conversation message lifecycle', () => {
  it.each([TaskStatus.COMPLETE, TaskStatus.FAILED])(
    '确认 %s 终态时清算当前轮的所有运行中消息，保留更早轮次',
    (taskStatus) => {
      const earlierRound = message({
        id: 'earlier-assistant',
        role: AssistantRoleEnum.ASSISTANT,
        status: MessageStatusEnum.Loading,
      });
      const user = message({
        id: 'current-user',
        role: AssistantRoleEnum.USER,
      });
      const history = message({
        id: 'partial-history',
        role: AssistantRoleEnum.ASSISTANT,
        status: MessageStatusEnum.Loading,
        thinkingFinished: false,
        processingList: [processing('history-tool')],
      });
      const resume = message({
        id: 'resume-output',
        role: AssistantRoleEnum.ASSISTANT,
        status: MessageStatusEnum.Incomplete,
        thinkingFinished: false,
      });
      const finishedTail = message({
        id: 'finished-output',
        role: AssistantRoleEnum.ASSISTANT,
        status: MessageStatusEnum.Complete,
        thinkingFinished: true,
      });
      const result = finalizeMessagesOnTerminalTaskStatus(
        [earlierRound, user, history, resume, finishedTail],
        taskStatus,
      );
      const status =
        taskStatus === TaskStatus.FAILED
          ? MessageStatusEnum.Error
          : MessageStatusEnum.Complete;
      expect(result[0]).toBe(earlierRound);
      expect(result[1]).toBe(user);
      expect(result[2]).toMatchObject({ status, thinkingFinished: true });
      expect(result[3]).toMatchObject({ status, thinkingFinished: true });
      expect(result[4]).toBe(finishedTail);
      expect(history.status).toBe(MessageStatusEnum.Loading);
      expect(resume.status).toBe(MessageStatusEnum.Incomplete);
    },
  );

  it('live 流关闭：清理所有 EXECUTING processing，只停止最后一条临时消息', () => {
    const first = message({
      id: 'assistant-old',
      status: MessageStatusEnum.Complete,
      thinkingFinished: false,
      processingList: [processing('processing-old')],
    });
    const last = message({
      id: 'assistant-current',
      status: MessageStatusEnum.Incomplete,
      thinkingFinished: false,
      processingList: [processing('processing-current')],
    });

    const result = finalizeMessagesOnStreamClose([first, last]);

    expect(result[0]).toMatchObject({
      status: MessageStatusEnum.Complete,
      thinkingFinished: false,
      processingList: [{ status: ProcessingEnum.FAILED }],
    });
    expect(result[1]).toMatchObject({
      status: MessageStatusEnum.Stopped,
      thinkingFinished: true,
      processingList: [{ status: ProcessingEnum.FAILED }],
    });
  });

  it('过期连接关闭：只停止其所属消息，不触碰新一轮消息', () => {
    const oldMessage = message({
      id: 'assistant-old',
      status: MessageStatusEnum.Loading,
      thinkingFinished: false,
      processingList: [processing('processing-old')],
    });
    const currentMessage = message({
      id: 'assistant-current',
      status: MessageStatusEnum.Loading,
    });

    const result = finalizeOwnedMessageOnStaleClose(
      [oldMessage, currentMessage],
      'assistant-old',
    );

    expect(result[0]).toMatchObject({
      status: MessageStatusEnum.Stopped,
      thinkingFinished: true,
      processingList: [{ status: ProcessingEnum.FAILED }],
    });
    expect(result[1]).toBe(currentMessage);
  });

  it('连接错误：只将所属消息置为 Error，并保留 thinkingFinished 原值', () => {
    const failedMessage = message({
      id: 'assistant-failed',
      status: MessageStatusEnum.Loading,
      thinkingFinished: false,
      processingList: [processing('processing-failed')],
    });
    const otherMessage = message({ id: 'assistant-other' });

    const result = markOwnedMessageStreamError(
      [failedMessage, otherMessage],
      'assistant-failed',
    );

    expect(result[0]).toMatchObject({
      status: MessageStatusEnum.Error,
      thinkingFinished: false,
      processingList: [{ status: ProcessingEnum.FAILED }],
    });
    expect(result[1]).toBe(otherMessage);
  });
});
