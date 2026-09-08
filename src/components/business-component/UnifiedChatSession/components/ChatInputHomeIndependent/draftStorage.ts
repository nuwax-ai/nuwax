/**
 * 输入框草稿缓存：按会话 id 持久化到 localStorage，
 * 离开会话再回来（或刷新）时恢复未发送的输入内容（对齐飞书/微信体验）。
 * 存储形态对齐 MessageQueue/queueStorage.ts：TTL 过期丢弃、
 * localStorage 不可用/解析失败静默降级、空草稿删除存储键。
 */

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
