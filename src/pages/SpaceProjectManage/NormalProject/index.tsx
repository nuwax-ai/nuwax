import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import useHomePinnedProjectHandoff from '@/hooks/useHomePinnedProjectHandoff';
import { dict } from '@/services/i18nRuntime';
import {
  apiNormalProjectDelete,
  apiNormalProjectUpdate,
} from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { RequestResponse } from '@/types/interfaces/request';
import type { UserProjectItem } from '@/types/interfaces/userProject';
import { needsTopRightAvoid, shellAvoid } from '@/utils/hostBridge';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Modal } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { history, useParams, useRequest } from 'umi';
import CreateNormalProjectModal from '../components/CreateNormalProjectModal';
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
  const spaceId = Number(params.spaceId);
  const { pin } = useHomePinnedProjectHandoff();

  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<UserProjectItem[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [renameTarget, setRenameTarget] = useState<UserProjectItem>();
  const [renameName, setRenameName] = useState('');

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
      },
      onError: () => {
        setList([]);
      },
    },
  );

  useEffect(() => {
    if (!spaceId) {
      return;
    }
    run(keyword);
  }, [keyword, spaceId]);

  const handleOpenProject = useCallback(
    (item: UserProjectItem) => {
      history.push(`/space/${spaceId}/normal-project-detail/${item.id}`);
    },
    [spaceId],
  );

  const handleRenameSubmit = async () => {
    const name = renameName.trim();
    if (!name || !renameTarget) {
      return;
    }
    const res = await apiNormalProjectUpdate({ id: renameTarget.id, name });
    if (res?.code !== SUCCESS_CODE) {
      return;
    }
    setList((prev) =>
      prev.map((item) =>
        item.id === renameTarget.id ? { ...item, name } : item,
      ),
    );
    setRenameTarget(undefined);
  };

  const openDeleteConfirm = useCallback((item: UserProjectItem) => {
    Modal.confirm({
      title: dict('PC.Common.Global.deleteConfirmTitle'),
      content: dict('PC.Common.Global.deleteConfirmContent'),
      okButtonProps: { danger: true },
      okText: dict('PC.Common.Global.delete'),
      cancelText: dict('PC.Common.Global.cancel'),
      onOk: async () => {
        const res = await apiNormalProjectDelete(item.id);
        if (res?.code === SUCCESS_CODE) {
          setList((prev) => prev.filter((row) => row.id !== item.id));
        }
      },
    });
  }, []);

  const handleRename = useCallback((item: UserProjectItem) => {
    setRenameTarget(item);
    setRenameName(item.name);
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
              onRename={handleRename}
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

      <Modal
        title={dict('PC.Components.HistoryConversationList.renameModalTitle')}
        open={renameTarget !== undefined}
        onOk={() => void handleRenameSubmit()}
        onCancel={() => setRenameTarget(undefined)}
        okButtonProps={{ disabled: !renameName.trim() }}
        okText={dict('PC.Common.Global.confirm')}
        cancelText={dict('PC.Common.Global.cancel')}
        destroyOnHidden
      >
        <Input
          value={renameName}
          onChange={(event) => setRenameName(event.target.value)}
          onPressEnter={() => void handleRenameSubmit()}
          maxLength={50}
        />
      </Modal>
    </div>
  );
};

export default NormalProject;
