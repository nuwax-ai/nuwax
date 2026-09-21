import SvgIcon from '@/components/base/SvgIcon';
import ConversationContextMenu from '@/components/business-component/ConversationContextMenu';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { t } from '@/services/i18nRuntime';
import {
  apiUserProjectArchive,
  apiUserProjectCollect,
  apiUserProjectConversations,
  apiUserProjectPageQuery,
  apiUserProjectPin,
  apiUserProjectUnCollect,
} from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { UserProjectTabItem } from '@/types/interfaces/userProject';
import {
  FolderOpenOutlined,
  FolderOutlined,
  InboxOutlined,
  PushpinFilled,
  PushpinOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { Dropdown, message, Spin } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history } from 'umi';
import { emitProjectChanged } from '@/utils/directorySyncEvents';
import { resolveConversationRoute } from './conversationRoute';
import styles from './index.less';
import {
  appendProjectRowsDedup,
  computeHasMore,
  filterProjectConversations,
  filterProjectRows,
  needsChase,
  ProjectViewMode,
} from './projectHistoryRows';

const cx = classNames.bind(styles);

/** 拉取页大小（页码分页，对齐首页项目面板 PROJECT_PAGE_SIZE） */
const PROJECT_PAGE_SIZE = 20;
/** 首屏/追加的最小可见行数：前端过滤（归档剔除等）可能让单页可见数不足，追拉补齐 */
const MIN_VISIBLE_BATCH = 10;
/** 单次加载最多连续追拉页数（防已归档视图稀疏行打爆后端） */
const MAX_CHASE_PAGES = 5;

/** 项目类型徽标文案（SpaceProjectManage 类型 tab 同词；分层红线非页面层
 * 禁止 import @/pages/**，就地维护 key 映射） */
const PROJECT_TYPE_LABEL_KEYS: Record<string, string> = {
  [AgentComponentTypeEnum.NormalProject]:
    'PC.Pages.SpaceProjectManage.tabNormalProject',
  [AgentComponentTypeEnum.UserApp]: 'PC.Pages.SpaceProjectManage.tabUserApp',
  [AgentComponentTypeEnum.PageApp]: 'PC.Pages.SpaceProjectManage.tabPageApp',
};

interface ProjectListProps {
  keyword?: string;
  onEdit?: (id: number, currentTopic: string) => void;
  onDelete?: (id: number) => void;
}

export interface ProjectListRef {
  updateItemTopic: (id: number, newTopic: string) => void;
  removeItem: (id: number) => void;
  refresh: () => void;
}

/**
 * 历史会话页「项目」tab 列表：项目行（默认收起，点击展开子会话）+
 * 组内会话行。三视图（全部/已收藏/已归档）只按项目层级过滤；
 * 已收藏走服务端 collectedFilter=only，已归档走服务端 archivedFilter=only，
 * 回包打标过滤仅兜底。
 * 数据走统一接口 user-project/page-query（2026-09-14 两接口统一：
 * 不再附带子会话，展开项目时懒加载 conversations 接口补齐）。
 */
const ProjectList = React.forwardRef<ProjectListRef, ProjectListProps>(
  ({ keyword = '', onEdit, onDelete }, ref) => {
    const [rows, setRows] = useState<UserProjectTabItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [viewMode, setViewMode] = useState<ProjectViewMode>('all');
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);

    // rows 的同步镜像：加载循环里要读最新累计行，闭包 state 会滞后
    const rowsRef = useRef<UserProjectTabItem[]>([]);
    /** 页码游标：下一次要拉的页 */
    const nextPageRef = useRef(1);
    /** 加载代际：视图/关键词切换后丢弃在途的过期响应 */
    const epochRef = useRef(0);

    const applyRows = (next: UserProjectTabItem[]) => {
      rowsRef.current = next;
      setRows(next);
    };

    // 加载数据：页码分页 + 前端过滤追拉（可见行数不足最小展示量时继续翻页）
    const loadData = async (isRefresh = false) => {
      if (!isRefresh && (loading || !hasMore)) return;
      const epoch = epochRef.current;
      setLoading(true);
      try {
        let page = isRefresh ? 1 : nextPageRef.current;
        let acc = isRefresh ? [] : [...rowsRef.current];
        const minVisible = isRefresh ? MIN_VISIBLE_BATCH : PROJECT_PAGE_SIZE;
        let visibleCount = filterProjectRows(acc, viewMode).length;
        let totalPages: number | undefined;
        let lastRecords: UserProjectTabItem[] = [];
        let lastPage = page - 1;

        for (let fetched = 0; fetched < MAX_CHASE_PAGES; fetched += 1) {
          if (
            fetched > 0 &&
            !needsChase(
              visibleCount,
              minVisible,
              lastPage,
              totalPages,
              lastRecords.length,
              PROJECT_PAGE_SIZE,
            )
          ) {
            break;
          }
          const res = await apiUserProjectPageQuery({
            queryFilter: {
              name: keyword || undefined,
              projectTypes: [AgentComponentTypeEnum.NormalProject, AgentComponentTypeEnum.UserApp],
              // 收藏/归档过滤均走服务端，口径与任务 tab 一致（testagent
              // 2026-09-15 实测 archivedFilter 不传=剔除归档行）：
              // 已收藏传 all——收藏是跨归档的个人视图，归档的收藏项仍可见
              collectedFilter: viewMode === 'collected' ? 'only' : undefined,
              archivedFilter:
                viewMode === 'archived'
                  ? 'only'
                  : viewMode === 'collected'
                  ? 'all'
                  : undefined,
            },
            current: page,
            pageSize: PROJECT_PAGE_SIZE,
            orders: [],
            filters: [],
            columns: [],
          });
          if (epoch !== epochRef.current) return; // 过期响应丢弃
          lastRecords = res.data?.records ?? [];
          totalPages = res.data?.pages;
          acc = appendProjectRowsDedup(acc, lastRecords);
          visibleCount = filterProjectRows(acc, viewMode).length;
          lastPage = page;
          page += 1;
        }

        const more = computeHasMore(
          lastPage,
          totalPages,
          lastRecords.length,
          PROJECT_PAGE_SIZE,
        );
        applyRows(acc);
        setHasMore(more);
        if (more) {
          nextPageRef.current = lastPage + 1;
        }
      } catch (error) {
        console.error('Fetch project list failed:', error);
      } finally {
        if (epoch === epochRef.current) {
          setLoading(false);
        }
      }
    };

    // 视图/关键词切换：整流重拉（首渲染由下方 keyword effect 负责首拉）
    const resetAndReload = () => {
      epochRef.current += 1;
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      applyRows([]);
      nextPageRef.current = 1;
      setHasMore(true);
      void loadData(true);
    };

    // 暴露给父组件的方法（与 ConversationListRef 同形，重命名/删除会话走父组件 Modal）
    React.useImperativeHandle(ref, () => ({
      updateItemTopic: (id: number, newTopic: string) => {
        applyRows(
          rowsRef.current.map((project) => ({
            ...project,
            conversations: project.conversations?.map((conversation) =>
              conversation.id === id
                ? { ...conversation, topic: newTopic }
                : conversation,
            ),
          })),
        );
      },
      removeItem: (id: number) => {
        applyRows(
          rowsRef.current.map((project) => ({
            ...project,
            conversations: project.conversations?.filter(
              (conversation) => conversation.id !== id,
            ),
          })),
        );
      },
      refresh: () => {
        resetAndReload();
      },
    }));

    // 监听关键词变化刷新（含挂载首拉）
    useEffect(() => {
      resetAndReload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keyword]);

    // 视图切换整流重拉（跳过首渲染避免与首拉重复请求）
    const viewModeInitializedRef = useRef(false);
    useEffect(() => {
      if (!viewModeInitializedRef.current) {
        viewModeInitializedRef.current = true;
        return;
      }
      resetAndReload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode]);

    // 滚动加载
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleScroll = () => {
        if (loading || !hasMore) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollTop + clientHeight >= scrollHeight - 20) {
          void loadData();
        }
      };

      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, hasMore, rows]);

    // 内容不足一屏时自动补拉（已归档等前端过滤视图下滚动事件不会触发）
    useEffect(() => {
      const container = containerRef.current;
      if (!container || loading || !hasMore) return;
      if (container.scrollHeight <= container.clientHeight + 20) {
        void loadData();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, hasMore, rows]);

    const visibleRows = useMemo(
      () => filterProjectRows(rows, viewMode),
      [rows, viewMode],
    );

    const toggleExpand = (projectId: number) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(projectId)) {
          next.delete(projectId);
        } else {
          next.add(projectId);
        }
        return next;
      });
    };

    const updateProjectRow = (
      projectId: number,
      patch: Partial<UserProjectTabItem>,
    ) => {
      applyRows(
        rowsRef.current.map((project) =>
          project.projectId === projectId ? { ...project, ...patch } : project,
        ),
      );
    };

    // 子会话懒加载在途守卫（防止快速点开收起 / effect 重跑重复拉取）
    const loadingConversationsRef = useRef<Set<number>>(new Set());

    /**
     * 展开且未加载过子会话的行触发懒加载：统一接口不随列表回包
     * conversations，覆盖点击展开与刷新/切视图后仍保持展开的行。
     * 失败置空数组避免展开态无限 loading（收起再展开不重拉，刷新列表可重试）。
     */
    useEffect(() => {
      rowsRef.current.forEach((project) => {
        if (
          !expandedIds.has(project.projectId) ||
          project.conversations !== undefined ||
          loadingConversationsRef.current.has(project.projectId)
        ) {
          return;
        }
        loadingConversationsRef.current.add(project.projectId);
        void apiUserProjectConversations(project.projectId, project.projectType)
          .then((res) => {
            updateProjectRow(project.projectId, {
              conversations: res.code === SUCCESS_CODE ? res.data ?? [] : [],
            });
          })
          .catch(() => {
            updateProjectRow(project.projectId, { conversations: [] });
          })
          .finally(() => {
            loadingConversationsRef.current.delete(project.projectId);
          });
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, expandedIds]);

    const updateConversationInRows = (
      conversationId: number,
      patch: Partial<ConversationInfo>,
    ) => {
      applyRows(
        rowsRef.current.map((project) => ({
          ...project,
          conversations: project.conversations?.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, ...patch }
              : conversation,
          ),
        })),
      );
    };

    // 项目标记切换（置顶/归档/收藏）：成功后才更新本地列表，失败不做乐观变更
    const handleProjectMenuClick = async (
      project: UserProjectTabItem,
      key: string,
    ) => {
      let res: { code?: string } | null = null;
      if (key === 'pin') {
        res = await apiUserProjectPin(
          project.projectId,
          !project.pinned,
          project.projectType,
        ).catch(() => null);
      } else if (key === 'archive') {
        res = await apiUserProjectArchive(
          project.projectId,
          !project.archived,
          project.projectType,
        ).catch(() => null);
      } else if (key === 'collect') {
        res = await (project.collected
          ? apiUserProjectUnCollect(project.projectId, project.projectType)
          : apiUserProjectCollect(project.projectId, project.projectType)
        ).catch(() => null);
      }
      if (res?.code !== SUCCESS_CODE) {
        message.error(t('PC.Common.Global.operationFailed'));
        return;
      }
      if (key === 'pin') {
        updateProjectRow(project.projectId, { pinned: !project.pinned });
        message.success(
          t(
            project.pinned
              ? 'PC.Components.ConversationContextMenu.unpinnedToast'
              : 'PC.Components.ConversationContextMenu.pinnedToast',
          ),
        );
        // 置顶成功广播 directorySync 事件（bug 2475）：左侧项目面板既有订阅
        // 按补丁即时增删标记集合（排前/隐藏），无需手动刷新
        emitProjectChanged({
          operation: 'updated',
          project: {
            projectId: String(project.projectId),
            projectType: project.projectType,
            ...(project.spaceId !== undefined
              ? { spaceId: String(project.spaceId) }
              : {}),
          },
          patch: { pinned: !project.pinned },
          origin: 'history-project-list',
          reason: project.pinned ? 'unpin' : 'pin',
        });
      } else if (key === 'archive') {
        updateProjectRow(project.projectId, { archived: !project.archived });
        message.success(
          t(
            project.archived
              ? 'PC.Components.ConversationContextMenu.unarchivedToast'
              : 'PC.Components.ConversationContextMenu.archivedToast',
          ),
        );
        emitProjectChanged({
          operation: 'updated',
          project: {
            projectId: String(project.projectId),
            projectType: project.projectType,
            ...(project.spaceId !== undefined
              ? { spaceId: String(project.spaceId) }
              : {}),
          },
          patch: { archived: !project.archived },
          origin: 'history-project-list',
          reason: project.archived ? 'unarchive' : 'archive',
        });
      } else if (key === 'collect') {
        updateProjectRow(project.projectId, { collected: !project.collected });
        message.success(
          t(
            project.collected
              ? 'PC.Components.ConversationContextMenu.uncollectedToast'
              : 'PC.Components.ConversationContextMenu.collectedToast',
          ),
        );
      }
    };

    const buildProjectMenu = (project: UserProjectTabItem) => ({
      items: [
        {
          key: 'pin',
          icon: <PushpinOutlined />,
          label: t(
            project.pinned
              ? 'PC.Components.HistoryConversationList.projectUnpin'
              : 'PC.Components.HistoryConversationList.projectPin',
          ),
        },
        {
          key: 'archive',
          icon: <InboxOutlined />,
          label: t(
            project.archived
              ? 'PC.Components.ConversationContextMenu.unarchive'
              : 'PC.Components.ConversationContextMenu.archive',
          ),
        },
        {
          key: 'collect',
          icon: project.collected ? <StarFilled /> : <StarOutlined />,
          label: t(
            project.collected
              ? 'PC.Components.ConversationContextMenu.unfavorite'
              : 'PC.Components.ConversationContextMenu.favorite',
          ),
        },
      ],
      onClick: ({
        key,
        domEvent,
      }: {
        key: string;
        domEvent?:
          | React.MouseEvent<HTMLElement>
          | React.KeyboardEvent<HTMLElement>;
      }) => {
        domEvent?.stopPropagation();
        void handleProjectMenuClick(project, key);
      },
    });

    // 视图分类 tab：全部 / 已收藏（服务端）/ 已归档（前端过滤），与任务 tab 同款
    const viewTabs: Array<{ key: ProjectViewMode; label: string }> = [
      { key: 'all', label: t('PC.Common.Global.all') },
      {
        key: 'collected',
        label: t('PC.Components.HistoryConversationList.collectedTab'),
      },
      {
        key: 'archived',
        label: t('PC.Components.HistoryConversationList.archivedTab'),
      },
    ];

    const renderProjectRow = (project: UserProjectTabItem) => {
      const expanded = expandedIds.has(project.projectId);
      const children = filterProjectConversations(
        project.conversations,
        viewMode,
      );
      return (
        <div key={project.projectId} className={styles['project-block']}>
          <Dropdown menu={buildProjectMenu(project)} trigger={['contextMenu']}>
            <div
              className={styles['project-item']}
              onClick={() => toggleExpand(project.projectId)}
              role="button"
              tabIndex={0}
              aria-expanded={expanded}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggleExpand(project.projectId);
                }
              }}
            >
              {/* 展开指示=文件夹图标双态（2026-09-19 定调：行尾箭头去除，
                  展开=打开态/收起=默认态） */}
              {expanded ? (
                <FolderOpenOutlined className={styles['project-icon']} />
              ) : (
                <FolderOutlined className={styles['project-icon']} />
              )}
              {project.pinned === true && (
                <PushpinFilled className={styles['pin-icon']} />
              )}
              <span className={styles.name}>{project.name}</span>
              <span className={styles['type-badge']}>
                {t(
                  PROJECT_TYPE_LABEL_KEYS[project.projectType] ??
                    'PC.Pages.SpaceProjectManage.tabNormalProject',
                )}
              </span>
              <div className={styles['right-area']}>
                <span className={styles.date}>
                  {dayjs(project.modified).format(
                    t('PC.Components.HistoryConversationList.dateTimeFormat'),
                  )}
                </span>
                <Dropdown menu={buildProjectMenu(project)} trigger={['click']}>
                  <button
                    type="button"
                    className={styles['more-btn']}
                    aria-label={t('PC.Components.ActionMenu.more')}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <SvgIcon
                      name="icons-common-more"
                      style={{ fontSize: 15 }}
                    />
                  </button>
                </Dropdown>
              </div>
            </div>
          </Dropdown>
          {expanded && (
            <div className={styles.children}>
              {project.conversations === undefined ? (
                // 子会话懒加载中（统一接口不随列表回包，展开时才拉取）
                <div className={cx(styles.child, styles['child-empty'])}>
                  <Spin size="small" />
                </div>
              ) : children.length === 0 ? (
                <div className={cx(styles.child, styles['child-empty'])}>
                  {t(
                    'PC.Components.HistoryConversationList.projectNoConversations',
                  )}
                </div>
              ) : (
                children.map((conversation) => (
                  <ConversationContextMenu
                    key={conversation.id}
                    conversationId={conversation.id}
                    currentTopic={conversation.topic}
                    pinned={conversation.pinned === true}
                    archived={conversation.archived === true}
                    collected={conversation.collected === true}
                    showMoreButton
                    onFlagChanged={(kind, enabled) => {
                      updateConversationInRows(conversation.id, {
                        [kind]: enabled,
                      });
                    }}
                    onCollectedChanged={(collected) => {
                      updateConversationInRows(conversation.id, { collected });
                    }}
                    onRename={
                      onEdit
                        ? () => onEdit(conversation.id, conversation.topic)
                        : undefined
                    }
                    onDelete={
                      onDelete ? () => onDelete(conversation.id) : undefined
                    }
                  >
                    {(moreButton) => (
                      <div
                        className={styles.child}
                        onClick={() =>
                          history.push(resolveConversationRoute(conversation))
                        }
                      >
                        <span className={styles['child-topic']}>
                          {/* 空主题回退与首页项目子会话同口径（topic → agent 名 → 新建会话） */}
                          {conversation.topic ||
                            conversation.agent?.name ||
                            t('PC.Constants.Menus.newChat')}
                        </span>
                        <span className={styles['child-meta']}>
                          <span className={styles.date}>
                            {dayjs(conversation.modified).format(
                              t(
                                'PC.Components.HistoryConversationList.dateTimeFormat',
                              ),
                            )}
                          </span>
                          {moreButton}
                        </span>
                      </div>
                    )}
                  </ConversationContextMenu>
                ))
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className={styles.view}>
        <div className={styles.tabs}>
          {viewTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={
                viewMode === tab.key
                  ? `${styles['tab']} ${styles['tab-active']}`
                  : styles.tab
              }
              onClick={() => setViewMode(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div
          ref={containerRef}
          className={cx(styles.container, 'scroll-container')}
        >
          <div className={styles['list-content']}>
            {visibleRows.map(renderProjectRow)}
            {loading && (
              <div className={styles.loading}>
                <Spin size="small" />
              </div>
            )}
            {/* 三视图空态提示 */}
            {!loading && visibleRows.length === 0 && (
              <div className={styles.nomore}>
                {t(
                  viewMode === 'collected'
                    ? 'PC.Components.HistoryConversationList.projectCollectedEmpty'
                    : viewMode === 'archived'
                    ? 'PC.Components.HistoryConversationList.projectArchivedEmpty'
                    : 'PC.Components.HistoryConversationList.projectEmpty',
                )}
              </div>
            )}
            {!hasMore && visibleRows.length > 8 && (
              <div className={styles.nomore}>
                {t('PC.Components.HistoryConversationList.noMoreData')}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

export default ProjectList;
