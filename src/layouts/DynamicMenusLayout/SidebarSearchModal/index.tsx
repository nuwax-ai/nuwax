/**
 * 侧栏搜索弹窗（命令面板）
 * @description 单栏顶栏「搜索」icon / ⌘K 打开。六个资源分类 tab
 * （任务/项目/专家&专家团/技能/连接器/资料库，数据源见 ./sources.ts）：
 * 任务/资料库无关键词时展示「最近访问」（有就展示），其余分类展示列表第一页；
 * 关键词 500ms 防抖走各分类接口搜索（专家/技能/连接器双源合并带来源标记）。
 * 支持 ↑/↓ 选择、Enter 确认、Esc 关闭、⌘B 切换侧边栏。
 */
import SvgIcon from '@/components/base/SvgIcon';
import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import useSelectSkillHandoff from '@/hooks/useSelectSkillHandoff';
import useSummonExpertHandoff from '@/hooks/useSummonExpertHandoff';
import { dict } from '@/services/i18nRuntime';
import type { InputRef } from 'antd';
import { Input, Modal, Spin } from 'antd';
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
import type { SearchFetchParams, SearchResultItem, SearchTab } from './sources';
import { fetchRecentRepos, fetchRecentTasks, SEARCH_FETCHERS } from './sources';

const cx = classNames.bind(styles);

const RECENT_LIMIT = 8;
const SEARCH_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 500;

/**
 * 资料库菜单 code（后端菜单管理下发）
 * repo-web 深链尚未接入主线，资料库文档跳转须走该菜单的应用内 iframe 形态
 */
const REPO_MENU_CODE = 'ziliaoku';

const I18N_PREFIX = 'PC.Layouts.DynamicMenusLayout.SidebarSearchModal';

/** tab 定义（key + i18n 后缀，顺序即展示顺序） */
const TABS: Array<[SearchTab, string]> = [
  ['task', 'tabTask'],
  ['project', 'tabProject'],
  ['expert', 'tabExpert'],
  ['skill', 'tabSkill'],
  ['connector', 'tabConnector'],
  ['repo', 'tabRepo'],
];

/** 各分类行的兜底图标（无真实图标/受保护图加载失败时） */
const TAB_FALLBACK_ICONS: Record<SearchTab, string> = {
  task: 'icons-nav-history-conversation',
  project: 'icons-nav-cube',
  expert: 'icons-nav-robot',
  skill: 'icons-nav-skill',
  connector: 'icons-nav-connector',
  repo: 'icons-nav-knowledge',
};

/** 行图标：真实图标优先（受保护地址走鉴权 blob），缺失回退分类兜底图标 */
const RowIcon: React.FC<{ tab: SearchTab; icon?: string }> = ({
  tab,
  icon,
}) => {
  const { displaySrc } = useAuthProtectedImageSrc(icon);
  if (displaySrc) {
    return <img className={cx(styles.rowImg)} src={displaySrc} alt="" />;
  }
  return <SvgIcon name={TAB_FALLBACK_ICONS[tab]} />;
};

const SidebarSearchModal: React.FC = () => {
  const { openSearchModal, setOpenSearchModal } = useModel('layout');
  const { getSpaceId } = useModel('spaceModel');
  const { firstLevelMenus } = useModel('menuModel');
  const { summon } = useSummonExpertHandoff();
  const { select } = useSelectSkillHandoff();
  const { toggleCollapse } = useSidebarCollapse();
  const inputRef = useRef<InputRef>(null);

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

  /** 拉取指定分类列表（缓存命中直接回显） */
  const runFetch = useCallback(
    async (tab: SearchTab, kw: string) => {
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
  // 任务/资料库无关键词走「最近访问」不拉列表，其余分类无关键词拉第一页
  useEffect(() => {
    if (!openSearchModal) return;
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

  /** 结果点击分发（键盘 Enter 同路径） */
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
        case 'expert':
          closeModal();
          // 复用专家页「召唤」：写入透传上下文回 /home 以该专家建会话
          if (item.agentId !== undefined) {
            summon({ agentId: item.agentId, name: item.name, icon: item.icon });
          }
          break;
        case 'skill':
          closeModal();
          // 复用技能页「选择」：写入透传上下文回 /home 挂技能 chip
          if (item.skillId !== undefined) {
            select({ skillId: item.skillId, name: item.name, icon: item.icon });
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
    [closeModal, goConversation, summon, select, openRepoDoc],
  );

  // 无关键词时：任务/资料库展示最近访问，其余分类展示列表第一页
  const displayList = useMemo(() => {
    if (keyword) return view.items;
    if (activeTab === 'task') return recentTasks;
    if (activeTab === 'repo') return recentRepos;
    return view.items;
  }, [keyword, activeTab, view.items, recentTasks, recentRepos]);

  const loading = useMemo(() => {
    if (keyword) return view.loading;
    if (activeTab === 'repo') return recentRepoLoading;
    if (activeTab === 'task') return false;
    return view.loading;
  }, [keyword, activeTab, view.loading, recentRepoLoading]);

  // 区块标题：有关键词=搜索结果；任务/资料库无关键词=最近访问；其余不展示
  const sectionTitle = keyword
    ? dict(`${I18N_PREFIX}.sectionResult`)
    : activeTab === 'task' || activeTab === 'repo'
    ? dict(`${I18N_PREFIX}.sectionRecent`)
    : '';
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
        <span className={cx(styles.rowIcon)}>
          <RowIcon tab={item.kind} icon={item.icon} />
        </span>
        <span className={cx(styles.rowMain)}>
          <span className={cx(styles.rowLabel)}>{item.name}</span>
          {item.description && (
            <span className={cx(styles.rowDesc)}>{item.description}</span>
          )}
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
        {item.meta && <span className={cx(styles.rowTime)}>{item.meta}</span>}
      </div>
    );
  };

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
      width={640}
      style={{ top: 80 }}
      styles={{ body: { padding: 0 } }}
      destroyOnClose
    >
      <div className={cx(styles.container)}>
        <div className={cx(styles['input-wrap'])}>
          <Input
            ref={inputRef}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={dict(`${I18N_PREFIX}.placeholder`)}
            allowClear
            bordered={false}
          />
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

        <div className={cx(styles.body)}>
          {sectionTitle && !hideRecentSection && (
            <div className={cx(styles.sectionTitle)}>{sectionTitle}</div>
          )}
          {renderBody()}
        </div>
      </div>
    </Modal>
  );
};

export default SidebarSearchModal;
