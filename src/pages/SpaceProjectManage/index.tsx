import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import useHomePinnedProjectHandoff from '@/hooks/useHomePinnedProjectHandoff';
import {
  apiUserAppDelete,
  apiUserAppUpdate,
  apiUserProjectDelete,
  apiUserProjectTabPageQuery,
  apiUserProjectUpdate,
} from '@/pages/AppDevPro/services/appDevPro';
import type { UserProjectTabItem } from '@/pages/AppDevPro/type';
import { dict } from '@/services/i18nRuntime';
import { apiDownloadAllFiles } from '@/services/vncDesktop';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  ExportOutlined,
  FolderOpenOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Empty, Input, message, Modal, Spin } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'umi';
import CreateUserApp from '../AppDevPro/components/CreateUserApp';
import CreateNormalProjectModal from './components/CreateNormalProjectModal';
import styles from './index.less';
import {
  openProject,
  PROJECT_MANAGE_TYPES,
  PROJECT_TAB_LABEL_KEYS,
  PROJECT_TAB_TYPES,
  projectTypeBadgeClass,
  type ProjectTabKey,
} from './type';

/** 项目管理列表行（tab/page-query 实测契约：主键 projectId，附项目下会话列表） */
type ProjectListItem = Omit<UserProjectTabItem, 'projectId'> & {
  id: number;
};

/**
 * 行归一：tab/page-query 实测契约（2026-09-10）主键为 projectId（无 id
 * 字段），全页统一以 id 消费；打开/改名/删除/导出均依赖此步。
 */
const normalizeProjectRow = (row: UserProjectTabItem): ProjectListItem => {
  const { projectId, ...rest } = row;
  return { ...rest, id: projectId };
};

/**
 * 行最新会话解析：tab 行的 conversationId 实测恒为 null（后端未维护绑定），
 * 项目下会话在 conversations[] 里，取 modified 最新一条作为「最新会话」
 * （含 id/agentId，打开与导出共用）。
 */
const resolveRowLatestConversation = (
  item: ProjectListItem,
): ConversationInfo | undefined => {
  const list = item.conversations || [];
  if (!list.length) return undefined;
  return [...list].sort((a, b) =>
    (b.modified || '').localeCompare(a.modified || ''),
  )[0];
};

/**
 * 项目管理：个人/团队空间下的项目列表（常规项目/网页应用/全栈应用三类合并查询）。
 * 数据走 tab/page-query（实测行主键 projectId、自带最新会话 id 与项目下会话）；
 * 常规项目/全栈应用的重命名、删除、导出走真实接口（user-project / userapp /
 * download-all-files 契约，操作清单对齐 wiki「全栈应用任务及接口清单」）；
 * 打开项目按类型分发落点（常规项目对齐单栏「项目」分组跳 home/chat 会话详情）；
 * PageApp 契约未覆盖改名删除，不挂菜单。新建入口与类型 tab 均去除网页应用
 * （2026-09-10）；「全部」仍合并查询三类，存量 PageApp 项目照常列表/打开。
 * 菜单入口为 menuModel 的 project_manage 占位项。
 */
const SpaceProjectManage: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const { pin } = useHomePinnedProjectHandoff();

  const [activeTab, setActiveTab] = useState<ProjectTabKey>('all');
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 新建弹窗态
  const [openCreateNormal, setOpenCreateNormal] = useState(false);
  const [openCreateUserApp, setOpenCreateUserApp] = useState(false);
  // 重命名弹窗态
  const [renameTarget, setRenameTarget] = useState<ProjectListItem>();
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
            apiUserProjectTabPageQuery(buildBody(type)).catch(() => null),
          ),
        );
        const merged = results
          .flatMap((res) =>
            res?.code === SUCCESS_CODE && Array.isArray(res.data?.records)
              ? res.data.records
              : [],
          )
          .map(normalizeProjectRow)
          .sort((a: ProjectListItem, b: ProjectListItem) =>
            (b.modified || '').localeCompare(a.modified || ''),
          );
        setList(merged);
      } else {
        const res = await apiUserProjectTabPageQuery(
          buildBody(activeTab as AgentComponentTypeEnum),
        );
        if (res?.code === SUCCESS_CODE && Array.isArray(res.data?.records)) {
          setList(res.data.records.map(normalizeProjectRow));
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
    () => ['all', ...PROJECT_TAB_TYPES] as ProjectTabKey[],
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
   * 打开项目（落点与单栏「项目」分组会话点击同源）：
   * - PageApp → 网页 IDE；
   * - 常规项目 → home/chat 会话详情（会话/智能体 id 取自行 conversations[]）；
   *   无会话时上框到 /home，发送即建会话绑定项目，落地即会话详情；
   * - 全栈应用 → 全栈 IDE 携最新会话 id 直达续聊（conversationId 参数与
   *   单栏全栈会话点击对齐）。
   */
  const handleOpenProject = useCallback(
    (item: ProjectListItem) => {
      if (item.projectType === AgentComponentTypeEnum.PageApp) {
        openProject(spaceId, item);
        return;
      }
      const latest = resolveRowLatestConversation(item);
      const conversationId = latest?.id ?? item.conversationId ?? undefined;
      if (item.projectType === AgentComponentTypeEnum.NormalProject) {
        const agentId = latest?.agentId;
        if (conversationId && agentId) {
          openProject(spaceId, item, conversationId, agentId);
          return;
        }
        pin({
          projectId: item.id,
          spaceId,
          projectType: item.projectType,
          name: item.name,
          icon: item.icon,
          sandboxId: item.sandboxId,
        });
        return;
      }
      openProject(spaceId, item, conversationId);
    },
    [spaceId, pin],
  );

  /**
   * 导出项目（wiki #30：download-all-files 适用全栈/常规项目）。
   * 导出以会话为锚（cId），用行最新会话（resolveRowLatestConversation）；
   * 无会话提示先进入项目。
   */
  const handleExportProject = useCallback((item: ProjectListItem) => {
    const latest = resolveRowLatestConversation(item);
    const conversationId = latest?.id ?? item.conversationId ?? undefined;
    if (!conversationId) {
      message.warning(
        dict('PC.Pages.SpaceProjectManage.exportRequiresConversation'),
      );
      return;
    }
    void apiDownloadAllFiles(conversationId);
  }, []);

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

  const openDeleteConfirm = (item: ProjectListItem) => {
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

  const buildCardMenu = (item: ProjectListItem) => ({
    items: [
      {
        key: 'rename',
        icon: <EditOutlined />,
        label: dict('PC.Components.ConversationContextMenu.rename'),
      },
      {
        key: 'export',
        icon: <ExportOutlined />,
        label: dict('PC.Common.Global.export'),
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
      } else if (key === 'export') {
        handleExportProject(item);
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
                  onClick={() => handleOpenProject(item)}
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
                      title={item.description || undefined}
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

      {/* 新建：常规项目（名称直达统一创建接口；创建返回首个会话+智能体 id
          时直达 home/chat 详情，实测常态未返回则上框到 /home，发送即建会话） */}
      <CreateNormalProjectModal
        spaceId={spaceId}
        open={openCreateNormal}
        onCancel={() => setOpenCreateNormal(false)}
        onConfirm={(project) => {
          setOpenCreateNormal(false);
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
      {/* 新建：全栈应用（复用 AppDevPro 创建弹窗，成功即进 IDE 续聊创建返回的首个会话） */}
      <CreateUserApp
        spaceId={spaceId}
        mode={CreateUpdateModeEnum.Create}
        open={openCreateUserApp}
        onCancel={() => setOpenCreateUserApp(false)}
        onConfirmCreate={(result) => {
          openProject(
            spaceId,
            { id: result.id, projectType: AgentComponentTypeEnum.UserApp },
            result.conversationId,
          );
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
