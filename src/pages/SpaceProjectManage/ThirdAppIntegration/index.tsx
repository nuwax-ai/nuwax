import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiUserProjectDelete } from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { RequestResponse } from '@/types/interfaces/request';
import type { UserProjectItem } from '@/types/interfaces/userProject';
import { needsTopRightAvoid, shellAvoid } from '@/utils/hostBridge';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Modal } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRequest } from 'umi';
import ProjectCard from '../components/ProjectCard';
import { apiUserProjectPageQuery } from '../services';
import { apiThirdAppOauth2Update } from '../services/thirdAppOauth2';
import CreateThirdAppModal from './components/CreateThirdAppModal';
import styles from './index.less';

const cx = classNames.bind(styles);

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
 * 创建和重命名使用第三方应用 OAuth2 接口。
 *
 * @returns 第三方应用列表页面
 */
const ThirdAppIntegration: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);

  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<UserProjectItem[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<UserProjectItem>();
  const [renameName, setRenameName] = useState('');

  /** 查询第三方应用列表 */
  const { run: runQuery, loading } = useRequest(
    (name?: string) =>
      apiUserProjectPageQuery({
        queryFilter: {
          spaceId,
          projectType: AgentComponentTypeEnum.ThirdApp,
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

  /** 空间或搜索词变化时刷新列表 */
  useEffect(() => {
    if (!spaceId) {
      return;
    }
    runQuery(keyword);
  }, [keyword, runQuery, spaceId]);

  /** 打开重命名弹窗 */
  const handleRename = useCallback((item: UserProjectItem) => {
    setRenameTarget(item);
    setRenameName(item.name);
  }, []);

  /** 保存第三方应用名称 */
  const handleRenameSubmit = useCallback(async () => {
    const name = renameName.trim();
    if (!name || !renameTarget) {
      return;
    }
    const response = await apiThirdAppOauth2Update({
      projectId: renameTarget.id,
      name,
    });
    if (response?.code !== SUCCESS_CODE) {
      return;
    }
    setList((previous) =>
      previous.map((item) =>
        item.id === renameTarget.id ? { ...item, name } : item,
      ),
    );
    setRenameTarget(undefined);
  }, [renameName, renameTarget]);

  /** 删除第三方应用前二次确认 */
  const handleDelete = useCallback((item: UserProjectItem) => {
    Modal.confirm({
      title: dict('PC.Common.Global.deleteConfirmTitle'),
      content: dict('PC.Common.Global.deleteConfirmContent'),
      okButtonProps: { danger: true },
      okText: dict('PC.Common.Global.delete'),
      cancelText: dict('PC.Common.Global.cancel'),
      onOk: async () => {
        const response = await apiUserProjectDelete(item.id);
        if (response?.code === SUCCESS_CODE) {
          setList((previous) =>
            previous.filter((record) => record.id !== item.id),
          );
        }
      },
    });
  }, []);

  /** 创建完成后关闭弹窗并刷新列表 */
  const handleCreated = useCallback(() => {
    setCreateOpen(false);
    runQuery(keyword);
  }, [keyword, runQuery]);

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
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
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
          maxLength={128}
        />
      </Modal>
    </div>
  );
};

export default ThirdAppIntegration;
