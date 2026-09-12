/**
 * 会话收藏本地存储（过渡方案）：
 * 会话收藏后端接口未上线（swagger 中 ConversationDto 仅有 pinned/archived），
 * 先以 localStorage 按会话 id 持久化；历史页「已收藏」视图据此过滤。
 * 后端收藏字段/接口就绪后，读侧切列表字段、写侧切接口并移除本模块。
 *
 * 变更后派发全局事件 `conversation-favorites-changed`，供消费方（历史页列表）刷新。
 */

const STORAGE_KEY = 'conversation_favorite_ids';

/** 旧「置顶/归档/收藏本地化」方案的存储键：收藏数据迁入新键后即弃用 */
const LEGACY_FLAGS_KEY = 'conversation_local_flags';

export const CONVERSATION_FAVORITES_EVENT = 'conversation-favorites-changed';

const normalizeIds = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.filter((id): id is number => typeof id === 'number')
    : [];

/** 读取收藏 id（去重、稳定升序）；首读顺带迁移旧方案 collected 数据 */
const loadIds = (): number[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacyIds();
    return dedupe(normalizeIds(JSON.parse(raw)));
  } catch {
    return [];
  }
};

/** 旧方案 conversation_local_flags.v1 的 collected 数组搬入新键 */
const migrateLegacyIds = (): number[] => {
  try {
    const legacyRaw = localStorage.getItem(LEGACY_FLAGS_KEY);
    if (!legacyRaw) return [];
    const legacy = JSON.parse(legacyRaw);
    if (legacy?.version !== 1) return [];
    const ids = dedupe(normalizeIds(legacy.collected));
    if (ids.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }
    return ids;
  } catch {
    return [];
  }
};

const dedupe = (ids: number[]): number[] => Array.from(new Set(ids));

const saveIds = (ids: number[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupe(ids)));
  } catch {
    // ignore：localStorage 不可用时降级为仅本次会话内生效
  }
};

const notifyChanged = (conversationId: number): void => {
  window.dispatchEvent(
    new CustomEvent(CONVERSATION_FAVORITES_EVENT, {
      detail: { id: conversationId },
    }),
  );
};

/** 全量读取收藏 id（列表层过滤用） */
export const loadFavoriteConversationIds = (): number[] => loadIds();

/** 某会话是否已收藏 */
export const isFavoriteConversation = (conversationId: number): boolean =>
  loadIds().includes(conversationId);

/** 切换收藏，返回切换后的状态 */
export const toggleFavoriteConversation = (
  conversationId: number,
  collected?: boolean,
): boolean => {
  const ids = loadIds();
  const next = collected ?? !ids.includes(conversationId);
  saveIds(
    next ? [...ids, conversationId] : ids.filter((id) => id !== conversationId),
  );
  notifyChanged(conversationId);
  return next;
};

/** 会话删除后清理收藏残留 */
export const removeFavoriteConversation = (conversationId: number): void => {
  const ids = loadIds();
  if (!ids.includes(conversationId)) return;
  saveIds(ids.filter((id) => id !== conversationId));
  notifyChanged(conversationId);
};
