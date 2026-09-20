/**
 * 单栏（style3）首页会话域视图：项目/任务双分组折叠形态（原型同款）。
 * 数据经 HomeSectionDataShell 注入；本文件只管形态——分组头 sticky 吸顶、
 * 折叠态、项目面板挂载与任务分组触底加载。
 */
import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'umi';

import ProjectPanel, { ProjectPanelHandle } from './components/ProjectPanel';
import styles from './index.less';
import TaskListSection from './TaskListSection';
import { useFinishedConversationUnread } from './useFinishedConversationUnread';
import { HomeSectionDataShell } from './useHomeSectionData';

const cx = classNames.bind(styles);

const SidebarNavHomeSection: React.FC<{ shell: HomeSectionDataShell }> = ({
  shell,
}) => {
  const location = useLocation();
  const projectPanelRef = useRef<ProjectPanelHandle>(null);
  // 会话结束未读蓝点 id 快照（页面级内存态，订阅重渲染见 hook 层）
  const unreadConversationIds = useFinishedConversationUnread();
  // 单栏分组折叠态（原型：点击分组头折叠/展开对应列表，不做持久化）
  const [projectCollapsed, setProjectCollapsed] = useState(false);
  const [taskCollapsed, setTaskCollapsed] = useState(false);
  const lastSyncAtRef = useRef(Date.now());
  const pendingSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const previousPathRef = useRef(location.pathname);
  // 触发源口径：'visibility'=页签切回（受活动门控约束）；不传=路由切换
  // （导航本身即收敛时机，不设门）
  const syncRef = useRef<(reason?: 'visibility') => void>(() => {});
  syncRef.current = (reason) => {
    // 活动门控（2026-09-18 定调「切回页签只允许当前打开页面自身需要的接口」）：
    // 页签切回本身不补刷——切走时本地没有任何执行中会话就无事可补（状态跃迁/
    // 未读蓝点无从发生，跨端新增行交由导航/事件路径收敛）。有执行中会话才刷新，
    // 把结束跃迁补上（蓝点亮起主场景）
    if (
      reason === 'visibility' &&
      !shell.hasExecutingTask &&
      !projectPanelRef.current?.hasExecutingChildren()
    ) {
      return;
    }
    const remaining = 30_000 - (Date.now() - lastSyncAtRef.current);
    if (remaining > 0) {
      // 很快切走又返回也要核对一次；合并到节流窗口末尾，不持续轮询。
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

  // 单栏分组头（原型 .tabs/.tab）：12.5px 文案 + 12px chevron，折叠时箭头转 -90°
  // sticky：滚动到对应区域时分组头相互顶替、钉在滚动区顶部（配合 .section-tabs-sticky）
  const renderSectionHeader = (options: {
    label: string;
    count: number;
    collapsed: boolean;
    task?: boolean;
    onToggle: () => void;
  }) => (
    <div
      className={cx(styles['section-tabs'], {
        [styles['task-section-tabs']]: options.task,
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
      <span className={cx(styles['section-tab-text'])}>
        {`${options.label} (${options.count})`}
      </span>
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
    /* 滚动区：项目/任务两个分组（原型 scroll-area 同构）。分组头 sticky 吸顶——
       滚动到对应区域时该区分组头把上一区分组头顶出、自动替换钉在滚动区顶部 */
    <div
      ref={shell.scrollShowRef}
      className={cx(styles['conversation-list-wrapper'])}
    >
      <div className={cx(styles['section-group'])}>
        {renderSectionHeader({
          label: dict('PC.Layouts.DynamicMenusLayout.HomeSection.projectTab'),
          count: shell.projectCount,
          collapsed: projectCollapsed,
          onToggle: () => setProjectCollapsed((prev) => !prev),
        })}
        <div
          className={cx(styles['project-list-section'])}
          hidden={projectCollapsed}
        >
          <ProjectPanel
            ref={projectPanelRef}
            compact
            leadingMark
            unreadConversationIds={unreadConversationIds}
            onVisibleCountChange={shell.handleProjectCountChange}
            onConversationClick={shell.handleConversationClick}
            activeConversationId={shell.chatId}
            onActiveChildResolved={shell.setActiveProjectChildId}
          />
        </div>
      </div>

      <div className={cx(styles['section-group'])}>
        {renderSectionHeader({
          label: dict('PC.Layouts.DynamicMenusLayout.NewHomeSection.tabTask'),
          count: shell.visibleConversationList.length,
          collapsed: taskCollapsed,
          task: true,
          onToggle: () => setTaskCollapsed((prev) => !prev),
        })}
        {!taskCollapsed && (
          <TaskListSection
            compact
            leadingMark
            unreadConversationIds={unreadConversationIds}
            list={shell.visibleConversationList}
            loading={shell.loading}
            keyword={shell.keyword}
            chatId={shell.chatId}
            activeProjectChildId={shell.activeProjectChildId}
            onConversationClick={shell.handleConversationClick}
            onFlagChanged={shell.handleConversationFlagChanged}
            onCollectedChanged={shell.handleConversationCollectedChanged}
          />
        )}
      </div>
    </div>
  );
};

export default SidebarNavHomeSection;
