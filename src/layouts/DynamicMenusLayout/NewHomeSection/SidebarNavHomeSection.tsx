/**
 * 单栏（style3）首页会话域视图：项目/任务双分组折叠形态（原型同款）。
 * 数据经 HomeSectionDataShell 注入；本文件只管形态——分组头 sticky 吸顶、
 * 折叠态、项目面板挂载与任务分组触底加载。
 */
import SvgIcon from '@/components/base/SvgIcon';
import useCommercialEdition from '@/hooks/useCommercialEdition';
import { dict } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'umi';

import ProjectPanel, { ProjectPanelHandle } from './components/ProjectPanel';
import styles from './index.less';
import TaskListSection from './TaskListSection';
import { HomeSectionDataShell } from './useHomeSectionData';

const cx = classNames.bind(styles);

const SidebarNavHomeSection: React.FC<{ shell: HomeSectionDataShell }> = ({
  shell,
}) => {
  const location = useLocation();
  const { aiOSCommercialEdition } = useCommercialEdition();
  const projectPanelRef = useRef<ProjectPanelHandle>(null);
  // 单栏分组折叠态（原型：点击分组头折叠/展开对应列表，不做持久化）
  const [projectCollapsed, setProjectCollapsed] = useState(false);
  const [taskCollapsed, setTaskCollapsed] = useState(false);
  const lastSyncAtRef = useRef(Date.now());
  const pendingSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // 路由切换可以与页签切回共用节流定时器，但不能在定时器触发时降级成
  // visibility：静止列表的活动门控只适用于单纯的页签切回。
  const pendingNavigationSyncRef = useRef(false);
  const previousPathRef = useRef(location.pathname);
  // 触发源口径：'visibility'=页签切回（受活动门控约束）；不传=路由切换
  // （导航本身即收敛时机，不设门）
  const syncRef = useRef<(reason?: 'visibility') => void>(() => {});
  syncRef.current = (reason) => {
    if (reason !== 'visibility') pendingNavigationSyncRef.current = true;
    // 活动门控（2026-09-18 定调「切回页签只允许当前打开页面自身需要的接口」）：
    // 页签切回时仅补刷执行中的会话，把结束状态同步到列表；
    // 跨端新增行交由导航/事件路径收敛。
    if (
      !pendingNavigationSyncRef.current &&
      !shell.hasExecutingTask &&
      !projectPanelRef.current?.hasExecutingChildren()
    ) {
      return;
    }
    const remaining = 30_000 - (Date.now() - lastSyncAtRef.current);
    if (remaining > 0) {
      // 路由切换与页签切回合并到节流窗口末尾；待执行的路由刷新保留优先级。
      if (!pendingSyncTimerRef.current) {
        pendingSyncTimerRef.current = setTimeout(() => {
          pendingSyncTimerRef.current = null;
          if (document.visibilityState === 'visible')
            syncRef.current('visibility');
        }, remaining);
      }
      return;
    }
    if (pendingSyncTimerRef.current) {
      clearTimeout(pendingSyncTimerRef.current);
      pendingSyncTimerRef.current = null;
    }
    lastSyncAtRef.current = Date.now();
    pendingNavigationSyncRef.current = false;
    shell.refreshList(true, { silent: true });
    if (!projectCollapsed) projectPanelRef.current?.revalidateVisible();
  };

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncRef.current('visibility');
    };
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
      if (pendingSyncTimerRef.current) {
        clearTimeout(pendingSyncTimerRef.current);
        pendingSyncTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      previousPathRef.current = location.pathname;
      syncRef.current();
    }
  }, [location.pathname]);

  // 任务列表是否在滚动视口内（触底加载分页仅在其可见时生效）
  const taskListVisible = !taskCollapsed;

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

  const handleProjectHeaderClick = () => {
    const container = shell.scrollContainerRef.current;
    // 从吸顶标题返回项目列表；列表起点仍保留原有的展开/收起操作。
    if (container && container.scrollTop > 0) {
      setProjectCollapsed(false);
      container.scrollTop = 0;
      return;
    }
    setProjectCollapsed((prev) => !prev);
  };

  // 两个分组头共用滚动包含块；项目可见时，任务才在项目头下方吸顶。
  const renderSectionHeader = (options: {
    label: string;
    collapsed: boolean;
    task?: boolean;
    onToggle: () => void;
  }) => (
    <div
      className={cx(styles['section-tabs'], {
        [styles['task-section-tabs']]: options.task,
        [styles['task-section-tabs-with-project']]:
          options.task && aiOSCommercialEdition,
        [styles['section-tabs-collapsed']]: options.collapsed,
        [styles['section-tabs-sticky']]: true,
      })}
      onClick={options.onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          options.onToggle();
        }
      }}
      aria-expanded={!options.collapsed}
    >
      <span className={cx(styles['section-tab-text'])}>{options.label}</span>
      <span className={cx(styles['section-tab-chev'])} aria-hidden>
        <SvgIcon name="icons-common-caret_down" style={{ fontSize: 14 }} />
      </span>
      {!options.task && (
        <button
          type="button"
          className={styles['section-tool']}
          title={dict(
            'PC.Layouts.DynamicMenusLayout.NewHomeSection.toggleAllProjects',
          )}
          aria-label={dict(
            'PC.Layouts.DynamicMenusLayout.NewHomeSection.toggleAllProjects',
          )}
          disabled={shell.projectCount === 0}
          onClick={(event) => {
            event.stopPropagation();
            setProjectCollapsed(false);
            projectPanelRef.current?.toggleAll();
            if (shell.scrollContainerRef.current) {
              shell.scrollContainerRef.current.scrollTop = 0;
            }
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    /* 分组头直接放入同一滚动容器，避免各自分组的边界把项目标题顶出。 */
    <div
      ref={shell.scrollShowRef}
      className={cx(styles['conversation-list-wrapper'])}
    >
      {aiOSCommercialEdition && (
        <>
          {renderSectionHeader({
            label: dict('PC.Layouts.DynamicMenusLayout.HomeSection.projectTab'),
            collapsed: projectCollapsed,
            onToggle: handleProjectHeaderClick,
          })}
          <div
            className={cx(styles['project-list-section'])}
            hidden={projectCollapsed}
          >
            <ProjectPanel
              ref={projectPanelRef}
              compact
              leadingMark
              onVisibleCountChange={shell.handleProjectCountChange}
              onConversationClick={shell.handleConversationClick}
              activeConversationId={shell.chatId}
              onActiveChildResolved={shell.setActiveProjectChildId}
            />
          </div>
        </>
      )}

      {renderSectionHeader({
        label: dict('PC.Layouts.DynamicMenusLayout.NewHomeSection.tabTask'),
        collapsed: taskCollapsed,
        task: true,
        onToggle: () => setTaskCollapsed((prev) => !prev),
      })}
      {!taskCollapsed && (
        <div className={styles['task-list-section']}>
          <TaskListSection
            compact
            leadingMark
            list={shell.visibleConversationList}
            loading={shell.loading}
            keyword={shell.keyword}
            chatId={shell.chatId}
            activeProjectChildId={shell.activeProjectChildId}
            onConversationClick={shell.handleConversationClick}
            onFlagChanged={shell.handleConversationFlagChanged}
            onCollectedChanged={shell.handleConversationCollectedChanged}
          />
          {/* 首屏未撑出滚动区时没有 scroll 事件，仍须提供下一页入口。 */}
          {shell.hasMore && (
            <button
              type="button"
              className={styles['task-load-more']}
              disabled={shell.loading}
              onClick={() => shell.refreshList()}
            >
              {dict('PC.Components.AgentConversation.viewMore')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarNavHomeSection;
