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
      searchText: externalSearchText,
      selectedIndex: externalSelectedIndex,
      onSelectedIndexChange,
      onHeightChange,
    },
    ref,
  ) => {
    // ==================== State ====================
    /** 当前激活的 Tab */
    const [activeTab, setActiveTab] = useState<TabType>('all');
    /** 内部选中索引（当外部未控制时使用） */
    const [internalSelectedIndex, setInternalSelectedIndex] =
      useState<number>(0);
    /** 各 Tab 对应的分页数据 */
    const [tabDataMap, setTabDataMap] = useState<Record<TabType, TabDataState>>(
      createTabDataState(),
    );

    // ==================== Refs ====================
    /** 弹窗容器引用，用于滚动控制 */
    const containerRef = useRef<HTMLDivElement>(null);
    /** 列表容器引用，用于滚动加载下一页 */
    const listRef = useRef<HTMLDivElement>(null);

    // ==================== 计算属性 ====================
    /** 搜索文本（由外部通过 @ 后输入的内容控制） */
    const searchText = externalSearchText ?? '';
    /** 防抖后的搜索文本，仅用于请求和本地筛选 */
    const [debouncedSearchText, setDebouncedSearchText] =
      useState<string>(searchText);
    /** 选中索引（优先使用外部控制） */
    const selectedIndex = externalSelectedIndex ?? internalSelectedIndex;

    // ==================== 事件处理 ====================

    /**
     * 更新选中索引
     * 支持内部和外部控制两种模式
     */
    const updateSelectedIndex = useCallback(
      (index: number) => {
        if (onSelectedIndexChange) {
          onSelectedIndexChange(index);
        } else {
          setInternalSelectedIndex(index);
        }
      },
      [onSelectedIndexChange],
    );

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
     * 根据当前 Tab 和搜索文本过滤
     */
    const currentItems = useMemo(() => {
      return tabDataMap[activeTab].items;
    }, [activeTab, tabDataMap]);

    const activeTabData = useMemo(() => {
      return tabDataMap[activeTab];
    }, [activeTab, tabDataMap]);

    /**
     * 通用的 Tab 数据处理方法
     * 根据传入的原始记录数组和目标 Tab，完成映射、分页切片和状态更新
     */
    const handleTabDataResponse = useCallback(
      (
        tab: Exclude<TabType, 'all'>,
        page: number,
        records: SkillInfoForAt[],
      ) => {
        const startIndex = (page - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const pageItems = records.slice(startIndex, endIndex);

        updateTabDataState(tab, (prev) => ({
          ...prev,
          items: page === 1 ? pageItems : [...prev.items, ...pageItems],
          page,
          total: records.length,
          loading: false,
          initialized: true,
          hasMore: endIndex < records.length,
        }));
      },
      [updateTabDataState],
    );

    /**
     * 加载最近使用 Tab 的数据
     * 使用 apiSkillRecentlyUsedListForAt 由接口根据关键字完成过滤，这里只做分页切片
     */
    const loadRecentTabData = useCallback(
      async (page: number) => {
        const response = await apiSkillRecentlyUsedListForAt({
          kw: debouncedSearchText,
          targetType: AgentComponentTypeEnum.Skill,
        });
        const records = (response?.data || []) as SkillInfoForAt[];

        handleTabDataResponse('recent', page, records);
      },
      [debouncedSearchText, handleTabDataResponse],
    );

    /**
     * 加载「我的收藏」 Tab 数据
     * 使用 apiSkillCollectListForAt 一次性返回全部数据，由接口根据关键字完成过滤，这里只做分页切片
     */
    const loadFavoriteTabData = useCallback(
      async (page: number) => {
        const response = await apiSkillCollectListForAt({
          kw: debouncedSearchText,
          targetType: AgentComponentTypeEnum.Skill,
        });
        const records = (response?.data || []) as SkillInfoForAt[];

        handleTabDataResponse('favorite', page, records);
      },
      [debouncedSearchText, handleTabDataResponse],
    );

    /**
     * 加载「全部」 Tab 数据
     * 使用 apiSkillListForAt 分页接口
     */
    const loadAllTabData = useCallback(
      async (page: number) => {
        const requestParams = {
          page,
          pageSize: PAGE_SIZE,
          kw: debouncedSearchText,
          targetType: AgentComponentTypeEnum.Skill,
        };

        const response = await apiSkillListForAt(requestParams);
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
        }));
      },
      [debouncedSearchText, updateTabDataState],
    );

    /**
     * 对外统一的 Tab 数据加载入口
     * 根据 Tab 类型分发到本地缓存或接口请求，并负责 loading/异常兜底
     */
    const loadTabData = useCallback(
      async (tab: TabType, page: number = 1) => {
        if (!visible) {
          return;
        }

        // 这里不再依赖外部的 tabDataMap，避免因 loading 状态变更导致的死循环请求
        updateTabDataState(tab, (prev) => ({
          ...prev,
          loading: true,
        }));

        try {
          if (tab === 'recent') {
            await loadRecentTabData(page);
          } else if (tab === 'favorite') {
            await loadFavoriteTabData(page);
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

    // ==================== Effects ====================

    /**
     * searchText 变化时做 500ms 防抖
     * 输入提示立即更新，但真正的数据重载延后触发，减少接口请求频率
     */
    useEffect(() => {
      if (!visible) {
        setDebouncedSearchText(searchText);
        return;
      }

      const timer = window.setTimeout(() => {
        setDebouncedSearchText(searchText);
      }, 500);

      return () => {
        window.clearTimeout(timer);
      };
    }, [searchText, visible]);

    /**
     * 弹窗显示时重置状态
     * 每次重新打开时都回到“全部 Tab + 第一项选中”的初始视图
     */
    useEffect(() => {
      if (visible) {
        setActiveTab('all');
        updateSelectedIndex(0);
        setTabDataMap(createTabDataState());
      }
    }, [visible, updateSelectedIndex]);

    /**
     * 当前 Tab 尚未初始化时才触发第一页加载
     * 避免同一个 Tab 在同一轮状态下重复请求
     */
    useEffect(() => {
      if (!visible) {
        return;
      }

      loadTabData(activeTab, 1);
    }, [activeTab, loadTabData, visible]);

    /**
     * 当弹窗可见且 Tab 或列表内容发生变化时，通知外部“高度可能改变”
     * 由外部统一重新计算弹窗与光标之间的位置关系
     */
    useEffect(() => {
      if (!visible || !containerRef.current) return;
      const height = containerRef.current.offsetHeight ?? 0;
      onHeightChange?.(height);
    }, [visible, currentItems.length]);

    /**
     * 切换 Tab 或搜索词后，将列表滚动条重置到顶部
     * 避免新结果仍停留在旧滚动位置，影响阅读
     */
    useEffect(() => {
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    }, [activeTab, debouncedSearchText]);

    /**
     * 当列表项数量变化时，确保选中索引不越界
     */
    useEffect(() => {
      if (selectedIndex >= currentItems.length && currentItems.length > 0) {
        updateSelectedIndex(currentItems.length - 1);
      }
    }, [currentItems.length, selectedIndex, updateSelectedIndex]);

    /**
     * 自动滚动到选中项
     */
    useEffect(() => {
      if (visible && containerRef.current) {
        const selectedEl = containerRef.current.querySelector(
          `.${styles['mention-item']}.${styles.selected}`,
        );
        if (selectedEl) {
          selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
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
        updateSelectedIndex(0);
      } else {
        updateSelectedIndex(selectedIndex - 1);
      }
    }, [selectedIndex, updateSelectedIndex]);

    /**
     * 向下移动选中项
     * 到达最后一项后循环到第一项
     */
    const handleArrowDown = useCallback(() => {
      if (selectedIndex >= currentItems.length - 1) {
        // 在列表最后一项，循环到第一项
        updateSelectedIndex(0);
      } else {
        // 向下移动
        updateSelectedIndex(selectedIndex + 1);
      }
    }, [selectedIndex, currentItems.length, updateSelectedIndex]);

    /**
     * 向左切换 Tab
     */
    const handleArrowLeft = useCallback(() => {
      const currentIndex = TABS.findIndex((tab) => tab.key === activeTab);
      const newIndex = currentIndex <= 0 ? TABS.length - 1 : currentIndex - 1;
      setActiveTab(TABS[newIndex].key);
      updateSelectedIndex(0);
    }, [activeTab, updateSelectedIndex]);

    /**
     * 向右切换 Tab
     */
    const handleArrowRight = useCallback(() => {
      const currentIndex = TABS.findIndex((tab) => tab.key === activeTab);
      const newIndex = currentIndex >= TABS.length - 1 ? 0 : currentIndex + 1;
      setActiveTab(TABS[newIndex].key);
      updateSelectedIndex(0);
    }, [activeTab, updateSelectedIndex]);

    /**
     * 重置选中索引为 0
     */
    const resetSelectedIndex = useCallback(() => {
      updateSelectedIndex(0);
    }, [updateSelectedIndex]);

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
     * 处理 Tab 切换（点击时）
     */
    const handleTabChange = useCallback(
      (tab: TabType) => {
        setActiveTab(tab);
        updateSelectedIndex(0);
        if (listRef.current) {
          listRef.current.scrollTop = 0;
        }
      },
      [updateSelectedIndex],
    );

    /**
     * 鼠标在列表项上移动时同步选中项
     * 使用 onMouseMove 而不是 onMouseEnter，可减少键盘导航过程中被 hover 抢状态的问题
     */
    const handleItemMouseMove = useCallback(
      (index: number) => {
        if (selectedIndex !== index) {
          updateSelectedIndex(index);
        }
      },
      [selectedIndex, updateSelectedIndex],
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
        updateSelectedIndex,
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
        className={styles['mention-popup']}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
        }}
        onMouseDown={(e) => {
          // 阻止点击弹窗内容时让编辑器失焦，否则会触发外层 blur 关闭弹窗
          e.preventDefault();
        }}
        onKeyDown={handleKeyDown}
      >
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

        {/* 搜索提示（显示当前搜索关键词，来自 @ 后输入的文本） */}
        {searchText && (
          <div className={styles['mention-search-hint']}>
            搜索: {searchText}
          </div>
        )}

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
          {activeTabData.loading && currentItems.length > 0 && (
            <div className={styles['mention-empty']}>加载更多中...</div>
          )}
        </div>
      </div>
    );
  },
);

export default MentionPopup;
