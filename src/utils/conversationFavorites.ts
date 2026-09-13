/**
 * 会话收藏本地数据一次性迁移（过渡方案收尾）：
 * 2026-09-12~13 期间收藏走 localStorage（后端接口未上线），后端
 * collect/unCollect 上线后读侧已切列表回包 collected 打标、写侧切接口。
 * 本模块仅负责把本地已收藏的会话 id 逐个上报后端（collect 幂等，已收藏
 * 再报无副作用），成功后清键并写迁移标记防重入；单个失败容错跳过，
 * 未写标记前下次进入历史会话页会重试。
 */

import { apiAgentConversationCollect } from '@/services/agentConfig';

const STORAGE_KEY = 'conversation_favorite_ids';

/** 旧「置顶/归档/收藏本地化」方案的存储键：收藏数据迁入新键后即弃用 */
const LEGACY_FLAGS_KEY = 'conversation_local_flags';

/** 迁移完成标记：存在则不再上报/清键（幂等防重入） */
const MIGRATED_KEY = 'conversation_favorite_migrated';

const normalizeIds = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.filter((id): id is number => typeof id === 'number')
    : [];

const dedupe = (ids: number[]): number[] => Array.from(new Set(ids));

/** 读取本地收藏 id（含旧方案 conversation_local_flags.v1 的 collected 数组） */
const loadIds = (): number[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return dedupe(normalizeIds(JSON.parse(raw)));
    const legacyRaw = localStorage.getItem(LEGACY_FLAGS_KEY);
    if (!legacyRaw) return [];
    const legacy = JSON.parse(legacyRaw);
    if (legacy?.version !== 1) return [];
    return dedupe(normalizeIds(legacy.collected));
  } catch {
    return [];
  }
};

const clearKeys = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_FLAGS_KEY);
    localStorage.setItem(MIGRATED_KEY, '1');
  } catch {
    // ignore：localStorage 不可用时放弃标记，副作用只是下次重复尝试上报
  }
};

const isMigrated = (): boolean => {
  try {
    return localStorage.getItem(MIGRATED_KEY) === '1';
  } catch {
    return true;
  }
};

/**
 * 本地收藏一次性迁移上报后端（历史会话页挂载时调用）：
 * - 已迁移（标记存在）或无本地数据：直接写标记收尾；
 * - 有数据：逐个调 collect（幂等），单个失败跳过不阻塞；
 * - 全部尝试完后清旧键并写标记；仍在途的失败项下次进入重试。
 */
export const migrateLocalConversationFavorites = async (): Promise<void> => {
  if (isMigrated()) return;
  const ids = loadIds();
  if (ids.length === 0) {
    clearKeys();
    return;
  }
  await Promise.allSettled(ids.map((id) => apiAgentConversationCollect(id)));
  clearKeys();
};
