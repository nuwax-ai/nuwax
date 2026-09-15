/**
 * 输入框草稿缓存：按「会话页面地址 × 会话 id」持久化到 localStorage，
 * 离开会话再回来（或刷新）时恢复未发送的输入内容（对齐飞书/微信体验）。
 * 存储形态对齐 MessageQueue/queueStorage.ts：TTL 过期丢弃、
 * localStorage 不可用/解析失败静默降级、空草稿删除存储键。
 */

/** 会话详情路由：/home/chat/:id/:agentId */
const CHAT_PATH = /^\/home\/chat(?:\/|$)/;
/** 智能体详情路由（会话面板承载会话）：/agent/* */
const AGENT_PATH = /^\/agent(?:\/|$)/;
/** 工作空间域路由（app-pro 等全栈 IDE 会话面板）：/space/:spaceId/* */
const SPACE_PATH = /^\/space(?:\/|$)/;

/**
 * 会话草稿作用面：结合会话页面地址分桶（2026-09-15 定调「以会话框组件为标准
 * 接入 + 结合会话页面地址」）。同一会话在不同路由面（/home/chat 会话页、
 * /agent 智能体面板、/space 全栈 IDE）各自独立草稿互不串扰；其余承载面
 * （插件/技能/EditAgent 预览等）落 'page' 兜底桶。
 */
export const resolveDraftSurface = (pathname: string): string => {
  if (CHAT_PATH.test(pathname)) return 'chat';
  if (AGENT_PATH.test(pathname)) return 'agent';
  if (SPACE_PATH.test(pathname)) return 'apppro';
  return 'page';
};

export interface ChatDraftData {
  version: 1;
  /** 输入框纯文本（mention 在编辑器内以 chip 呈现，与队列编辑回填一致退化为纯文本） */
  text: string;
  /** 已选技能 id 快照 */
  skillIds?: number[];
  savedAt: number;
}

const STORAGE_PREFIX = 'chat_draft:';

/** 草稿有效期（ms），超时视为过期不再恢复 */
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

const getStorageKey = (conversationId: string | number) =>
  `${STORAGE_PREFIX}${conversationId}`;

const isValidDraft = (value: unknown): value is ChatDraftData =>
  !!value &&
  typeof value === 'object' &&
  (value as ChatDraftData).version === 1 &&
  typeof (value as ChatDraftData).text === 'string';

/** 读取某会话草稿；无草稿 / 结构非法 / 超过 TTL 时返回 null */
export const loadDraft = (
  conversationId: string | number | null | undefined,
): ChatDraftData | null => {
  if (conversationId === null || conversationId === undefined) return null;
  try {
    const raw = localStorage.getItem(getStorageKey(conversationId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      !isValidDraft(parsed) ||
      Date.now() - parsed.savedAt > DRAFT_TTL_MS ||
      !parsed.text.trim()
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

/** 持久化某会话草稿；空文本且无技能时删除存储键。localStorage 不可用时静默降级。 */
export const saveDraft = (
  conversationId: string | number | null | undefined,
  draft: Omit<ChatDraftData, 'savedAt'>,
): void => {
  if (conversationId === null || conversationId === undefined) return;
  try {
    const key = getStorageKey(conversationId);
    const hasContent = !!draft.text.trim() || !!draft.skillIds?.length;
    if (!hasContent) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(
      key,
      JSON.stringify({ ...draft, savedAt: Date.now() } satisfies ChatDraftData),
    );
  } catch {
    // ignore: localStorage 不可用或配额超限，降级为不缓存
  }
};

/** 清除某会话草稿（发送成功后调用） */
export const clearDraft = (
  conversationId: string | number | null | undefined,
): void => {
  if (conversationId === null || conversationId === undefined) return;
  try {
    localStorage.removeItem(getStorageKey(conversationId));
  } catch {
    // ignore
  }
};
