import { createConversationRuntime } from '@/features/conversation/runtime/createConversationRuntime';
import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageModeEnum,
} from '@/types/enums/agent';
import { describe, expect, it, vi } from 'vitest';

const createRuntime = () =>
  createConversationRuntime({
    renderProcessingBlock: vi.fn(() => 'block'),
    reconcileFinalMessage: vi.fn((message) => message),
  });

describe('createConversationRuntime', () => {
  it('同一实例跨 MESSAGE chunk 持有 active output identity', () => {
    const runtime = createRuntime();
    const owner = {
      id: 'owner',
      role: AssistantRoleEnum.ASSISTANT,
      type: MessageModeEnum.CHAT,
      text: '',
    } as any;

    const first = runtime.reduceStreamEvent([owner], 'owner', {
      eventType: ConversationEventTypeEnum.MESSAGE,
      data: {
        id: 'server-output-1',
        type: MessageModeEnum.CHAT,
        text: 'A',
        finished: false,
      },
    } as any);
    const second = runtime.reduceStreamEvent(first.messages, 'owner', {
      eventType: ConversationEventTypeEnum.MESSAGE,
      data: {
        id: 'server-output-1',
        type: MessageModeEnum.CHAT,
        text: 'B',
        finished: true,
      },
    } as any);

    expect(second.messages[0].text).toBe('AB');
    expect(runtime.getActiveOutputMessageId()).toBe('server-output-1');
    runtime.resetStreamProjection();
    expect(runtime.getActiveOutputMessageId()).toBe('');
  });

  it('不同 Runtime 实例的输出身份与连接所有权隔离', () => {
    const first = createRuntime();
    const second = createRuntime();
    const firstRun = first.liveConnection.startRun();
    const secondRun = second.liveConnection.startRun();

    expect(first.liveConnection.isCurrent(firstRun)).toBe(true);
    expect(second.liveConnection.isCurrent(secondRun)).toBe(true);
    first.liveConnection.abortCurrent();
    expect(second.liveConnection.isCurrent(secondRun)).toBe(true);
  });
});
