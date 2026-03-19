/**
 * MentionPopup 组件
 *
 * @description
 * @ 提及功能的弹窗选择器组件
 * 用于显示可选择的提及项列表
 *
 * @features
 * - 支持三个 Tab 切换：全部、最近使用、我的收藏
 * - 支持搜索过滤（通过 @ 后输入的文本进行过滤，按名称和描述匹配）
 * - 支持键盘导航（上下箭头、回车选择、ESC 关闭）
 * - 支持鼠标悬停和点击选择
 * - 自动滚动到选中项
 *
 * @example
 * ```tsx
 * <MentionPopup
 *   visible={showPopup}
 *   position={{ top: 100, left: 200 }}
 *   searchText="PPT"  // @ 后输入的文本作为搜索关键词
 *   onSelect={(item) => console.log('Selected:', item)}
 *   onClose={() => setShowPopup(false)}
 * />
 * ```
 */

import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { Page } from '@/types/interfaces/request';
import { SearchOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Input, type InputRef } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  apiSkillCollectListForAt,
  apiSkillListForAt,
  apiSkillRecentlyUsedListForAt,
} from './atSkill';
import styles from './index.less';
import type {
  MentionItem,
  MentionPopupHandle,
  MentionPopupProps,
  SkillInfoForAt,
  TabConfig,
  TabType,
} from './types';

const cx = classNames.bind(styles);

/**
 * Tab 配置列表
 * 定义弹窗顶部的标签页
 * 默认优先展示「最近使用」，将「全部」放在最后
 */
const TABS: TabConfig[] = [
  { key: 'all', label: '全部' },
  { key: 'recent', label: '最近使用' },
  { key: 'favorite', label: '我的收藏' },
];

/** 单个 Tab 每次请求或分页追加的数量 */
const PAGE_SIZE = 6;
/**
 * 单个 Tab 的列表状态
 * 用于管理分页数据、首次加载状态和滚动加载状态
 */
interface TabDataState {
  items: MentionItem[];
  page: number;
  total: number;
  loading: boolean;
  initialized: boolean;
  hasMore: boolean;
  /** 「全部」Tab 当前数据是用哪个 searchText 加载的，用于切回全部时判断是否需要按最新关键字重新加载 */
  loadedWithSearchText?: string;
}

/**
 * 创建所有 Tab 的初始状态
 * 每次打开弹窗、切换搜索词后都会重置到这份结构
 */
const createTabDataState = (): Record<TabType, TabDataState> => ({
  all: {
    items: [],
    page: 1,
    total: 0,
    loading: false,
    initialized: false,
    hasMore: true,
  },
  recent: {
    items: [],
    page: 1,
    total: 0,
    loading: false,
    initialized: false,
    hasMore: true,
  },
  favorite: {
    items: [],
    page: 1,
    total: 0,
    loading: false,
    initialized: false,
    hasMore: true,
  },
});

/**
 * MentionPopup 主组件
 * 使用 forwardRef 暴露组件方法给父组件（MentionEditor）
 */
const MentionPopup = React.forwardRef<MentionPopupHandle, MentionPopupProps>(
  (
    {
      visible,
      position,
      onSelect,
      onClose,
      searchText,
      maxHeight,
      onHeightChange,
      showSearchInput = false,
    },
    ref,
  ) => {
    // ==================== State ====================
    /** 当前激活的 Tab */
    const [activeTab, setActiveTab] = useState<TabType>('all');
    /** 弹窗内搜索输入框的值（仅当 showSearchInput 为 true 时使用） */
    const [searchInputValue, setSearchInputValue] = useState<string>('');
    /** 实际参与搜索的关键字：显示内置搜索框时用输入框值，否则用外部 searchText */
    const effectiveSearchText = showSearchInput
      ? searchInputValue
      : searchText ?? '';
    /** 当前选中项索引（仅内部状态） */
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    /** 各 Tab 对应的分页数据 */
    const [tabDataMap, setTabDataMap] = useState<Record<TabType, TabDataState>>(
      createTabDataState(),
    );

    // ==================== Refs ====================
    /** 弹窗容器引用，用于滚动控制 */
    const containerRef = useRef<HTMLDivElement>(null);
    /** 列表容器引用，用于滚动加载下一页 */
    const listRef = useRef<HTMLDivElement>(null);
    /** 是否已在本次弹窗打开时执行过首次加载（只加载当前 Tab 第一页） */
    const hasInitTabsRef = useRef<boolean>(false);
    /** 上一次已用于请求的搜索关键字，关键字变化时仅刷新当前 Tab */
    const lastSearchTextRef = useRef<string>('');
    /** 在最后一项按向下键触发加载更多后，待加载完成时要选中的索引（新一页的第一项） */
    const pendingSelectIndexAfterLoadRef = useRef<number | null>(null);
    /** 弹窗内搜索输入框引用（showSearchInput 时打开弹窗自动聚焦） */
    const searchInputRef = useRef<InputRef>(null);

    // ==================== 事件处理 ====================

    const updateTabDataState = useCallback(
      (tab: TabType, updater: (prev: TabDataState) => TabDataState) => {
        setTabDataMap((prev) => ({
          ...prev,
          [tab]: updater(prev[tab]),
        }));
      },
      [],
    );

    /**
     * 获取当前需要渲染的列表项
     * 这里已经是按 Tab、分页、搜索处理后的最终结果
     */
    /**
     * 计算当前显示的列表项
     * - All Tab：直接使用接口返回的列表（后端搜索）
     * - 最近使用 / 我的收藏：仅做本地过滤，不因 searchText 请求后端
     */
    const currentItems = useMemo(() => {
      const items = tabDataMap[activeTab].items;
      if (activeTab === 'all') return items;
      const kw = (effectiveSearchText ?? '').trim().toLowerCase();
      if (!kw) return items;
      return items.filter(
        (item) =>
          item.name.toLowerCase().includes(kw) ||
          (item.description?.toLowerCase().includes(kw) ?? false),
      );
    }, [activeTab, tabDataMap, effectiveSearchText]);

    const activeTabData = useMemo(() => {
      return tabDataMap[activeTab];
    }, [activeTab, tabDataMap]);

    /**
     * 最近使用 / 我的收藏 Tab 的数据处理方法
     * 不做分页，直接使用接口返回的全部数据渲染
     */
    const handleTabDataResponse = useCallback(
      (tab: Exclude<TabType, 'all'>, records: SkillInfoForAt[]) => {
        updateTabDataState(tab, (prev) => ({
          ...prev,
          items: records,
          page: 1,
          total: records.length,
          loading: false,
          initialized: true,
          hasMore: false,
        }));
      },
      [updateTabDataState],
    );

    // 加载「最近使用」数据
    const { runAsync: runRecentTabData } = useRequest(
      apiSkillRecentlyUsedListForAt,
      {
        manual: true,
        debounceWait: 300,
      },
    );

    // 加载「我的收藏」数据
    const { runAsync: runFavoriteTabData } = useRequest(
      apiSkillCollectListForAt,
      {
        manual: true,
        debounceWait: 300,
      },
    );

    // 加载「全部」数据
    const { runAsync: runAllTabData } = useRequest(apiSkillListForAt, {
      manual: true,
      debounceWait: 300,
    });

    /**
     * 加载最近使用 Tab 的数据
     * 一次性拉取全部，不分页，直接全部渲染
     */
    const loadRecentTabData = useCallback(async () => {
      const response = await runRecentTabData({
        targetType: AgentComponentTypeEnum.Skill,
      });
      const records = (response?.data || []) as SkillInfoForAt[];

      handleTabDataResponse('recent', records);
    }, [handleTabDataResponse]);

    /**
     * 加载「我的收藏」 Tab 数据
     * 一次性拉取全部，不分页，直接全部渲染
     */
    const loadFavoriteTabData = useCallback(async () => {
      const response = await runFavoriteTabData({
        targetType: AgentComponentTypeEnum.Skill,
      });
      const records = (response?.data || []) as SkillInfoForAt[];

      handleTabDataResponse('favorite', records);
    }, [handleTabDataResponse]);

    /**
     * 加载「全部」 Tab 数据
     * 使用 apiSkillListForAt 分页接口
     */
    const loadAllTabData = useCallback(
      async (page: number) => {
        const requestParams = {
          page,
          pageSize: PAGE_SIZE,
          kw: effectiveSearchText,
          targetType: AgentComponentTypeEnum.Skill,
        };

        const response = await runAllTabData(requestParams);
        const pageData = (response?.data || {}) as Page<SkillInfoForAt>;
        const records = pageData.records || [];
        const total = pageData.total || records.length;

        updateTabDataState('all', (prev) => ({
          ...prev,
          items: page === 1 ? records : [...prev.items, ...records],
          page,
          total,
          loading: false,
          initialized: true,
          hasMore:
            total > 0 ? page * PAGE_SIZE < total : records.length >= PAGE_SIZE,
          loadedWithSearchText: effectiveSearchText ?? '',
        }));
      },
      [effectiveSearchText, updateTabDataState],
    );

    /**
     * 对外统一的 Tab 数据加载入口
     * 根据 Tab 类型分发到本地缓存或接口请求，并负责 loading/异常兜底
     */
    const loadTabData = useCallback(
      async (tab: TabType, page: number = 1) => {
        if (!visible) return;

        updateTabDataState(tab, (prev) => ({
          ...prev,
          loading: true,
        }));

        try {
          if (tab === 'recent') {
            await loadRecentTabData();
          } else if (tab === 'favorite') {
            await loadFavoriteTabData();
          } else {
            await loadAllTabData(page);
          }
        } catch (error) {
          console.error(`加载 MentionPopup ${tab} 数据失败:`, error);
          updateTabDataState(tab, (prev) => ({
            ...prev,
            loading: false,
            initialized: true,
            hasMore: false,
            items: page === 1 ? [] : prev.items,
            total: page === 1 ? 0 : prev.total,
          }));
        }
      },
      [
        loadAllTabData,
        loadFavoriteTabData,
        loadRecentTabData,
        updateTabDataState,
        visible,
      ],
    );

    /**
     * 处理 Tab 切换（点击时）
     *
     * 行为：
     * - 总是切换激活 Tab，并重置选中项与滚动位置
     * - 以下情况会加载：目标 Tab 未初始化，或切回「全部」时当前关键字与当时加载用的不一致（在非全部 Tab 下改过关键字后切回全部需按最新关键字重载）
     */
    const handleTabChange = useCallback(
      (tab: TabType) => {
        setActiveTab(tab);
        setSelectedIndex(0);
        if (listRef.current) {
          listRef.current.scrollTop = 0;
        }

        const tabState = tabDataMap[tab];
        const currentSearch = effectiveSearchText ?? '';
        const needLoad =
          !tabState ||
          !tabState.initialized ||
          (tab === 'all' && tabState.loadedWithSearchText !== currentSearch);
        if (needLoad) {
          loadTabData(tab, 1);
        }
      },
      [loadTabData, tabDataMap, effectiveSearchText],
    );

    // ==================== Effects ====================
    /**
     * 弹窗显示时重置状态
     * 每次重新打开时都回到“最近使用 Tab + 第一项选中”的初始视图
     */
    useEffect(() => {
      return () => {
        setActiveTab('all');
        setSelectedIndex(0);
        setTabDataMap(createTabDataState());
        setSearchInputValue('');
        /**
         * 弹窗关闭时重置首次加载标记与搜索关键字标记
         */
        hasInitTabsRef.current = false;
        lastSearchTextRef.current = '';
      };
    }, [visible]);

    /**
     * 弹窗首次打开时，只加载当前 Tab 的第一页数据（仅执行一次，不轮询其他 Tab）
     */
    useEffect(() => {
      if (!visible || hasInitTabsRef.current) return;

      hasInitTabsRef.current = true;
      lastSearchTextRef.current = effectiveSearchText ?? '';
      loadTabData(activeTab, 1);
    }, [activeTab, loadTabData, visible, effectiveSearchText]);

    /**
     * 弹窗已打开后：搜索关键字变化时
     * - 当前为 All Tab：请求后端搜索（刷新当前 Tab 第一页）
     * - 当前为最近使用 / 我的收藏：不请求后端，仅依赖 currentItems 的本地过滤
     */
    useEffect(() => {
      if (!visible || !hasInitTabsRef.current) return;
      const currentSearch = effectiveSearchText ?? '';
      if (currentSearch === lastSearchTextRef.current) return;
      lastSearchTextRef.current = currentSearch;
      loadTabData(activeTab, 1);
    }, [visible, effectiveSearchText, activeTab, loadTabData]);

    /**
     * 使用 ResizeObserver 在弹窗实际尺寸变化时上报高度，确保父组件用真实渲染高度重算位置，
     * 避免切换 Tab 后弹窗变高但位置未更新导致弹窗底边超出光标
     */
    useEffect(() => {
      if (!visible || !onHeightChange || !containerRef.current) return;
      const el = containerRef.current;

      const reportHeight = () => {
        const height = el.offsetHeight ?? 0;
        if (height > 0) onHeightChange(height);
      };

      reportHeight();
      const observer = new ResizeObserver(() => reportHeight());
      observer.observe(el);
      return () => observer.disconnect();
    }, [visible, onHeightChange]);

    /**
     * showSearchInput 时，打开弹窗后自动聚焦搜索输入框
     */
    useEffect(() => {
      if (!visible || !showSearchInput) return;
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }, [visible, showSearchInput]);

    /**
     * 切换 Tab 或搜索词后，将列表滚动条重置到顶部，并清除「加载更多后待选中」的标记
     */
    useEffect(() => {
      pendingSelectIndexAfterLoadRef.current = null;
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    }, [activeTab, effectiveSearchText]);

    /**
     * 当列表项数量变化时，确保选中索引不越界；
     * 若存在「按向下键触发的加载更多」待选中的索引，则选中该索引（新一页的第一项）
     */
    useEffect(() => {
      const pending = pendingSelectIndexAfterLoadRef.current;
      if (pending !== null && currentItems.length > pending) {
        pendingSelectIndexAfterLoadRef.current = null;
        setSelectedIndex(pending);
        return;
      }
      if (selectedIndex >= currentItems.length && currentItems.length > 0) {
        setSelectedIndex(currentItems.length - 1);
      }
    }, [currentItems.length, selectedIndex]);

    /**
     * 自动滚动到选中项
     */
    useEffect(() => {
      if (!visible || !containerRef.current) return;

      const container = containerRef.current;
      const selectedEl = container.querySelector(
        `.${styles['mention-item']}.${styles.selected}`,
      ) as HTMLElement | null;

      if (!selectedEl) return;

      const containerRect = container.getBoundingClientRect();
      const elRect = selectedEl.getBoundingClientRect();

      // 仅当选中项完全跑出可视区域时，才进行滚动，且使用 behavior: 'auto' 避免连续平滑滚动叠加
      const isAbove = elRect.top < containerRect.top;
      const isBelow = elRect.bottom > containerRect.bottom;

      if (isAbove || isBelow) {
        selectedEl.scrollIntoView({ behavior: 'auto', block: 'nearest' });
      }
    }, [selectedIndex, visible]);

    // ==================== 暴露给父组件的方法 ====================

    /**
     * 选择当前选中的项
     */
    const handleSelectCurrentItem = useCallback(() => {
      const item = currentItems[selectedIndex];
      if (item) {
        onSelect(item);
      }
    }, [currentItems, selectedIndex, onSelect]);

    /**
     * 向上移动选中项
     * 到达第一项后停止，不再切换到顶部 Tab
     */
    const handleArrowUp = useCallback(() => {
      if (selectedIndex <= 0) {
        setSelectedIndex(0);
      } else {
        setSelectedIndex(selectedIndex - 1);
      }
    }, [selectedIndex]);

    /**
     * 向下移动选中项
     *
     * 行为说明：
     * - 不是最后一项时：正常向下移动一项
     * - 在最后一项且还有更多分页时：
     *   - 记录「加载完成后要选中的索引」为当前列表长度（新一页的第一项）
     *   - 如果当前未在加载，则主动触发加载下一页
     *   - 保持当前仍选中最后一项，等待数据回来后自动跳到新一页第一项
     * - 在最后一项且没有更多分页时：循环到第一项
     */
    const handleArrowDown = useCallback(() => {
      if (selectedIndex < currentItems.length - 1) {
        setSelectedIndex(selectedIndex + 1);
        return;
      }

      // 已在最后一项
      if (activeTabData.hasMore) {
        // 标记：加载完成后自动选中新一页第一项
        pendingSelectIndexAfterLoadRef.current = currentItems.length;
        // 如果当前不在加载中，则由这里触发下一页加载；
        // 若已经在加载（例如滚动触发了加载更多），则只需等待加载完成即可
        if (!activeTabData.loading) {
          loadTabData(activeTab, activeTabData.page + 1);
        }
        return;
      }

      // 没有更多分页，循环回到第一项
      setSelectedIndex(0);
    }, [
      selectedIndex,
      currentItems.length,
      activeTab,
      activeTabData,
      loadTabData,
    ]);

    /**
     * 向左切换 Tab
     */
    const handleArrowLeft = useCallback(() => {
      const currentIndex = TABS.findIndex((tab) => tab.key === activeTab);
      const newIndex = currentIndex <= 0 ? TABS.length - 1 : currentIndex - 1;
      handleTabChange(TABS[newIndex].key);
    }, [activeTab, handleTabChange]);

    /**
     * 向右切换 Tab
     */
    const handleArrowRight = useCallback(() => {
      const currentIndex = TABS.findIndex((tab) => tab.key === activeTab);
      const newIndex = currentIndex >= TABS.length - 1 ? 0 : currentIndex + 1;
      handleTabChange(TABS[newIndex].key);
    }, [activeTab, handleTabChange]);

    /**
     * 重置选中索引为 0
     */
    const resetSelectedIndex = useCallback(() => {
      setSelectedIndex(0);
    }, []);

    // 通过 useImperativeHandle 暴露方法
    useImperativeHandle(ref, () => ({
      handleSelectCurrentItem,
      handleArrowUp,
      handleArrowDown,
      handleArrowLeft,
      handleArrowRight,
      resetSelectedIndex,
    }));

    // ==================== 内部事件处理 ====================

    /**
     * 鼠标在列表项上移动时同步选中项
     * 使用 onMouseMove 而不是 onMouseEnter，可减少键盘导航过程中被 hover 抢状态的问题
     */
    const handleItemMouseMove = useCallback(
      (index: number) => {
        if (selectedIndex !== index) {
          setSelectedIndex(index);
        }
      },
      [selectedIndex],
    );

    /**
     * 监听列表滚动，接近底部时自动加载下一页
     * 仅对当前 Tab 生效，且会跳过空列表、加载中和无更多数据的情况
     */
    const handleListScroll = useCallback(
      (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 48;

        if (
          !isNearBottom ||
          activeTabData.loading ||
          !activeTabData.hasMore ||
          currentItems.length === 0
        ) {
          return;
        }

        loadTabData(activeTab, activeTabData.page + 1);
      },
      [activeTab, activeTabData, currentItems.length, loadTabData],
    );

    /**
     * 处理弹窗内的键盘事件
     * 支持 Tab 栏和列表项的键盘导航
     */
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            handleArrowUp();
            break;
          case 'ArrowDown':
            e.preventDefault();
            handleArrowDown();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            handleArrowLeft();
            break;
          case 'ArrowRight':
            e.preventDefault();
            handleArrowRight();
            break;
          case 'Enter':
            e.preventDefault();
            handleSelectCurrentItem();
            break;
          case 'Escape':
            e.preventDefault();
            onClose();
            break;
        }
      },
      [
        handleArrowUp,
        handleArrowDown,
        handleArrowLeft,
        handleArrowRight,
        handleSelectCurrentItem,
        onClose,
      ],
    );

    // ==================== Render ====================

    // 不可见时不渲染
    if (!visible) {
      return null;
    }

    return (
      <div
        ref={containerRef}
        data-mention-popup
        className={styles['mention-popup']}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          ...(!!maxHeight && { maxHeight }),
        }}
        onMouseDown={(e) => {
          // 点击搜索区域（含清除图标）时不阻止默认行为，否则清除按钮无法响应
          if ((e.target as HTMLElement).closest?.('[data-mention-search]'))
            return;
          // 阻止点击弹窗其余内容时让编辑器失焦
          e.preventDefault();
        }}
        onKeyDown={handleKeyDown}
      >
        {/* 搜索输入框（由 showSearchInput 控制，置于 Tabs 上方；data-mention-search 便于点击清除图标时不触发容器 preventDefault） */}
        {showSearchInput && (
          <div className={styles['mention-search-wrap']} data-mention-search>
            <Input
              ref={searchInputRef}
              className={styles['mention-search-input']}
              placeholder="搜索技能"
              allowClear
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
                  e.stopPropagation();
                }
              }}
              prefix={
                <SearchOutlined className={styles['mention-search-icon']} />
              }
              variant="borderless"
            />
          </div>
        )}

        {/* Tab 标签栏 */}
        <div className={styles['mention-tabs']}>
          {TABS.map((tab) => (
            <div
              key={tab.key}
              className={`${styles['mention-tab']} ${
                activeTab === tab.key ? styles.active : ''
              }`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* 列表项 */}
        <div
          ref={listRef}
          className={styles['mention-list']}
          onScroll={handleListScroll}
        >
          {activeTabData.loading && currentItems.length === 0 ? (
            <div className={styles['mention-empty']}>加载中...</div>
          ) : currentItems.length === 0 ? (
            // 空状态
            <div className={styles['mention-empty']}>
              {activeTab === 'favorite' ? '暂无收藏' : '未找到匹配项'}
            </div>
          ) : (
            // 列表项渲染，直接使用接口返回的 SkillInfoForAt 结构
            currentItems.map((item: MentionItem, index) => (
              <div
                key={item.id}
                className={`${styles['mention-item']} overflow-hide ${
                  index === selectedIndex ? styles.selected : ''
                }`}
                onClick={() => onSelect(item)}
                onMouseMove={() => handleItemMouseMove(index)}
              >
                {/* 左侧图标 */}
                <span className={styles['mention-item-icon']}>
                  <img src={item.icon} alt={item.name} />
                </span>
                {/* 右侧名称 + 描述 */}
                <div className={styles['mention-item-content']}>
                  <div
                    className={cx(styles['mention-item-name'], 'text-ellipsis')}
                  >
                    {item.name}
                  </div>
                  {item.description && (
                    <div
                      className={cx(
                        styles['mention-item-desc'],
                        'text-ellipsis',
                      )}
                    >
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {activeTabData.loading &&
            activeTabData.page > 1 &&
            currentItems.length > 0 && (
              <div className={styles['mention-empty']}>加载更多中...</div>
            )}
        </div>
      </div>
    );
  },
);

export default MentionPopup;
