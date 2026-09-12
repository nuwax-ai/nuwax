import {
  apiAgentConversationArchive,
  apiAgentConversationList,
  apiAgentConversationPin,
} from '@/services/agentConfig';
import { request } from 'umi';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('umi', () => ({
  request: vi.fn().mockResolvedValue({ code: '0000', data: [] }),
}));

describe('会话置顶、归档接口契约', () => {
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

  it('列表透传 archivedFilter', async () => {
    await apiAgentConversationList({
      agentId: null,
      lastId: null,
      limit: 30,
      archivedFilter: 'all',
    });
    expect(request).toHaveBeenLastCalledWith('/api/agent/conversation/list', {
      method: 'POST',
      data: {
        agentId: null,
        lastId: null,
        limit: 30,
        archivedFilter: 'all',
      },
    });
  });

  it('旧列表调用缺省按 exclude 兜底（不含已归档）', async () => {
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
