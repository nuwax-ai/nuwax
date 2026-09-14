/**
 * 女娲应用页面(一级菜单入口)
 * @description 应用分发页:最近使用(POST recentlyUsed/list 接口,点击进应用详情)+ 应用列表区
 * (主tab:系统应用/团队空间两维度共用 POST app/list,系统应用 scope=Tenant(本租户内)、
 * 团队空间 scope=Space,再经 official / justReturnSpaceData 区分,两 tab 均滚动触底分页追加;
 * 点击进应用详情 /agent/:id);「更多」跳广场-网页应用
 */
import agentImage from '@/assets/images/agent_image.png';
import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import { dict } from '@/services/i18nRuntime';
import {
  apiPublishedAppList,
  apiPublishedAppRecentlyUsedList,
  apiPublishedCategoryList,
} from '@/services/square';
import { apiSpaceList } from '@/services/workspace';
import type { Page } from '@/types/interfaces/request';
import type {
  SquareCategoryInfo,
  SquarePublishedItemInfo,
} from '@/types/interfaces/square';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Empty, Input, Segmented } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useRequest } from 'umi';
import AppCard from './components/AppCard';
import {
  APP_LIST_PAGE_SIZE,
  APP_LIST_TARGET_SUBTYPES,
  APP_LIST_TARGET_TYPES,
  APP_SCROLL_CONTAINER_ID,
  PAGE_APP_CATEGORY_ROOT_KEY,
  RECENT_COLLAPSED_MAX_ROWS,
  RECENT_GRID_GAP,
  RECENT_GRID_MIN_COLUMN,
  RECENT_USED_SIZE,
  SQUARE_PAGE_APP_PATH,
} from './constants';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 分类标签信息 */
interface CategoryTabInfo {
  key: string;
  label: string;
}

/** 固定首位的「全部」分类 key(空串即不限分类) */
const ALL_CATEGORY_KEY = '';

/** 应用列表区主 tab:系统应用 / 团队空间 */
type AppSourceEnum = 'system' | 'team';

/** 系统应用列表分页查询参数(runAppList 入参) */
interface AppListQuery {
  page: number;
  category: string;
  kw: string;
}

/** 团队空间列表分页查询参数(runSpaceAppList 入参;「全部」不传 spaceId,kw 搜索关键词) */
interface SpaceAppListQuery {
  page: number;
  spaceId?: number;
  kw: string;
}

const NuwaApps: React.FC = () => {
  // 应用列表区主 tab(默认系统应用)
  const [activeSource, setActiveSource] = useState<AppSourceEnum>('system');
  // 激活分类 key(空串=全部,系统应用 tab 用)
  const [activeCategory, setActiveCategory] =
    useState<string>(ALL_CATEGORY_KEY);
  // 激活空间 key(团队空间 tab 用,空串=「全部」不限空间,其余为空间 id)
  const [activeSpace, setActiveSpace] = useState<string>('');
  // 搜索关键词(两 tab 通用)
  const [keyword, setKeyword] = useState<string>('');
  // 分类标签(全部 + PageApp 根节点 children)
  const [categories, setCategories] = useState<CategoryTabInfo[]>([]);
  // 空间分类标签(团队空间 tab,接口空间列表映射)
  const [spaces, setSpaces] = useState<CategoryTabInfo[]>([]);
  // 应用列表(系统应用 tab)
  const [appList, setAppList] = useState<SquarePublishedItemInfo[]>([]);
  // 应用列表(团队空间 tab)
  const [spaceAppList, setSpaceAppList] = useState<SquarePublishedItemInfo[]>(
    [],
  );
  // 最近使用列表
  const [recentList, setRecentList] = useState<SquarePublishedItemInfo[]>([]);
  // 最近使用展开态(收起时最多展示两排,展开看全部)
  const [recentExpanded, setRecentExpanded] = useState(false);
  // 最近使用网格实时列数(ResizeObserver 按容器宽度测量,0=尚未测得)
  const [recentColumns, setRecentColumns] = useState(0);
  const recentGridRef = useRef<HTMLDivElement | null>(null);

  // 最近使用网格列数:auto-fill minmax(210px,230px) + gap 16 的列数公式
  // floor((容器宽+间距)/(列宽下限+间距));列宽/间距与 index.less 的
  // recent-list 保持同步(常量集中定义在 constants.ts)。
  // 依赖 hasRecent:网格随「最近使用」条件渲染,首帧数据未到时不存在,
  // 需等其挂载后再取 ref 挂观察器(否则列数恒为 0,两排裁剪不生效)
  const hasRecent = recentList.length > 0;
  useEffect(() => {
    if (!hasRecent) return;
    const el = recentGridRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const updateColumns = () => {
      setRecentColumns(
        Math.max(
          1,
          Math.floor(
            (el.clientWidth + RECENT_GRID_GAP) /
              (RECENT_GRID_MIN_COLUMN + RECENT_GRID_GAP),
          ),
        ),
      );
    };
    updateColumns();
    const observer = new ResizeObserver(updateColumns);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasRecent]);

  // 最近使用:POST /api/published/app/recentlyUsed/list(全量数组,按最近使用排序)
  useRequest(
    () => apiPublishedAppRecentlyUsedList({ size: RECENT_USED_SIZE }),
    {
      onSuccess: (result: SquarePublishedItemInfo[]) => {
        setRecentList(result || []);
      },
      onError: () => setRecentList([]),
    },
  );

  // 分类标签:已发布分类接口中 key=PageApp 根节点的 children;失败时降级为仅「全部」
  useRequest(apiPublishedCategoryList, {
    onSuccess: (result: SquareCategoryInfo[]) => {
      const list = result || [];
      const root = list.find((item) => item.key === PAGE_APP_CATEGORY_ROOT_KEY);
      const children = (root?.children || [])
        .filter((item) => Boolean(item?.key))
        .map((item) => ({ key: item.key, label: item.label || item.key }));
      setCategories(children);
    },
    onError: () => setCategories([]),
  });

  // 空间分类标签:用户空间列表(GET /api/space/list)映射为 {key: 空间id, label: 空间名};
  // 失败时降级为空列表(团队空间 tab 仅剩「全部」pill,仍可查全部空间应用)
  const { loading: spacesLoading } = useRequest(apiSpaceList, {
    onSuccess: (result: SpaceInfo[]) => {
      const list = result || [];
      setSpaces(
        list
          .filter((item) => Boolean(item?.id))
          .map((item) => ({ key: String(item.id), label: item.name || '' })),
      );
    },
    onError: () => setSpaces([]),
  });

  // 应用列表分页(系统应用 tab):当前页码与已加载数 ref,滚动触底加载下一页
  const appPageRef = useRef(1);
  const appLoadedRef = useRef(0);
  const [appHasMore, setAppHasMore] = useState(false);
  // 应用列表分页(团队空间 tab)同上
  const spaceAppPageRef = useRef(1);
  const spaceAppLoadedRef = useRef(0);
  const [spaceAppHasMore, setSpaceAppHasMore] = useState(false);

  // 应用列表(系统应用 tab):POST /api/published/app/list,scope=Tenant(本租户内)+
  // official=true 查官方系统应用;分类/关键词变化时重置回第一页,
  // 滚动触底按页码 +1 追加(与专家·技能·连接器页滚动加载同口径)
  const { run: runAppList, loading: appListLoading } = useRequest(
    (query: { page: number; category: string; kw: string }) =>
      apiPublishedAppList({
        scope: 'Tenant',
        targetTypes: APP_LIST_TARGET_TYPES,
        targetSubTypes: APP_LIST_TARGET_SUBTYPES,
        official: true,
        page: query.page,
        pageSize: APP_LIST_PAGE_SIZE,
        category: query.category || undefined,
        kw: query.kw || undefined,
      }),
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (
        result: Page<SquarePublishedItemInfo>,
        [query]: [AppListQuery],
      ) => {
        const records = result?.records || [];
        setAppList((prev) =>
          query.page === 1 ? records : [...prev, ...records],
        );
        appPageRef.current = query.page;
        appLoadedRef.current =
          query.page === 1
            ? records.length
            : appLoadedRef.current + records.length;
        // 优先按总页数判断是否还有下一页,回包缺 pages 时按已加载/总数兜底
        const pages = result?.pages;
        const total = result?.total;
        setAppHasMore(
          records.length > 0 &&
            (pages && pages > 0
              ? query.page < pages
              : total === null ||
                total === undefined ||
                appLoadedRef.current < total),
        );
      },
      onError: (_e: unknown, [query]: [AppListQuery]) => {
        // 仅第一页失败清空列表;翻页失败保留已加载内容(可再次触底重试)
        if (query.page === 1) {
          setAppList([]);
        }
        setAppHasMore(false);
      },
    },
  );

  // 应用列表(团队空间 tab):POST /api/published/app/list,scope=Space(团队空间)+
  // justReturnSpaceData=true 查空间已发布应用;「全部」不传 spaceId,
  // 选中具体空间追加 spaceId;kw 与系统应用 tab 同为服务端搜索;
  // 切换时重置回第一页,滚动触底按页码 +1 追加
  const { run: runSpaceAppList, loading: spaceAppListLoading } = useRequest(
    (query: { page: number; spaceId?: number; kw: string }) =>
      apiPublishedAppList({
        scope: 'Space',
        targetTypes: APP_LIST_TARGET_TYPES,
        targetSubTypes: APP_LIST_TARGET_SUBTYPES,
        justReturnSpaceData: true,
        spaceId: query.spaceId,
        page: query.page,
        pageSize: APP_LIST_PAGE_SIZE,
        kw: query.kw || undefined,
      }),
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (
        result: Page<SquarePublishedItemInfo>,
        [query]: [SpaceAppListQuery],
      ) => {
        const records = result?.records || [];
        setSpaceAppList((prev) =>
          query.page === 1 ? records : [...prev, ...records],
        );
        spaceAppPageRef.current = query.page;
        spaceAppLoadedRef.current =
          query.page === 1
            ? records.length
            : spaceAppLoadedRef.current + records.length;
        const pages = result?.pages;
        const total = result?.total;
        setSpaceAppHasMore(
          records.length > 0 &&
            (pages && pages > 0
              ? query.page < pages
              : total === null ||
                total === undefined ||
                spaceAppLoadedRef.current < total),
        );
      },
      onError: (_e: unknown, [query]: [SpaceAppListQuery]) => {
        if (query.page === 1) {
          setSpaceAppList([]);
        }
        setSpaceAppHasMore(false);
      },
    },
  );

  // 激活 tab 内的筛选条件变化时重置回第一页查询(切回 tab 时按保留的筛选重新拉取)
  useEffect(() => {
    if (activeSource !== 'system') return;
    runAppList({ page: 1, category: activeCategory, kw: keyword });
  }, [activeSource, activeCategory, keyword, runAppList]);

  // 团队空间:「全部」不传 spaceId 查全部空间,具体空间传 id;搜索词与系统应用
  // tab 同口径参与查询;空间或关键词变化时重置回第一页
  useEffect(() => {
    if (activeSource !== 'team') return;
    const spaceId = Number(activeSpace);
    runSpaceAppList({
      page: 1,
      spaceId: spaceId > 0 ? spaceId : undefined,
      kw: keyword,
    });
  }, [activeSource, activeSpace, keyword, runSpaceAppList]);

  // 滚动触底加载下一页(系统应用):沿用当前筛选,页码 +1 追加
  const loadMoreApps = () => {
    if (appListLoading || !appHasMore) return;
    runAppList({
      page: appPageRef.current + 1,
      category: activeCategory,
      kw: keyword,
    });
  };

  // 滚动触底加载下一页(团队空间):沿用当前空间与搜索词(「全部」不传 spaceId),页码 +1 追加
  const loadMoreSpaceApps = () => {
    if (spaceAppListLoading || !spaceAppHasMore) return;
    const spaceId = Number(activeSpace);
    runSpaceAppList({
      page: spaceAppPageRef.current + 1,
      spaceId: spaceId > 0 ? spaceId : undefined,
      kw: keyword,
    });
  };

  // 跳转广场-网页应用
  const handleGoSquare = () => {
    history.push(SQUARE_PAGE_APP_PATH);
  };

  // 最近使用点击:进应用详情(新接口条目为发布对象,无会话字段,不再续上次会话)
  const handleRecentClick = (app: SquarePublishedItemInfo) => {
    history.push(`/agent/${app.targetId}`);
  };

  // 当前 tab 的展示列表与加载态:仅首屏(第一页且列表为空)显示整屏 Loading,
  // 滚动加载下一页由 InfiniteScrollDiv 自带底部 loader 展示;
  // 团队空间 tab 需等空间列表与默认空间就绪(空间列表为空时不再等待,走空态)
  const isTeamSource = activeSource === 'team';
  const displayList = isTeamSource ? spaceAppList : appList;
  const listLoading = isTeamSource
    ? (spacesLoading || spaceAppListLoading) && spaceAppList.length === 0
    : appListLoading && appList.length === 0;
  // 当前 tab 的二级筛选 pill:首位固定「全部」(系统应用=不限 PageApp 分类;
  // 团队空间=不限空间、不传 spaceId),后接分类/空间列表
  const categoryTabs = [
    { key: ALL_CATEGORY_KEY, label: dict('PC.Pages.NuwaApps.all') },
    ...(isTeamSource ? spaces : categories),
  ];

  // 最近使用折叠:收起时最多两排(列数×2);列数未测得前不裁剪,避免首帧闪隐;
  // 未超两排或已展开时展示全部
  const recentTwoRowLimit =
    recentColumns > 0
      ? recentColumns * RECENT_COLLAPSED_MAX_ROWS
      : recentList.length;
  const recentOverflow = recentList.length > recentTwoRowLimit;
  const visibleRecentList =
    recentExpanded || !recentOverflow
      ? recentList
      : recentList.slice(0, recentTwoRowLimit);

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      {/* 头部:标题 + 搜索 + 更多 */}
      <header className={cx('flex', 'items-center', styles.header)}>
        <h3 className={cx(styles.title)}>{dict('PC.Pages.NuwaApps.title')}</h3>
        <div className={cx('flex', 'items-center', styles['header-actions'])}>
          <Input.Search
            className={cx(styles['search-input'])}
            allowClear
            placeholder={dict('PC.Pages.NuwaApps.searchPlaceholder')}
            onSearch={(value) => setKeyword(value || '')}
          />
          {/* 「更多」入口:样式对齐专家·技能·连接器页工具栏 more-btn,排布在搜索框右侧 */}
          <a className={cx(styles['more-btn'])} onClick={handleGoSquare}>
            {dict('PC.Pages.NuwaApps.more')}
          </a>
        </div>
      </header>

      <div
        id={APP_SCROLL_CONTAINER_ID}
        className={cx('flex-1', 'min-h-0', 'scroll-container-hide')}
      >
        {/* 最近使用:接口数据,无数据时整节隐藏;超过两排时收起展示并提供展开/收起 */}
        {recentList.length > 0 && (
          <section>
            <h4 className={cx(styles['section-title'])}>
              {dict('PC.Pages.NuwaApps.recentlyUsed')}
            </h4>
            <div className={cx(styles['recent-body'])}>
              <div className={cx(styles['recent-list'])} ref={recentGridRef}>
                {visibleRecentList.map((app) => (
                  <div
                    key={app.id}
                    className={cx(styles['recent-item'])}
                    onClick={() => handleRecentClick(app)}
                  >
                    <span className={cx(styles['recent-icon'])}>
                      <img
                        src={app.icon || agentImage}
                        alt={app.name}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = agentImage;
                        }}
                      />
                    </span>
                    <div className={cx('flex-1', 'overflow-hide')}>
                      <p className={cx('text-ellipsis', styles['recent-name'])}>
                        {app.name}
                      </p>
                      {/* 标题下展示应用描述,超长单行省略 */}
                      <p
                        className={cx('text-ellipsis', styles['recent-desc'])}
                        title={app.description}
                      >
                        {app.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {/* 超过两排:展开看全部/收起回到最多两排(开关靠右) */}
              {recentOverflow && (
                <div className={cx('flex', 'content-end')}>
                  <a
                    className={cx(styles['recent-toggle'])}
                    onClick={() => setRecentExpanded((prev) => !prev)}
                  >
                    {recentExpanded
                      ? dict('PC.Pages.NuwaApps.collapse')
                      : dict('PC.Pages.NuwaApps.expand')}
                    {recentExpanded ? <UpOutlined /> : <DownOutlined />}
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 应用列表区:主tab(系统应用/团队空间,Segmented 样式对齐专家&专家团页)+ 二级筛选 pill + 应用卡片网格 */}
        <section className={cx('flex', 'flex-col')}>
          <Segmented
            className={cx(styles['source-segmented'])}
            options={[
              {
                label: dict('PC.Pages.NuwaApps.systemApps'),
                value: 'system',
              },
              {
                label: dict('PC.Pages.NuwaApps.teamSpace'),
                value: 'team',
              },
            ]}
            value={activeSource}
            onChange={(value) => setActiveSource(value as AppSourceEnum)}
          />

          {/* 二级筛选 pill:首位固定「全部」——系统应用=全部 PageApp 分类,
              团队空间=全部空间(不传 spaceId);样式对齐专家&专家团页分类 pill */}
          {categoryTabs.length > 0 && (
            <div
              className={cx('flex', 'items-center', styles['category-tabs'])}
            >
              {categoryTabs.map((tab) => (
                <div
                  key={tab.key || 'all'}
                  className={cx(styles['category-tab'], {
                    [styles['category-tab-active']]: isTeamSource
                      ? activeSpace === tab.key
                      : activeCategory === tab.key,
                  })}
                  onClick={() =>
                    isTeamSource
                      ? setActiveSpace(tab.key)
                      : setActiveCategory(tab.key)
                  }
                >
                  {tab.label}
                </div>
              ))}
            </div>
          )}

          {listLoading ? (
            <Loading className={cx(styles['min-height-300'])} />
          ) : displayList.length > 0 ? (
            <InfiniteScrollDiv
              scrollableTarget={APP_SCROLL_CONTAINER_ID}
              list={displayList}
              hasMore={isTeamSource ? spaceAppHasMore : appHasMore}
              onScroll={isTeamSource ? loadMoreSpaceApps : loadMoreApps}
            >
              <div className={cx(styles['app-list'])}>
                {displayList.map((item) => (
                  <AppCard
                    key={item.id}
                    publishedItemInfo={item}
                    onClick={() => history.push(`/agent/${item.targetId}`)}
                  />
                ))}
              </div>
            </InfiniteScrollDiv>
          ) : (
            <div
              className={cx(
                'flex',
                'flex-col',
                'items-center',
                'content-center',
                styles['min-height-300'],
              )}
            >
              <Empty description={dict('PC.Common.Global.emptyData')} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default NuwaApps;
