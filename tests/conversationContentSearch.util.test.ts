import { describe, expect, it, vi } from 'vitest';
import {
  buildContentSnippetParts,
  ContentSearchPage,
  scanConversationsForContent,
} from '@/utils/conversationContentSearch';

interface FakeConversation {
  id: number;
}

interface FakeMessage {
  text?: string;
  think?: string;
}

const page = <T>(items: T[], hasMore = false): ContentSearchPage<T> => ({
  items,
  hasMore,
  cursor: null,
});

describe('会话内容搜索（前端过渡方案）', () => {
  it('短关键词不发任何请求直接返回空', async () => {
    const fetchConversations = vi.fn();
    const fetchMessages = vi.fn();
    for (const keyword of ['', ' ', 'a']) {
      const summary = await scanConversationsForContent<FakeConversation>({
        keyword,
        fetchConversations,
        fetchMessages,
      });
      expect(summary.hits).toEqual([]);
      expect(summary.scannedConversations).toBe(0);
      expect(summary.cancelled).toBe(false);
    }
    expect(fetchConversations).not.toHaveBeenCalled();
    expect(fetchMessages).not.toHaveBeenCalled();
  });

  it('命中消息正文并返回高亮片段（大小写不敏感）', async () => {
    const summary = await scanConversationsForContent<FakeConversation>({
      keyword: 'World',
      fetchConversations: async () => page([{ id: 1 }]),
      fetchMessages: async () =>
        page([{ text: 'prefix hello world suffix' }]),
    });
    expect(summary.hits).toHaveLength(1);
    expect(summary.hits[0].conversation.id).toBe(1);
    const highlight = summary.hits[0].snippet.filter((part) => part.highlight);
    expect(highlight).toHaveLength(1);
    expect(highlight[0].text.toLowerCase()).toBe('world');
  });

  it('思考内容参与匹配，协议内联标签剥离后不计入命中', async () => {
    const scanWithKeyword = (keyword: string) =>
      scanConversationsForContent<FakeConversation>({
        keyword,
        fetchConversations: async () => page([{ id: 1 }]),
        fetchMessages: async () =>
          page([
            {
              text: '<markdown-custom-process type="payment">正文开头',
              think: '思考里的 部署计划 内容',
            },
          ]),
      });

    // 关键词只出现在标签属性里：剥离后不命中
    const tagOnly = await scanWithKeyword('payment');
    expect(tagOnly.hits).toHaveLength(0);
    // 关键词在思考内容里：命中
    const thinkHit = await scanWithKeyword('部署计划');
    expect(thinkHit.hits).toHaveLength(1);
    // 命中片段不含协议标签
    const snippetText = thinkHit.hits[0].snippet
      .map((part) => part.text)
      .join('');
    expect(snippetText).not.toContain('markdown-custom');
  });

  it('会话数达上限即停止圈定范围，且分页重复 id 去重', async () => {
    const fetchMessages = vi.fn(async () => page<FakeMessage>([]));
    const fetchConversations = vi
      .fn()
      .mockResolvedValueOnce(
        page(
          [1, 2, 2, 3].map((id) => ({ id })),
          true,
        ),
      )
      .mockResolvedValueOnce(page([{ id: 3 }]));

    const summary = await scanConversationsForContent<FakeConversation>({
      keyword: 'keyword',
      fetchConversations,
      fetchMessages,
      maxConversations: 3,
    });

    // 首页去重后（1/2/3）已凑满上限 3，无需再拉第二页
    expect(fetchConversations).toHaveBeenCalledTimes(1);
    // 去重后只有 1/2/3 三个会话被扫描
    const scannedIds = fetchMessages.mock.calls.map(
      (call) => call[0] as number,
    );
    expect(scannedIds.sort()).toEqual([1, 2, 3]);
    expect(summary.scannedConversations).toBe(3);
  });

  it('单会话消息条数达上限即停止翻页', async () => {
    const fetchMessages = vi.fn(async () =>
      page(Array.from({ length: 50 }, () => ({ text: 'nope' })), true),
    );
    await scanConversationsForContent<FakeConversation>({
      keyword: 'keyword',
      fetchConversations: async () => page([{ id: 1 }]),
      fetchMessages,
      maxMessagesPerConversation: 50,
    });
    expect(fetchMessages).toHaveBeenCalledTimes(1);
  });

  it('单会话命中即止，不再继续翻页', async () => {
    const fetchMessages = vi
      .fn()
      .mockResolvedValueOnce(
        page([{ text: 'nope' }, { text: 'hit keyword here' }], true),
      )
      .mockResolvedValue(page([{ text: 'keyword later' }]));
    await scanConversationsForContent<FakeConversation>({
      keyword: 'keyword',
      fetchConversations: async () => page([{ id: 1 }]),
      fetchMessages,
    });
    expect(fetchMessages).toHaveBeenCalledTimes(1);
  });

  it('onHit 按会话列表顺序渐进产出', async () => {
    const onHit = vi.fn();
    await scanConversationsForContent<FakeConversation>({
      keyword: 'keyword',
      fetchConversations: async () => page([{ id: 1 }, { id: 2 }, { id: 3 }]),
      fetchMessages: async (id: number) =>
        page(id === 2 ? [{ text: 'nothing' }] : [{ text: 'keyword' }]),
      concurrency: 2,
      onHit,
    });
    expect(onHit.mock.calls.map((call) => call[0].conversation.id)).toEqual([
      1, 3,
    ]);
  });

  it('取消后不再发起批次拉取，返回 cancelled', async () => {
    const fetchMessages = vi.fn();
    let cancelCheckCalls = 0;
    const summary = await scanConversationsForContent<FakeConversation>({
      keyword: 'keyword',
      fetchConversations: async () => page([{ id: 1 }, { id: 2 }]),
      fetchMessages,
      concurrency: 2,
      // 首次探测（圈定范围前）放行，其后均视为已取消
      isCancelled: () => ++cancelCheckCalls > 1,
    });
    expect(summary.cancelled).toBe(true);
    expect(fetchMessages).not.toHaveBeenCalled();
  });

  it('单会话消息拉取失败按未命中处理，不影响其余会话', async () => {
    const summary = await scanConversationsForContent<FakeConversation>({
      keyword: 'keyword',
      fetchConversations: async () => page([{ id: 1 }, { id: 2 }]),
      fetchMessages: async (id: number) => {
        if (id === 1) throw new Error('network down');
        return page([{ text: 'contains keyword' }]);
      },
      concurrency: 2,
    });
    expect(summary.hits.map((hit) => hit.conversation.id)).toEqual([2]);
    expect(summary.scannedConversations).toBe(2);
  });

  it('会话范围拉取失败时以空范围收场不抛错', async () => {
    const summary = await scanConversationsForContent<FakeConversation>({
      keyword: 'keyword',
      fetchConversations: async () => {
        throw new Error('network down');
      },
      fetchMessages: async () => page([]),
    });
    expect(summary.hits).toEqual([]);
    expect(summary.scannedConversations).toBe(0);
  });
});

describe('buildContentSnippetParts', () => {
  it('命中词居中时片段带省略号边界', () => {
    const source = `甲${'前'.repeat(40)}keyword${'后'.repeat(60)}`;
    const parts = buildContentSnippetParts(source, 'keyword');
    expect(parts[0]).toEqual({ text: '…', highlight: false });
    expect(parts.some((part) => part.highlight && part.text === 'keyword')).toBe(
      true,
    );
    expect(parts[parts.length - 1].text.endsWith('…')).toBe(true);
  });

  it('未命中返回空数组', () => {
    expect(buildContentSnippetParts('abc', 'xyz')).toEqual([]);
  });
});
