/**
 * 会话置顶/归档/收藏的本地标记（过渡方案）：
 * 后端会话级字段（isPinned/isArchived/isCollected 契约，见会话优化 M2 清单）就绪前，
 * 先以 localStorage 按会话 id 持久化，列表据此排序/过滤/标记；
 * 后端字段上线后迁移到服务端并移除本模块。
 *
 * 变更后派发全局事件 `conversation-flags-changed`，供会话列表（主侧栏/历史页）刷新展示。
 */

const STORAGE_KEY = 'conversation_local_flags';
const FLAGS_EVENT = 'conversation-flags-changed';

export interface ConversationLocalFlags {
  version: 1;
  pinned: number[];
  archived: number[];
  collected: number[];
}

const EMPTY_FLAGS: ConversationLocalFlags = {
  version: 1,
  pinned: [],
  archived: [],
  collected: [],
};

const loadFlags = (): ConversationLocalFlags => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_FLAGS;
    const parsed = JSON.parse(raw) as Partial<ConversationLocalFlags>;
    if (parsed?.version !== 1) return EMPTY_FLAGS;
    return {
      version: 1,
      pinned: Array.isArray(parsed.pinned)
        ? parsed.pinned.filter((id) => typeof id === 'number')
        : [],
      archived: Array.isArray(parsed.archived)
        ? parsed.archived.filter((id) => typeof id === 'number')
        : [],
      collected: Array.isArray(parsed.collected)
        ? parsed.collected.filter((id) => typeof id === 'number')
        : [],
    };
  } catch {
    return EMPTY_FLAGS;
  }
};

const saveFlags = (flags: ConversationLocalFlags): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch {
    // ignore: localStorage 不可用，降级为仅本次会话内无效
  }
};

const notifyFlagsChanged = (conversationId: number) => {
  window.dispatchEvent(
    new CustomEvent(FLAGS_EVENT, { detail: { id: conversationId } }),
  );
};

export type ConversationFlagKind = 'pinned' | 'archived' | 'collected';

/** 全量读取（列表层排序/过滤用，每次渲染读一次） */
export const loadConversationFlags = (): ConversationLocalFlags => loadFlags();

/** 读取某会话的标记状态（一次性读取，供渲染层判断） */
export const getConversationFlag = (
  conversationId: number,
  kind: ConversationFlagKind,
): boolean => loadFlags()[kind].includes(conversationId);

/** 切换标记，返回切换后的状态 */
export const toggleConversationFlag = (
  conversationId: number,
  kind: ConversationFlagKind,
): boolean => {
  const flags = loadFlags();
  const list = flags[kind];
  const next = list.includes(conversationId)
    ? list.filter((id) => id !== conversationId)
    : [...list, conversationId];
  const nextFlags = { ...flags, [kind]: next };
  saveFlags(nextFlags);
  notifyFlagsChanged(conversationId);
  return next.includes(conversationId);
};

/** 移除某会话的全部标记（删除会话时清理，避免残留） */
export const clearConversationFlags = (conversationId: number): void => {
  const flags = loadFlags();
  const nextFlags: ConversationLocalFlags = {
    version: 1,
    pinned: flags.pinned.filter((id) => id !== conversationId),
    archived: flags.archived.filter((id) => id !== conversationId),
    collected: flags.collected.filter((id) => id !== conversationId),
  };
  saveFlags(nextFlags);
  notifyFlagsChanged(conversationId);
};

export const CONVERSATION_FLAGS_EVENT = FLAGS_EVENT;
