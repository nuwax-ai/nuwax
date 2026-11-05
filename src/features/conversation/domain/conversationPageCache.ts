export const DEFAULT_CONVERSATION_PAGE_CACHE_CAPACITY = 5;

export type ConversationWorkspaceView =
  | 'closed'
  | 'filePreview'
  | 'terminal'
  | 'desktop'
  | 'pagePreview';

export type ConversationPageCacheLifecycle = 'active' | 'cached' | 'disposing';

/** 已上传附件的服务端元数据；本地 File 与上传响应不进入草稿。 */
export interface ConversationDraftAttachment {
  uid: string;
  name: string;
  type: string;
  size: number;
  url: string;
  key: string;
  width?: number;
  height?: number;
}

export type ConversationDraftMention =
  | { kind: 'skill'; targetId: number; name: string }
  | { kind: 'doc'; slugId: string; name: string; pageType?: string }
  | { kind: 'file'; relativePath: string; name: string };

/** 文本与引用按编辑顺序保存，恢复时重新生成 chip，不存储编辑器 HTML。 */
export type ConversationDraftContent = (string | ConversationDraftMention)[];

export function normalizeDraftContent(
  value: unknown,
): ConversationDraftContent {
  if (!Array.isArray(value)) return [];
  return value.flatMap((part): ConversationDraftContent => {
    if (typeof part === 'string') return part ? [part] : [];
    if (
      !part ||
      typeof part !== 'object' ||
      typeof part.name !== 'string' ||
      !part.name.trim()
    )
      return [];
    if (
      part.kind === 'skill' &&
      Number.isSafeInteger(part.targetId) &&
      part.targetId > 0
    ) {
      return [{ kind: 'skill', targetId: part.targetId, name: part.name }];
    }
    if (
      part.kind === 'doc' &&
      typeof part.slugId === 'string' &&
      part.slugId.trim()
    ) {
      return [
        {
          kind: 'doc',
          slugId: part.slugId,
          name: part.name,
          ...(typeof part.pageType === 'string'
            ? { pageType: part.pageType }
            : {}),
        },
      ];
    }
    if (
      part.kind === 'file' &&
      typeof part.relativePath === 'string' &&
      part.relativePath.trim()
    ) {
      return [
        { kind: 'file', relativePath: part.relativePath, name: part.name },
      ];
    }
    return [];
  });
}

export interface ConversationDraftData {
  version: 1;
  text: string;
  skillIds?: number[];
  files?: ConversationDraftAttachment[];
  content?: ConversationDraftContent;
  savedAt: number;
}

export interface ConversationDraftSummary {
  hasContent: boolean;
  textLength: number;
  skillCount: number;
  savedAt: number | null;
}

export interface ConversationPageResourceState {
  terminalMounted: boolean;
  terminalConnected: boolean;
  pageIframeMounted: boolean;
  fileWorkspaceDirty: boolean;
  desktopVisible: boolean;
}

export interface ConversationPageCacheEntry {
  key: string;
  surface: string;
  conversationId: string;
  agentId?: string;
  view: ConversationWorkspaceView;
  lifecycle: ConversationPageCacheLifecycle;
  /** 会话任务处于 CREATE/EXECUTING（执行中）时为 true。 */
  executing: boolean;
  /** 进入执行态的时间戳；非执行态为 null。 */
  executingSince: number | null;
  createdAt: number;
  lastAccessAt: number;
  revision: number;
  draft: ConversationDraftSummary;
  resources: ConversationPageResourceState;
}

export interface ConversationPageCacheSnapshot {
  activeKey: string | null;
  sharedVncOwnerConversationId: string | null;
  entries: ConversationPageCacheEntry[];
}

export const EMPTY_DRAFT_SUMMARY: ConversationDraftSummary = {
  hasContent: false,
  textLength: 0,
  skillCount: 0,
  savedAt: null,
};

export const EMPTY_RESOURCE_STATE: ConversationPageResourceState = {
  terminalMounted: false,
  terminalConnected: false,
  pageIframeMounted: false,
  fileWorkspaceDirty: false,
  desktopVisible: false,
};

export function selectConversationPageCacheEvictionKey(
  entries: Iterable<ConversationPageCacheEntry>,
  activeKey: string | null,
): string | null {
  const candidate = [...entries]
    .filter(
      (entry) => entry.key !== activeKey && entry.lifecycle !== 'disposing',
    )
    .sort(
      (left, right) =>
        left.lastAccessAt - right.lastAccessAt ||
        left.createdAt - right.createdAt ||
        left.key.localeCompare(right.key),
    )[0];
  return candidate?.key ?? null;
}

export const createConversationPageCacheKey = (
  surface: string,
  conversationId: number | string,
): string => `${surface}:${conversationId}`;
