import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';
import {
  appendOutgoingConversationMessages,
  isOptimisticMessageId,
  preserveOptimisticMessageTail,
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
  it('treats non-empty string id as optimistic (frontend uuid)', () => {
    expect(isOptimisticMessageId('uuid-1234')).toBe(true);
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
});

describe('preserveOptimisticMessageTail', () => {
  // 落库消息 id 用 number；乐观消息 id 用 string uuid（与生产语义一致）
  const persistedUser = (text: string, id = 1) =>
    ({ id, role: AssistantRoleEnum.USER, text } as MessageInfo);
  const persistedAsst = (id = 2) =>
    ({
      id,
      role: AssistantRoleEnum.ASSISTANT,
      status: MessageStatusEnum.Complete,
    } as MessageInfo);
  const optimisticUser = (text: string) =>
    ({ id: 'opt-user', role: AssistantRoleEnum.USER, text } as MessageInfo);
  const optimisticAsst = () =>
    ({
      id: 'opt-asst',
      role: AssistantRoleEnum.ASSISTANT,
      status: MessageStatusEnum.Loading,
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
    expect(merged.some((m) => m.id === 'opt-user')).toBe(false);
    expect(merged.some((m) => m.id === 'opt-asst')).toBe(false);
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
    expect(merged.some((m) => m.id === 'opt-user')).toBe(false);
    expect(merged.some((m) => m.id === 'opt-asst')).toBe(true);
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
    expect(merged.some((m) => m.id === 'opt-asst')).toBe(false);
  });

  it('keeps assistant-only placeholder tail when incoming is empty', () => {
    const prev = [optimisticAsst()];
    const merged = preserveOptimisticMessageTail(prev, []);
    expect(merged).toEqual([optimisticAsst()]);
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
});
