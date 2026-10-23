import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageTypeEnum,
  TaskStatus,
} from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  ConversationFinalResult,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';
import { reduceTerminalEvent } from './reduceTerminalEvent';

/**
 * 回归背景：reconciler 会把只在 finalResult.componentExecuteResults 里的补投
 * 结果以 markdown-custom-process 块追加进 text（真实现见
 * reconcileFinalMessageState → getCustomBlock）。这里用同形 stub 表达该契约，
 * 避免单测耦合 AgentIntervention 依赖链。
 */
const appendedBlock =
  '<div><markdown-custom-process executeId="exec-backfill-1" type="ToolCall" status="3"></markdown-custom-process></div>';

const stubReconciler = (message: MessageInfo) => ({
  ...message,
  text: `${message.text || ''}${appendedBlock}`,
});

function finalResultEvent(): ConversationChatResponse {
  const finalResult: ConversationFinalResult = {
    success: true,
    outputText: '回答正文',
    completionTokens: 1,
    promptTokens: 1,
    totalTokens: 2,
    componentExecuteResults: [],
    startTime: 1000,
    endTime: 2000,
    error: '',
  };
  return {
    completed: true,
    eventType: ConversationEventTypeEnum.FINAL_RESULT,
    data: finalResult,
    error: '',
    requestId: 'req-1',
  };
}

function currentMessage(): MessageInfo {
  return {
    id: 'm1',
    index: 0,
    role: AssistantRoleEnum.ASSISTANT,
    time: '2026-10-02 10:00:00',
    componentExecutedList: [],
    messageType: MessageTypeEnum.ASSISTANT,
    tenantId: 1,
    senderType: 'AGENT',
    senderId: '5',
    userId: 1,
    agentId: 5,
    text: '回答正文',
    processingList: [],
  };
}

describe('reduceTerminalEvent FINAL_RESULT text 投影', () => {
  it('终态 text 保留 reconciler 写入的补投块，不被 reconcile 前的 text 覆盖', () => {
    const { message, applied, taskStatus } = reduceTerminalEvent(
      [currentMessage()],
      'm1',
      finalResultEvent(),
      stubReconciler,
    );

    expect(applied).toBe(true);
    expect(taskStatus).toBeTruthy();
    expect(message?.status).toBe(MessageStatusEnum.Complete);
    // 回归点：修复前 text: closeOpenThinkBlock() 用 reconcile 前的
    // currentMessage.text 整体覆盖，补投块被丢弃
    expect(message?.text).toContain('executeId="exec-backfill-1"');
    expect(message?.text).toContain('回答正文');
  });

  it('思考收口基于 reconcile 之后的 text：finalizer 收到补投块且其输出成为终态 text', () => {
    const seenTexts: string[] = [];
    const trackingFinalizer = (text: string) => {
      seenTexts.push(text);
      return `${text}<!--think-closed-->`;
    };

    const { message } = reduceTerminalEvent(
      [currentMessage()],
      'm1',
      finalResultEvent(),
      stubReconciler,
      trackingFinalizer,
    );

    expect(seenTexts).toHaveLength(1);
    expect(seenTexts[0]).toContain('executeId="exec-backfill-1"');
    expect(message?.text).toContain('<!--think-closed-->');
  });
});

describe('reduceTerminalEvent FINAL_RESULT 终态透出（NW-050）', () => {
  const failedFinal = (
    error: string,
    overrides: Partial<ConversationFinalResult> = {},
  ): ConversationChatResponse => ({
    completed: true,
    eventType: ConversationEventTypeEnum.FINAL_RESULT,
    data: {
      ...finalResultEvent().data,
      success: false,
      error,
      ...overrides,
    } as ConversationFinalResult,
    error: '',
    requestId: 'req-failed-final',
  });

  it('success=false 明确失败时消息置 Error，不再显示为运行完成', () => {
    const { message, taskStatus } = reduceTerminalEvent(
      [currentMessage()],
      'm1',
      failedFinal('context length exceeded'),
      stubReconciler,
    );
    expect(taskStatus).toBe(TaskStatus.FAILED);
    expect(message?.status).toBe(MessageStatusEnum.Error);
  });

  it('用户主动取消（保留部分输出）不标 Error：取消不是失败', () => {
    const { message, taskStatus } = reduceTerminalEvent(
      [{ ...currentMessage(), text: '部分输出' }],
      'm1',
      failedFinal('用户主动取消任务', { outputText: '部分输出' }),
      stubReconciler,
    );
    expect(taskStatus).toBe(TaskStatus.CANCEL);
    expect(message?.status).toBe(MessageStatusEnum.Complete);
  });

  it('「正在执行任务」冲突拒绝新请求时不标 Error：旧任务仍在执行', () => {
    const { message, taskStatus } = reduceTerminalEvent(
      [currentMessage()],
      'm1',
      failedFinal('Agent正在执行任务，请等待当前任务完成后再发送新请求'),
      stubReconciler,
    );
    expect(taskStatus).toBeUndefined();
    expect(message?.status).toBe(MessageStatusEnum.Complete);
  });
});

describe('reduceTerminalEvent ERROR 合同', () => {
  const safeError =
    'Agent execution failed. Please retry or contact the administrator.';
  const event: ConversationChatResponse = {
    requestId: 'req-failed',
    eventType: ConversationEventTypeEnum.ERROR,
    completed: true,
    error: safeError,
    data: null,
  };

  it('重复 ERROR 不重复追加安全错误，并保留原正文与服务端 requestId', () => {
    const first = reduceTerminalEvent(
      [currentMessage()],
      'm1',
      event,
      stubReconciler,
    );
    const repeated = reduceTerminalEvent(
      first.messages,
      'm1',
      event,
      stubReconciler,
    );
    expect(repeated.message?.text).toBe(`回答正文\n\n${safeError}`);
    expect(repeated.message?.requestId).toBe('req-failed');
    expect(repeated.message?.status).toBe(MessageStatusEnum.Error);
  });

  it('ERROR 缺 requestId 时保留当前消息的 requestId', () => {
    const message = { ...currentMessage(), requestId: 'req-existing' };
    const result = reduceTerminalEvent(
      [message],
      'm1',
      { ...event, requestId: '' },
      stubReconciler,
    );
    expect(result.message?.requestId).toBe('req-existing');
  });
});
