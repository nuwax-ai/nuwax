/**
 * 女娲应用页面(一级菜单入口)
 * @description 应用分发页:最近使用(used/list 接口,点击续上次会话)+ 全部应用(分类标签 + 已发布网页应用列表,点击进应用详情 /agent/:id);
 * 「更多」跳广场-网页应用
 */
import agentImage from '@/assets/images/agent_image.png';
import Loading from '@/components/custom/Loading';
import { apiUserUsedAgentList } from '@/services/agentDev';
import { dict } from '@/services/i18nRuntime';
import {
  apiPublishedAgentList,
  apiPublishedCategoryList,
} from '@/services/square';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { AgentInfo } from '@/types/interfaces/agent';
import type { Page } from '@/types/interfaces/request';
import type {
  SquareCategoryInfo,
  SquarePublishedItemInfo,
} from '@/types/interfaces/square';
import { Empty, Input } from 'antd';
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

const NuwaApps: React.FC = () => {
  // 激活分类 key(空串=全部)
  const [activeCategory, setActiveCategory] =
    useState<string>(ALL_CATEGORY_KEY);
  // 搜索关键词
  const [keyword, setKeyword] = useState<string>('');
  // 分类标签(全部 + PageApp 根节点 children)
  const [categories, setCategories] = useState<CategoryTabInfo[]>([]);
  // 应用列表
  const [appList, setAppList] = useState<SquarePublishedItemInfo[]>([]);
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

  // 应用列表:已发布智能体列表(网页应用),分类/关键词变化时重新查询
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

  useEffect(() => {
    runAppList({ category: activeCategory, kw: keyword });
  }, [activeCategory, keyword, runAppList]);

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

        {/* 全部应用:分类标签 + 应用卡片网格 */}
        <section className={cx('flex', 'flex-col')}>
          <h4 className={cx(styles['section-title'])}>
            {dict('PC.Pages.NuwaApps.allApps')}
          </h4>
          <div className={cx(styles.tabs)}>
            {[
              { key: ALL_CATEGORY_KEY, label: dict('PC.Pages.NuwaApps.all') },
              ...categories,
            ].map((tab) => (
              <span
                key={tab.key || 'all'}
                className={cx(styles.tab, {
                  [styles.active]: activeCategory === tab.key,
                })}
                onClick={() => setActiveCategory(tab.key)}
              >
                {tab.label}
              </span>
            ))}
          </div>

          {appListLoading ? (
            <Loading className={cx(styles['min-height-300'])} />
          ) : appList.length > 0 ? (
            <div className={cx(styles['app-list'])}>
              {appList.map((item) => (
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
