/**
 * 会话内容搜索（前端过渡方案）：
 * 后端会话列表仅支持 topic（标题）模糊查询，消息内容维度的检索接口未上线；
 * 历史会话页搜索时由前端补「内容匹配」——按会话列表分页拉取最近的会话，
 * 逐会话按消息游标翻页扫描正文/思考内容，产出命中会话与高亮片段。
 * 后端内容检索接口就绪后，本模块与调用方接线整体移除。
 *
 * 纯工具层：会话/消息拉取函数由调用方注入（分层规则 utils 不依赖 services）。
 */

/** 扫描的会话数上限（按列表默认新→旧序取最近的，含归档） */
const DEFAULT_MAX_CONVERSATIONS = 50;
/** 单会话扫描的消息条数上限（深会话兜底） */
const DEFAULT_MAX_MESSAGES = 100;
/** 消息拉取并发数 */
const DEFAULT_CONCURRENCY = 4;
/** 触发内容扫描的最短关键词长度（单字符噪音大且扫描成本高；标题维度不受此限） */
export const CONTENT_SEARCH_MIN_KEYWORD_LENGTH = 2;

/** 分页拉取结果：单页条数约定由注入的拉取函数掌握，扫描器只消费 hasMore/cursor */
export interface ContentSearchPage<T> {
  items: T[];
  /** 本页拉满（可能有下一页） */
  hasMore: boolean;
  /** 下一页游标：会话列表=lastId，消息=本页最旧一条的 index；无更多时为 null */
  cursor: number | null;
}

export interface ContentSearchConversation {
  id: number;
}

export interface ContentSearchMessage {
  text?: string;
  think?: string;
}

export interface ContentSearchSnippetPart {
  text: string;
  highlight: boolean;
}

export interface ContentSearchHit<
  T extends ContentSearchConversation = ContentSearchConversation,
> {
  conversation: T;
  /** 首处命中的前后文片段（命中词高亮） */
  snippet: ContentSearchSnippetPart[];
}

export interface ContentSearchSummary<
  T extends ContentSearchConversation = ContentSearchConversation,
> {
  hits: ContentSearchHit<T>[];
  /** 实际扫描过的会话数 */
  scannedConversations: number;
  /** 中途取消（关键词变更/组件卸载等） */
  cancelled: boolean;
}

/** 搜索源文本：剥离过程/思考内联标签，避免命中协议噪音 */
const stripProcessTags = (text: string) =>
  text.replace(/<markdown-custom-[a-z-]+[^>]*>/gi, '');

/** 消息可搜索文本（正文 + 思考） */
const buildSearchableText = (message: ContentSearchMessage) =>
  stripProcessTags(`${message.text || ''}\n${message.think || ''}`).trim();

/** 首处命中的前后文片段（前 20 / 后 40 字符），片段内命中词高亮 */
export const buildContentSnippetParts = (
  source: string,
  keyword: string,
): ContentSearchSnippetPart[] => {
  const found = source.toLowerCase().indexOf(keyword.toLowerCase());
  if (found === -1) return [];

  const contextStart = Math.max(0, found - 20);
  const contextEnd = Math.min(source.length, found + keyword.length + 40);
  const parts: ContentSearchSnippetPart[] = [];
  if (contextStart > 0) {
    parts.push({ text: '…', highlight: false });
  }
  parts.push({ text: source.slice(contextStart, found), highlight: false });
  parts.push({
    text: source.slice(found, found + keyword.length),
    highlight: true,
  });
  if (contextEnd < source.length) {
    parts.push({
      text: `${source.slice(found + keyword.length, contextEnd)}…`,
      highlight: false,
    });
  } else {
    parts.push({
      text: source.slice(found + keyword.length),
      highlight: false,
    });
  }
  return parts;
};

export interface ScanConversationsForContentOptions<
  T extends ContentSearchConversation,
> {
  keyword: string;
  /** 会话分页拉取（新→旧）；cursor 为 null 时从头开始 */
  fetchConversations: (
    cursor: number | null,
  ) => Promise<ContentSearchPage<T>>;
  /** 消息分页拉取（新→旧）；cursor 为 null 时从最新一条开始 */
  fetchMessages: (
    conversationId: number,
    cursor: number | null,
  ) => Promise<ContentSearchPage<ContentSearchMessage>>;
  maxConversations?: number;
  maxMessagesPerConversation?: number;
  concurrency?: number;
  /** 取消探测：返回 true 后停止后续拉取（已完成批次照常产出） */
  isCancelled?: () => boolean;
  /** 命中渐进回调（按会话列表顺序分批产出，供列表渐进渲染） */
  onHit?: (hit: ContentSearchHit<T>) => void;
}

/**
 * 扫描最近会话的消息内容：
 * 1. 按注入的会话拉取函数分页圈定范围（去重防御分页重复，上限 maxConversations）；
 * 2. 按并发批次逐会话翻页扫描消息，单会话命中即止、条数达上限即止；
 * 3. 单会话消息拉取失败按未命中处理，会话范围拉取失败则以已拉到的部分继续。
 */
export async function scanConversationsForContent<
  T extends ContentSearchConversation,
>(
  options: ScanConversationsForContentOptions<T>,
): Promise<ContentSearchSummary<T>> {
  const {
    keyword,
    fetchConversations,
    fetchMessages,
    maxConversations = DEFAULT_MAX_CONVERSATIONS,
    maxMessagesPerConversation = DEFAULT_MAX_MESSAGES,
    concurrency = DEFAULT_CONCURRENCY,
    isCancelled,
    onHit,
  } = options;

  const normalized = keyword.trim();
  const hits: ContentSearchHit<T>[] = [];
  const isNowCancelled = () => isCancelled?.() === true;

  // 短词不扫内容（标题维度由服务端 topic 查询承担）
  if (normalized.length < CONTENT_SEARCH_MIN_KEYWORD_LENGTH) {
    return { hits, scannedConversations: 0, cancelled: false };
  }
  const lowerKeyword = normalized.toLowerCase();

  // 1. 圈定扫描范围
  const scoped: T[] = [];
  const seenIds = new Set<number>();
  let conversationCursor: number | null = null;
  while (scoped.length < maxConversations) {
    if (isNowCancelled()) {
      return { hits, scannedConversations: 0, cancelled: true };
    }
    let page: ContentSearchPage<T>;
    try {
      page = await fetchConversations(conversationCursor);
    } catch (error) {
      console.error('[ContentSearch] fetch conversations failed:', error);
      break;
    }
    for (const item of page.items) {
      if (scoped.length >= maxConversations) break;
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      scoped.push(item);
    }
    if (
      !page.hasMore ||
      page.cursor === null ||
      scoped.length >= maxConversations
    ) {
      break;
    }
    conversationCursor = page.cursor;
  }

  // 2. 并发扫描消息：单会话命中即止
  const scanOne = async (
    conversation: T,
  ): Promise<ContentSearchHit<T> | null> => {
    let messageCursor: number | null = null;
    let scannedMessages = 0;
    while (scannedMessages < maxMessagesPerConversation) {
      if (isNowCancelled()) return null;
      let page: ContentSearchPage<ContentSearchMessage>;
      try {
        page = await fetchMessages(conversation.id, messageCursor);
      } catch (error) {
        console.error('[ContentSearch] fetch messages failed:', error);
        return null;
      }
      if (!page.items.length) return null;
      for (const message of page.items) {
        scannedMessages += 1;
        const source = buildSearchableText(message);
        if (source && source.toLowerCase().includes(lowerKeyword)) {
          return {
            conversation,
            snippet: buildContentSnippetParts(source, normalized),
          };
        }
        if (scannedMessages >= maxMessagesPerConversation) return null;
      }
      if (!page.hasMore || page.cursor === null) return null;
      messageCursor = page.cursor;
    }
    return null;
  };

  // 3. 分批扫描：批次内按列表顺序产出（渐进回调顺序稳定）
  let scannedConversations = 0;
  let wasCancelled = false;
  for (let start = 0; start < scoped.length; start += concurrency) {
    if (isNowCancelled()) {
      wasCancelled = true;
      break;
    }
    const batch = scoped.slice(start, start + concurrency);
    const results = await Promise.all(batch.map(scanOne));
    scannedConversations += batch.length;
    if (isNowCancelled()) {
      // 本批已完成：产出结果后再停
      results.forEach((hit) => {
        if (hit) hits.push(hit);
      });
      wasCancelled = true;
      break;
    }
    results.forEach((hit) => {
      if (!hit) return;
      hits.push(hit);
      onHit?.(hit);
    });
  }

  return { hits, scannedConversations, cancelled: wasCancelled };
}
