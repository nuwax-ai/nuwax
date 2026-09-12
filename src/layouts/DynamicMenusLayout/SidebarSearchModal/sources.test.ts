/**
 * 搜索弹窗数据适配层单测
 * @description 纯函数（映射/过滤/摘要剥离）与各分类取数的合并、降级、过滤口径。
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

vi.mock('@/services/systemManage', () => ({
  apiConnectorProviderPageList: vi.fn(),
  apiSystemConnectorProviderList: vi.fn(),
}));

vi.mock('@/services/userProjectApp', () => ({
  apiUserProjectTabPageQuery: vi.fn(),
}));

import { apiAgentConversationList } from '@/services/agentConfig';
import { apiRepoRecentlyAccessedPages, apiRepoSearch } from '@/services/repo';
import {
  apiConnectorProviderPageList,
  apiSystemConnectorProviderList,
} from '@/services/systemManage';
import { apiUserProjectTabPageQuery } from '@/services/userProjectApp';
import {
  fetchConnectorList,
  fetchProjectList,
  fetchRecentRepos,
  fetchRecentTasks,
  fetchRepoList,
  mapProjectItem,
  matchKeyword,
  stripHtml,
} from './sources';

const mocked = {
  apiAgentConversationList: vi.mocked(apiAgentConversationList),
  apiRepoSearch: vi.mocked(apiRepoSearch),
  apiRepoRecentlyAccessedPages: vi.mocked(apiRepoRecentlyAccessedPages),
  apiConnectorProviderPageList: vi.mocked(apiConnectorProviderPageList),
  apiSystemConnectorProviderList: vi.mocked(apiSystemConnectorProviderList),
  apiUserProjectTabPageQuery: vi.mocked(apiUserProjectTabPageQuery),
};

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

describe('matchKeyword', () => {
  it('空关键字恒真', () => {
    expect(matchKeyword('', undefined)).toBe(true);
    expect(matchKeyword('  ', 'abc')).toBe(true);
  });

  it('名称/描述包含即命中（大小写不敏感）', () => {
    expect(matchKeyword('OSS', 'Aliyun OSS', undefined)).toBe(true);
    expect(matchKeyword('存储', undefined, '对象存储服务')).toBe(true);
  });

  it('字段全不包含则不命中', () => {
    expect(matchKeyword('k8s', 'Aliyun OSS', '对象存储')).toBe(false);
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

describe('fetchRecentTasks / fetchTaskList（经 SEARCH_FETCHERS 不在此重复）', () => {
  it('最近任务：不带 topic，映射会话行', async () => {
    mocked.apiAgentConversationList.mockResolvedValue(
      ok([{ id: 1, topic: '会话一' }]) as never,
    );
    const items = await fetchRecentTasks(8);
    expect(mocked.apiAgentConversationList).toHaveBeenCalledWith({
      agentId: null,
      lastId: null,
      limit: 8,
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: 'task',
      id: 'task-1',
      name: '会话一',
      conversation: { id: 1, topic: '会话一' },
    });
  });

  it('信封 code 非成功返回空数组', async () => {
    mocked.apiAgentConversationList.mockResolvedValue({
      code: '9999',
      data: null,
    } as never);
    await expect(fetchRecentTasks(8)).resolves.toEqual([]);
  });
});

describe('fetchConnectorList 双源合并', () => {
  it('系统连接器本地过滤 + 空间连接器分页结果合并', async () => {
    mocked.apiSystemConnectorProviderList.mockResolvedValue(
      ok([
        {
          id: 1,
          service: 'aliyun_oss',
          displayName: 'Aliyun OSS',
          description: '',
        },
        { id: 2, service: 'aws_s3', displayName: 'AWS S3', description: '' },
      ]) as never,
    );
    mocked.apiConnectorProviderPageList.mockResolvedValue(
      ok({
        records: [{ id: 9, service: 'space_conn', displayName: '空间连接器' }],
      }) as never,
    );
    const items = await fetchConnectorList({
      keyword: 'oss',
      limit: 20,
      spaceId: 52,
    });
    expect(items.map((item) => item.name)).toEqual([
      'Aliyun OSS',
      '空间连接器',
    ]);
    // 空间源服务端搜参数透传
    expect(mocked.apiConnectorProviderPageList).toHaveBeenCalledWith(
      expect.objectContaining({ spaceId: 52, keyword: 'oss', scope: 'space' }),
    );
  });
});

describe('fetchProjectList', () => {
  it('queryFilter 携带 spaceId 与 name 模糊参数', async () => {
    mocked.apiUserProjectTabPageQuery.mockResolvedValue(
      ok({
        records: [{ projectId: 7, name: 'P', modified: '', created: '' }],
      }) as never,
    );
    const items = await fetchProjectList({
      keyword: 'P',
      limit: 20,
      spaceId: 52,
    });
    expect(mocked.apiUserProjectTabPageQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryFilter: { spaceId: 52, name: 'P' },
        current: 1,
        pageSize: 20,
      }),
    );
    expect(items[0]).toMatchObject({ kind: 'project', id: 'project-7' });
  });
});

describe('fetchRepoList / fetchRecentRepos', () => {
  it('搜索：剥离摘要 HTML 并映射 slugId', async () => {
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
    const items = await fetchRepoList({ keyword: '文档', limit: 20 });
    expect(mocked.apiRepoSearch).toHaveBeenCalledWith({
      keyword: '文档',
      from: 0,
      size: 20,
    });
    expect(items[0]).toMatchObject({
      kind: 'repo',
      id: 'repo-search-abc',
      slugId: 'abc',
      description: '高亮片段',
    });
  });

  it('最近访问：无 slugId 的行被过滤', async () => {
    mocked.apiRepoRecentlyAccessedPages.mockResolvedValue(
      ok([
        { slugId: 'a', title: '有链接', time: '2026-09-12T10:00:00Z' },
        { title: '无链接' },
      ]) as never,
    );
    const items = await fetchRecentRepos(8);
    expect(mocked.apiRepoRecentlyAccessedPages).toHaveBeenCalledWith({
      from: 0,
      size: 8,
    });
    expect(items.map((item) => item.slugId)).toEqual(['a']);
  });
});
