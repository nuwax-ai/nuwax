import { apiAgentConversationMessageList } from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import { AssistantRoleEnum } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { SearchOutlined } from '@ant-design/icons';
import { Input, message, Popover, Spin } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 单次拉取条数与总页数上限（深会话兜底，最多约 1000 条） */
const SEARCH_PAGE_SIZE = 50;
const SEARCH_MAX_PAGES = 20;
/** 定位高亮的临时 class（样式见 index.less 的 :global） */
const HIGHLIGHT_CLASS = 'conversation-search-highlight';
/** 触发搜索的最短关键词长度 */
const MIN_KEYWORD_LENGTH = 2;

/** 搜索源文本：剥离过程/思考内联标签，避免命中协议噪音 */
const stripProcessTags = (text: string) =>
  text.replace(/<markdown-custom-[a-z-]+[^>]*>/gi, '');

interface SearchHit {
  id: string | number;
  isUser: boolean;
  snippet: { text: string; highlight: boolean }[];
}

/** 每个匹配处截取前后文片段（最多 3 处），片段内命中词高亮 */
const buildSnippets = (
  source: string,
  keyword: string,
): { text: string; highlight: boolean }[] => {
  const lowerKeyword = keyword.toLowerCase();
  const parts: { text: string; highlight: boolean }[] = [];
  let cursor = 0;
  let matched = 0;

  while (matched < 3) {
    const found = source.toLowerCase().indexOf(lowerKeyword, cursor);
    if (found === -1) break;
    const contextStart = Math.max(0, found - 20);
    parts.push({
      text: (contextStart > 0 ? '…' : '') + source.slice(contextStart, found),
      highlight: false,
    });
    parts.push({
      text: source.slice(found, found + keyword.length),
      highlight: true,
    });
    cursor = found + keyword.length;
    matched += 1;
  }
  if (matched > 0 && cursor < source.length) {
    parts.push({
      text: `${source.slice(cursor, cursor + 40)}…`,
      highlight: false,
    });
  }
  return parts;
};

interface ConversationSearchPanelProps {
  conversationId?: string | number | null;
  /** 有会话记录时才渲染入口 */
  hasMessages?: boolean;
}

/**
 * 会话内搜索：顶栏入口 + Popover 面板。
 * 打开时按消息 index 游标翻页拉取当前会话消息（本地缓存，切会话重拉），
 * keyword 本地过滤（正文 + 思考），点击结果滚动定位到消息并临时高亮；
 * 消息尚未加载进 DOM 时提示向上滚动加载。
 */
const ConversationSearchPanel: React.FC<ConversationSearchPanelProps> = ({
  conversationId,
  hasMessages = false,
}) => {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MessageInfo[]>([]);
  /** 已加载缓存的会话 id（切会话失效重拉） */
  const loadedForRef = useRef<string | number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const ensureLoaded = useCallback(async () => {
    if (!conversationId) return;
    if (loadedForRef.current === conversationId) return;
    loadedForRef.current = conversationId;
    setLoading(true);
    try {
      const all: MessageInfo[] = [];
      let cursor = 0;
      for (let page = 0; page < SEARCH_MAX_PAGES; page++) {
        const res = await apiAgentConversationMessageList({
          conversationId: Number(conversationId),
          index: cursor,
          size: SEARCH_PAGE_SIZE,
        });
        const list = (res?.data ?? []) as (MessageInfo & { index?: number })[];
        if (!list.length) break;
        all.push(...list);
        if (list.length < SEARCH_PAGE_SIZE) break;
        // index 游标：取本页最后一条（最旧）消息的 index
        const last = list[list.length - 1] as { index?: number };
        cursor = last?.index ?? 0;
        if (!cursor) break;
      }
      setMessages(all);
    } catch (error) {
      console.error('[ConversationSearch] load messages failed:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const hits: SearchHit[] = useMemo(() => {
    if (!debouncedKeyword || debouncedKeyword.length < MIN_KEYWORD_LENGTH) {
      return [];
    }
    const lowerKeyword = debouncedKeyword.toLowerCase();
    const result: SearchHit[] = [];
    // 接口按新→旧返回，结果按时间正序展示
    for (const msg of [...messages].reverse()) {
      const source = stripProcessTags(
        `${msg?.text || ''}\n${msg?.think || ''}`,
      ).trim();
      if (source && source.toLowerCase().includes(lowerKeyword)) {
        result.push({
          id: msg.id,
          isUser: msg.role === AssistantRoleEnum.USER,
          snippet: buildSnippets(source, debouncedKeyword),
        });
      }
    }
    return result;
  }, [debouncedKeyword, messages]);

  const locateMessage = useCallback((id: string | number) => {
    const el =
      document.querySelector(`[data-server-message-id="${id}"]`) ||
      document.querySelector(`[data-message-id="${id}"]`);
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add(HIGHLIGHT_CLASS);
    setTimeout(() => el.classList.remove(HIGHLIGHT_CLASS), 2500);
    return true;
  }, []);

  const handleHitClick = useCallback(
    (id: string | number) => {
      if (!locateMessage(id)) {
        message.info(t('PC.Pages.Chat.searchLocateHint'));
      }
    },
    [locateMessage],
  );

  if (!conversationId || !hasMessages) {
    return null;
  }

  const content = (
    <div className={cx('conversation-search-panel')}>
      <Input
        allowClear
        size="small"
        prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
        placeholder={t('PC.Pages.Chat.searchMessages')}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <div className={cx('search-results')}>
        {loading && (
          <div className={cx('search-state')}>
            <Spin size="small" />
            <span>{t('PC.Pages.Chat.searchLoading')}</span>
          </div>
        )}
        {!loading &&
          debouncedKeyword.length >= MIN_KEYWORD_LENGTH &&
          !hits.length && (
            <div className={cx('search-state')}>
              {t('PC.Pages.Chat.searchNoResults')}
            </div>
          )}
        {!loading &&
          hits.map((hit) => (
            <div
              key={hit.id}
              className={cx('search-hit')}
              onClick={() => handleHitClick(hit.id)}
            >
              <div className={cx('search-hit-header')}>
                <span className={cx('search-hit-role')}>
                  {t(
                    hit.isUser
                      ? 'PC.Pages.Chat.searchRoleUser'
                      : 'PC.Pages.Chat.searchRoleAssistant',
                  )}
                </span>
              </div>
              <div className={cx('search-hit-snippet')}>
                {hit.snippet.map((part, index) =>
                  part.highlight ? (
                    <mark key={index}>{part.text}</mark>
                  ) : (
                    <span key={index}>{part.text}</span>
                  ),
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          ensureLoaded();
        }
      }}
      content={content}
      overlayClassName={cx('conversation-search-popover')}
    >
      <span className={cx('search-trigger')}>
        <SearchOutlined style={{ fontSize: 16 }} />
      </span>
    </Popover>
  );
};

export default ConversationSearchPanel;
