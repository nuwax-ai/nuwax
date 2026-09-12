/**
 * 侧栏搜索弹窗（命令面板）
 * @description 单栏顶栏「搜索」icon / ⌘K 打开。六个资源分类 tab
 * （任务/项目/专家&专家团/技能/连接器/资料库，数据源见 ./sources.ts）：
 * 任务/资料库无关键词时展示「最近访问」（有就展示），其余分类展示列表第一页；
 * 关键词 500ms 防抖走各分类接口搜索（专家/连接器双源合并带来源标记）。
 * 技能 tab 复用 SkillListView 搜索场景（type=search，数据/分页/付费拦截组件内闭环）。
 * 样式对齐原型 gsearch（file-preview sk=837cc）：700 宽面板/药丸 tab/色块图标双行行。
 * 支持 ↑/↓ 选择、Enter 确认、Esc 关闭、⌘B 切换侧边栏。
 */
import SvgIcon from '@/components/base/SvgIcon';
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
  SearchFetchParams,
  SearchResultItem,
  SearchRowKind,
  SearchTab,
} from './sources';
import { fetchRecentRepos, fetchRecentTasks, SEARCH_FETCHERS } from './sources';

const cx = classNames.bind(styles);

const RECENT_LIMIT = 8;
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
  expert: 'icons-nav-robot',
  connector: 'icons-nav-connector',
  repo: 'icons-nav-knowledge',
};

/** 行副标题的分类前缀（「类型 · 描述/时间」格式） */
const KIND_I18N_KEYS: Record<SearchRowKind, string> = {
  task: 'tabTask',
  project: 'tabProject',
  expert: 'kindExpert',
  connector: 'kindConnector',
  repo: 'kindRepo',
};

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
  // 任务「最近访问」（打开弹窗即拉）
  const [recentTasks, setRecentTasks] = useState<SearchResultItem[]>([]);
  // 资料库「最近访问」（首次切到资料库 tab 时拉）
  const [recentRepos, setRecentRepos] = useState<SearchResultItem[]>([]);
  const [recentRepoLoading, setRecentRepoLoading] = useState(false);
  // 关键词搜索结果 / 无关键词分类列表（带 loading）
  const [view, setView] = useState<{
    items: SearchResultItem[];
    loading: boolean;
  }>({ items: [], loading: false });
  const [selectedIdx, setSelectedIdx] = useState(0);

  // 结果缓存（key: `${tab}|${keyword}`；弹窗每次打开清空保证数据新鲜）
  const cacheRef = useRef(new Map<string, SearchResultItem[]>());
  // 请求序号（过期响应丢弃）
  const seqRef = useRef(0);
  const repoRecentLoadedRef = useRef(false);

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

  /** 拉取指定分类列表（缓存命中直接回显；技能 tab 由 SkillListView 自取不经过此路径） */
  const runFetch = useCallback(
    async (tab: SearchRowKind, kw: string) => {
      const cacheKey = `${tab}|${kw}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setView({ items: cached, loading: false });
        return;
      }
      const seq = ++seqRef.current;
      setView({ items: [], loading: true });
      const params: SearchFetchParams = {
        keyword: kw,
        limit: SEARCH_LIMIT,
        spaceId: resolveSpaceId(),
      };
      try {
        const items = await SEARCH_FETCHERS[tab](params);
        if (seqRef.current !== seq) return;
        cacheRef.current.set(cacheKey, items);
        setView({ items, loading: false });
      } catch {
        if (seqRef.current !== seq) return;
        setView({ items: [], loading: false });
      }
    },
    [resolveSpaceId],
  );

  /** 打开时重置并拉取任务「最近访问」 */
  useEffect(() => {
    if (!openSearchModal) return;
    setKeyword('');
    setActiveTab('task');
    setSelectedIdx(0);
    setView({ items: [], loading: false });
    setRecentTasks([]);
    setRecentRepos([]);
    setRecentRepoLoading(false);
    repoRecentLoadedRef.current = false;
    cacheRef.current.clear();
    seqRef.current += 1;
    fetchRecentTasks(RECENT_LIMIT)
      .then(setRecentTasks)
      .catch(() => setRecentTasks([]));
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [openSearchModal]);

  // 关键词搜索（500ms 防抖）与分类切换的列表加载；
  // 任务/资料库无关键词走「最近访问」不拉列表，其余分类无关键词拉第一页；
  // 技能 tab 由 SkillListView 自取（keyword 受控传入，组件内防抖）
  useEffect(() => {
    if (!openSearchModal || activeTab === 'skill') return;
    if (!keyword) {
      if (activeTab !== 'task' && activeTab !== 'repo') {
        runFetch(activeTab, '');
      } else {
        setView({ items: [], loading: false });
      }
      return;
    }
    const timer = setTimeout(
      () => runFetch(activeTab, keyword),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [keyword, activeTab, openSearchModal, runFetch]);

  // 资料库「最近访问」：首次切到资料库 tab 时拉取（有就展示，没有不占位）
  useEffect(() => {
    if (
      !openSearchModal ||
      activeTab !== 'repo' ||
      repoRecentLoadedRef.current
    ) {
      return;
    }
    repoRecentLoadedRef.current = true;
    setRecentRepoLoading(true);
    fetchRecentRepos(RECENT_LIMIT)
      .then(setRecentRepos)
      .catch(() => setRecentRepos([]))
      .finally(() => setRecentRepoLoading(false));
  }, [openSearchModal, activeTab]);

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

  /** 结果点击分发（键盘 Enter 同路径；技能 tab 由 SkillListView onSelect 自分发） */
  const activateItem = useCallback(
    (item: SearchResultItem) => {
      // TODO 专家/连接器点击待复用「会话框快捷呼能力」CapabilityModal 交互联动
      //  （src/components/ChatInputHome/CapabilityModal，组件另一同学开发中，就绪后替换）：
      //  行点击改为打开该弹窗并落对应维度（defaultResourceType + resourceTypes 收敛），
      //  onSelect 按弹窗场景分派；以下 summon/跳页 为临时行为。
      //  技能已接入（SkillListView type=search，见 renderBody）。
      switch (item.kind) {
        case 'task':
          goConversation(item.conversation);
          break;
        case 'project':
          // 项目无子会话置灰不可点
          goConversation(item.projectConversation);
          break;
        case 'expert':
          closeModal();
          // 复用专家页「召唤」：写入透传上下文回 /home 以该专家建会话
          if (item.agentId !== undefined) {
            summon({ agentId: item.agentId, name: item.name, icon: item.icon });
          }
          break;
        case 'connector':
          closeModal();
          history.push('/expert-skill-connector/connector');
          break;
        case 'repo':
          closeModal();
          openRepoDoc(item.slugId);
          break;
      }
    },
    [closeModal, goConversation, summon, openRepoDoc],
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
    if (activeTab === 'skill') return [];
    if (keyword) return view.items;
    if (activeTab === 'task') return recentTasks;
    if (activeTab === 'repo') return recentRepos;
    return view.items;
  }, [keyword, activeTab, view.items, recentTasks, recentRepos]);

  const loading = useMemo(() => {
    if (activeTab === 'skill') return false;
    if (keyword) return view.loading;
    if (activeTab === 'repo') return recentRepoLoading;
    if (activeTab === 'task') return false;
    return view.loading;
  }, [keyword, activeTab, view.loading, recentRepoLoading]);

  // 「最近访问」空不占位（有就展示）
  const hideRecentSection =
    !keyword &&
    (activeTab === 'task' || activeTab === 'repo') &&
    !loading &&
    displayList.length === 0;

  useEffect(() => setSelectedIdx(0), [keyword, activeTab]);

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
        {item.source && (
          <span
            className={cx(
              styles.rowSource,
              item.source === 'official'
                ? styles.sourceOfficial
                : styles.sourceTeam,
            )}
          >
            {dict(
              `${I18N_PREFIX}.${
                item.source === 'official' ? 'sourceOfficial' : 'sourceTeam'
              }`,
            )}
          </span>
        )}
      </div>
    );
  };

  const renderBody = () => {
    // 技能 tab：SkillListView 搜索场景（数据/分页/付费拦截组件内闭环）
    if (activeTab === 'skill') {
      return (
        <div className={cx(styles['skill-wrap'])}>
          <SkillListView
            type="search"
            variant="list"
            keyword={keyword}
            onSelect={handleSkillSelect}
          />
        </div>
      );
    }
    if (hideRecentSection) return null;
    if (loading) {
      return (
        <div className={cx(styles.empty)}>
          <Spin size="small" />
        </div>
      );
    }
    if (displayList.length) {
      return displayList.map(renderItemRow);
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
      destroyOnClose
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

        <div className={cx(styles.body)}>{renderBody()}</div>
      </div>
    </Modal>
  );
};

export default SidebarSearchModal;
