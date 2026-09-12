/**
 * 经典布局（style1/2）首页会话域视图：搜索头 + 任务/项目 tab 切换 + 列表。
 * 数据经 HomeSectionDataShell 注入；本文件只管形态——tab 态（localStorage 持久化）、
 * 关键词搜索防抖、初始按 tab 决定首载、任务 tab 触底加载。
 */
import { dict } from '@/services/i18nRuntime';
import { useDebounceFn } from 'ahooks';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useModel } from 'umi';

import ProjectPanel from './components/ProjectPanel';
import SearchHeader from './components/SearchHeader';
import styles from './index.less';
import TaskListSection from './TaskListSection';
import { HomeSectionDataShell } from './useHomeSectionData';

const cx = classNames.bind(styles);

type HomeTab = 'conversation' | 'project';

const ACTIVE_TAB_STORAGE_KEY = 'PC_HOME_SECTION_ACTIVE_TAB';

const getInitialActiveTab = (): HomeTab => {
  if (typeof window === 'undefined') return 'conversation';
  const storedTab = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
  return storedTab === 'conversation' || storedTab === 'project'
    ? storedTab
    : 'conversation';
};

/** tab 指示条位次：CSS 侧以 data-active 驱动滑动（原型同款动效的 CSS-only 等价实现） */
const HOME_TAB_INDEX: Record<HomeTab, number> = {
  conversation: 0,
  project: 1,
};

const ClassicHomeSection: React.FC<{ shell: HomeSectionDataShell }> = ({
  shell,
}) => {
  const { handleCloseMobileMenu } = useModel('layout');
  const { firstLevelMenus } = useModel('menuModel');

  const [activeTab, setActiveTab] = useState<HomeTab>(() =>
    getInitialActiveTab(),
  );

  // 初始停留在任务 tab 才首载（停留在项目 tab 时延后到切换时加载；单栏形态由
  // 数据壳挂载恒发）——与数据壳初始 loading 的互补语义由 initialLoad 内部保证
  useEffect(() => {
    if (activeTab === 'conversation') {
      shell.initialLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 任务列表是否在滚动视口内（触底加载分页仅在其可见时生效）
  const taskListVisible = activeTab === 'conversation';

  useEffect(() => {
    const container = shell.scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (shell.loading || !shell.hasMore || !taskListVisible) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 30) {
        shell.refreshList();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [taskListVisible, shell]);

  const { run: debouncedSearch, cancel: cancelDebouncedSearch } = useDebounceFn(
    (val: string) => {
      shell.setSearchKeyword(val);
    },
    { wait: 500 },
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 项目 tab 搜索不生效（项目面板自管数据，维持改版前行为）
    if (activeTab === 'project') return;
    shell.setKeyword(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleSearchSubmit = () => {
    if (activeTab === 'project') return;
    cancelDebouncedSearch();
    if (shell.keyword === shell.searchKeyword) {
      shell.refreshList(true);
    } else {
      shell.setSearchKeyword(shell.keyword);
    }
  };

  const handleTabChange = (tab: HomeTab) => {
    cancelDebouncedSearch();
    setActiveTab(tab);
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
    if (shell.scrollContainerRef.current) {
      shell.scrollContainerRef.current.scrollTop = 0;
    }
    if (tab === 'project') return;
    shell.resetSearchAndRefresh();
  };

  const handleNewConversation = () => {
    handleCloseMobileMenu();
    history.push('/home');
  };

  // 新建会话入口在搜索栏右侧（单栏在侧栏顶部操作区 SidebarNavHeader）
  const showNewChatButton = firstLevelMenus?.some(
    (menu: any) => menu?.code === 'new_conversation',
  );

  return (
    <>
      <SearchHeader
        keyword={shell.keyword}
        placeholder={dict(
          'PC.Layouts.DynamicMenusLayout.NewHomeSection.searchPlaceholder',
        )}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onNewChat={handleNewConversation}
        showNewChatButton={showNewChatButton}
      />

      {/* 任务/项目 tab 切换（维持改版前形态，指示条随位次滑动） */}
      <div
        className={cx(styles.tabs, styles['tabs-under-search'])}
        data-active={HOME_TAB_INDEX[activeTab] ?? 0}
      >
        <button
          type="button"
          className={cx(styles.tab, {
            [styles.active]: activeTab === 'conversation',
          })}
          onClick={() => handleTabChange('conversation')}
        >
          {dict('PC.Layouts.DynamicMenusLayout.NewHomeSection.tabTask')}
        </button>
        <button
          type="button"
          className={cx(styles.tab, {
            [styles.active]: activeTab === 'project',
          })}
          onClick={() => handleTabChange('project')}
        >
          {dict('PC.Layouts.DynamicMenusLayout.HomeSection.projectTab')}
        </button>
        {/* 滑动指示条：位次由容器 data-active 控制（原型 tab-indicator 的 CSS-only 等价） */}
        <span className={cx(styles['tab-indicator'])} aria-hidden />
      </div>

      <div
        ref={shell.scrollShowRef}
        className={cx(styles['conversation-list-wrapper'])}
      >
        {activeTab === 'project' ? (
          <ProjectPanel
            onVisibleCountChange={shell.handleProjectCountChange}
            onConversationClick={shell.handleConversationClick}
            activeConversationId={shell.chatId}
            onActiveChildResolved={shell.setActiveProjectChildId}
          />
        ) : (
          <TaskListSection
            list={shell.visibleConversationList}
            loading={shell.loading}
            keyword={shell.keyword}
            chatId={shell.chatId}
            activeProjectChildId={shell.activeProjectChildId}
            onConversationClick={shell.handleConversationClick}
            onFlagChanged={shell.handleConversationFlagChanged}
          />
        )}
      </div>
    </>
  );
};

export default ClassicHomeSection;
