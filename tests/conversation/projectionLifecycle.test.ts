import {
  __resetThinkTimingAnchorsForTest,
  createConversationProjector,
  projectConversation,
} from '@/features/conversation/presentation-v2/projectConversation';
import { AssistantRoleEnum } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const parse = vi.hoisted(() => vi.fn());
vi.mock(
  '@/features/conversation/presentation-v2/parseMessageSegments',
  async (importOriginal) => {
    const original = await importOriginal<
      typeof import('@/features/conversation/presentation-v2/parseMessageSegments')
    >();
    return {
      ...original,
      parseMessageSegments: (
        ...args: Parameters<typeof original.parseMessageSegments>
      ) => {
        parse(...args);
        return original.parseMessageSegments(...args);
      },
    };
  },
);

const message = (
  id: string,
  status: 'thinking' | 'finished',
  content = 'thinking',
): MessageInfo =>
  ({
    id,
    role: AssistantRoleEnum.ASSISTANT,
    text: `<markdown-custom-think status="${status}" content="${content}"></markdown-custom-think>`,
    componentExecutedList: [],
  } as unknown as MessageInfo);
const reasoning = (projection: ReturnType<typeof projectConversation>) =>
  projection.turns[0]?.nodes.find((node) => node.kind === 'reasoning');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  parse.mockClear();
  __resetThinkTimingAnchorsForTest();
});
afterEach(() => vi.useRealTimers());

describe('conversation projector lifecycle', () => {
  it('keeps cached conversations independent even when message ids overlap', () => {
    const a = createConversationProjector();
    const b = createConversationProjector();
    a([message('same', 'thinking')]);
    vi.setSystemTime(1500);
    b([message('same', 'thinking')]);
    vi.setSystemTime(3000);
    expect(reasoning(a([message('same', 'finished')]))?.durationMs).toBe(3000);
    expect(reasoning(b([message('same', 'finished')]))?.durationMs).toBe(1500);
  });

  it('releases removed thoughts and starts remounted histories without stale duration', () => {
    const project = createConversationProjector();
    project([message('removed', 'thinking')]);
    vi.setSystemTime(2000);
    expect(
      reasoning(project([message('removed', 'finished')]))?.durationMs,
    ).toBe(2000);
    project([]);
    expect(
      reasoning(project([message('removed', 'finished')]))?.durationMs,
    ).toBeUndefined();
    expect(
      reasoning(createConversationProjector()([message('removed', 'finished')]))
        ?.durationMs,
    ).toBeUndefined();
  });

  it('parses unchanged historical objects once but invalidates in-place text changes', () => {
    const project = createConversationProjector();
    const history = message('history', 'finished');
    project([history]);
    project([history]);
    expect(parse).toHaveBeenCalledTimes(1);
    history.text = message('history', 'finished', 'updated').text;
    expect(reasoning(project([history]))?.thinkText).toBe('updated');
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it('handles tool-only messages without text and caches their empty segments', () => {
    const project = createConversationProjector();
    const history = message('tool-only', 'finished');
    delete (history as Partial<MessageInfo>).text;
    expect(project([history]).turns).toHaveLength(1);
    expect(project([history]).turns).toHaveLength(1);
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it('fallback projection does not retain timing for unrelated historical inputs', () => {
    projectConversation([message('old', 'thinking')]);
    projectConversation([message('new', 'thinking')]);
    vi.setSystemTime(2000);
    expect(
      reasoning(projectConversation([message('old', 'finished')]))?.durationMs,
    ).toBeUndefined();
  });
});
