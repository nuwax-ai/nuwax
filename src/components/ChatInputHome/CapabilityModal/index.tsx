/**
 * 添加能力弹窗
 * @description 技能/连接器/专家/资料库 四类能力 × 系统广场/团队空间 双数据源的
 * 能力选择弹窗：左侧类型导航 + 数据源 tab + 搜索 + 二级分类 pill +
 * 两列卡片网格（滚动加载 / 键盘导航 / 置顶）。
 * 数据层参考 pages/ExpertSkillConnector 的适配器方案在本组件内独立实现，
 * 不直接依赖 pages 层代码。
 *
 * 用法：
 * ```tsx
 * <CapabilityModal
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   onSelect={(item) => console.log(item.resourceType, item.targetId ?? item.rawId)}
 * />
 * ```
 */

import ConnectorConnectModal from '@/components/business-component/ConnectorConnectModal';
import useConnectorConnect from '@/hooks/useConnectorConnect';
import { t } from '@/services/i18nRuntime';
import {
  CloseOutlined,
  FileTextOutlined,
  LinkOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Empty, Input, InputRef, Modal, Spin } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CapabilityCard from './CapabilityCard';
import useCapabilityCategories from './hooks/useCapabilityCategories';
import useCapabilityResources from './hooks/useCapabilityResources';
import styles from './index.less';
import type {
  CapabilityItem,
  CapabilitySourceEnum,
  CapabilityTypeEnum,
} from './types';

const cx = classNames.bind(styles);

/** 卡片网格列数（键盘 ↑↓ 按行移动的步长） */
const GRID_COLUMNS = 2;

/** 搜索防抖时长 */
const SEARCH_DEBOUNCE = 400;

/** 置顶持久化 localStorage key（按 key 粒度存：能力类型+数据源+原始标识） */
const PINNED_STORAGE_KEY = 'CAPABILITY_MODAL_PINNED_KEYS';

/** 左侧能力类型导航配置（图标使用带色板的 tinted 容器渲染） */
const RESOURCE_MENUS: {
  type: CapabilityTypeEnum;
  labelKey: string;
  icon: React.ReactNode;
}[] = [
  {
    type: 'skill',
    labelKey: 'PC.Components.CapabilityModal.menuSkill',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m15 7 5-5 2 2-5 5M14 10l-4 4M8 13l3 3-5 5a2.1 2.1 0 0 1-3-3l5-5Z" />
        <path d="M9.5 8.5a4.5 4.5 0 0 0-5.7-6.1l2.7 2.7-1.4 1.4-2.7-2.7a4.5 4.5 0 0 0 6.1 5.7l6 6a4.5 4.5 0 0 0 5.7 6.1l-2.7-2.7 1.4-1.4 2.7 2.7a4.5 4.5 0 0 0-6.1-5.7l-6-6Z" />
      </svg>
    ),
  },
  {
    type: 'connector',
    labelKey: 'PC.Components.CapabilityModal.menuConnector',
    icon: <LinkOutlined />,
  },
  {
    type: 'expert',
    labelKey: 'PC.Components.CapabilityModal.menuExpert',
    icon: <TeamOutlined />,
  },
  {
    type: 'knowledge',
    labelKey: 'PC.Components.CapabilityModal.menuKnowledge',
    icon: <FileTextOutlined />,
  },
];

const loadPinnedKeys = (): string[] => {
  try {
    const raw = localStorage.getItem(PINNED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((k) => typeof k === 'string')
      : [];
  } catch {
    return [];
  }
};

export interface CapabilityModalProps {
  /** 是否可见 */
  open: boolean;
  /** 关闭回调（Esc / 遮罩 / 选中完成后触发） */
  onClose: () => void;
  /** 选中能力回调（rawId 为原始标识，系统广场条目另有 targetId 本体 ID） */
  onSelect: (item: CapabilityItem) => void;
  /** 初始能力类型，默认技能；不在 resourceTypes 允许范围内时回落首个可用类型 */
  defaultResourceType?: CapabilityTypeEnum;
  /** 选中后是否自动关闭，默认 true */
  closeOnSelect?: boolean;
  /** 开放的能力类型列表，缺省全部；用于按入口收敛可选范围（如专家仅首页开放） */
  resourceTypes?: CapabilityTypeEnum[];
}

const CapabilityModal: React.FC<CapabilityModalProps> = ({
  open,
  onClose,
  onSelect,
  defaultResourceType = 'skill',
  closeOnSelect = true,
  resourceTypes,
}) => {
  /** 按入口开放范围过滤后的左侧导航（缺省=全部四类） */
  const menus = useMemo(
    () =>
      RESOURCE_MENUS.filter(
        (menu) => !resourceTypes || resourceTypes.includes(menu.type),
      ),
    [resourceTypes],
  );
  /** 初始能力类型：defaultResourceType 被过滤时回落首个可用类型 */
  const initialResourceType = menus.some(
    (menu) => menu.type === defaultResourceType,
  )
    ? defaultResourceType
    : menus[0]?.type ?? 'skill';

  // 能力类型 / 数据源（资料库=空间文档仓库，仅团队空间维度，初始即为 team）
  const [resourceType, setResourceType] =
    useState<CapabilityTypeEnum>(initialResourceType);
  const [source, setSource] = useState<CapabilitySourceEnum>(
    initialResourceType === 'knowledge' ? 'team' : 'system',
  );
  // 二级分类 key：system 维度为内容分类（空串=全部），team 维度为选中的空间 ID
  const [category, setCategory] = useState<string>('');

  // 搜索（输入值 + 防抖值）
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  // 搜索框展开态（设计稿为图标按钮，点击展开输入框）
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const searchInputRef = useRef<InputRef>(null);

  // 键盘聚焦项序号
  const [focusIndex, setFocusIndex] = useState<number>(0);

  // 置顶（localStorage 持久化）
  const [pinnedKeys, setPinnedKeys] = useState<string[]>(loadPinnedKeys);

  // 分类字典（system：内容分类；team：首位"全部" + 空间列表，团队空间优先）
  const categories = useCapabilityCategories(resourceType, source);

  /**
   * 团队空间维度：分类 pill 即空间选择——选中具体空间查该空间；
   * 与广场页同口径无"全部"占位，默认选中首个空间（团队空间优先）
   */
  const defaultSpaceId = useMemo(() => {
    const first = categories.find((item) => item.key);
    const id = first ? Number(first.key) : NaN;
    return Number.isFinite(id) && id > 0 ? id : undefined;
  }, [categories]);

  const spaceId = useMemo(
    () => (source === 'team' ? Number(category) || defaultSpaceId : undefined),
    [source, category, defaultSpaceId],
  );

  // 归一化列表数据
  const { list, loading, error, hasMore, loadMore, updateItem } =
    useCapabilityResources({
      resourceType,
      source,
      category,
      keyword,
      spaceId,
      pageSize: 20,
    });

  // 连接器「连接/断开」：与专家·技能·连接器广场页共用同一份共享 hook
  // （oauth2 授权 / 凭据弹窗 / 断开寻址，成功后就地更新卡片 connected）
  const {
    handleConnect,
    connectingIds,
    handleDisconnect,
    disconnectingIds,
    connectCtx,
    closeConnectModal,
    handleConnected,
  } = useConnectorConnect({
    source,
    spaceId,
    updateItem,
  });
  const connectorBusyKeys = useMemo(
    () => [...connectingIds, ...disconnectingIds],
    [connectingIds, disconnectingIds],
  );
  // CapabilityItem → 共享 hook 契约（connector 的 rawId 即 service 标识）
  const toConnectItem = (item: CapabilityItem) => ({
    id: item.key,
    service: item.rawId !== undefined ? String(item.rawId) : undefined,
    authType: item.authType,
    connected: item.connected,
  });
  const onConnectorConnect = useCallback(
    (item: CapabilityItem) => {
      void handleConnect(toConnectItem(item));
    },
    [handleConnect],
  );
  const onConnectorDisconnect = useCallback(
    (item: CapabilityItem) => {
      void handleDisconnect(toConnectItem(item));
    },
    [handleDisconnect],
  );

  // 置顶项排在当前列表最前（保持原相对顺序的稳定分区）
  const displayList = useMemo(() => {
    if (pinnedKeys.length === 0) {
      return list;
    }
    const pinnedSet = new Set(pinnedKeys);
    const pinned = list.filter((item) => pinnedSet.has(item.key));
    const rest = list.filter((item) => !pinnedSet.has(item.key));
    return [...pinned, ...rest];
  }, [list, pinnedKeys]);

  // 搜索防抖
  useEffect(() => {
    const timer = window.setTimeout(
      () => setKeyword(keywordInput),
      SEARCH_DEBOUNCE,
    );
    return () => window.clearTimeout(timer);
  }, [keywordInput]);

  /**
   * 切换数据源/能力类型时同步清空二级分类：跨维度的 category 语义不同
   * （system=内容分类、team=空间选择），携带旧值会先发出一次无效加载；
   * 切换类型导航时数据源自动回到系统广场（资料库=空间文档仓库，repo 树
   * 接口 spaceId 必传，强制团队空间源）
   */
  const handleSourceChange = useCallback((next: CapabilitySourceEnum) => {
    setSource(next);
    setCategory('');
  }, []);
  const handleResourceTypeChange = useCallback((next: CapabilityTypeEnum) => {
    setResourceType(next);
    setSource(next === 'knowledge' ? 'team' : 'system');
    setCategory('');
  }, []);

  // team 维度兜底：分类不在字典中（含初始空值）时选中首位"全部"
  useEffect(() => {
    if (source === 'team' && categories.length > 0) {
      setCategory((current) =>
        categories.some((item) => item.key === current)
          ? current
          : categories[0].key,
      );
    }
  }, [source, categories]);

  // 筛选条件变化时聚焦复位到首项
  useEffect(() => {
    setFocusIndex(0);
  }, [resourceType, source, category, keyword]);

  // 列表长度变化时收敛聚焦序号（避免越界）
  useEffect(() => {
    setFocusIndex((index) =>
      Math.min(index, Math.max(0, displayList.length - 1)),
    );
  }, [displayList.length]);

  // 弹窗打开时聚焦弹窗根节点，保证键盘事件可达（Esc/方向键/回车）
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => rootRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
    // 关闭后复位交互状态（弹窗使用 destroyOnClose，此处兜底同步关闭态）
    setSearchOpen(false);
  }, [open]);

  // 搜索框展开后自动聚焦输入框
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  // 键盘聚焦项滚动跟随：仅键盘导航时滚动（鼠标 hover 同样会改 focusIndex，
  // 若跟随滚动会在加载新页/悬停底部卡片时把滚动条拽走）
  const listRef = useRef<HTMLDivElement | null>(null);
  const keyboardNavRef = useRef<boolean>(false);
  useEffect(() => {
    if (!keyboardNavRef.current) {
      return;
    }
    keyboardNavRef.current = false;
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView?.({ block: 'nearest' });
  }, [focusIndex, displayList]);

  /**
   * 滚动锚定：置顶项会随后续页加载插入列表头部，导致视口内容被整体推挤。
   * loadMore 前记录视口首卡的 key 与位置，数据更新后补偿 scrollTop 差值；
   * 纯尾部追加时首卡位置不变、差值为 0，不会产生多余滚动。
   */
  const scrollAnchorRef = useRef<{ key: string; top: number } | null>(null);
  const captureScrollAnchor = () => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    const firstCard = el.querySelector<HTMLElement>('[data-capability-key]');
    scrollAnchorRef.current = firstCard
      ? { key: firstCard.dataset.capabilityKey || '', top: firstCard.offsetTop }
      : null;
  };
  useLayoutEffect(() => {
    const anchor = scrollAnchorRef.current;
    if (!anchor?.key) {
      scrollAnchorRef.current = null;
      return;
    }
    const el = listRef.current;
    const card = el?.querySelector<HTMLElement>(
      `[data-capability-key="${CSS.escape(anchor.key)}"]`,
    );
    if (el && card) {
      el.scrollTop += card.offsetTop - anchor.top;
    }
    scrollAnchorRef.current = null;
  }, [displayList]);

  const handleSelect = useCallback(
    (item: CapabilityItem) => {
      onSelect(item);
      if (closeOnSelect) {
        onClose();
      }
    },
    [onSelect, onClose, closeOnSelect],
  );

  const handleTogglePin = useCallback((item: CapabilityItem) => {
    setPinnedKeys((prev) => {
      const next = prev.includes(item.key)
        ? prev.filter((key) => key !== item.key)
        : [...prev, item.key];
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // 持久化失败不影响当次会话内置顶
      }
      return next;
    });
  }, []);

  /** 键盘导航：↑↓ 按行移动（步长=列数）、←→ 逐项移动、Enter 选中、Esc 关闭 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) {
      return;
    }
    const inInput = e.target instanceof HTMLInputElement;
    // 输入框内左右键保留光标移动语义
    if (inInput && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      return;
    }
    // 新增按钮保留原生 Enter/Space 激活语义，避免误选列表中的卡片。
    if (
      e.target instanceof HTMLButtonElement &&
      (e.key === 'Enter' || e.key === ' ')
    )
      return;
    const columns = listRef.current
      ? getComputedStyle(listRef.current).gridTemplateColumns.split(' ').length
      : GRID_COLUMNS;
    const last = Math.max(0, displayList.length - 1);
    const actions: Record<string, (() => void) | undefined> = {
      ArrowDown: () => setFocusIndex((i) => Math.min(i + columns, last)),
      ArrowUp: () => setFocusIndex((i) => Math.max(i - columns, 0)),
      ArrowRight: () => setFocusIndex((i) => Math.min(i + 1, last)),
      ArrowLeft: () => setFocusIndex((i) => Math.max(i - 1, 0)),
      Home: () => setFocusIndex(0),
      End: () => setFocusIndex(last),
      Enter: () => {
        const item = displayList[focusIndex];
        if (item) {
          handleSelect(item);
        }
      },
      Escape: () => onClose(),
    };
    const action = actions[e.key];
    if (action) {
      e.preventDefault();
      e.stopPropagation();
      // 方向键/Home/End 属于键盘导航，聚焦项需要滚动跟随
      if (e.key !== 'Enter' && e.key !== 'Escape') {
        keyboardNavRef.current = true;
      }
      action();
    }
  };

  /** 滚动触底加载下一页（先锚定视口，防置顶项前插造成跳动） */
  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight < 48 &&
      !loading &&
      hasMore
    ) {
      captureScrollAnchor();
      loadMore();
    }
  };

  // 列表未填满容器且还有数据时自动补拉（首屏数据不足一屏的场景）
  useEffect(() => {
    const el = listRef.current;
    if (!el || loading || !hasMore || displayList.length === 0) {
      return;
    }
    if (el.scrollHeight <= el.clientHeight) {
      captureScrollAnchor();
      loadMore();
    }
  }, [displayList, loading, hasMore, loadMore]);

  // 团队空间维度等待空间字典/空间 ID 就绪
  const waitingSpace = source === 'team' && !spaceId;
  const initialLoading = (loading || waitingSpace) && displayList.length === 0;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={920}
      centered
      footer={null}
      closable={false}
      // Esc 由弹窗内容统一处理（含输入框聚焦场景）
      keyboard={false}
      maskClosable
      destroyOnHidden
      className={cx(styles['capability-modal'])}
    >
      <div
        ref={rootRef}
        tabIndex={-1}
        className={cx('flex', styles.root)}
        onKeyDown={handleKeyDown}
      >
        {/* 左侧：标题 + 能力类型导航 + 快捷键提示 */}
        <aside className={cx('flex', 'flex-col', styles.sidebar)}>
          <div className={cx(styles['sidebar-header'])}>
            <div className={cx(styles['sidebar-title'])}>
              {t('PC.Components.CapabilityModal.title')}
            </div>
            <div className={cx(styles['sidebar-subtitle'])}>
              {t('PC.Components.CapabilityModal.subtitle')}
            </div>
          </div>
          <nav className={cx('flex', 'flex-col', 'flex-1', styles.menu)}>
            {menus.map((menu) => (
              <button
                key={menu.type}
                type="button"
                aria-pressed={resourceType === menu.type}
                className={cx(styles['menu-item'], {
                  [styles['menu-item-active']]: resourceType === menu.type,
                })}
                onClick={() => handleResourceTypeChange(menu.type)}
              >
                <span
                  className={cx(
                    'flex',
                    'items-center',
                    'content-center',
                    styles['menu-icon'],
                    styles[`menu-icon-${menu.type}`],
                  )}
                >
                  {menu.icon}
                </span>
                <span className={cx(styles['menu-label'])}>
                  {t(menu.labelKey)}
                </span>
              </button>
            ))}
          </nav>
          <div className={cx('flex', 'items-center', styles['sidebar-hints'])}>
            <span>{t('PC.Components.CapabilityModal.hintNav')}</span>
            <i>·</i>
            <span>{t('PC.Components.CapabilityModal.hintSelect')}</span>
            <i>·</i>
            <span>{t('PC.Components.CapabilityModal.hintClose')}</span>
          </div>
        </aside>

        {/* 右侧：数据源 tab + 搜索 + 分类 pill + 卡片网格 */}
        <section className={cx('flex', 'flex-col', 'flex-1', styles.main)}>
          <header className={styles.header}>
            {resourceType === 'knowledge' ? (
              // 资料库=空间文档仓库，仅团队空间维度（repo 树接口 spaceId 必传），
              // 无数据源切换，仅展示静态标题
              <button type="button" className={styles['header-title']}>
                {t('PC.Components.CapabilityModal.menuKnowledge')}
              </button>
            ) : (
              <div className={styles.tabs} role="tablist">
                {(['system', 'team'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={source === key}
                    className={cx(styles.tab, {
                      [styles['tab-active']]: source === key,
                    })}
                    onClick={() => handleSourceChange(key)}
                  >
                    {t(
                      key === 'system'
                        ? 'PC.Components.CapabilityModal.mainTabSystem'
                        : 'PC.Components.CapabilityModal.mainTabTeam',
                    )}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className={styles['close-btn']}
              aria-label={t('PC.Components.CapabilityModal.close')}
              onClick={onClose}
            >
              <CloseOutlined />
            </button>
          </header>

          <div className={styles.toolbar}>
            <div className={styles.categories}>
              {categories.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={item.key === category}
                  className={cx(styles['category-pill'], {
                    [styles['category-pill-active']]: item.key === category,
                  })}
                  onClick={() => setCategory(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className={styles.search}>
              {searchOpen ? (
                <Input
                  ref={searchInputRef}
                  className={styles['search-input']}
                  allowClear
                  size="small"
                  prefix={<SearchOutlined />}
                  placeholder={t(
                    'PC.Components.CapabilityModal.searchPlaceholder',
                  )}
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  onBlur={() => {
                    if (!keywordInput) setSearchOpen(false);
                  }}
                />
              ) : (
                <button
                  type="button"
                  aria-label={t(
                    'PC.Components.CapabilityModal.searchPlaceholder',
                  )}
                  className={styles['search-btn']}
                  onClick={() => setSearchOpen(true)}
                >
                  <SearchOutlined />
                </button>
              )}
            </div>
          </div>

          {/* 滚动容器常驻（三态在容器内切换）：避免加载完成时 Spin/网格互换 DOM 造成整屏闪跳 */}
          <div
            ref={listRef}
            role="listbox"
            aria-activedescendant={`capability-option-${focusIndex}`}
            className={cx('flex-1', styles.list, {
              [styles['list-knowledge']]: resourceType === 'knowledge',
            })}
            onScroll={handleListScroll}
          >
            {initialLoading ? (
              <div
                className={cx(
                  'flex',
                  'items-center',
                  'content-center',
                  styles['list-state'],
                )}
              >
                <Spin size="large" />
              </div>
            ) : displayList.length === 0 ? (
              <div
                className={cx(
                  'flex',
                  'items-center',
                  'content-center',
                  styles['list-state'],
                )}
              >
                <Empty
                  description={t(
                    error
                      ? 'PC.Components.CapabilityModal.loadFailed'
                      : 'PC.Common.Global.emptyData',
                  )}
                />
              </div>
            ) : (
              <>
                {displayList.map((item, index) => (
                  <CapabilityCard
                    key={item.key}
                    item={item}
                    index={index}
                    focused={index === focusIndex}
                    pinned={pinnedKeys.includes(item.key)}
                    onSelect={handleSelect}
                    onHover={setFocusIndex}
                    onTogglePin={handleTogglePin}
                    onConnectorConnect={onConnectorConnect}
                    onConnectorDisconnect={onConnectorDisconnect}
                    connectorBusyKeys={connectorBusyKeys}
                  />
                ))}
                {loading && (
                  <div
                    className={cx(
                      'flex',
                      'items-center',
                      'content-center',
                      styles['list-loading'],
                    )}
                  >
                    {t('PC.Components.CapabilityModal.loading')}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* 凭据型连接器连接弹窗（oauth2 走授权窗口，不经过这里） */}
      <ConnectorConnectModal
        open={!!connectCtx}
        record={connectCtx?.record ?? null}
        fields={connectCtx?.fields ?? []}
        spaceId={source === 'team' ? spaceId : undefined}
        onClose={closeConnectModal}
        onConnected={handleConnected}
      />
    </Modal>
  );
};

export default CapabilityModal;
