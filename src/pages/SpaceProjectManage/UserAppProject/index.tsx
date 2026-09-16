import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { useProjectChanged } from '@/hooks/useDirectorySync';
import { dict } from '@/services/i18nRuntime';
import { apiUserAppDelete } from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import type {
  UserAppInfo,
  UserProjectItem,
  UserProjectPageResult,
} from '@/types/interfaces/userProject';
import {
  applyProjectChangedToList,
  emitProjectChanged,
} from '@/utils/directorySyncEvents';
import { needsTopRightAvoid, shellAvoid } from '@/utils/hostBridge';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Modal } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { history, useLocation, useParams, useRequest } from 'umi';
import CreateUserApp from '../../AppDevPro/components/CreateUserApp';
import ProjectCard from '../components/ProjectCard';
import { apiUserProjectPageQuery } from '../services';
import styles from './index.less';

const cx = classNames.bind(styles);
const PAGE_SIZE = 48;
const SCROLL_CONTAINER_ID = 'user-app-project-scroll';

/** page-query 行可能用 projectId 作主键，统一成 id */
const normalizeProjectRow = (
  row: UserProjectItem & { projectId?: number },
): UserProjectItem => ({
  ...row,
  id: row.id || row.projectId || 0,
  projectType: row.projectType || AgentComponentTypeEnum.UserApp,
});

/**
 * 全栈应用列表：布局、查询、卡片与常规项目页一致，
 * 仅 page-query 的 projectType 为 UserApp。
 */
const UserAppProject: React.FC = () => {
  const params = useParams();
  const location = useLocation();
  const spaceId = Number(params.spaceId);
  const refreshToken = (location.state as { _t?: number } | null)?._t ?? 0;

  const [keyword, setKeyword] = useState<string>('');
  const [list, setList] = useState<UserProjectItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<UserProjectItem>();

  const { run, loading } = useRequest(
    (name?: string, pageIndex: number = 1) =>
      apiUserProjectPageQuery({
        queryFilter: {
          spaceId,
          projectType: AgentComponentTypeEnum.UserApp,
          name: name?.trim() || undefined,
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
        result: UserProjectPageResult,
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
          ? pageResult.records
              .map(normalizeProjectRow)
              .filter((item) => item.id)
          : [];
        setList((previous) =>
          current === 1 ? records : [...previous, ...records],
        );
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

  /** 重复点击菜单或切换空间：重置列表态，展示与首次进入一致的 Loading */
  useEffect(() => {
    setHasLoaded(false);
    setList([]);
    setPage(1);
    setHasMore(true);
  }, [refreshToken, spaceId]);

  /** 搜索、空间变化或重复点击菜单时，从第一页重新加载 */
  useEffect(() => {
    if (!spaceId) {
      return;
    }
    run(keyword, 1);
  }, [keyword, refreshToken, run, spaceId]);

  useProjectChanged((event) => {
    if (
      event.project.projectType !== AgentComponentTypeEnum.UserApp ||
      (event.project.spaceId !== undefined &&
        event.project.spaceId !== String(spaceId))
    ) {
      return;
    }
    if (event.operation === 'created') {
      run(keyword, 1);
      return;
    }
    setList((previous) =>
      applyProjectChangedToList<UserProjectItem>(previous, event),
    );
  });

  /** 滚动到底部后加载下一页 */
  const handleLoadMore = useCallback(() => {
    if (loading || !hasMore) {
      return;
    }
    run(keyword, page + 1);
  }, [hasMore, keyword, loading, page, run]);

  const handleOpenProject = useCallback(
    (item: UserProjectItem) => {
      history.push(`/space/${spaceId}/app-project-detail/${item.id}`);
    },
    [spaceId],
  );

  const openDeleteConfirm = useCallback(
    (item: UserProjectItem) => {
      Modal.confirm({
        title: dict('PC.Common.Global.deleteConfirmTitle'),
        content: dict('PC.Common.Global.deleteConfirmContent'),
        okButtonProps: { danger: true },
        okText: dict('PC.Common.Global.delete'),
        cancelText: dict('PC.Common.Global.cancel'),
        onOk: async () => {
          const res = await apiUserAppDelete(item.id);
          if (res?.code === SUCCESS_CODE) {
            emitProjectChanged({
              operation: 'deleted',
              project: {
                projectId: String(item.id),
                projectType: AgentComponentTypeEnum.UserApp,
                spaceId: String(spaceId),
              },
              origin: 'user-app-project-list',
              reason: 'delete',
            });
            run(keyword, 1);
          }
        },
      });
    },
    [keyword, run, spaceId],
  );

  /** 打开全栈项目编辑弹窗 */
  const handleEdit = useCallback((item: UserProjectItem) => {
    setEditTarget(item);
  }, []);

  /** 编辑成功后同步更新卡片 */
  const handleEdited = useCallback((info: UserAppInfo) => {
    setList((previous) =>
      previous.map((item) =>
        item.id === info.id
          ? {
              ...item,
              name: info.name,
              description: info.description,
              icon: info.icon,
            }
          : item,
      ),
    );
    setEditTarget(undefined);
  }, []);

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <div
        className={cx(styles['header-area'])}
        style={{
          paddingRight: needsTopRightAvoid() ? shellAvoid.RIGHT : undefined,
        }}
      >
        <div className={cx(styles['header-left'])}>
          <h3 className={cx(styles.title)}>
            {dict('PC.Pages.SpaceProjectManage.tabUserApp')}
          </h3>
        </div>
        <div className={cx(styles['header-right'])}>
          <Input
            placeholder={dict('PC.Pages.SpaceProjectManage.searchPlaceholder')}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            prefix={<SearchOutlined />}
            allowClear
            onClear={() => setKeyword('')}
            style={{ width: 214 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpenCreate(true)}
          >
            {dict('PC.Pages.SpaceProjectManage.createUserAppBtn')}
          </Button>
        </div>
      </div>

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
                <ProjectCard
                  key={item.id}
                  item={item}
                  onClick={handleOpenProject}
                  onEdit={handleEdit}
                  onDelete={openDeleteConfirm}
                />
              ))}
            </div>
          </InfiniteScrollDiv>
        </div>
      ) : (
        <div className={cx('flex', 'items-center', 'content-center', 'h-full')}>
          <Empty description={dict('PC.Pages.SpaceProjectManage.emptyText')} />
        </div>
      )}

      <CreateUserApp
        spaceId={spaceId}
        mode={CreateUpdateModeEnum.Create}
        open={openCreate}
        onCancel={() => setOpenCreate(false)}
        onConfirmCreate={(result) => {
          setOpenCreate(false);
          history.push(`/space/${spaceId}/app-project-detail/${result.id}`);
        }}
      />

      <CreateUserApp
        mode={CreateUpdateModeEnum.Update}
        userAppInfo={editTarget as UserAppInfo | undefined}
        open={editTarget !== undefined}
        onCancel={() => setEditTarget(undefined)}
        onConfirmUpdate={handleEdited}
      />
    </div>
  );
};

export default UserAppProject;
