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

  it('同一实例内 live 与 resume 连接槽位互相独立', () => {
    const runtime = createRuntime();
    runtime.liveConnection.startRun();
    const resumeRun = runtime.resumeConnection.startRun();

    // 中断 live 发送不影响 sub 恢复订阅
    runtime.liveConnection.abortCurrent();
    expect(runtime.resumeConnection.isCurrent(resumeRun)).toBe(true);

    // 中断 sub 恢复也不影响新一轮 live run 的所有权
    const nextLiveRun = runtime.liveConnection.startRun();
    runtime.resumeConnection.abortCurrent();
    expect(runtime.liveConnection.isCurrent(nextLiveRun)).toBe(true);
    expect(runtime.resumeConnection.isSuperseded(resumeRun)).toBe(false);
  });

  it('不同 Runtime 实例的 sub 连接所有权隔离', () => {
    const first = createRuntime();
    const second = createRuntime();
    const firstRun = first.resumeConnection.startRun();
    const secondRun = second.resumeConnection.startRun();

    expect(first.resumeConnection.isCurrent(firstRun)).toBe(true);
    expect(second.resumeConnection.isCurrent(secondRun)).toBe(true);
    first.resumeConnection.abortCurrent();
    expect(second.resumeConnection.isCurrent(secondRun)).toBe(true);
    expect(first.resumeConnection.isCurrent(firstRun)).toBe(false);
  });
});
