import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiUserProjectPageQuery } from '@/pages/AppDevPro/services/appDevPro';
import type { UserProjectItem } from '@/pages/AppDevPro/type';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { PageDevelopCreateTypeEnum } from '@/types/enums/pageDev';
import {
  DownOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Empty, Input, Spin } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { history, useParams } from 'umi';
import CreateUserApp from '../AppDevPro/components/CreateUserApp';
import PageCreateModal from '../SpacePageDevelop/PageCreateModal';
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
 * 数据走 apiUserProjectPageQuery（后端未就绪期间 dev 由 mock 供数）；
 * 菜单入口为 menuModel 的 project_manage 占位项。
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
  const [openCreatePageApp, setOpenCreatePageApp] = useState(false);

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
      key: AgentComponentTypeEnum.PageApp,
      label: dict('PC.Pages.SpaceProjectManage.createPageApp'),
    },
    {
      key: AgentComponentTypeEnum.UserApp,
      label: dict('PC.Pages.SpaceProjectManage.createUserApp'),
    },
  ];

  const handleCreateMenuClick = (key: string) => {
    if (key === AgentComponentTypeEnum.NormalProject) {
      setOpenCreateNormal(true);
    } else if (key === AgentComponentTypeEnum.PageApp) {
      setOpenCreatePageApp(true);
    } else {
      setOpenCreateUserApp(true);
    }
  };

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
                  onClick={() => openProject(spaceId, item)}
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
      {/* 新建：网页应用（复用页面开发创建弹窗；成功后跳开发页，与 SpacePageDevelop 同款） */}
      <PageCreateModal
        spaceId={spaceId}
        type={PageDevelopCreateTypeEnum.Online_Develop}
        open={openCreatePageApp}
        onCancel={() => setOpenCreatePageApp(false)}
        onConfirm={(info) => {
          setOpenCreatePageApp(false);
          history.push(`/space/${spaceId}/app-dev/${info.projectId}`);
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
    </WorkspaceLayout>
  );
};

export default SpaceProjectManage;
