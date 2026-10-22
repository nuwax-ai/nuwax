/** 手机发消息后，PC 轮询/续接不能把上一轮回答归给新消息。 */
import { projectConversation } from '@/features/conversation/presentation-v2/projectConversation';
import {
  appendOutgoingConversationMessages,
  preserveOptimisticMessageTail,
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
  it('手机新轮仅落库 user 时，上一轮 UUID assistant 不能追加到手机轮下面', () => {
    const local = localRound();
    const incoming = [
      ...pcSnapshot(),
      message('u-mobile', AssistantRoleEnum.USER, '参考你的建议'),
    ];
    const merged = reconcileConversationSnapshotMessages(local, incoming);
    expect(merged.map((item) => item.text)).toEqual([
      '确认',
      'PC 第一轮回答',
      '参考你的建议',
    ]);
    expect(projectConversation(merged).turns[1].assistantMessages).toHaveLength(
      0,
    );
  });

  it('手机轮已有空白 loading assistant 时，PC 旧回答仍只属于旧轮', () => {
    const incoming = [
      ...pcSnapshot(),
      message('u-mobile', AssistantRoleEnum.USER, '参考你的建议'),
      message('a-mobile', AssistantRoleEnum.ASSISTANT, '', {
        status: MessageStatusEnum.Loading,
      }),
    ];
    const merged = reconcileConversationSnapshotMessages(
      localRound(),
      incoming,
    );
    expect(merged).toHaveLength(4);
    expect(projectConversation(merged).turns[1].finalAnswer.text).toBe('');
  });

  it('重装历史时，本地旧回答尚未落库也必须留在手机新 user 之前', () => {
    const local = localRound();
    const incoming = [
      pcSnapshot()[0],
      message('u-mobile', AssistantRoleEnum.USER, '参考你的建议'),
    ];
    const merged = preserveOptimisticMessageTail(local, incoming);
    expect(merged.map((item) => item.text)).toEqual([
      '确认',
      'PC 第一轮回答',
      '参考你的建议',
    ]);
    expect(projectConversation(merged).turns[1].assistantMessages).toHaveLength(
      0,
    );
  });

  it('手机重复同一指令且尚无回答时，不把无法唯一定位的 PC 终态尾巴加到手机轮', () => {
    const incoming = [
      ...pcSnapshot(),
      message('u-mobile', AssistantRoleEnum.USER, '确认'),
    ];
    const merged = reconcileConversationSnapshotMessages(
      localRound(),
      incoming,
    );
    expect(merged.map((item) => item.text)).toEqual([
      '确认',
      'PC 第一轮回答',
      '确认',
    ]);
    expect(projectConversation(merged).turns[1].assistantMessages).toHaveLength(
      0,
    );
  });

  it('连续两轮本地 UUID 各自归位，不把较早轮的回答带进最后一轮', () => {
    const secondUser = '7233af1e-2fa9-4328-9e7a-183829c2589a';
    const secondAssistant = '73c0dc1a-0c45-4d6f-8a4d-b18463e3d3b6';
    const local = [
      ...localRound(),
      message(secondUser, AssistantRoleEnum.USER, '第二轮'),
      message(secondAssistant, AssistantRoleEnum.ASSISTANT, '第二轮已输出', {
        status: MessageStatusEnum.Incomplete,
      }),
    ];
    const incoming = [
      ...pcSnapshot(),
      message('u-second', AssistantRoleEnum.USER, '第二轮'),
      message('u-mobile', AssistantRoleEnum.USER, '手机新轮'),
    ];
    const merged = preserveOptimisticMessageTail(local, incoming);
    expect(merged.map((item) => item.text)).toEqual([
      '确认',
      'PC 第一轮回答',
      '第二轮',
      '第二轮已输出',
      '手机新轮',
    ]);
    expect(projectConversation(merged).turns[2].assistantMessages).toHaveLength(
      0,
    );
  });

  it('本地 SSE assistant 的服务端 ID 已在同轮快照中时不重复保留', () => {
    const local = [
      message(localUserId, AssistantRoleEnum.USER, '确认'),
      message('a-stream', AssistantRoleEnum.ASSISTANT, '流式内容', {
        status: MessageStatusEnum.Incomplete,
      }),
    ];
    const incoming = [
      pcSnapshot()[0],
      message('a-stream', AssistantRoleEnum.ASSISTANT, '最新流式内容', {
        status: MessageStatusEnum.Incomplete,
      }),
    ];
    expect(preserveOptimisticMessageTail(local, incoming)).toEqual(incoming);
  });

  it('快照与恢复流中同一工具只投影一次，复用位置并采用最新状态', () => {
    const process = (status: string) =>
      `<markdown-custom-process executeId="resume-tool" type="ToolCall" status="${status}" name="审计"></markdown-custom-process>`;
    const presentation = projectConversation([
      message('u-mobile', AssistantRoleEnum.USER, '继续'),
      message('a-snapshot', AssistantRoleEnum.ASSISTANT, process('EXECUTING'), {
        status: MessageStatusEnum.Incomplete,
      }),
      message('a-replay', AssistantRoleEnum.ASSISTANT, process('FINISHED')),
    ]);
    const turn = presentation.turns[0];
    expect(
      turn.nodes.filter((node) => node.executeId === 'resume-tool'),
    ).toHaveLength(1);
    expect(turn.nodes[0].status).toBe('finished');
    expect(new Set(turn.nodes.map((node) => node.id)).size).toBe(
      turn.nodes.length,
    );
  });

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
