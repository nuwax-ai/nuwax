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
import { Button, Empty } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
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

  /** 计划 / 资产 Tab 占位内容 */
  const renderComingSoon = () => (
    <div className={cx('flex', 'items-center', 'content-center', 'h-full')}>
      <Empty description={dict('PC.Pages.NormalProjectDetail.comingSoon')} />
    </div>
  );

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
        <div className={cx(styles.tabs)}>
          {(
            [
              ['plan', 'PC.Pages.NormalProjectDetail.tabPlan'],
              ['asset', 'PC.Pages.NormalProjectDetail.tabAsset'],
            ] as const
          ).map(([key, labelKey]) => (
            <button
              key={key}
              type="button"
              className={cx(styles.tab, { [styles.active]: activeTab === key })}
              onClick={() => setActiveTab(key)}
            >
              {dict(labelKey)}
            </button>
          ))}
        </div>
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
                'flex-1',
                'scroll-container-hide',
              )}
            >
              {renderComingSoon()}
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
