import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiUserAppDelete } from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import type { RequestResponse } from '@/types/interfaces/request';
import type {
  UserAppInfo,
  UserProjectItem,
} from '@/types/interfaces/userProject';
import { needsTopRightAvoid, shellAvoid } from '@/utils/hostBridge';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Modal } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { history, useLocation, useParams, useRequest } from 'umi';
import CreateUserApp from '../../AppDevPro/components/CreateUserApp';
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

  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<UserProjectItem[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<UserProjectItem>();

  const { run, loading } = useRequest(
    (name?: string) =>
      apiUserProjectPageQuery({
        queryFilter: {
          spaceId,
          projectType: AgentComponentTypeEnum.UserApp,
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
      },
      onError: () => {
        setList([]);
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
            run(keyword);
          }
        },
      });
    },
    [keyword, run],
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

      {loading ? (
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

      <CreateUserApp
        spaceId={spaceId}
        mode={CreateUpdateModeEnum.Create}
        open={openCreate}
        onCancel={() => setOpenCreate(false)}
        onConfirmCreate={(result) => {
          setOpenCreate(false);
          openProject(
            spaceId,
            { id: result.id, projectType: AgentComponentTypeEnum.UserApp },
            result.conversationId,
          );
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
