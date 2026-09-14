import {
  apiNormalProjectDelete,
  apiNormalProjectGetById,
  apiNormalProjectLatestConversation,
  apiNormalProjectUpdate,
  apiUserProjectArchive,
  apiUserProjectCollect,
  apiUserProjectPin,
  apiUserProjectUnCollect,
} from '@/services/userProjectApp';
import { request } from 'umi';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('umi', () => ({
  request: vi.fn().mockResolvedValue({ code: '0000' }),
}));

describe('常规项目与项目标记接口契约', () => {
  beforeEach(() => {
    vi.mocked(request).mockClear();
  });

  it('常规项目更新与删除走 normal-project 路径', async () => {
    const payload = { id: 32, name: '新名称' };
    await apiNormalProjectUpdate(payload);
    expect(request).toHaveBeenLastCalledWith('/api/normal-project/update', {
      method: 'POST',
      data: payload,
    });

    await apiNormalProjectDelete(32);
    expect(request).toHaveBeenLastCalledWith('/api/normal-project/delete/32', {
      method: 'POST',
    });
  });

  it('常规项目详情与最新会话走 GET 接口', async () => {
    await apiNormalProjectGetById(32);
    expect(request).toHaveBeenLastCalledWith('/api/normal-project/get/32', {
      method: 'GET',
    });

    await apiNormalProjectLatestConversation(32);
    expect(request).toHaveBeenLastCalledWith(
      '/api/normal-project/conversation/32',
      { method: 'GET' },
    );
  });

  it('项目置顶与归档走 user-project toggle 接口且必传目标态与 projectType', async () => {
    await apiUserProjectPin(32, true, 'NormalProject');
    expect(request).toHaveBeenLastCalledWith('/api/user-project/pin/32', {
      method: 'POST',
      params: { pinned: true, projectType: 'NormalProject' },
    });

    await apiUserProjectPin(32, false, 'NormalProject');
    expect(request).toHaveBeenLastCalledWith('/api/user-project/pin/32', {
      method: 'POST',
      params: { pinned: false, projectType: 'NormalProject' },
    });

    await apiUserProjectArchive(32, true, 'UserApp');
    expect(request).toHaveBeenLastCalledWith('/api/user-project/archive/32', {
      method: 'POST',
      params: { archived: true, projectType: 'UserApp' },
    });
  });

  it('项目收藏/取消收藏为双路径接口且必传 projectType（2026-09-13 契约）', async () => {
    await apiUserProjectCollect(32, 'NormalProject');
    expect(request).toHaveBeenLastCalledWith('/api/user-project/collect/32', {
      method: 'POST',
      params: { projectType: 'NormalProject' },
    });

    await apiUserProjectUnCollect(32, 'UserApp');
    expect(request).toHaveBeenLastCalledWith('/api/user-project/unCollect/32', {
      method: 'POST',
      params: { projectType: 'UserApp' },
    });
  });
});
