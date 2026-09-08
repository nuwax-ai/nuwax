/**
 * createConversationSessionModel 入口级会话构建器合同测试。
 * 吸收原 Chat 页自行组合的活跃态合成规则（方案 §2.3 / §4）。
 */
import { createConversationSessionModel } from '@/features/conversation/react/createConversationSessionModel';
import { TaskStatus } from '@/types/enums/agent';
import { describe, expect, it } from 'vitest';

const baseInput = {
  conversationId: 1001,
  messageList: [],
  isConversationActive: false,
  isAwaitingChatTerminal: false,
  taskStatus: undefined as TaskStatus | undefined,
};

describe('createConversationSessionModel', () => {
  it('空闲：完整活跃为 false，sessionViewInput 携带原始维度', () => {
    const model = createConversationSessionModel(baseInput);

    expect(model.isConversationActive).toBe(false);
    expect(model.isLocallyStreaming).toBe(false);
    expect(model.isAwaitingChatTerminal).toBe(false);
    expect(model.sessionViewInput).toEqual({
      conversationId: 1001,
      modelStreamActive: false,
      awaitingChatTerminal: false,
      taskStatus: undefined,
      messageList: [],
    });
  });

  it('本地流式：完整活跃与纯流式均为 true', () => {
    const model = createConversationSessionModel({
      ...baseInput,
      isConversationActive: true,
    });

    expect(model.isConversationActive).toBe(true);
    expect(model.isLocallyStreaming).toBe(true);
    expect(model.sessionViewInput.modelStreamActive).toBe(true);
  });

  it('后台任务执行中：完整活跃为 true，纯流式保持 false', () => {
    const model = createConversationSessionModel({
      ...baseInput,
      taskStatus: TaskStatus.EXECUTING,
    });

    expect(model.isConversationActive).toBe(true);
    expect(model.isLocallyStreaming).toBe(false);
    expect(model.sessionViewInput.taskStatus).toBe(TaskStatus.EXECUTING);
  });

  it('终态（COMPLETE/FAILED）不参与完整活跃合成', () => {
    for (const status of [TaskStatus.COMPLETE, TaskStatus.FAILED]) {
      const model = createConversationSessionModel({
        ...baseInput,
        taskStatus: status,
      });
      expect(model.isConversationActive).toBe(false);
    }
  });
});
