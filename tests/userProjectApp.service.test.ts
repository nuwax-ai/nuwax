import {
  apiNormalProjectDelete,
  apiNormalProjectGetById,
  apiNormalProjectLatestConversation,
  apiNormalProjectUpdate,
  apiUserProjectArchive,
  apiUserProjectPin,
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

  it('项目置顶与归档走 user-project toggle 接口', async () => {
    await apiUserProjectPin(32);
    expect(request).toHaveBeenLastCalledWith('/api/user-project/pin/32', {
      method: 'POST',
    });

    await apiUserProjectArchive(32);
    expect(request).toHaveBeenLastCalledWith('/api/user-project/archive/32', {
      method: 'POST',
    });
  });
});
