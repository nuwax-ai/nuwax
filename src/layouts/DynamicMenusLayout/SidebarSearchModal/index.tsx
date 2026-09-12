/**
 * 侧栏搜索弹窗（命令面板）
 * @description 单栏顶栏「搜索」icon / ⌘K 打开。六个资源分类 tab
 * （任务/项目/专家&专家团/技能/连接器/资料库，数据源见 ./sources.ts）：
 * 任务/资料库无关键词时展示「最近访问」（有就展示），其余分类展示列表第一页；
 * 关键词 500ms 防抖走各分类接口搜索。
 * 技能/专家/连接器 tab 复用对应 ListView 搜索场景（type=search，列表数据与
 * 付费拦截/连接流程组件内闭环，宿主只传关键词与选中回调）。
 * 样式对齐原型 gsearch（file-preview sk=837cc）：700 宽面板/药丸 tab/色块图标双行行。
 * 支持 ↑/↓ 选择、Enter 确认、Esc 关闭、⌘B 切换侧边栏。
 */
import SvgIcon from '@/components/base/SvgIcon';
import ConnectorListView from '@/components/business-component/ConnectorListView';
import ExpertListView from '@/components/business-component/ExpertListView';
import type { ExpertListItem } from '@/components/business-component/ExpertListView/types';
import SkillListView from '@/components/business-component/SkillListView';
import type { SkillListItem } from '@/components/business-component/SkillListView/types';
import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import useSelectSkillHandoff from '@/hooks/useSelectSkillHandoff';
import useSummonExpertHandoff from '@/hooks/useSummonExpertHandoff';
import { dict } from '@/services/i18nRuntime';
import { Modal, Spin } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useModel } from 'umi';
import { useSidebarCollapse } from '../useSidebarCollapse';
import { findMenuByCode, handleOpenUrl, resolveMenuPath } from '../utils';
import styles from './index.less';
import type {
  SearchPageCursor,
  SearchResultItem,
  SearchRowKind,
  SearchTab,
} from './sources';
import { SEARCH_FETCHERS } from './sources';

const cx = classNames.bind(styles);

const SEARCH_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 500;

const I18N_PREFIX = 'PC.Layouts.DynamicMenusLayout.SidebarSearchModal';

/**
 * 资料库菜单 code（后端菜单管理下发）
 * repo-web 深链尚未接入主线，资料库文档跳转须走该菜单的应用内 iframe 形态
 */
const REPO_MENU_CODE = 'ziliaoku';

/** tab 定义（key + i18n 后缀，顺序即展示顺序；技能 tab 由 SkillListView 自渲染） */
const TABS: Array<[SearchTab, string]> = [
  ['task', 'tabTask'],
  ['project', 'tabProject'],
  ['expert', 'tabExpert'],
  ['skill', 'tabSkill'],
  ['connector', 'tabConnector'],
  ['repo', 'tabRepo'],
];

/** 各分类行兜底图标（无真实图标/受保护图加载失败时） */
const TAB_FALLBACK_ICONS: Record<SearchRowKind, string> = {
  task: 'icons-nav-history-conversation',
  project: 'icons-nav-cube',
  repo: 'icons-nav-knowledge',
};

/** 行副标题的分类前缀（「类型 · 描述/时间」格式） */
const KIND_I18N_KEYS: Record<SearchRowKind, string> = {
  task: 'tabTask',
  project: 'tabProject',
  repo: 'kindRepo',
};

/** 列表组件自渲染的 tab（技能/专家/连接器，取数/分页/连接流程组件内闭环） */
const isCompTab = (tab: SearchTab) =>
  tab === 'skill' || tab === 'expert' || tab === 'connector';

/** 行图标：真实图标优先（受保护地址走鉴权 blob），缺失回退分类色块+兜底图标 */
const RowIcon: React.FC<{ kind: SearchRowKind; icon?: string }> = ({
  kind,
  icon,
}) => {
  const { displaySrc } = useAuthProtectedImageSrc(icon);
  if (displaySrc) {
    return <img className={cx(styles.rowImg)} src={displaySrc} alt="" />;
  }
  return <SvgIcon name={TAB_FALLBACK_ICONS[kind]} style={{ fontSize: 21 }} />;
};

const SidebarSearchModal: React.FC = () => {
  const { openSearchModal, setOpenSearchModal } = useModel('layout');
  const { getSpaceId } = useModel('spaceModel');
  const { firstLevelMenus } = useModel('menuModel');
  const { summon } = useSummonExpertHandoff();
  const { select } = useSelectSkillHandoff();
  const { toggleCollapse } = useSidebarCollapse();
  const inputRef = useRef<HTMLInputElement>(null);

  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('task');
  // 分页视图：当前自渲染 tab 的列表（任务/项目/资料库统一走分页取数）
  const [view, setView] = useState<{
    items: SearchResultItem[];
    hasMore: boolean;
    cursor: SearchPageCursor;
    loading: boolean;
    loadingMore: boolean;
  }>({
    items: [],
    hasMore: false,
    cursor: {},
    loading: false,
    loadingMore: false,
  });
  const [selectedIdx, setSelectedIdx] = useState(0);

  // 分页结果缓存（key: `${tab}|${keyword}`，含续拉游标；弹窗每次打开清空保证数据新鲜）
  const cacheRef = useRef(
    new Map<
      string,
      { items: SearchResultItem[]; hasMore: boolean; cursor: SearchPageCursor }
    >(),
  );
  // 请求序号（过期响应丢弃）
  const seqRef = useRef(0);

  /** 关弹窗 */
  const closeModal = useCallback(
    () => setOpenSearchModal(false),
    [setOpenSearchModal],
  );

  /** 当前团队空间 ID（localStorage 字符串/内存数字统一收敛为 number） */
  const resolveSpaceId = useCallback((): number | undefined => {
    const raw = getSpaceId();
    if (raw === null || raw === undefined || raw === '') return undefined;
    const num = Number(raw);
    return Number.isFinite(num) ? num : undefined;
  }, [getSpaceId]);

  /**
   * 分页拉取：append=false 拉首页（命中缓存直接回显），append=true 触底续拉
   * （游标由上一次 SearchPageResult.cursor 透传，结果追加进当前列表）
   */
  const loadPage = useCallback(
    async (
      tab: SearchRowKind,
      kw: string,
      cursor: SearchPageCursor,
      append: boolean,
    ) => {
      const cacheKey = `${tab}|${kw}`;
      if (!append) {
        const cached = cacheRef.current.get(cacheKey);
        if (cached) {
          setView({ ...cached, loading: false, loadingMore: false });
          return;
        }
      }
      const seq = ++seqRef.current;
      if (append) {
        setView((prev) => ({ ...prev, loadingMore: true }));
      } else {
        setView({
          items: [],
          hasMore: false,
          cursor: {},
          loading: true,
          loadingMore: false,
        });
      }
      try {
        const res = await SEARCH_FETCHERS[tab]({
          keyword: kw,
          size: SEARCH_LIMIT,
          cursor,
          spaceId: resolveSpaceId(),
        });
        if (seqRef.current !== seq) return;
        setView((prev) => {
          const raw = append ? [...prev.items, ...res.items] : res.items;
          // 会话按修改时间序返回，lastId 游标续拉的回包可能与已有行边界重复：
          // 按行 id 去重，避免 React 重复 key（对齐侧栏 useHomeSectionData 去重口径）
          const seen = new Set<string>();
          const items = raw.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
          const merged = {
            items,
            hasMore: res.hasMore,
            cursor: res.cursor,
            loading: false,
            loadingMore: false,
          };
          cacheRef.current.set(cacheKey, {
            items: merged.items,
            hasMore: merged.hasMore,
            cursor: merged.cursor,
          });
          return merged;
        });
      } catch {
        if (seqRef.current !== seq) return;
        setView((prev) => ({ ...prev, loading: false, loadingMore: false }));
      }
    },
    [resolveSpaceId],
  );

  /** 打开时重置（首屏数据由下方分类加载 effect 统一拉取） */
  useEffect(() => {
    if (!openSearchModal) return;
    setKeyword('');
    setActiveTab('task');
    setSelectedIdx(0);
    setView({
      items: [],
      hasMore: false,
      cursor: {},
      loading: false,
      loadingMore: false,
    });
    cacheRef.current.clear();
    seqRef.current += 1;
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [openSearchModal]);

  // 关键词搜索（500ms 防抖）与分类切换的首屏加载（缓存命中直接回显）；
  // 任务/项目/资料库统一分页取数——任务/资料库无关键词的首屏即「最近」数据；
  // 技能/专家/连接器 tab 由对应列表组件自取（keyword 受控传入，组件内防抖）
  useEffect(() => {
    if (!openSearchModal || isCompTab(activeTab)) {
      return;
    }
    if (!keyword) {
      loadPage(activeTab, '', {}, false);
      return;
    }
    const timer = setTimeout(
      () => loadPage(activeTab, keyword, {}, false),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [keyword, activeTab, openSearchModal, loadPage]);

  /** 任务/项目会话跳转（对齐 NewHomeSection 会话点击的分发逻辑） */
  const goConversation = useCallback(
    (conv: SearchResultItem['conversation']) => {
      if (!conv) return;
      closeModal();
      const { id, agentId, devTargetType, devTargetId, devSpaceId } = conv;
      if (devTargetType === 'Agent' && devSpaceId && id) {
        history.push(
          `/space/${devSpaceId}/agent-dev?agentId=${devTargetId}&conversationId=${id}`,
        );
      } else if (devTargetType === 'PageApp' && devSpaceId && devTargetId) {
        history.push(`/space/${devSpaceId}/app-dev/${devTargetId}`);
      } else if (devTargetType === 'UserApp' && devSpaceId && devTargetId) {
        // 全栈应用会话：跳全栈应用开发详情页，conversationId 用于恢复该会话
        history.push(
          `/space/${devSpaceId}/app-pro?appId=${devTargetId}&conversationId=${id}`,
        );
      } else {
        history.push('/home/chat/' + id + '/' + agentId);
      }
    },
    [closeModal],
  );

  /**
   * 资料库文档跳转：复用侧栏「资料库」菜单的打开链路（应用内 iframe 包装，
   * 桌面壳走独立开窗、新标签页语义均与菜单点击一致）。
   * repo-web 深链（/repo/doc/{slugId}）尚未接入主线，
   * 文档地址 = 菜单配置的资料库地址 + /doc/{slugId}；菜单未下发时回落深链。
   */
  const openRepoDoc = useCallback(
    (slugId?: string) => {
      if (!slugId) return;
      const menu = findMenuByCode(firstLevelMenus, REPO_MENU_CODE);
      if (!menu?.path) {
        window.location.assign(`/repo/doc/${slugId}`);
        return;
      }
      const docUrl = `${resolveMenuPath(menu).path?.replace(
        /\/+$/,
        '',
      )}/doc/${slugId}`;
      // 仅替换目标文档地址，不传 parentCode：不覆写菜单自身的路径记忆（PATH_URL）
      handleOpenUrl({ ...menu, path: docUrl });
    },
    [firstLevelMenus],
  );

  /** 结果点击分发（键盘 Enter 同路径；技能/专家/连接器由列表组件自分发） */
  const activateItem = useCallback(
    (item: SearchResultItem) => {
      switch (item.kind) {
        case 'task':
          goConversation(item.conversation);
          break;
        case 'project':
          // 项目无子会话置灰不可点
          goConversation(item.projectConversation);
          break;
        case 'repo':
          closeModal();
          openRepoDoc(item.slugId);
          break;
      }
    },
    [closeModal, goConversation, openRepoDoc],
  );

  /** 专家选中（ExpertListView 回调，付费拦截通过后才触发）：复用「召唤」回 /home 建会话 */
  // TODO 召唤/选择链路后续收敛复用 CapabilityModal
  // （src/components/ChatInputHome/CapabilityModal/，能力选择弹窗已内聚
  //  技能/专家/连接器三维度列表，待其消费侧定稿后统一）
  const handleExpertSelect = useCallback(
    (item: ExpertListItem) => {
      closeModal();
      summon({
        agentId: item.targetId ?? item.rawId,
        name: item.name,
        icon: item.icon,
      });
    },
    [closeModal, summon],
  );

  /** 技能选中（SkillListView 回调，付费拦截通过后才触发）：复用「选择」回 /home 挂 chip */
  const handleSkillSelect = useCallback(
    (item: SkillListItem) => {
      closeModal();
      select({
        skillId: item.targetId ?? item.rawId,
        name: item.name,
        icon: item.icon,
      });
    },
    [closeModal, select],
  );

  // 无关键词时：任务/资料库展示最近访问，其余分类展示列表第一页
  const displayList = useMemo(() => {
    if (isCompTab(activeTab)) return [];
    return view.items;
  }, [activeTab, view.items]);

  const loading = useMemo(() => {
    if (isCompTab(activeTab)) return false;
    return view.loading;
  }, [activeTab, view.loading]);

  // 「最近访问」空不占位（有就展示）
  const hideRecentSection =
    !keyword &&
    (activeTab === 'task' || activeTab === 'repo') &&
    !loading &&
    displayList.length === 0;

  useEffect(() => setSelectedIdx(0), [keyword, activeTab]);

  /** 列表触底：加载下一页（组件 tab 内部自滚动，不经过此处） */
  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (view.loading || view.loadingMore || !view.hasMore) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight > 48) return;
    loadPage(activeTab as SearchRowKind, keyword, view.cursor, true);
  };

  /** 输入框键盘：↑/↓ 选择、Enter 确认 */
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, displayList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = displayList[selectedIdx];
      if (item) activateItem(item);
    }
  };

  /** ⌘K 开关弹窗、⌘B 切换侧边栏（弹窗打开时） */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key?.toLowerCase();
      if (key === 'k') {
        e.preventDefault();
        setOpenSearchModal(!openSearchModal);
      } else if (key === 'b' && openSearchModal) {
        e.preventDefault();
        // 走统一入口：移动端切抽屉、桌面端折叠（含偏好持久化）
        toggleCollapse();
        closeModal();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openSearchModal, setOpenSearchModal, toggleCollapse, closeModal]);

  const renderItemRow = (item: SearchResultItem) => {
    const idx = displayList.findIndex((entry) => entry.id === item.id);
    // 项目无子会话置灰不可点
    const disabled = item.kind === 'project' && !item.projectConversation;
    // 副标题「类型 · 描述/时间」
    const sub = item.description || item.meta;
    return (
      <div
        key={item.id}
        className={cx(styles.row, {
          [styles.rowActive]: selectedIdx === idx,
          [styles.rowDisabled]: disabled,
        })}
        onClick={() => activateItem(item)}
        onMouseEnter={() => !disabled && setSelectedIdx(idx)}
        aria-disabled={disabled || undefined}
      >
        <span className={cx(styles.tile, styles[`tile-${item.kind}`])}>
          <RowIcon kind={item.kind} icon={item.icon} />
        </span>
        <span className={cx(styles.rowMain)}>
          <span className={cx(styles.rowLabel)}>{item.name}</span>
          <span className={cx(styles.rowSub)}>
            {dict(`${I18N_PREFIX}.${KIND_I18N_KEYS[item.kind]}`)}
            {sub ? ` · ${sub}` : ''}
          </span>
        </span>
      </div>
    );
  };

  // 弹窗自渲染列表（任务/项目/资料库；技能/专家/连接器由列表组件自渲染）
  const renderBody = () => {
    if (hideRecentSection) return null;
    if (loading) {
      return (
        <div className={cx(styles.empty)}>
          <Spin size="small" />
        </div>
      );
    }
    if (displayList.length) {
      return (
        <>
          {displayList.map(renderItemRow)}
          {view.loadingMore && (
            <div className={cx(styles.empty)}>
              <Spin size="small" />
            </div>
          )}
        </>
      );
    }
    // 无关键词的任务/资料库空态已由 hideRecentSection 隐藏；其余展示空文案
    return (
      <div className={cx(styles.empty)}>{dict(`${I18N_PREFIX}.empty`)}</div>
    );
  };

  return (
    <Modal
      open={openSearchModal}
      onCancel={closeModal}
      footer={null}
      closable={false}
      width={700}
      style={{ top: '12vh' }}
      styles={{
        content: { padding: 0, borderRadius: 16, overflow: 'hidden' },
        body: { padding: 0 },
      }}
      destroyOnHidden
    >
      <div className={cx(styles.container)}>
        <div className={cx(styles.head)}>
          <svg
            className={cx(styles.headIcon)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            className={cx(styles.input)}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={dict(`${I18N_PREFIX}.placeholder`)}
            autoComplete="off"
          />
          <button
            type="button"
            className={cx(styles.closeBtn)}
            onClick={closeModal}
            aria-label={dict(`${I18N_PREFIX}.close`)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className={cx(styles.tabs)}>
          {TABS.map(([key, i18nKey]) => (
            <button
              key={key}
              type="button"
              className={cx(styles.tab, {
                [styles.tabActive]: activeTab === key,
              })}
              onClick={() => setActiveTab(key)}
            >
              {dict(`${I18N_PREFIX}.${i18nKey}`)}
            </button>
          ))}
        </div>

        {isCompTab(activeTab) ? (
          // 列表组件自带滚动容器：包装层只限高不滚动，空态随内容收缩不出滚动条
          <div className={cx(styles['comp-wrap'])}>
            {activeTab === 'skill' && (
              <SkillListView
                type="search"
                variant="list"
                keyword={keyword}
                onSelect={handleSkillSelect}
              />
            )}
            {activeTab === 'expert' && (
              <ExpertListView
                type="search"
                variant="list"
                keyword={keyword}
                onSelect={handleExpertSelect}
              />
            )}
            {activeTab === 'connector' && (
              // 连接器无选中语义（纯连接管理）：连接/断开/凭据/扫码授权组件内闭环
              <ConnectorListView
                type="search"
                variant="list"
                keyword={keyword}
              />
            )}
          </div>
        ) : (
          <div className={cx(styles.body)} onScroll={handleBodyScroll}>
            {renderBody()}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SidebarSearchModal;
