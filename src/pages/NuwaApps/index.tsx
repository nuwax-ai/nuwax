/**
 * 女娲应用页面(一级菜单入口)
 * @description 应用分发页:最近使用(used/list 接口,点击续上次会话)+ 应用列表区
 * (主tab:系统应用=分类标签+已发布网页应用 POST 列表 / 团队空间=空间分类+GET 列表,
 * 点击进应用详情 /agent/:id);「更多」跳广场-网页应用
 */
import agentImage from '@/assets/images/agent_image.png';
import Loading from '@/components/custom/Loading';
import { apiUserUsedAgentList } from '@/services/agentDev';
import { dict } from '@/services/i18nRuntime';
import {
  apiPublishedAgentList,
  apiPublishedAgentListBySpace,
  apiPublishedCategoryList,
} from '@/services/square';
import { apiSpaceList } from '@/services/workspace';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { AgentInfo } from '@/types/interfaces/agent';
import type { Page } from '@/types/interfaces/request';
import type {
  SquareCategoryInfo,
  SquarePublishedItemInfo,
} from '@/types/interfaces/square';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { Empty, Input, Segmented } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import AppCard from './components/AppCard';
import {
  APP_LIST_PAGE_SIZE,
  PAGE_APP_CATEGORY_ROOT_KEY,
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

const NuwaApps: React.FC = () => {
  // 应用列表区主 tab(默认系统应用)
  const [activeSource, setActiveSource] = useState<AppSourceEnum>('system');
  // 激活分类 key(空串=全部,系统应用 tab 用)
  const [activeCategory, setActiveCategory] =
    useState<string>(ALL_CATEGORY_KEY);
  // 激活空间 key(团队空间 tab 用,空间列表就绪后默认选首个空间)
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
  const [recentList, setRecentList] = useState<AgentInfo[]>([]);

  // 最近使用:GET /api/user/agent/used/list/{size},type=PageApp 过滤网页应用
  useRequest(
    () =>
      apiUserUsedAgentList({
        size: RECENT_USED_SIZE,
        type: AgentComponentTypeEnum.PageApp,
      }),
    {
      onSuccess: (result: AgentInfo[]) => {
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
  // 失败时降级为空列表(团队空间 tab 展示空态)
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

  // 团队空间 tab:空间列表就绪后默认选中首个空间(用户切换后 activeSpace 有值不再覆盖)
  useEffect(() => {
    if (spaces.length > 0 && !activeSpace) {
      setActiveSpace(spaces[0].key);
    }
  }, [spaces, activeSpace]);

  // 应用列表(系统应用 tab):已发布智能体列表(网页应用),分类/关键词变化时重新查询
  const { run: runAppList, loading: appListLoading } = useRequest(
    (query: { category: string; kw: string }) =>
      apiPublishedAgentList({
        page: 1,
        pageSize: APP_LIST_PAGE_SIZE,
        category: query.category,
        kw: query.kw,
        targetType: AgentComponentTypeEnum.Agent,
        targetSubType: AgentComponentTypeEnum.PageApp,
      }),
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (result: Page<SquarePublishedItemInfo>) => {
        setAppList(result?.records || []);
      },
      onError: () => setAppList([]),
    },
  );

  // 应用列表(团队空间 tab):GET /api/published/agent/list?spaceId=xx,
  // 仅 spaceId + 分页参数(不带 kw/targetType/targetSubType),切换空间时重新查询
  const { run: runSpaceAppList, loading: spaceAppListLoading } = useRequest(
    (query: { spaceId: number }) =>
      apiPublishedAgentListBySpace({
        spaceId: query.spaceId,
        page: 1,
        pageSize: APP_LIST_PAGE_SIZE,
      }),
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (result: Page<SquarePublishedItemInfo>) => {
        setSpaceAppList(result?.records || []);
      },
      onError: () => setSpaceAppList([]),
    },
  );

  // 激活 tab 内的筛选条件变化时查询对应列表(切回 tab 时按保留的筛选重新拉取)
  useEffect(() => {
    if (activeSource !== 'system') return;
    runAppList({ category: activeCategory, kw: keyword });
  }, [activeSource, activeCategory, keyword, runAppList]);

  useEffect(() => {
    if (activeSource !== 'team') return;
    const spaceId = Number(activeSpace);
    if (!Number.isFinite(spaceId) || spaceId <= 0) return;
    runSpaceAppList({ spaceId });
  }, [activeSource, activeSpace, runSpaceAppList]);

  // 跳转广场-网页应用
  const handleGoSquare = () => {
    history.push(SQUARE_PAGE_APP_PATH);
  };

  // 最近使用点击:有最后一次会话则续会话,否则进应用详情
  const handleRecentClick = (app: AgentInfo) => {
    if (app.lastConversationId) {
      history.push(`/home/chat/${app.lastConversationId}/${app.agentId}`);
      return;
    }
    history.push(`/agent/${app.agentId}`);
  };

  // 当前 tab 的展示列表与加载态(团队空间 tab 需等空间列表与默认空间就绪;
  // 空间列表为空时不再等待,走空态)
  const isTeamSource = activeSource === 'team';
  const displayList = isTeamSource ? spaceAppList : appList;
  const listLoading = isTeamSource
    ? spacesLoading ||
      (spaces.length > 0 && !activeSpace) ||
      spaceAppListLoading
    : appListLoading;
  // 当前 tab 的二级筛选 pill(系统应用=「全部」+PageApp 分类;团队空间=空间分类)
  const categoryTabs = isTeamSource
    ? spaces
    : [
        { key: ALL_CATEGORY_KEY, label: dict('PC.Pages.NuwaApps.all') },
        ...categories,
      ];

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      {/* 头部:标题 + 搜索 + 更多 */}
      <header className={cx('flex', 'items-center', styles.header)}>
        <h3 className={cx(styles.title)}>{dict('PC.Pages.NuwaApps.title')}</h3>
        <div className={cx('flex', 'items-center', styles['header-actions'])}>
          {/* 「更多」入口:样式与排布对齐专家·技能·连接器页工具栏(更多在搜索框左侧) */}
          <a className={cx(styles['more-btn'])} onClick={handleGoSquare}>
            {dict('PC.Pages.NuwaApps.more')}
          </a>
          <Input.Search
            className={cx(styles['search-input'])}
            allowClear
            placeholder={dict('PC.Pages.NuwaApps.searchPlaceholder')}
            onSearch={(value) => setKeyword(value || '')}
          />
        </div>
      </header>

      <div className={cx('flex-1', 'min-h-0', 'scroll-container-hide')}>
        {/* 最近使用:接口数据,无数据时整节隐藏 */}
        {recentList.length > 0 && (
          <section>
            <h4 className={cx(styles['section-title'])}>
              {dict('PC.Pages.NuwaApps.recentlyUsed')}
            </h4>
            <div className={cx(styles['recent-list'])}>
              {recentList.map((app) => (
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
                    <p className={cx(styles['recent-desc'])}>
                      {dict('PC.Pages.NuwaApps.appTag')}
                    </p>
                  </div>
                </div>
              ))}
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

          {/* 二级筛选 pill:系统应用=分类(全部 + PageApp 分类)/ 团队空间=空间分类(切换空间筛选应用);
              样式对齐专家&专家团页分类 pill;列表为空时隐藏整行 */}
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
            <div className={cx(styles['app-list'])}>
              {displayList.map((item) => (
                <AppCard
                  key={item.id}
                  publishedItemInfo={item}
                  onClick={() => history.push(`/agent/${item.targetId}`)}
                />
              ))}
            </div>
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
