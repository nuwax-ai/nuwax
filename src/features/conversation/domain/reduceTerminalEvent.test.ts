import { ConversationEventTypeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
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
  return {
    eventType: ConversationEventTypeEnum.FINAL_RESULT,
    data: { success: true, outputText: '回答正文' },
    requestId: 'req-1',
  } as unknown as ConversationChatResponse;
}

function currentMessage(): MessageInfo {
  return {
    id: 'm1',
    text: '回答正文',
    processingList: [],
  } as MessageInfo;
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
