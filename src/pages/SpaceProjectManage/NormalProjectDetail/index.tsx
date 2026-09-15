import SvgIcon from '@/components/base/SvgIcon';
import Loading from '@/components/custom/Loading';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import useHomePinnedProjectHandoff from '@/hooks/useHomePinnedProjectHandoff';
import { dict } from '@/services/i18nRuntime';
import { apiNormalProjectGetById } from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { RequestResponse } from '@/types/interfaces/request';
import type {
  UserNormalProjectInfo,
  UserProjectConversationInfo,
} from '@/types/interfaces/userProject';
import { needsTopRightAvoid, shellAvoid } from '@/utils/hostBridge';
import type { TabsProps } from 'antd';
import { Button, Result, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { history, useParams, useRequest } from 'umi';
import ConversationPanel from '../components/ConversationPanel';
import { apiUserProjectConversations } from '../services';
import { openProject } from '../type';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 常规项目详情页顶部 Tab */
type DetailTabKey = 'plan' | 'asset';

/**
 * 解开 umi request / useRequest 包装，兼容完整响应与已解包 data。
 *
 * @param result 接口原始返回
 * @returns 业务数据；失败或无法识别时为 undefined
 */
const pickResponseData = <T,>(
  result?: RequestResponse<T> | T,
): T | undefined => {
  if (result === undefined || result === null) {
    return undefined;
  }
  if (typeof result === 'object' && 'code' in result) {
    const wrapped = result as RequestResponse<T>;
    if (wrapped.code && wrapped.code !== SUCCESS_CODE) {
      return undefined;
    }
    return wrapped.data;
  }
  return result as T;
};

/**
 * 常规项目详情页。
 *
 * 保留应用详情页的顶部、计划/资产 Tab 与相关任务侧栏，不包含设置 Tab
 * 及 OAuth2、域名、部署服务器等全栈应用专属配置。
 *
 * @returns 常规项目详情页面
 */
const NormalProjectDetail: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const projectId = Number(params.projectId);
  const { pin } = useHomePinnedProjectHandoff();

  const [activeTab, setActiveTab] = useState<DetailTabKey>('plan');
  const [projectInfo, setProjectInfo] = useState<UserNormalProjectInfo>();
  const [projectName, setProjectName] = useState('');
  const [conversations, setConversations] = useState<
    UserProjectConversationInfo[]
  >([]);
  const [conversationPanelVisible, setConversationPanelVisible] =
    useState(true);
  const [iframeLoadFailed, setIframeLoadFailed] = useState(false);

  /** 顶部 Tab 仅负责切换状态，内容由页面主体区域统一渲染 */
  const tabItems = useMemo<TabsProps['items']>(
    () => [
      {
        key: 'plan',
        label: dict('PC.Pages.NormalProjectDetail.tabPlan'),
        children: null,
      },
      {
        key: 'asset',
        label: dict('PC.Pages.NormalProjectDetail.tabAsset'),
        children: null,
      },
    ],
    [],
  );

  /** 获取常规项目详情并回填标题 */
  const { run: runGetProject, loading: projectLoading } = useRequest(
    () => apiNormalProjectGetById(projectId),
    {
      manual: true,
      onSuccess: (result: UserNormalProjectInfo) => {
        const info = pickResponseData(result);
        if (!info?.projectId) {
          return;
        }
        setProjectInfo(info);
        setProjectName(info.name || '');
      },
    },
  );

  /** 获取项目下全部会话，供右侧相关任务列表展示 */
  const { run: runConversations, loading: conversationLoading } = useRequest(
    () =>
      apiUserProjectConversations(
        projectId,
        AgentComponentTypeEnum.NormalProject,
      ),
    {
      manual: true,
      onSuccess: (result: UserProjectConversationInfo[]) => {
        const list = Array.isArray(result) ? result : pickResponseData(result);
        const records = Array.isArray(list) ? list : [];
        setConversations(records);
        setProjectName(
          (previous) =>
            previous ||
            records.find((item) => item.agent?.name)?.agent?.name ||
            '',
        );
      },
      onError: () => {
        setConversations([]);
      },
    },
  );

  /** 进入页面后并行获取详情与相关任务 */
  useEffect(() => {
    if (!spaceId || !projectId) {
      return;
    }
    runGetProject();
    runConversations();
  }, [projectId, spaceId, runConversations, runGetProject]);

  /** 返回常规项目列表 */
  const handleBack = useCallback(() => {
    history.push(`/space/${spaceId}/normal-project`);
  }, [spaceId]);

  /** 切换右侧相关任务列表显隐 */
  const handleToggleConversationPanel = useCallback(() => {
    setConversationPanelVisible((visible) => !visible);
  }, []);

  /** 切换顶部 Tab */
  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as DetailTabKey);
  }, []);

  /** 打开右侧任务对应的常规项目会话 */
  const handleOpenConversation = useCallback(
    (item: UserProjectConversationInfo) => {
      openProject(
        spaceId,
        {
          id: projectId,
          projectType: AgentComponentTypeEnum.NormalProject,
        },
        item.id,
        item.agentId,
      );
    },
    [projectId, spaceId],
  );

  /** 新建任务：将当前常规项目上框后进入首页 */
  const handleCreateConversation = useCallback(() => {
    pin({
      projectId,
      spaceId,
      projectType: AgentComponentTypeEnum.NormalProject,
      name: projectInfo?.name || projectName,
      icon: projectInfo?.icon,
      sandboxId: projectInfo?.sandboxId,
    });
  }, [pin, projectId, projectInfo, projectName, spaceId]);

  /** 当前计划或资产 Tab 对应的仓库页面地址 */
  const repositoryPageUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    // 仓库页面会读取父窗口的嵌入配置，必须与父页面保持同源。
    const domain = window.location.origin;
    if (activeTab === 'plan' && projectInfo?.planSlugId) {
      return `${domain}/repo/doc/${encodeURIComponent(
        projectInfo.planSlugId,
      )}?just_show_content=true&hide_sheet=true`;
    }
    if (activeTab === 'asset' && projectInfo?.repoSlugId) {
      return `${domain}/repo/folder/${encodeURIComponent(
        projectInfo.repoSlugId,
      )}`;
    }
    return '';
  }, [activeTab, projectInfo?.planSlugId, projectInfo?.repoSlugId]);

  /** iframe 地址变化时清除上一个页面的失败状态 */
  useEffect(() => {
    setIframeLoadFailed(false);
  }, [repositoryPageUrl]);

  /** 重新挂载 iframe，触发页面再次加载 */
  const handleReloadIframe = useCallback(() => {
    setIframeLoadFailed(false);
  }, []);

  /** 渲染计划或资产仓库页面 */
  const renderRepositoryPage = () => {
    if (iframeLoadFailed || !repositoryPageUrl) {
      return (
        <Result
          className={cx(styles['repository-error'])}
          status="error"
          title={dict('PC.Pages.NormalProjectDetail.repositoryLoadFailed')}
          extra={
            repositoryPageUrl ? (
              <Button type="primary" onClick={handleReloadIframe}>
                {dict('PC.Common.Global.refresh')}
              </Button>
            ) : null
          }
        />
      );
    }
    return (
      <iframe
        className={cx(styles['repository-iframe'])}
        src={repositoryPageUrl}
        onError={() => setIframeLoadFailed(true)}
        title={
          activeTab === 'plan'
            ? dict('PC.Pages.NormalProjectDetail.tabPlan')
            : dict('PC.Pages.NormalProjectDetail.tabAsset')
        }
      />
    );
  };

  return (
    <div className={cx(styles.page, 'h-full', 'flex', 'flex-col')}>
      <header
        className={cx(styles.header)}
        style={{
          paddingRight: needsTopRightAvoid() ? shellAvoid.RIGHT : undefined,
        }}
      >
        <Button
          type="text"
          className={cx(styles.back)}
          onClick={handleBack}
          icon={<SvgIcon className={cx('flex')} name="icons-nav-backward" />}
        />
        <h3 className={cx(styles['project-name'], 'text-ellipsis')}>
          {projectName || dict('PC.Pages.NormalProjectDetail.untitled')}
        </h3>
        <Tabs
          className={cx(styles.tabs)}
          activeKey={activeTab}
          items={tabItems}
          onChange={handleTabChange}
        />
        <div className={cx(styles['header-actions'])}>
          <TooltipIcon
            title={
              conversationPanelVisible
                ? dict('PC.Pages.NormalProjectDetail.hideConversationPanel')
                : dict('PC.Pages.NormalProjectDetail.showConversationPanel')
            }
            className={cx(styles['panel-toggle'], {
              [styles.active]: conversationPanelVisible,
            })}
            icon={<SvgIcon name="icons-nav-sidebar" style={{ fontSize: 16 }} />}
            onClick={handleToggleConversationPanel}
          />
        </div>
      </header>

      {projectLoading && !projectName ? (
        <Loading />
      ) : (
        <div className={cx(styles.body, 'flex-1')}>
          <main className={cx(styles.main, 'flex-1', 'flex', 'flex-col')}>
            <div
              className={cx(
                styles['main-scroll'],
                styles['repository-content'],
                'flex-1',
                'scroll-container-hide',
              )}
            >
              {renderRepositoryPage()}
            </div>
          </main>
          {conversationPanelVisible ? (
            <ConversationPanel
              conversations={conversations}
              loading={conversationLoading}
              onSelect={handleOpenConversation}
              onCreate={handleCreateConversation}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default NormalProjectDetail;
