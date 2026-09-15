import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import useHomePinnedProjectHandoff from '@/hooks/useHomePinnedProjectHandoff';
import { dict } from '@/services/i18nRuntime';
import { apiNormalProjectDelete } from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { RequestResponse } from '@/types/interfaces/request';
import type { UserProjectItem } from '@/types/interfaces/userProject';
import { needsTopRightAvoid, shellAvoid } from '@/utils/hostBridge';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Modal } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { history, useLocation, useParams, useRequest } from 'umi';
import CreateNormalProjectModal from '../components/CreateNormalProjectModal';
import EditNormalProjectModal, {
  type EditedNormalProjectInfo,
} from '../components/EditNormalProjectModal';
import ProjectCard from '../components/ProjectCard';
import { apiUserProjectPageQuery } from '../services';
import { openProject } from '../type';
import styles from './index.less';

const cx = classNames.bind(styles);

/** page-query 行可能用 projectId 作主键，统一成 id */
const normalizeProjectRow = (
  row: UserProjectItem & { projectId?: number },
): UserProjectItem => ({
  ...row,
  id: row.id || row.projectId || 0,
  projectType: row.projectType || AgentComponentTypeEnum.NormalProject,
});

/**
 * 常规项目列表：布局对齐 SpaceDevelop（标题 + 搜索 + 创建），
 * 列表走 apiUserProjectPageQuery，卡片结构对齐项目管理截图，
 * 图标 / 标题 / 描述 / 日期字号对齐 ApplicationItem。
 */
const NormalProject: React.FC = () => {
  const params = useParams();
  const location = useLocation();
  const spaceId = Number(params.spaceId);
  const refreshToken = (location.state as { _t?: number } | null)?._t ?? 0;
  const { pin } = useHomePinnedProjectHandoff();

  const [keyword, setKeyword] = useState<string>('');
  const [list, setList] = useState<UserProjectItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<UserProjectItem>();

  const { run, loading } = useRequest(
    (name?: string) =>
      apiUserProjectPageQuery({
        queryFilter: {
          spaceId,
          projectType: AgentComponentTypeEnum.NormalProject,
          name: name?.trim() || undefined,
        },
        current: 1,
        pageSize: 50,
        orders: [],
        filters: [],
        columns: [],
      }),
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (
        result: RequestResponse<{ records?: UserProjectItem[] }> & {
          records?: UserProjectItem[];
        },
      ) => {
        const records = Array.isArray(result?.records)
          ? result.records
          : Array.isArray(result?.data?.records)
          ? result.data.records
          : [];
        setList(records.map(normalizeProjectRow).filter((item) => item.id));
        setHasLoaded(true);
      },
      onError: () => {
        setList([]);
        setHasLoaded(true);
      },
    },
  );

  /** 搜索、空间变化或重复点击菜单时，从第一页重新加载 */
  useEffect(() => {
    if (!spaceId) {
      return;
    }
    run(keyword);
  }, [keyword, refreshToken, run, spaceId]);

  const handleOpenProject = useCallback(
    (item: UserProjectItem) => {
      history.push(`/space/${spaceId}/normal-project-detail/${item.id}`);
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
          const res = await apiNormalProjectDelete(item.id);
          if (res?.code === SUCCESS_CODE) {
            run(keyword);
          }
        },
      });
    },
    [keyword, run],
  );

  /** 打开常规项目编辑弹窗 */
  const handleEdit = useCallback((item: UserProjectItem) => {
    setEditTarget(item);
  }, []);

  /** 编辑成功后同步更新卡片 */
  const handleEdited = useCallback(
    (projectId: number, editedInfo: EditedNormalProjectInfo) => {
      setList((previous) =>
        previous.map((item) =>
          item.id === projectId ? { ...item, ...editedInfo } : item,
        ),
      );
      setEditTarget(undefined);
    },
    [],
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
            {dict('PC.Pages.SpaceProjectManage.tabNormalProject')}
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
            {dict('PC.Pages.SpaceProjectManage.createNormalProjectBtn')}
          </Button>
        </div>
      </div>

      {loading || !hasLoaded ? (
        <Loading />
      ) : list.length > 0 ? (
        <div
          className={cx(
            styles['main-container'],
            'flex-1',
            'scroll-container-hide',
          )}
        >
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
      ) : (
        <div className={cx('flex', 'items-center', 'content-center', 'h-full')}>
          <Empty description={dict('PC.Pages.SpaceProjectManage.emptyText')} />
        </div>
      )}

      <CreateNormalProjectModal
        spaceId={spaceId}
        open={openCreate}
        onCancel={() => setOpenCreate(false)}
        onConfirm={(project) => {
          setOpenCreate(false);
          if (project.conversationId && project.agentId) {
            openProject(
              spaceId,
              {
                id: project.id,
                projectType: AgentComponentTypeEnum.NormalProject,
              },
              project.conversationId,
              project.agentId,
            );
            return;
          }
          pin({
            projectId: project.id,
            spaceId,
            projectType: AgentComponentTypeEnum.NormalProject,
            name: project.name,
            sandboxId: project.sandboxId,
          });
        }}
      />

      <EditNormalProjectModal
        project={editTarget}
        onCancel={() => setEditTarget(undefined)}
        onEdited={handleEdited}
      />
    </div>
  );
};

export default NormalProject;
