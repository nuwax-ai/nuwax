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

import { collectList, getList } from '@/services/created';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { SkillInfo } from '@/types/interfaces/library';
import type { Page } from '@/types/interfaces/request';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './index.less';
import type {
  MentionItem,
  MentionPopupHandle,
  MentionPopupProps,
  TabConfig,
  TabType,
} from './types';

/**
 * Tab 配置列表
 * 定义弹窗顶部的标签页
 */
const TABS: TabConfig[] = [
  { key: 'all', label: '全部' },
  { key: 'recent', label: '最近使用' },
  { key: 'favorite', label: '我的收藏' },
  { key: 'installed', label: '已安装' },
];

/** 单个 Tab 每次请求或分页追加的数量 */
const PAGE_SIZE = 6;
/** 最近使用提及项的本地缓存键 */
const RECENT_ITEMS_STORAGE_KEY = 'home_mention_popup_recent_items';

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
  installed: {
    items: [],
    page: 1,
    total: 0,
    loading: false,
    initialized: false,
    hasMore: true,
  },
});

/**
 * 将后端技能数据映射成 MentionPopup 内部统一使用的展示结构
 * 这样列表渲染层无需关心接口字段差异
 */
const mapSkillToMentionItem = (
  skill: Partial<SkillInfo> & Record<string, any>,
): MentionItem => ({
  id: skill.id ?? skill.targetId ?? '',
  name: skill.name ?? skill.targetName ?? '未命名',
  avatar: skill.icon || skill.targetIcon,
  description: skill.description ?? '',
  category: 'skill',
  type: 'skill',
});

/**
 * 兼容分页接口和数组返回两种数据格式
 * 某些本地数据或老接口可能直接返回数组
 */
const getResponsePageData = (
  data: Page<any> | any[] | undefined,
): { records: any[]; total: number } => {
  if (Array.isArray(data)) {
    return {
      records: data,
      total: data.length,
    };
  }

  return {
    records: data?.records ?? [],
    total: data?.total ?? 0,
  };
};

/**
 * 读取最近使用的提及项缓存
 * 最近使用 Tab 只依赖本地缓存，不走远端接口
 */
const getRecentMentionItems = (): MentionItem[] => {
  try {
    const cached = localStorage.getItem(RECENT_ITEMS_STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('读取最近使用 mention 失败:', error);
    return [];
  }
};

/**
 * 保存最近选择过的提及项
 * 通过去重 + 头插的方式保证最近使用列表始终按最新操作排序
 */
const saveRecentMentionItem = (item: MentionItem) => {
  try {
    const currentItems = getRecentMentionItems();
    const deduplicatedItems = currentItems.filter(
      (currentItem) => String(currentItem.id) !== String(item.id),
    );
    const nextItems = [item, ...deduplicatedItems].slice(0, 50);
    localStorage.setItem(RECENT_ITEMS_STORAGE_KEY, JSON.stringify(nextItems));
  } catch (error) {
    console.error('保存最近使用 mention 失败:', error);
  }
};

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
     * 加载最近使用 Tab 的数据
     * 数据来自 localStorage，并在前端完成搜索过滤和分页切片
     */
    const loadRecentTabData = useCallback(
      async (page: number) => {
        const cachedRecentItems = getRecentMentionItems();
        const mergedRecentItems = cachedRecentItems;

        const filteredItems = debouncedSearchText
          ? mergedRecentItems.filter(
              (item) =>
                item.name
                  .toLowerCase()
                  .includes(debouncedSearchText.toLowerCase()) ||
                item.description
                  ?.toLowerCase()
                  .includes(debouncedSearchText.toLowerCase()),
            )
          : mergedRecentItems;

        const startIndex = (page - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const pageItems = filteredItems.slice(startIndex, endIndex);

        updateTabDataState('recent', (prev) => ({
          ...prev,
          items: page === 1 ? pageItems : [...prev.items, ...pageItems],
          page,
          total: filteredItems.length,
          loading: false,
          initialized: true,
          hasMore: endIndex < filteredItems.length,
        }));
      },
      [debouncedSearchText, updateTabDataState],
    );

    /**
     * 加载远端 Tab 数据
     * - all: 全部技能
     * - favorite: 收藏技能
     * - installed: 已安装技能
     */
    const loadApiTabData = useCallback(
      async (tab: Exclude<TabType, 'recent'>, page: number) => {
        const requestParams = {
          page,
          pageSize: PAGE_SIZE,
          kw: debouncedSearchText || undefined,
        };

        let response;
        if (tab === 'favorite') {
          response = await collectList('skill', requestParams);
        } else if (tab === 'installed') {
          response = await getList(AgentComponentTypeEnum.Skill, {
            ...requestParams,
            justReturnSpaceData: true,
          });
        } else {
          response = await getList(AgentComponentTypeEnum.Skill, requestParams);
        }

        const { records, total } = getResponsePageData(response?.data);
        const mappedItems = records.map((record) =>
          mapSkillToMentionItem(record),
        );
        const fallbackItems =
          page === 1 && mappedItems.length === 0
            ? tab === 'favorite'
              ? []
              : []
            : [];
        const nextItems = mappedItems.length > 0 ? mappedItems : fallbackItems;

        updateTabDataState(tab, (prev) => ({
          ...prev,
          items: page === 1 ? nextItems : [...prev.items, ...nextItems],
          page,
          total: total || nextItems.length,
          loading: false,
          initialized: true,
          hasMore:
            total > 0
              ? page * PAGE_SIZE < total
              : nextItems.length >= PAGE_SIZE,
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
        if (!visible || tabDataMap[tab].loading) {
          return;
        }

        updateTabDataState(tab, (prev) => ({
          ...prev,
          loading: true,
        }));

        try {
          if (tab === 'recent') {
            await loadRecentTabData(page);
          } else {
            await loadApiTabData(tab, page);
          }
        } catch (error) {
          console.error(`加载 MentionPopup ${tab} 数据失败:`, error);
          updateTabDataState(tab, (prev) => ({
            ...prev,
            loading: false,
            initialized: true,
            hasMore: false,
            items:
              page === 1
                ? tab === 'favorite'
                  ? []
                  : tab === 'recent'
                  ? []
                  : []
                : prev.items,
            total:
              page === 1
                ? tab === 'favorite'
                  ? 0
                  : tab === 'recent'
                  ? 0
                  : 0
                : prev.total,
          }));
        }
      },
      [
        loadApiTabData,
        loadRecentTabData,
        tabDataMap,
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
     * 当防抖后的搜索词变化时，重置所有 Tab 的分页状态
     * 这样当前 Tab 会重新从第一页发起查询
     */
    useEffect(() => {
      if (!visible) {
        return;
      }

      setTabDataMap(createTabDataState());
    }, [debouncedSearchText, visible]);

    /**
     * 当前 Tab 尚未初始化时才触发第一页加载
     * 避免同一个 Tab 在同一轮状态下重复请求
     */
    useEffect(() => {
      if (!visible) {
        return;
      }

      if (
        !tabDataMap[activeTab].initialized &&
        !tabDataMap[activeTab].loading
      ) {
        loadTabData(activeTab, 1);
      }
    }, [activeTab, loadTabData, tabDataMap, visible]);

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
        saveRecentMentionItem(item);
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
     * 处理列表项点击
     */
    const handleItemClick = useCallback(
      (item: MentionItem) => {
        saveRecentMentionItem(item);
        onSelect(item);
      },
      [onSelect],
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
            // 列表项渲染
            currentItems.map((item, index) => (
              <div
                key={item.id}
                className={`${styles['mention-item']} ${
                  index === selectedIndex ? styles.selected : ''
                }`}
                onClick={() => handleItemClick(item)}
                onMouseMove={() => handleItemMouseMove(index)}
              >
                {/* 图标 */}
                <span className={styles['mention-item-icon']}>
                  {item.avatar &&
                  (/^(https?:)?\/\//.test(item.avatar) ||
                    item.avatar.startsWith('/')) ? (
                    <img src={item.avatar} alt={item.name} />
                  ) : (
                    item.icon || item.avatar
                  )}
                </span>
                {/* 名称 */}
                <span className={styles['mention-item-name']}>{item.name}</span>
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

MentionPopup.displayName = 'MentionPopup';

export default MentionPopup;
