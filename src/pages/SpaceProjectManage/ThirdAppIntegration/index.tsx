import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { RequestResponse } from '@/types/interfaces/request';
import type {
  UserProjectItem,
  UserProjectPageResult,
} from '@/types/interfaces/userProject';
import { needsTopRightAvoid, shellAvoid } from '@/utils/hostBridge';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Modal } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { history, useLocation, useParams, useRequest } from 'umi';
import { apiUserProjectPageQuery } from '../services';
import { apiThirdAppOauth2Delete } from '../services/thirdAppOauth2';
import CreateThirdAppModal from './CreateThirdAppModal';
import EditThirdAppModal, {
  type EditedThirdAppInfo,
} from './EditThirdAppModal';
import ProjectListCard from '../components/ProjectListCard';
import styles from './index.less';

const cx = classNames.bind(styles);
const PAGE_SIZE = 48;
const SCROLL_CONTAINER_ID = 'third-app-integration-scroll';

/** page-query 行可能使用 projectId 作主键，统一成卡片需要的 id */
const normalizeProjectRow = (
  row: UserProjectItem & { projectId?: number },
): UserProjectItem => ({
  ...row,
  id: row.id || row.projectId || 0,
  projectType: row.projectType || AgentComponentTypeEnum.ThirdApp,
});

/**
 * 第三方应用接入列表。
 *
 * 页面结构复用全栈应用列表，分页查询固定传 projectType=ThirdApp；
 * 创建和编辑使用第三方应用 OAuth2 接口。
 *
 * @returns 第三方应用列表页面
 */
const ThirdAppIntegration: React.FC = () => {
  const params = useParams();
  const location = useLocation();
  const spaceId = Number(params.spaceId);
  const refreshToken = (location.state as { _t?: number } | null)?._t ?? 0;

  const [keyword, setKeyword] = useState<string>('');
  const [list, setList] = useState<UserProjectItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<UserProjectItem>();

  /** 查询第三方应用列表 */
  const { run: runQuery, loading } = useRequest(
    (name?: string, pageIndex: number = 1) =>
      apiUserProjectPageQuery({
        queryFilter: {
          spaceId,
          projectType: AgentComponentTypeEnum.ThirdApp,
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
    runQuery(keyword, 1);
  }, [keyword, refreshToken, runQuery, spaceId]);

  /** 滚动到底部后加载下一页 */
  const handleLoadMore = useCallback(() => {
    if (loading || !hasMore) {
      return;
    }
    runQuery(keyword, page + 1);
  }, [hasMore, keyword, loading, page, runQuery]);

  /** 打开编辑弹窗 */
  const handleEdit = useCallback((item: UserProjectItem) => {
    setEditTarget(item);
  }, []);

  /** 编辑成功后同步更新卡片信息 */
  const handleEdited = useCallback(
    (appId: number, editedInfo: EditedThirdAppInfo) => {
      setList((previous) =>
        previous.map((item) =>
          item.id === appId ? { ...item, ...editedInfo } : item,
        ),
      );
      setEditTarget(undefined);
    },
    [],
  );

  /** 关闭编辑弹窗 */
  const handleEditCancel = useCallback(() => {
    setEditTarget(undefined);
  }, []);

  /** 删除第三方应用前二次确认 */
  const handleDelete = useCallback(
    (item: UserProjectItem) => {
      Modal.confirm({
        title: dict('PC.Common.Global.deleteConfirmTitle'),
        content: dict('PC.Common.Global.deleteConfirmContent'),
        okButtonProps: { danger: true },
        okText: dict('PC.Common.Global.delete'),
        cancelText: dict('PC.Common.Global.cancel'),
        onOk: async () => {
          const response = await apiThirdAppOauth2Delete(item.id);
          if (response?.code === SUCCESS_CODE) {
            runQuery(keyword, 1);
          }
        },
      });
    },
    [keyword, runQuery],
  );

  /** 创建完成后跳转三方应用详情页 */
  const handleCreated = useCallback(
    (projectId: number) => {
      setCreateOpen(false);
      history.push(`/space/${spaceId}/third-app-detail/${projectId}`);
    },
    [spaceId],
  );

  /** 打开三方应用详情 */
  const handleOpenProject = useCallback(
    (item: UserProjectItem) => {
      history.push(`/space/${spaceId}/third-app-detail/${item.id}`);
    },
    [spaceId],
  );

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
            {dict('PC.Pages.ThirdAppIntegration.title')}
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
            onClick={() => setCreateOpen(true)}
          >
            {dict('PC.Pages.ThirdAppIntegration.createButton')}
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
                <ProjectListCard
                  key={item.id}
                  item={item}
                  onClick={handleOpenProject}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
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

      <CreateThirdAppModal
        spaceId={spaceId}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <EditThirdAppModal
        app={editTarget}
        onCancel={handleEditCancel}
        onEdited={handleEdited}
      />
    </div>
  );
};

export default ThirdAppIntegration;
