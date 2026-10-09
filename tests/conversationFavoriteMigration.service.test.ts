import { apiAgentConversationCollect } from '@/services/agentConfig';
import { migrateLocalConversationFavorites } from '@/services/conversationFavoriteMigration';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// 迁移模块 import 服务层（传递依赖 umi），vitest 环境须 mock
vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationCollect: vi.fn().mockResolvedValue({ code: '0000' }),
}));

const KEY = 'conversation_favorite_ids';
const LEGACY_KEY = 'conversation_local_flags';
const MIGRATED_KEY = 'conversation_favorite_migrated';

describe('会话收藏本地数据一次性迁移（2026-09-13 后端化收尾）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('无本地数据时不发请求，仅写迁移标记', async () => {
    await migrateLocalConversationFavorites();
    expect(apiAgentConversationCollect).not.toHaveBeenCalled();
    expect(localStorage.getItem(MIGRATED_KEY)).toBe('1');
  });

  it('本地收藏逐个上报 collect，完成后清键并写标记', async () => {
    localStorage.setItem(KEY, JSON.stringify([8, 9, 8]));
    await migrateLocalConversationFavorites();
    expect(apiAgentConversationCollect).toHaveBeenCalledTimes(2);
    expect(apiAgentConversationCollect).toHaveBeenCalledWith(8);
    expect(apiAgentConversationCollect).toHaveBeenCalledWith(9);
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(localStorage.getItem(MIGRATED_KEY)).toBe('1');
  });

  it('旧方案 conversation_local_flags.v1 的 collected 数据同样上报', async () => {
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({ version: 1, collected: [5] }),
    );
    await migrateLocalConversationFavorites();
    expect(apiAgentConversationCollect).toHaveBeenCalledWith(5);
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(localStorage.getItem(MIGRATED_KEY)).toBe('1');
  });

  it('单个上报失败容错跳过，仍清键写标记（幂等收尾）', async () => {
    localStorage.setItem(KEY, JSON.stringify([1, 2]));
    vi.mocked(apiAgentConversationCollect)
      .mockResolvedValueOnce({ code: '1001' } as never)
      .mockRejectedValueOnce(new Error('network') as never);
    await migrateLocalConversationFavorites();
    expect(apiAgentConversationCollect).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(localStorage.getItem(MIGRATED_KEY)).toBe('1');
  });

  it('迁移标记存在时直接返回（幂等防重入）', async () => {
    localStorage.setItem(MIGRATED_KEY, '1');
    localStorage.setItem(KEY, JSON.stringify([8]));
    await migrateLocalConversationFavorites();
    expect(apiAgentConversationCollect).not.toHaveBeenCalled();
    expect(localStorage.getItem(KEY)).toBe('[8]');
  });
});
