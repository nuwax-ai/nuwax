/**
 * 搜索弹窗数据适配层单测
 * @description 纯函数（映射/过滤/摘要剥离）与各分类分页取数的合并、降级、过滤、游标口径。
 * service 层与 i18nRuntime 全部 mock（vitest 不能 import umi 模块，含传递依赖）。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  getCurrentLang: () => 'zh-CN',
}));

vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationList: vi.fn(),
}));

vi.mock('@/services/repo', () => ({
  apiRepoSearch: vi.fn(),
  apiRepoRecentlyAccessedPages: vi.fn(),
}));

vi.mock('@/services/square', () => ({
  apiPublishedAgentList: vi.fn(),
}));

vi.mock('@/services/userProjectApp', () => ({
  apiUserProjectTabPageQuery: vi.fn(),
}));

import { apiAgentConversationList } from '@/services/agentConfig';
import { apiRepoRecentlyAccessedPages, apiRepoSearch } from '@/services/repo';
import { apiPublishedAgentList } from '@/services/square';
import { apiUserProjectTabPageQuery } from '@/services/userProjectApp';
import {
  fetchProjectPage,
  fetchRepoPage,
  fetchTaskPage,
  mapProjectItem,
  stripHtml,
} from './sources';

const mocked = {
  apiAgentConversationList: vi.mocked(apiAgentConversationList),
  apiRepoSearch: vi.mocked(apiRepoSearch),
  apiRepoRecentlyAccessedPages: vi.mocked(apiRepoRecentlyAccessedPages),
  apiPublishedAgentList: vi.mocked(apiPublishedAgentList),
  apiUserProjectTabPageQuery: vi.mocked(apiUserProjectTabPageQuery),
};
void mocked;

const ok = <T>(data: T) => Promise.resolve({ code: '0000', data } as never);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('stripHtml', () => {
  it('剥离高亮标签并去首尾空白', () => {
    expect(stripHtml('<em>标题</em> 正文')).toBe('标题 正文');
  });

  it('空值返回 undefined', () => {
    expect(stripHtml(undefined)).toBeUndefined();
    expect(stripHtml('   ')).toBeUndefined();
  });
});

describe('mapProjectItem', () => {
  const base = {
    projectId: 1,
    spaceId: 52,
    projectType: 'NormalProject',
    name: '项目A',
    modified: '',
    created: '',
  };

  it('优先取 conversationId 匹配的子会话，退而取首条', () => {
    const convs = [{ id: 11 }, { id: 22 }, { id: 33 }] as never[];
    expect(
      mapProjectItem({
        ...base,
        conversations: convs,
        conversationId: 22,
      } as never).projectConversation,
    ).toEqual({ id: 22 });
    expect(
      mapProjectItem({ ...base, conversations: convs } as never)
        .projectConversation,
    ).toEqual({ id: 11 });
  });

  it('无子会话时 projectConversation 为 undefined', () => {
    expect(
      mapProjectItem({ ...base } as never).projectConversation,
    ).toBeUndefined();
  });
});

describe('fetchTaskPage（lastId 游标分页）', () => {
  it('首页：不带 lastId/topic，游标指向最后一条会话', async () => {
    mocked.apiAgentConversationList.mockResolvedValue(
      ok([
        { id: 1, topic: '会话一' },
        { id: 2, topic: '会话二' },
      ]) as never,
    );
    const res = await fetchTaskPage({ keyword: '', size: 20, cursor: {} });
    expect(mocked.apiAgentConversationList).toHaveBeenCalledWith({
      agentId: null,
      lastId: null,
      limit: 20,
      topic: undefined,
    });
    expect(res.items.map((item) => item.id)).toEqual(['task-1', 'task-2']);
    expect(res.hasMore).toBe(false);
    expect(res.cursor).toEqual({ lastId: 2 });
  });

  it('续拉：透传 lastId 游标 + topic 关键字；满页 hasMore=true', async () => {
    mocked.apiAgentConversationList.mockResolvedValue(
      ok(
        Array.from({ length: 20 }, (_, i) => ({ id: i + 10, topic: `t${i}` })),
      ) as never,
    );
    const res = await fetchTaskPage({
      keyword: 't',
      size: 20,
      cursor: { lastId: 9 },
    });
    expect(mocked.apiAgentConversationList).toHaveBeenCalledWith({
      agentId: null,
      lastId: 9,
      limit: 20,
      topic: 't',
    });
    expect(res.hasMore).toBe(true);
    expect(res.cursor).toEqual({ lastId: 29 });
  });

  it('信封 code 非成功返回空数组', async () => {
    mocked.apiAgentConversationList.mockResolvedValue({
      code: '9999',
      data: null,
    } as never);
    const res = await fetchTaskPage({ keyword: '', size: 8, cursor: {} });
    expect(res.items).toEqual([]);
    expect(res.hasMore).toBe(false);
  });
});

describe('fetchProjectPage（页码分页）', () => {
  it('首页 current=1 + queryFilter.name；pages 回读时按页码判定 hasMore', async () => {
    mocked.apiUserProjectTabPageQuery.mockResolvedValue(
      ok({
        records: [{ projectId: 7, name: 'P', modified: '', created: '' }],
        pages: 3,
      }) as never,
    );
    const res = await fetchProjectPage({
      keyword: 'P',
      size: 20,
      cursor: {},
      spaceId: 52,
    });
    expect(mocked.apiUserProjectTabPageQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryFilter: { spaceId: 52, name: 'P' },
        current: 1,
        pageSize: 20,
      }),
    );
    expect(res.items[0]).toMatchObject({ kind: 'project', id: 'project-7' });
    expect(res.hasMore).toBe(true);
    expect(res.cursor).toEqual({ page: 2 });
  });

  it('末页（current=pages）hasMore=false', async () => {
    mocked.apiUserProjectTabPageQuery.mockResolvedValue(
      ok({ records: [], pages: 2 }) as never,
    );
    const res = await fetchProjectPage({
      keyword: '',
      size: 20,
      cursor: { page: 2 },
    });
    expect(res.hasMore).toBe(false);
    expect(res.cursor).toEqual({ page: 3 });
  });

  it('未回读 pages 时退「满页视为还有」', async () => {
    mocked.apiUserProjectTabPageQuery.mockResolvedValue(
      ok({
        records: Array.from({ length: 20 }, (_, i) => ({
          projectId: i,
          name: 'p',
          modified: '',
          created: '',
        })),
      }) as never,
    );
    const res = await fetchProjectPage({ keyword: '', size: 20, cursor: {} });
    expect(res.hasMore).toBe(true);
  });
});

describe('fetchRepoPage（from 偏移分页）', () => {
  it('搜索：ES 接口 + 剥离摘要 HTML + 游标推进', async () => {
    mocked.apiRepoSearch.mockResolvedValue(
      ok([
        {
          pageId: 5,
          slugId: 'abc',
          title: '文档',
          snippet: '<em>高亮</em>片段',
        },
      ]) as never,
    );
    const res = await fetchRepoPage({
      keyword: '文档',
      size: 20,
      cursor: { from: 20 },
    });
    expect(mocked.apiRepoSearch).toHaveBeenCalledWith({
      keyword: '文档',
      from: 20,
      size: 20,
    });
    expect(res.items[0]).toMatchObject({
      kind: 'repo',
      id: 'repo-search-abc',
      slugId: 'abc',
      description: '高亮片段',
    });
    expect(res.cursor).toEqual({ from: 40 });
    expect(res.hasMore).toBe(false);
  });

  it('最近访问：无 slugId 的行被过滤', async () => {
    mocked.apiRepoRecentlyAccessedPages.mockResolvedValue(
      ok([
        { slugId: 'a', title: '有链接', time: '2026-09-12T10:00:00Z' },
        { title: '无链接' },
      ]) as never,
    );
    const res = await fetchRepoPage({ keyword: '', size: 8, cursor: {} });
    expect(mocked.apiRepoRecentlyAccessedPages).toHaveBeenCalledWith({
      from: 0,
      size: 8,
    });
    expect(res.items.map((item) => item.slugId)).toEqual(['a']);
    expect(res.hasMore).toBe(false);
  });

  it('满页返回 hasMore=true（续拉游标推进）', async () => {
    mocked.apiRepoRecentlyAccessedPages.mockResolvedValue(
      ok(
        Array.from({ length: 8 }, (_, i) => ({
          slugId: `s${i}`,
          title: `t${i}`,
        })),
      ) as never,
    );
    const res = await fetchRepoPage({ keyword: '', size: 8, cursor: {} });
    expect(res.hasMore).toBe(true);
    expect(res.cursor).toEqual({ from: 8 });
  });
});
