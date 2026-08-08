import { AssistantRoleEnum, MessageTypeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';
import {
  appendOutgoingConversationMessages,
  areMessageListsEquivalent,
  isOptimisticMessageId,
  needsTerminalHistoryReload,
  preserveOptimisticMessageTail,
  reconcileConversationSnapshotMessages,
} from './conversationInfoMessageList';

describe('appendOutgoingConversationMessages', () => {
  it('preserves submitted ask/question state when appending resume messages', () => {
    const existing = {
      id: 'agent-message',
      status: MessageStatusEnum.Complete,
      mcpAskInteractions: [
        {
          input: {
            toolName: 'nuwax_ask_question',
            requestId: 'ask-1',
            prompt: 'fill form',
            schema: {},
            ui: {},
          },
          responseStatus: 'submitted',
          formData: { thesisTitle: 'AI Based Thesis Defense PPT Generator' },
        },
      ],
    } as unknown as MessageInfo;

    const appended = appendOutgoingConversationMessages(
      [existing],
      { id: 'user-message', text: 'resume' } as MessageInfo,
      {
        id: 'assistant-message',
        status: MessageStatusEnum.Loading,
      } as MessageInfo,
    );

    expect(appended).toHaveLength(3);
    expect(appended[0].mcpAskInteractions?.[0].responseStatus).toBe(
      'submitted',
    );
  });

  it('completes incomplete messages without mutating the original item', () => {
    const existing = {
      id: 'agent-message',
      status: MessageStatusEnum.Incomplete,
    } as MessageInfo;

    const appended = appendOutgoingConversationMessages(
      [existing],
      { id: 'user-message' } as MessageInfo,
      { id: 'assistant-message' } as MessageInfo,
    );

    expect(appended[0].status).toBe(MessageStatusEnum.Complete);
    expect(existing.status).toBe(MessageStatusEnum.Incomplete);
  });
});

describe('isOptimisticMessageId', () => {
  it('treats frontend uuidv4 id as optimistic', () => {
    expect(isOptimisticMessageId('11111111-1111-4111-8111-111111111111')).toBe(
      true,
    );
  });

  it('treats number id as persisted (backend)', () => {
    expect(isOptimisticMessageId(42)).toBe(false);
  });

  it('does not treat empty string id (opening placeholder) as optimistic', () => {
    expect(isOptimisticMessageId('')).toBe(false);
    expect(isOptimisticMessageId('  ')).toBe(false);
  });

  it('does not classify stringified-number id as optimistic (backend id as string)', () => {
    expect(isOptimisticMessageId('123')).toBe(false);
    expect(isOptimisticMessageId('100')).toBe(false);
  });

  it('does not classify backend 32-char hex id as optimistic', () => {
    expect(isOptimisticMessageId('056c255fee9e4a1f8347e022a6c80e1d')).toBe(
      false,
    );
  });
});

describe('terminal history reload helpers', () => {
  it('treats equal message snapshots as equivalent', () => {
    const list = [
      {
        id: '056c255fee9e4a1f8347e022a6c80e1d',
        role: AssistantRoleEnum.ASSISTANT,
        text: 'done',
        status: MessageStatusEnum.Complete,
      },
    ] as MessageInfo[];

    expect(areMessageListsEquivalent(list, [...list])).toBe(true);
    expect(needsTerminalHistoryReload(list, [...list])).toBe(false);
  });

  it('immediately appends persisted messages returned by polling', () => {
    const current = [{ id: 1, role: AssistantRoleEnum.USER, text: 'u1' }];
    const incoming = [
      ...current,
      {
        id: 2,
        role: AssistantRoleEnum.ASSISTANT,
        text: 'a1',
        status: MessageStatusEnum.Complete,
      },
    ];

    expect(
      reconcileConversationSnapshotMessages(
        current as MessageInfo[],
        incoming as MessageInfo[],
      ),
    ).toEqual(incoming);
  });

  it('keeps the same list reference when a polling snapshot is unchanged', () => {
    const current = [
      {
        id: 1,
        role: AssistantRoleEnum.ASSISTANT,
        text: 'done',
        status: MessageStatusEnum.Complete,
      },
    ] as MessageInfo[];

    expect(reconcileConversationSnapshotMessages(current, [...current])).toBe(
      current,
    );
  });

  it('preserves older pages that are absent from the latest polling window', () => {
    const current = [
      { id: 1, role: AssistantRoleEnum.USER, text: 'older page' },
      { id: 2, role: AssistantRoleEnum.ASSISTANT, text: 'current answer' },
    ] as MessageInfo[];
    const incoming = [
      { id: 2, role: AssistantRoleEnum.ASSISTANT, text: 'current answer' },
      { id: 3, role: AssistantRoleEnum.USER, text: 'new question' },
    ] as MessageInfo[];

    expect(reconcileConversationSnapshotMessages(current, incoming)).toEqual([
      current[0],
      incoming[0],
      incoming[1],
    ]);
  });

  it('deduplicates the id-less synthetic opening message across polls', () => {
    const opening = (time: string) =>
      ({
        id: null,
        index: null,
        role: AssistantRoleEnum.ASSISTANT,
        type: 'CHAT',
        messageType: MessageTypeEnum.ASSISTANT,
        text: '这里是通用智能体~~~',
        time,
      } as MessageInfo);
    const current = [
      opening('2026-08-07T13:51:17.000+00:00'),
      opening('2026-08-07T13:51:22.000+00:00'),
    ];
    const incoming = [opening('2026-08-07T13:51:27.000+00:00')];

    const merged = reconcileConversationSnapshotMessages(current, incoming);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toBe(current[0]);
  });

  it('requires terminal reload when incoming contains a missing persisted message', () => {
    const current = [{ id: 1, role: AssistantRoleEnum.USER, text: 'u1' }];
    const incoming = [
      { id: 1, role: AssistantRoleEnum.USER, text: 'u1' },
      {
        id: '056c255fee9e4a1f8347e022a6c80e1d',
        role: AssistantRoleEnum.ASSISTANT,
        text: 'a1',
        status: MessageStatusEnum.Complete,
      },
    ];

    expect(
      needsTerminalHistoryReload(
        current as MessageInfo[],
        incoming as MessageInfo[],
      ),
    ).toBe(true);
  });
});

describe('preserveOptimisticMessageTail', () => {
  // 乐观消息 id 用前端 uuidv4；落库消息 id 可能是 number、数字串或后端 hex 字符串。
  const optimisticUserId = '11111111-1111-4111-8111-111111111111';
  const optimisticAsstId = '22222222-2222-4222-8222-222222222222';
  const persistedUser = (text: string, id = 1) =>
    ({ id, role: AssistantRoleEnum.USER, text } as MessageInfo);
  const persistedAsst = (id = 2) =>
    ({
      id,
      role: AssistantRoleEnum.ASSISTANT,
      status: MessageStatusEnum.Complete,
    } as MessageInfo);
  const optimisticUser = (text: string) =>
    ({
      id: optimisticUserId,
      role: AssistantRoleEnum.USER,
      text,
    } as MessageInfo);
  const optimisticAsst = (overrides: Partial<MessageInfo> = {}) =>
    ({
      id: optimisticAsstId,
      role: AssistantRoleEnum.ASSISTANT,
      status: MessageStatusEnum.Loading,
      ...overrides,
    } as MessageInfo);

  it('returns incoming as-is when prev is empty', () => {
    const incoming = [persistedUser('hi'), persistedAsst()];
    expect(preserveOptimisticMessageTail(undefined, incoming)).toBe(incoming);
    expect(preserveOptimisticMessageTail([], incoming)).toBe(incoming);
  });

  it('appends optimistic tail when incoming lacks that user message', () => {
    const prev = [
      persistedUser('old', 1),
      optimisticUser('hello'),
      optimisticAsst(),
    ];
    const incoming = [persistedUser('old', 1)]; // 后端还没落库这一轮 hello
    const merged = preserveOptimisticMessageTail(prev, incoming);
    expect(merged).toEqual([
      persistedUser('old', 1),
      optimisticUser('hello'),
      optimisticAsst(),
    ]);
  });

  it('drops the whole tail when incoming already persisted that user round (no dup/reorder)', () => {
    const prev = [
      persistedUser('old', 1),
      optimisticUser('hello'),
      optimisticAsst(),
    ];
    // 后端已落库 user+asst（数字 id）→ 必须丢弃乐观尾巴，避免 [user, asst, userOpt, asstOpt] 重复错序
    const incoming = [
      persistedUser('old', 1),
      persistedUser('hello', 2),
      persistedAsst(3),
    ];
    const merged = preserveOptimisticMessageTail(prev, incoming);
    expect(merged).toBe(incoming);
    expect(merged.some((m) => m.id === optimisticUserId)).toBe(false);
    expect(merged.some((m) => m.id === optimisticAsstId)).toBe(false);
  });

  it('keeps assistant placeholder (drops userOpt) when user persisted but assistant still in-flight', () => {
    // sub 场景：后端建新会话先落库 user，assistant 仍在流式（未落库）
    const prev = [
      persistedUser('old', 1),
      optimisticUser('hello'),
      optimisticAsst(),
    ];
    const incoming = [persistedUser('old', 1), persistedUser('hello', 2)]; // user 落库，无 assistant
    const merged = preserveOptimisticMessageTail(prev, incoming);
    // userOpt 丢弃（后端已有 user），assistant 占位保留（SSE 流式回填目标）
    expect(merged).toEqual([
      persistedUser('old', 1),
      persistedUser('hello', 2),
      optimisticAsst(),
    ]);
    expect(merged.some((m) => m.id === optimisticUserId)).toBe(false);
    expect(merged.some((m) => m.id === optimisticAsstId)).toBe(true);
  });

  it('keeps optimistic tail when backend returned empty list (still in flight)', () => {
    const prev = [optimisticUser('hello'), optimisticAsst()];
    const merged = preserveOptimisticMessageTail(prev, []);
    expect(merged).toEqual([optimisticUser('hello'), optimisticAsst()]);
  });

  it('does not treat empty-id opening message as optimistic tail', () => {
    const opening = { id: '', text: 'opening' } as MessageInfo;
    const prev = [opening, optimisticUser('hello'), optimisticAsst()];
    const incoming = [persistedUser('hello', 1), persistedAsst(2)];
    // 后端已落库 hello → 丢弃乐观尾巴；开场消息（空 id）本就不在连续乐观尾巴段
    const merged = preserveOptimisticMessageTail(prev, incoming);
    expect(merged).toBe(incoming);
  });

  it('drops assistant-only placeholder tail when incoming ends with a persisted assistant', () => {
    const prev = [persistedUser('hi', 1), optimisticAsst()]; // 仅 assistant 占位（如 sub 占位）
    const incoming = [persistedUser('hi', 1), persistedAsst(2)];
    const merged = preserveOptimisticMessageTail(prev, incoming);
    expect(merged).toBe(incoming);
    expect(merged.some((m) => m.id === optimisticAsstId)).toBe(false);
  });

  it('keeps assistant-only placeholder tail when incoming is empty', () => {
    const prev = [optimisticAsst()];
    const merged = preserveOptimisticMessageTail(prev, []);
    expect(merged).toEqual([optimisticAsst()]);
  });

  it('inserts assistant-only placeholder after its anchor user when backend already has the next user', () => {
    const asstOpt = optimisticAsst({ text: 'streamed answer' });
    const prev = [persistedUser('user1', 'u1'), asstOpt];
    const incoming = [
      persistedUser('user1', 'u1'),
      persistedUser('user2', 'u2'),
    ];

    const merged = preserveOptimisticMessageTail(prev, incoming);

    expect(merged).toEqual([
      persistedUser('user1', 'u1'),
      {
        ...asstOpt,
        status: MessageStatusEnum.Complete,
      },
      persistedUser('user2', 'u2'),
    ]);
  });

  it('drops assistant-only placeholder when backend already persisted the anchored assistant before the next user', () => {
    const prev = [persistedUser('user1', 'u1'), optimisticAsst()];
    const incoming = [
      persistedUser('user1', 'u1'),
      persistedAsst('a1'),
      persistedUser('user2', 'u2'),
    ];

    const merged = preserveOptimisticMessageTail(prev, incoming);

    expect(merged).toBe(incoming);
  });

  it('keeps assistant-only placeholder at the tail for a single in-flight round', () => {
    const asstOpt = optimisticAsst({ text: 'streaming' });
    const prev = [persistedUser('user1', 'u1'), asstOpt];
    const incoming = [persistedUser('user1', 'u1')];

    const merged = preserveOptimisticMessageTail(prev, incoming);

    expect(merged).toEqual([persistedUser('user1', 'u1'), asstOpt]);
  });

  it('stops collecting tail at the first persisted message (non-contiguous optimistic msgs not kept)', () => {
    // prev 中间夹了落库消息：从末尾往前收集连续乐观段，遇到 persistedUser('b') 即停
    const prev = [
      optimisticUser('a'),
      persistedUser('b', 1),
      optimisticUser('c'),
    ];
    // 连续乐观尾巴 = [optimisticUser('c')]（'a' 被 'b' 隔断，不计入）
    const incoming = [persistedUser('b', 1)];
    const merged = preserveOptimisticMessageTail(prev, incoming);
    expect(merged).toEqual([persistedUser('b', 1), optimisticUser('c')]);
  });

  it('treats backend stringified-number ids as persisted (no contamination)', () => {
    // 后端把数字 id 序列化成字符串：尾巴收集应立即 break，不当乐观尾巴
    const stringIdUser = {
      id: '100',
      role: AssistantRoleEnum.USER,
      text: 'hi',
    };
    const stringIdAsst = {
      id: '101',
      role: AssistantRoleEnum.ASSISTANT,
      status: MessageStatusEnum.Complete,
    };
    const prev = [stringIdUser, stringIdAsst] as any[];
    const incoming = [stringIdUser, stringIdAsst] as any[];
    const merged = preserveOptimisticMessageTail(prev, incoming);
    expect(merged).toBe(incoming);
    expect(merged).toHaveLength(2);
  });

  it('treats backend hex ids as persisted and does not replay them as optimistic tail', () => {
    const backendUser = {
      id: 'd6f9583a51494ad7a7e3f3c7ac7af340',
      role: AssistantRoleEnum.USER,
      text: '你好，请简单介绍一下你自己',
    };
    const backendAsst = {
      id: '056c255fee9e4a1f8347e022a6c80e1d',
      role: AssistantRoleEnum.ASSISTANT,
      text: '你好！我是基于 LangGraph 工作流图运行的智能助手',
      status: MessageStatusEnum.Complete,
    };
    const prev = [backendUser, backendAsst] as MessageInfo[];
    const incoming = [backendUser, backendAsst] as MessageInfo[];

    const merged = preserveOptimisticMessageTail(prev, incoming);

    expect(merged).toBe(incoming);
    expect(merged).toHaveLength(2);
  });

  it('keeps optimistic assistant placeholder when incoming ends with an incomplete persisted assistant', () => {
    const prev = [
      persistedUser('old', 1),
      optimisticUser('hello'),
      optimisticAsst(),
    ];
    const incoming = [
      persistedUser('old', 1),
      persistedUser('hello', 2),
      {
        id: 3,
        role: AssistantRoleEnum.ASSISTANT,
        status: MessageStatusEnum.Incomplete,
      } as MessageInfo,
    ];

    const merged = preserveOptimisticMessageTail(prev, incoming);

    expect(merged).toEqual([...incoming, optimisticAsst()]);
  });

  it('keeps the optimistic user with an SSE assistant that already has a server-shaped id', () => {
    const streamedAssistant = {
      id: 'stream-message-id',
      role: AssistantRoleEnum.ASSISTANT,
      text: 'streaming answer',
      status: MessageStatusEnum.Incomplete,
    } as MessageInfo;
    const prev = [
      persistedUser('old', 1),
      optimisticUser('new question'),
      streamedAssistant,
    ];
    const incoming = [persistedUser('old', 1)];

    expect(preserveOptimisticMessageTail(prev, incoming)).toEqual(prev);
  });

  it('does not drop or duplicate an optimistic round when polling sees a stale snapshot', () => {
    const streamedAssistant = {
      id: 'stream-message-id',
      role: AssistantRoleEnum.ASSISTANT,
      text: 'streaming answer',
      status: MessageStatusEnum.Incomplete,
    } as MessageInfo;
    const current = [
      persistedUser('old', 1),
      optimisticUser('new question'),
      streamedAssistant,
    ];
    const incoming = [persistedUser('old', 1)];

    const merged = reconcileConversationSnapshotMessages(current, incoming);

    expect(merged).toBe(current);
    expect(merged).toEqual([
      persistedUser('old', 1),
      optimisticUser('new question'),
      streamedAssistant,
    ]);
  });

  it('replaces the optimistic user only after polling returns its persisted copy', () => {
    const streamedAssistant = {
      id: 'stream-message-id',
      role: AssistantRoleEnum.ASSISTANT,
      text: 'streaming answer',
      status: MessageStatusEnum.Incomplete,
    } as MessageInfo;
    const current = [
      persistedUser('old', 1),
      optimisticUser('new question'),
      streamedAssistant,
    ];
    const persistedNewUser = persistedUser('new question', 2);

    expect(
      reconcileConversationSnapshotMessages(current, [
        persistedUser('old', 1),
        persistedNewUser,
      ]),
    ).toEqual([persistedUser('old', 1), persistedNewUser, streamedAssistant]);
  });
});
