import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { useProjectChanged } from '@/hooks/useDirectorySync';
import { dict } from '@/services/i18nRuntime';
import {
  apiNormalProjectDelete,
  apiUserAppDelete,
  apiUserProjectPageQuery,
} from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import type {
  UserAppInfo,
  UserProjectItem,
  UserProjectTabPageResult,
} from '@/types/interfaces/userProject';
import {
  applyProjectChangedToList,
  emitProjectChanged,
} from '@/utils/directorySyncEvents';
import { DownOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Dropdown, Empty, Input, Modal } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { history, useLocation, useParams, useRequest } from 'umi';
import CreateUserApp from '../AppDevPro/components/CreateUserApp';
import CreateNormalProjectModal from './components/CreateNormalProjectModal';
import EditNormalProjectModal, {
  type EditedNormalProjectInfo,
} from './components/EditNormalProjectModal';
import ProjectManageItem from './components/ProjectManageItem';
import styles from './index.less';
import { normalizeProjectRows, type ProjectListItem } from './projectRows';
import { apiThirdAppOauth2Delete } from './services/thirdAppOauth2';
import CreateThirdAppModal from './ThirdAppIntegration/CreateThirdAppModal';
import EditThirdAppModal, {
  type EditedThirdAppInfo,
} from './ThirdAppIntegration/EditThirdAppModal';
import {
  openProject,
  PROJECT_TAB_LABEL_KEYS,
  PROJECT_TAB_TYPES,
  type ProjectTabKey,
} from './type';

const cx = classNames.bind(styles);
const PAGE_SIZE = 48;
const SCROLL_CONTAINER_ID = 'space-project-manage-scroll';

/**
 * 空间项目管理页：聚合展示常规项目、全栈应用、三方应用（及历史网页应用）。
 *
 * 功能概览：
 * - Tab 筛选：「全部」单次 page-query 不传 projectType；切换类型 Tab 时附带 projectType
 * - 搜索：按项目名称模糊匹配；列表滚动到底部分页加载（pageSize=48）
 * - 新建：下拉菜单支持创建常规项目 / 全栈应用 / 三方应用，成功后跳转对应详情页
 * - 卡片操作：常规/全栈/三方均支持编辑（各类型对应编辑弹窗）与删除
 * - 列表 UI 对齐 SpaceLibrary；卡片由 ProjectManageItem 渲染（CardWrapper 布局）
 *
 * @returns 项目管理页面
 */
const SpaceProjectManage: React.FC = () => {
  const params = useParams();
  const location = useLocation();
  const spaceId = Number(params.spaceId);
  /** 侧边栏重复点击同一菜单时通过 location.state._t 触发列表刷新 */
  const refreshToken = (location.state as { _t?: number } | null)?._t ?? 0;

  // ---- 列表查询态 ----
  const [activeTab, setActiveTab] = useState<ProjectTabKey>('all');
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<ProjectListItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // ---- 新建弹窗态 ----
  const [openCreateNormal, setOpenCreateNormal] = useState(false);
  const [openCreateUserApp, setOpenCreateUserApp] = useState(false);
  const [openCreateThirdApp, setOpenCreateThirdApp] = useState(false);

  // ---- 编辑弹窗态 ----
  const [editNormalProjectTarget, setEditNormalProjectTarget] =
    useState<ProjectListItem>();
  const [editUserAppTarget, setEditUserAppTarget] =
    useState<ProjectListItem>();
  const [editThirdAppTarget, setEditThirdAppTarget] =
    useState<ProjectListItem>();

  const projectTypeFilter =
    activeTab === 'all' ? undefined : activeTab;

  /** 分页查询当前 Tab + 关键词下的项目列表 */
  const { run, loading } = useRequest(
    (name?: string, pageIndex: number = 1) =>
      apiUserProjectPageQuery({
        queryFilter: {
          spaceId,
          name: name?.trim() || undefined,
          ...(projectTypeFilter ? { projectType: projectTypeFilter } : {}),
        },
        current: pageIndex,
        pageSize: PAGE_SIZE,
        orders: [],
        filters: [],
        columns: [],
      }),
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (
        result: UserProjectTabPageResult,
        params: [name?: string, pageIndex?: number],
      ) => {
        const pageResult = result;
        if (!pageResult) {
          setList([]);
          setHasMore(false);
          setHasLoaded(true);
          return;
        }
        const current = pageResult.current || params[1] || 1;
        const size = pageResult.size || PAGE_SIZE;
        const records = Array.isArray(pageResult.records)
          ? normalizeProjectRows(pageResult.records, projectTypeFilter)
          : [];
        setList((previous) => {
          if (current === 1) {
            return records;
          }
          const merged = new Map<string, ProjectListItem>();
          previous.forEach((item) =>
            merged.set(`${item.projectType}-${item.id}`, item),
          );
          records.forEach((item) =>
            merged.set(`${item.projectType}-${item.id}`, item),
          );
          return [...merged.values()].sort((a, b) =>
            (b.modified || '').localeCompare(a.modified || ''),
          );
        });
        setPage(current);
        setHasMore(current * size < (pageResult.total || 0));
        setHasLoaded(true);
      },
      onError: (
        _error: unknown,
        params: [name?: string, pageIndex?: number],
      ) => {
        if ((params[1] || 1) === 1) {
          setList([]);
          setHasMore(false);
        }
        setHasLoaded(true);
      },
    },
  );

  /** 重复点击菜单、切换空间或 Tab：重置列表态，展示与首次进入一致的 Loading */
  useEffect(() => {
    setHasLoaded(false);
    setList([]);
    setPage(1);
    setHasMore(true);
  }, [refreshToken, spaceId, activeTab]);

  /** Tab、关键词、空间或菜单重复点击时，从第一页重新加载 */
  useEffect(() => {
    if (!spaceId) {
      return;
    }
    run(keyword, 1);
  }, [keyword, refreshToken, run, spaceId, activeTab]);

  /** 滚动到底部后加载下一页 */
  const handleLoadMore = useCallback(() => {
    if (loading || !hasMore) {
      return;
    }
    run(keyword, page + 1);
  }, [hasMore, keyword, loading, page, run]);

  /** 监听跨页面项目变更事件，同步列表（创建全量刷新，更新/删除增量合并） */
  useProjectChanged((event) => {
    if (
      event.project.spaceId !== undefined &&
      event.project.spaceId !== String(spaceId)
    ) {
      return;
    }
    if (event.operation === 'created') {
      run(keyword, 1);
      return;
    }
    setList((previous) =>
      applyProjectChangedToList<ProjectListItem>(previous, event),
    );
  });

  /** 顶部类型 Tab：全部 + 常规 / 全栈 / 三方 */
  const tabs = useMemo(
    () => ['all', ...PROJECT_TAB_TYPES] as ProjectTabKey[],
    [],
  );

  /** 新建下拉菜单项（key 为 AgentComponentTypeEnum） */
  const createMenuItems = [
    {
      key: AgentComponentTypeEnum.NormalProject,
      label: dict('PC.Pages.SpaceProjectManage.createNormalProject'),
    },
    {
      key: AgentComponentTypeEnum.UserApp,
      label: dict('PC.Pages.SpaceProjectManage.createUserApp'),
    },
    {
      key: AgentComponentTypeEnum.ThirdApp,
      label: dict('PC.Pages.SpaceProjectManage.tabThirdApp'),
    },
  ];

  /** 根据所选类型打开对应创建弹窗 */
  const handleCreateMenuClick = (key: string) => {
    if (key === AgentComponentTypeEnum.NormalProject) {
      setOpenCreateNormal(true);
      return;
    }
    if (key === AgentComponentTypeEnum.UserApp) {
      setOpenCreateUserApp(true);
      return;
    }
    if (key === AgentComponentTypeEnum.ThirdApp) {
      setOpenCreateThirdApp(true);
    }
  };

  /**
   * 点击卡片：按 projectType 跳转各类型详情页。
   * 未知类型回退 openProject 通用逻辑。
   */
  const handleOpenProject = useCallback(
    (item: ProjectListItem) => {
      switch (item.projectType) {
        case AgentComponentTypeEnum.NormalProject:
          history.push(`/space/${spaceId}/normal-project-detail/${item.id}`);
          return;
        case AgentComponentTypeEnum.UserApp:
          history.push(`/space/${spaceId}/app-project-detail/${item.id}`);
          return;
        case AgentComponentTypeEnum.ThirdApp:
          history.push(`/space/${spaceId}/third-app-detail/${item.id}`);
          return;
        default:
          openProject(spaceId, item);
      }
    },
    [spaceId],
  );

  /** 是否展示卡片「更多」菜单（网页应用等历史类型仅支持查看） */
  const supportsManageActions = useCallback(
    (projectType: AgentComponentTypeEnum) =>
      projectType === AgentComponentTypeEnum.NormalProject ||
      projectType === AgentComponentTypeEnum.UserApp ||
      projectType === AgentComponentTypeEnum.ThirdApp,
    [],
  );

  /** 编辑入口：按项目类型打开对应编辑弹窗 */
  const handleEditProject = useCallback((item: ProjectListItem) => {
    if (item.projectType === AgentComponentTypeEnum.NormalProject) {
      setEditNormalProjectTarget(item);
      return;
    }
    if (item.projectType === AgentComponentTypeEnum.UserApp) {
      setEditUserAppTarget(item);
      return;
    }
    if (item.projectType === AgentComponentTypeEnum.ThirdApp) {
      setEditThirdAppTarget(item);
    }
  }, []);

  /** 常规项目编辑成功后更新本地列表 */
  const handleNormalProjectEdited = useCallback(
    (projectId: number, editedInfo: EditedNormalProjectInfo) => {
      setList((previous) =>
        previous.map((item) =>
          item.id === projectId &&
          item.projectType === AgentComponentTypeEnum.NormalProject
            ? { ...item, ...editedInfo }
            : item,
        ),
      );
      setEditNormalProjectTarget(undefined);
    },
    [],
  );

  /** 全栈应用编辑成功后更新本地列表 */
  const handleUserAppEdited = useCallback((info: UserAppInfo) => {
    setList((previous) =>
      previous.map((item) =>
        item.id === info.id && item.projectType === AgentComponentTypeEnum.UserApp
          ? {
              ...item,
              name: info.name,
              description: info.description,
              icon: info.icon,
            }
          : item,
      ),
    );
    setEditUserAppTarget(undefined);
  }, []);

  /** 三方应用编辑成功后更新本地列表并广播 directorySync 事件 */
  const handleThirdAppEdited = useCallback(
    (appId: number, editedInfo: EditedThirdAppInfo) => {
      setList((previous) =>
        previous.map((item) =>
          item.id === appId &&
          item.projectType === AgentComponentTypeEnum.ThirdApp
            ? { ...item, ...editedInfo }
            : item,
        ),
      );
      emitProjectChanged({
        operation: 'updated',
        project: {
          projectId: String(appId),
          projectType: AgentComponentTypeEnum.ThirdApp,
          spaceId: String(spaceId),
        },
        patch: editedInfo,
        origin: 'space-project-manage',
        reason: 'edit',
      });
      setEditThirdAppTarget(undefined);
    },
    [spaceId],
  );

  /** 删除前二次确认；按类型调用对应删除接口 */
  const openDeleteConfirm = useCallback(
    (item: ProjectListItem) => {
      Modal.confirm({
        title: dict('PC.Common.Global.deleteConfirmTitle'),
        content: dict(
          'PC.Pages.SpaceProjectManage.deleteConfirmContent',
          item.name,
        ),
        okButtonProps: { danger: true },
        okText: dict('PC.Common.Global.delete'),
        cancelText: dict('PC.Common.Global.cancel'),
        onOk: async () => {
          const res =
            item.projectType === AgentComponentTypeEnum.UserApp
              ? await apiUserAppDelete(item.id)
              : item.projectType === AgentComponentTypeEnum.ThirdApp
                ? await apiThirdAppOauth2Delete(item.id)
                : await apiNormalProjectDelete(item.id);
          if (res?.code === SUCCESS_CODE) {
            emitProjectChanged({
              operation: 'deleted',
              project: {
                projectId: String(item.id),
                projectType: item.projectType,
                spaceId: String(spaceId),
              },
              origin: 'space-project-manage',
              reason: 'delete',
            });
            run(keyword, 1);
          }
        },
      });
    },
    [keyword, run, spaceId],
  );

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.SpaceProjectManage.menuTitle')}
      hideScroll
      leftSlot={
        // 类型 Tab
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={
                tab === activeTab
                  ? `${styles.tab} ${styles['tab-active']}`
                  : styles.tab
              }
              onClick={() => setActiveTab(tab)}
            >
              {dict(PROJECT_TAB_LABEL_KEYS[tab])}
            </button>
          ))}
        </div>
      }
      rightSlot={
        <>
          {/* 项目名称搜索 */}
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={dict('PC.Pages.SpaceProjectManage.searchPlaceholder')}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onClear={() => setKeyword('')}
            style={{ width: 214 }}
          />
          {/* 新建：常规项目 / 全栈应用 / 三方应用 */}
          <Dropdown
            trigger={['click']}
            menu={{
              items: createMenuItems,
              onClick: ({ key }) => handleCreateMenuClick(key),
            }}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              {dict('PC.Pages.SpaceProjectManage.createButton')}
              <DownOutlined />
            </Button>
          </Dropdown>
        </>
      }
    >
      {/* 列表区：Loading / 滚动分页卡片网格 / 空态 */}
      <div className={cx(styles['project-manage'], 'flex', 'flex-col', 'h-full')}>
        {!hasLoaded ? (
          <Loading />
        ) : list.length > 0 ? (
          <div
            id={SCROLL_CONTAINER_ID}
            className={cx('flex-1', 'scroll-container-hide')}
          >
            <InfiniteScrollDiv
              scrollableTarget={SCROLL_CONTAINER_ID}
              list={list}
              hasMore={hasMore}
              showLoader={loading}
              onScroll={handleLoadMore}
            >
              <div className={cx(styles['main-container'])}>
                {list.map((item) => (
                  <ProjectManageItem
                    key={`${item.projectType}-${item.id}`}
                    item={item}
                    onClick={handleOpenProject}
                    onEdit={
                      supportsManageActions(item.projectType)
                        ? handleEditProject
                        : undefined
                    }
                    onDelete={
                      supportsManageActions(item.projectType)
                        ? openDeleteConfirm
                        : undefined
                    }
                  />
                ))}
              </div>
            </InfiniteScrollDiv>
          </div>
        ) : (
          <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
            <Empty description={dict('PC.Pages.SpaceProjectManage.emptyText')} />
          </div>
        )}
      </div>

      {/* 新建：常规项目 */}
      <CreateNormalProjectModal
        spaceId={spaceId}
        open={openCreateNormal}
        onCancel={() => setOpenCreateNormal(false)}
        onConfirm={(project) => {
          setOpenCreateNormal(false);
          history.push(`/space/${spaceId}/normal-project-detail/${project.id}`);
        }}
      />
      {/* 新建：全栈应用 */}
      <CreateUserApp
        spaceId={spaceId}
        mode={CreateUpdateModeEnum.Create}
        open={openCreateUserApp}
        onCancel={() => setOpenCreateUserApp(false)}
        onConfirmCreate={(result) => {
          setOpenCreateUserApp(false);
          history.push(`/space/${spaceId}/app-project-detail/${result.id}`);
        }}
      />
      {/* 新建：三方应用 */}
      <CreateThirdAppModal
        spaceId={spaceId}
        open={openCreateThirdApp}
        onCancel={() => setOpenCreateThirdApp(false)}
        onCreated={(projectId) => {
          setOpenCreateThirdApp(false);
          history.push(`/space/${spaceId}/third-app-detail/${projectId}`);
        }}
      />
      {/* 编辑：常规项目（名称/描述/图标） */}
      <EditNormalProjectModal
        project={editNormalProjectTarget as UserProjectItem | undefined}
        onCancel={() => setEditNormalProjectTarget(undefined)}
        onEdited={handleNormalProjectEdited}
      />
      {/* 编辑：全栈应用（名称/描述/图标） */}
      <CreateUserApp
        mode={CreateUpdateModeEnum.Update}
        userAppInfo={editUserAppTarget as UserAppInfo | undefined}
        open={editUserAppTarget !== undefined}
        onCancel={() => setEditUserAppTarget(undefined)}
        onConfirmUpdate={handleUserAppEdited}
      />
      {/* 编辑：三方应用（名称/描述/图标） */}
      <EditThirdAppModal
        app={editThirdAppTarget as UserProjectItem | undefined}
        onCancel={() => setEditThirdAppTarget(undefined)}
        onEdited={handleThirdAppEdited}
      />
    </WorkspaceLayout>
  );
};

export default SpaceProjectManage;
