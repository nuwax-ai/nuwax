import {
  apiAgentConversationArchive,
  apiAgentConversationCollect,
  apiAgentConversationList,
  apiAgentConversationPin,
  apiAgentConversationUnCollect,
} from '@/services/agentConfig';
import { request } from 'umi';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('umi', () => ({
  request: vi.fn().mockResolvedValue({ code: '0000', data: [] }),
}));

describe('会话置顶、归档、收藏接口契约', () => {
  beforeEach(() => {
    vi.mocked(request).mockClear();
  });

  it('置顶和归档使用会话级 toggle 接口', async () => {
    await apiAgentConversationPin(42, false);
    expect(request).toHaveBeenLastCalledWith('/api/agent/conversation/pin/42', {
      method: 'POST',
      params: { pinned: false },
    });

    await apiAgentConversationArchive(42, true);
    expect(request).toHaveBeenLastCalledWith(
      '/api/agent/conversation/archive/42',
      { method: 'POST', params: { archived: true } },
    );
  });

  it('收藏/取消收藏为双路径接口且无参数（2026-09-13 契约）', async () => {
    await apiAgentConversationCollect(42);
    expect(request).toHaveBeenLastCalledWith(
      '/api/agent/conversation/collect/42',
      { method: 'POST' },
    );

    await apiAgentConversationUnCollect(42);
    expect(request).toHaveBeenLastCalledWith(
      '/api/agent/conversation/unCollect/42',
      { method: 'POST' },
    );
  });

  it('列表透传 archivedFilter 与 collectedFilter', async () => {
    await apiAgentConversationList({
      agentId: null,
      lastId: null,
      limit: 30,
      archivedFilter: 'all',
      collectedFilter: 'only',
    });
    expect(request).toHaveBeenLastCalledWith('/api/agent/conversation/list', {
      method: 'POST',
      data: {
        agentId: null,
        lastId: null,
        limit: 30,
        archivedFilter: 'all',
        collectedFilter: 'only',
      },
    });
  });

  it('旧列表调用缺省按 exclude 兜底且不注入 collectedFilter（后端默认 all）', async () => {
    await apiAgentConversationList({
      agentId: null,
      lastId: null,
      limit: 30,
    });
    expect(request).toHaveBeenLastCalledWith('/api/agent/conversation/list', {
      method: 'POST',
      data: {
        agentId: null,
        lastId: null,
        limit: 30,
        archivedFilter: 'exclude',
      },
    });
  });
});
