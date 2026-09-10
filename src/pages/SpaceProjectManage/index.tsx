import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiUserAppDelete,
  apiUserAppLatestConversation,
  apiUserAppUpdate,
  apiUserProjectDelete,
  apiUserProjectLatestConversation,
  apiUserProjectPageQuery,
  apiUserProjectUpdate,
} from '@/pages/AppDevPro/services/appDevPro';
import type { UserProjectItem } from '@/pages/AppDevPro/type';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  FolderOpenOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Empty, Input, Modal, Spin } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { history, useParams } from 'umi';
import CreateUserApp from '../AppDevPro/components/CreateUserApp';
import CreateNormalProjectModal from './components/CreateNormalProjectModal';
import styles from './index.less';
import {
  openProject,
  PROJECT_MANAGE_TYPES,
  PROJECT_TAB_LABEL_KEYS,
  projectTypeBadgeClass,
  type ProjectTabKey,
} from './type';

/**
 * 项目管理：个人/团队空间下的三类项目列表（常规项目/网页应用/全栈应用）。
 * 数据走 apiUserProjectPageQuery；
 * 常规项目/全栈应用的重命名、删除走真实接口（user-project / userapp 契约），
 * 打开项目时取当前用户最新会话直达续聊；PageApp 契约未覆盖改名删除，不挂菜单。
 * 新建入口仅常规项目/全栈应用（2026-09-10 去除网页应用）；存量 PageApp
 * 项目仍照常列表/打开。菜单入口为 menuModel 的 project_manage 占位项。
 */
const SpaceProjectManage: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);

  const [activeTab, setActiveTab] = useState<ProjectTabKey>('all');
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<UserProjectItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 新建弹窗态
  const [openCreateNormal, setOpenCreateNormal] = useState(false);
  const [openCreateUserApp, setOpenCreateUserApp] = useState(false);
  // 重命名弹窗态
  const [renameTarget, setRenameTarget] = useState<UserProjectItem>();
  const [renameName, setRenameName] = useState('');

  const queryProjects = useCallback(async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      const name = keyword.trim();
      const buildBody = (projectType: AgentComponentTypeEnum) => ({
        queryFilter: { spaceId, projectType, name },
        current: 1,
        pageSize: 50,
        orders: [],
        filters: [],
        columns: [],
      });
      if (activeTab === 'all') {
        // 全部：三类并行拉取后按更新时间合并排序
        const results = await Promise.all(
          PROJECT_MANAGE_TYPES.map((type) =>
            apiUserProjectPageQuery(buildBody(type)).catch(() => null),
          ),
        );
        const merged = results
          .flatMap((res) =>
            res?.code === SUCCESS_CODE && Array.isArray(res.data?.records)
              ? res.data.records
              : [],
          )
          .sort((a: UserProjectItem, b: UserProjectItem) =>
            (b.modified || '').localeCompare(a.modified || ''),
          );
        setList(merged);
      } else {
        const res = await apiUserProjectPageQuery(
          buildBody(activeTab as AgentComponentTypeEnum),
        );
        if (res?.code === SUCCESS_CODE && Array.isArray(res.data?.records)) {
          setList(res.data.records);
        } else {
          setList([]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [spaceId, activeTab, keyword]);

  useEffect(() => {
    void queryProjects();
  }, [queryProjects]);

  const tabs = useMemo(
    () => ['all', ...PROJECT_MANAGE_TYPES] as ProjectTabKey[],
    [],
  );

  const createMenuItems = [
    {
      key: AgentComponentTypeEnum.NormalProject,
      label: dict('PC.Pages.SpaceProjectManage.createNormalProject'),
    },
    {
      key: AgentComponentTypeEnum.UserApp,
      label: dict('PC.Pages.SpaceProjectManage.createUserApp'),
    },
  ];

  const handleCreateMenuClick = (key: string) => {
    if (key === AgentComponentTypeEnum.NormalProject) {
      setOpenCreateNormal(true);
    } else {
      setOpenCreateUserApp(true);
    }
  };

  /**
   * 打开项目：PageApp 直达网页 IDE；其余先取当前用户最新会话再进全栈 IDE，
   * 取不到（含接口失败/尚无会话）不阻塞进入，由 IDE 内自行建立。
   */
  const handleOpenProject = useCallback(
    async (item: Pick<UserProjectItem, 'id' | 'projectType'>) => {
      if (item.projectType === AgentComponentTypeEnum.PageApp) {
        openProject(spaceId, item);
        return;
      }
      const fetchLatest =
        item.projectType === AgentComponentTypeEnum.UserApp
          ? apiUserAppLatestConversation
          : apiUserProjectLatestConversation;
      let conversationId: number | undefined;
      try {
        const res = await fetchLatest(item.id);
        if (res?.code === SUCCESS_CODE) {
          conversationId = res.data?.conversationId ?? res.data?.id;
        }
      } catch {
        // 最新会话获取失败不阻塞进入项目
      }
      openProject(spaceId, item, conversationId);
    },
    [spaceId],
  );

  const handleRenameSubmit = async () => {
    const name = renameName.trim();
    if (!name || !renameTarget) return;
    const { id, projectType } = renameTarget;
    const res =
      projectType === AgentComponentTypeEnum.UserApp
        ? await apiUserAppUpdate({ id, name })
        : await apiUserProjectUpdate({ id, name });
    if (res?.code !== SUCCESS_CODE) return;
    setList((prev) =>
      prev.map((item) =>
        item.id === id && item.projectType === projectType
          ? { ...item, name }
          : item,
      ),
    );
    setRenameTarget(undefined);
  };

  const openDeleteConfirm = (item: UserProjectItem) => {
    Modal.confirm({
      title: dict('PC.Common.Global.deleteConfirmTitle'),
      content: dict('PC.Common.Global.deleteConfirmContent'),
      okButtonProps: { danger: true },
      okText: dict('PC.Common.Global.delete'),
      cancelText: dict('PC.Common.Global.cancel'),
      onOk: async () => {
        const res =
          item.projectType === AgentComponentTypeEnum.UserApp
            ? await apiUserAppDelete(item.id)
            : await apiUserProjectDelete(item.id);
        if (res?.code === SUCCESS_CODE) {
          void queryProjects();
        }
      },
    });
  };

  const buildCardMenu = (item: UserProjectItem) => ({
    items: [
      {
        key: 'rename',
        icon: <EditOutlined />,
        label: dict('PC.Components.ConversationContextMenu.rename'),
      },
      { type: 'divider' as const },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        danger: true,
        label: dict('PC.Common.Global.delete'),
      },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'rename') {
        setRenameTarget(item);
        setRenameName(item.name);
      } else if (key === 'delete') {
        openDeleteConfirm(item);
      }
    },
  });

  return (
    <WorkspaceLayout title={dict('PC.Pages.SpaceProjectManage.menuTitle')}>
      <div className={styles['project-manage']}>
        <div className={styles.toolbar}>
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
          <Input
            className={styles.search}
            allowClear
            prefix={<SearchOutlined />}
            placeholder={dict('PC.Pages.SpaceProjectManage.searchPlaceholder')}
            onChange={(e) => setKeyword(e.target.value)}
          />
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
        </div>

        <Spin spinning={loading}>
          {list.length === 0 && !loading ? (
            <Empty
              className={styles.empty}
              description={dict('PC.Pages.SpaceProjectManage.emptyText')}
            >
              <Button
                type="primary"
                ghost
                icon={<FolderOpenOutlined />}
                onClick={() => setOpenCreateUserApp(true)}
              >
                {dict('PC.Pages.SpaceProjectManage.createButton')}
              </Button>
            </Empty>
          ) : (
            <div className={styles.grid}>
              {list.map((item) => (
                <div
                  key={`${item.projectType}-${item.id}`}
                  className={styles.card}
                  onClick={() => void handleOpenProject(item)}
                >
                  <div className={styles['card-icon']}>
                    {item.icon ? (
                      <img src={item.icon} alt="" />
                    ) : (
                      <FolderOpenOutlined />
                    )}
                  </div>
                  <div className={styles['card-body']}>
                    <div className={styles['card-title-row']}>
                      <span className={styles['card-title']} title={item.name}>
                        {item.name}
                      </span>
                      <span
                        className={`${styles.badge} ${
                          styles[projectTypeBadgeClass(item.projectType)]
                        }`}
                      >
                        {dict(PROJECT_TAB_LABEL_KEYS[item.projectType])}
                      </span>
                      {/* 契约只覆盖常规项目/全栈应用的改名删除，PageApp 不挂菜单 */}
                      {item.projectType !== AgentComponentTypeEnum.PageApp && (
                        <Dropdown
                          trigger={['click']}
                          menu={buildCardMenu(item)}
                        >
                          <button
                            type="button"
                            className={styles['card-more']}
                            aria-label={dict('PC.Components.ActionMenu.more')}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <MoreOutlined />
                          </button>
                        </Dropdown>
                      )}
                    </div>
                    <div
                      className={styles['card-desc']}
                      title={item.description}
                    >
                      {item.description ||
                        dict('PC.Pages.SpaceProjectManage.noDescription')}
                    </div>
                    <div className={styles['card-time']}>
                      {(item.modified || '').slice(0, 16).replace('T', ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Spin>
      </div>

      {/* 新建：常规项目（名称直达统一创建接口，成功即进 IDE） */}
      <CreateNormalProjectModal
        spaceId={spaceId}
        open={openCreateNormal}
        onCancel={() => setOpenCreateNormal(false)}
        onConfirm={(targetId) => {
          setOpenCreateNormal(false);
          history.push(`/space/${spaceId}/app-pro?appId=${targetId}`);
        }}
      />
      {/* 新建：全栈应用（复用 AppDevPro 创建弹窗，成功即进 IDE） */}
      <CreateUserApp
        spaceId={spaceId}
        mode={CreateUpdateModeEnum.Create}
        open={openCreateUserApp}
        onCancel={() => setOpenCreateUserApp(false)}
        onConfirmCreate={(result) => {
          history.push(`/space/${spaceId}/app-pro?appId=${result.id}`);
        }}
      />
      {/* 重命名（常规项目/全栈应用，走真实接口） */}
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
    </WorkspaceLayout>
  );
};

export default SpaceProjectManage;
