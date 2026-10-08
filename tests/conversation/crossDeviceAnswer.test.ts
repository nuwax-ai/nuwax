/** 手机发消息后，PC 轮询/续接不能把上一轮回答归给新消息。 */
import { projectConversation } from '@/features/conversation/presentation-v2/projectConversation';
import {
  appendOutgoingConversationMessages,
  reconcileConversationSnapshotMessages,
} from '@/models/conversationInfoMessageList';
import { AssistantRoleEnum, MessageModeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';

const message = (
  id: string,
  role: AssistantRoleEnum,
  text: string,
  extra: Partial<MessageInfo> = {},
): MessageInfo =>
  ({
    id,
    role,
    text,
    type: MessageModeEnum.CHAT,
    status: MessageStatusEnum.Complete,
    componentExecutedList: [],
    ...extra,
  } as MessageInfo);

const finalResult = (outputText: string): MessageInfo['finalResult'] =>
  ({ success: true, outputText } as MessageInfo['finalResult']);

const localUserId = '06e63270-f77b-4284-9ec6-e6d7ca0e91bc';
const localAssistantId = '975c4fb5-dfcc-45c7-9739-448a01273409';
const localRound = () =>
  appendOutgoingConversationMessages(
    [],
    message(localUserId, AssistantRoleEnum.USER, '确认'),
    message(localAssistantId, AssistantRoleEnum.ASSISTANT, 'PC 第一轮回答', {
      finalResult: finalResult('PC 第一轮回答'),
      requestId: 'pc-request',
    }),
  );
const pcSnapshot = () => [
  message('u-pc', AssistantRoleEnum.USER, '确认'),
  message('a-pc', AssistantRoleEnum.ASSISTANT, 'PC 第一轮回答'),
];
const mobileSnapshot = () => [
  message('u-mobile', AssistantRoleEnum.USER, '确认'),
  message('a-mobile', AssistantRoleEnum.ASSISTANT, '手机第二轮回答', {
    requestId: 'mobile-request',
  }),
];

describe('跨端快照回答归属', () => {
  it('PC UUID user 尚未映射时，同文案的两轮快照不猜测归属或覆盖手机回答', () => {
    const incoming = [...pcSnapshot(), ...mobileSnapshot()];
    const merged = reconcileConversationSnapshotMessages(
      localRound(),
      incoming,
    );
    expect(merged.map((item) => item.text)).toEqual([
      '确认',
      'PC 第一轮回答',
      '确认',
      '手机第二轮回答',
    ]);
    expect(merged[3].clientRenderKey).toBeUndefined();
    expect(merged[3].finalResult).toBeUndefined();
  });

  it('重复文案有唯一 requestId 时，UUID user 映射到对应轮而非最后一轮', () => {
    const current = localRound();
    current[0].requestId = 'pc-request';
    const incoming = [...pcSnapshot(), ...mobileSnapshot()];
    incoming[0].requestId = 'pc-request';
    incoming[2].requestId = 'mobile-request';
    const merged = reconcileConversationSnapshotMessages(current, incoming);
    expect(merged[0].clientRenderKey).toBe(localUserId);
    expect(merged[1].clientRenderKey).toBe(localAssistantId);
    expect(merged[3].text).toBe('手机第二轮回答');
    expect(merged[3].finalResult).toBeUndefined();
  });

  it('PC 消息落库后，手机重复同一指令仍保留两轮各自的回答和渲染标识', () => {
    const current = reconcileConversationSnapshotMessages(
      localRound(),
      pcSnapshot(),
    );
    const incoming = [...pcSnapshot(), ...mobileSnapshot()];
    const merged = reconcileConversationSnapshotMessages(current, incoming);
    expect(merged.map((item) => item.text)).toEqual([
      '确认',
      'PC 第一轮回答',
      '确认',
      '手机第二轮回答',
    ]);
    expect(merged[0].clientRenderKey).toBe(localUserId);
    expect(merged[1].clientRenderKey).toBe(localAssistantId);
    expect(merged[2].clientRenderKey).toBeUndefined();
    expect(merged[3].clientRenderKey).toBeUndefined();
    expect(merged[3].requestId).toBe('mobile-request');
    expect(merged[3].finalResult).toBeUndefined();
    expect(
      projectConversation(merged).turns.map((turn) => turn.finalAnswer.text),
    ).toEqual(['PC 第一轮回答', '手机第二轮回答']);
    expect(reconcileConversationSnapshotMessages(merged, incoming)).toBe(
      merged,
    );
  });

  it('快照仅含手机新轮时，不把缺失的旧轮映射到同文案的新轮', () => {
    const current = reconcileConversationSnapshotMessages(
      localRound(),
      pcSnapshot(),
    );
    const merged = reconcileConversationSnapshotMessages(
      current,
      mobileSnapshot(),
    );
    expect(merged.map((item) => item.text)).toEqual([
      '确认',
      'PC 第一轮回答',
      '确认',
      '手机第二轮回答',
    ]);
    expect(merged[3].finalResult).toBeUndefined();
    expect(merged[3].clientRenderKey).toBeUndefined();
  });

  it('PC 用户消息先落库、assistant 尚未落库时，不跨过手机 USER 匹配 assistant', () => {
    const current = reconcileConversationSnapshotMessages(localRound(), [
      pcSnapshot()[0],
    ]);
    const merged = reconcileConversationSnapshotMessages(current, [
      pcSnapshot()[0],
      ...mobileSnapshot(),
    ]);
    const mobileAnswer = merged.find((item) => item.id === 'a-mobile');
    expect(mobileAnswer?.text).toBe('手机第二轮回答');
    expect(mobileAnswer?.clientRenderKey).toBeUndefined();
    expect(mobileAnswer?.finalResult).toBeUndefined();
  });

  it('新轮文案不同且旧轮 assistant 尚未落库时，也不能跨 USER 匹配', () => {
    const current = reconcileConversationSnapshotMessages(localRound(), [
      pcSnapshot()[0],
    ]);
    const mobile = mobileSnapshot();
    mobile[0].text = '继续';
    const merged = reconcileConversationSnapshotMessages(current, [
      pcSnapshot()[0],
      ...mobile,
    ]);
    expect(merged.find((item) => item.id === 'a-mobile')?.text).toBe(
      '手机第二轮回答',
    );
    expect(
      merged.find((item) => item.id === 'a-mobile')?.clientRenderKey,
    ).toBeUndefined();
  });
});

describe('续接中的最终回答归属', () => {
  it.each([MessageStatusEnum.Complete, MessageStatusEnum.Incomplete])(
    '同轮最新正文（%s）没有 finalResult 时，不回用更早的最终回答',
    (status) => {
      const turn = projectConversation([
        message('u1', AssistantRoleEnum.USER, '任务'),
        message('a1', AssistantRoleEnum.ASSISTANT, '旧回答', {
          finalResult: finalResult('旧回答'),
          requestId: 'r1',
        }),
        message('a2', AssistantRoleEnum.ASSISTANT, '续接的新回答', {
          status,
          requestId: 'r1',
        }),
      ]).turns[0];
      expect(turn.finalAnswer).toEqual({
        text: '续接的新回答',
        source: 'messageText',
      });
      expect(
        turn.nodes
          .filter((node) => node.kind === 'narration')
          .map((node) => node.text),
      ).toEqual(['旧回答']);
    },
  );

  it('最新流式占位还没有正文时，不再次显示旧最终回答', () => {
    const turn = projectConversation([
      message('a1', AssistantRoleEnum.ASSISTANT, '旧回答', {
        finalResult: finalResult('旧回答'),
      }),
      message('a2', AssistantRoleEnum.ASSISTANT, '', {
        status: MessageStatusEnum.Loading,
      }),
    ]).turns[0];
    expect(turn.running).toBe(true);
    expect(turn.finalAnswer).toEqual({ text: '', source: 'none' });
  });

  it('最新消息带自己的 finalResult 时，仍优先使用它', () => {
    const turn = projectConversation([
      message('a1', AssistantRoleEnum.ASSISTANT, '旧回答', {
        finalResult: finalResult('旧回答'),
      }),
      message('a2', AssistantRoleEnum.ASSISTANT, '续接正文', {
        finalResult: finalResult('续接的最终回答'),
      }),
    ]).turns[0];
    expect(turn.finalAnswer).toEqual({
      text: '续接的最终回答',
      source: 'finalResult',
    });
  });

  it('末尾 SYSTEM 信息不影响 assistant 最终回答', () => {
    const turn = projectConversation([
      message('a1', AssistantRoleEnum.ASSISTANT, '正确回答', {
        finalResult: finalResult('正确回答'),
      }),
      message('s1', AssistantRoleEnum.SYSTEM, '上下文'),
    ]).turns[0];
    expect(turn.finalAnswer).toEqual({
      text: '正确回答',
      source: 'finalResult',
    });
  });
});
