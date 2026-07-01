import type { AgentMode } from '@/components/business-component/AgentIntervention';
import {
  readAgentModeCache,
  writeAgentModeCache,
} from '@/components/business-component/AgentIntervention/hooks/useAgentInterventionLayer';
import ChatInputHome, {
  type ChatInputHomeRef,
} from '@/components/ChatInputHome';
import Loading from '@/components/custom/Loading';
import useConversation from '@/hooks/useConversation';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import {
  apiCollectAgent,
  apiHomeCategoryList,
  apiPublishedAgentInfo,
  apiUnCollectAgent,
} from '@/services/agentDev';
import { apiDisplayRecommendList } from '@/services/displayRecommend';
import { dict } from '@/services/i18nRuntime';
import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
} from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import type {
  AgentDetailDto,
  AgentManualComponentInfo,
} from '@/types/interfaces/agent';
import type {
  CategoryItemInfo,
  HomeAgentCategoryInfo,
} from '@/types/interfaces/agentConfig';
import type {
  MessageSourceType,
  UploadFileInfo,
} from '@/types/interfaces/common';
import {
  DisplayRecommendFunctionTypeEnum,
  type DisplayRecommendInfo,
} from '@/types/interfaces/displayRecommend';
import { App, message as antdMessage } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useModel, useRequest } from 'umi';
import { createProjectAndNavigate } from '../SpaceCreateProject/utils/projectCreateStrategy';
import ChatBoxRecommendNav from './components/ChatBoxRecommendNav';
import DraggableHomeContent from './DraggableHomeContent';
import styles from './index.less';

const cx = classNames.bind(styles);
const EMPTY_MANUAL_COMPONENTS: AgentManualComponentInfo[] = [];

const PROJECT_FUNCTION_TYPE_MAP: Partial<
  Record<DisplayRecommendFunctionTypeEnum | string, AgentComponentTypeEnum>
> = {
  [DisplayRecommendFunctionTypeEnum.AgentDev]: AgentComponentTypeEnum.Agent,
  [DisplayRecommendFunctionTypeEnum.PageAppDev]: AgentComponentTypeEnum.PageApp,
  [DisplayRecommendFunctionTypeEnum.SkillDev]: AgentComponentTypeEnum.Skill,
  [DisplayRecommendFunctionTypeEnum.PluginDev]: AgentComponentTypeEnum.Plugin,
};

const TASK_AGENT_FUNCTION_TYPES = new Set<string>([
  DisplayRecommendFunctionTypeEnum.AgentDev,
  DisplayRecommendFunctionTypeEnum.SkillDev,
  DisplayRecommendFunctionTypeEnum.PluginDev,
]);

const SPACE_SELECTOR_FUNCTION_TYPES = new Set<string>([
  DisplayRecommendFunctionTypeEnum.AgentDev,
  DisplayRecommendFunctionTypeEnum.PageAppDev,
  DisplayRecommendFunctionTypeEnum.SkillDev,
  DisplayRecommendFunctionTypeEnum.PluginDev,
]);

const Home: React.FC = () => {
  const { message } = App.useApp();
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const { getSpaceId } = useModel('spaceModel');
  const { setContext } = useModel('pageHandoffContext');
  const { handleCreateConversation } = useConversation();
  const chatInputRef = useRef<ChatInputHomeRef>(null);
  const {
    selectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  const [agentDetail, setAgentDetail] = useState<AgentDetailDto>();
  const [isTaskAgentMode, setIsTaskAgentMode] = useState<boolean>(false);
  const [selectedComputerId, setSelectedComputerId] = useState<string>('-1');
  const [selectedModelId, setSelectedModelId] = useState<number>();
  const [selectedSpaceId, setSelectedSpaceId] = useState<number>();
  const [agentMode, setAgentMode] = useState<AgentMode>('yolo');
  const [activeTab, setActiveTab] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendNavList, setRecommendNavList] = useState<
    DisplayRecommendInfo[]
  >([]);
  const [selectedRecommend, setSelectedRecommend] =
    useState<DisplayRecommendInfo>();
  const [homeCategoryInfo, setHomeCategoryInfo] =
    useState<HomeAgentCategoryInfo>();

  const defaultAgentId =
    isTaskAgentMode && tenantConfigInfo?.defaultTaskAgentId
      ? tenantConfigInfo.defaultTaskAgentId
      : tenantConfigInfo?.defaultAgentId;
  const currentAgentId = selectedRecommend?.targetId || defaultAgentId;

  const handleAgentModeChange = useCallback(
    (mode: AgentMode) => {
      setAgentMode(mode);
      if (currentAgentId) {
        writeAgentModeCache(mode, currentAgentId);
      }
    },
    [currentAgentId],
  );
  const selectedFunctionType = selectedRecommend?.functionType || '';
  const selectedProjectType = useMemo(
    () => PROJECT_FUNCTION_TYPE_MAP[selectedFunctionType],
    [selectedFunctionType],
  );
  const effectiveTaskAgentActive = selectedRecommend
    ? TASK_AGENT_FUNCTION_TYPES.has(selectedFunctionType)
    : isTaskAgentMode;
  const showSpaceSelector = selectedRecommend
    ? SPACE_SELECTOR_FUNCTION_TYPES.has(selectedFunctionType)
    : false;

  const runDetail = useCallback(async (agentId: number) => {
    try {
      const { data } = await apiPublishedAgentInfo(agentId);
      setAgentDetail(data);
    } catch {
      setAgentDetail(undefined);
    }
  }, []);

  const runCategoryList = useCallback(async () => {
    try {
      const result = await apiHomeCategoryList({ skipErrorHandler: true });
      if (result?.success === false) {
        antdMessage.warning(result.message);
        setLoading(false);
        return;
      }

      const { data } = result;
      setHomeCategoryInfo(data);
      setActiveTab(data?.categories?.[0]?.type);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  const runRecommendNavList = useCallback(async () => {
    try {
      const result = await apiDisplayRecommendList({ skipErrorHandler: true });
      if (result?.success === false) {
        setRecommendNavList([]);
        return;
      }

      const list = result?.data?.recChatBoxNav?.Agent || [];
      setRecommendNavList(
        [...list].sort((prev, next) => (prev.sort || 0) - (next.sort || 0)),
      );
    } catch {
      setRecommendNavList([]);
    }
  }, []);

  const { run: runCollectAgent } = useRequest(apiCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      runCategoryList();
    },
  });

  const { run: runUnCollectAgent } = useRequest(apiUnCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      runCategoryList();
    },
  });

  useEffect(() => {
    setLoading(true);
    runCategoryList();
    runRecommendNavList();
  }, [runCategoryList, runRecommendNavList]);

  useEffect(() => {
    setAgentDetail(undefined);
    if (currentAgentId) {
      runDetail(currentAgentId);
    }
  }, [currentAgentId, runDetail]);

  useEffect(() => {
    if (agentDetail) {
      if (agentDetail.allowChooseMode !== DefaultSelectedEnum.Yes) {
        setAgentMode('yolo');
      } else {
        const cached = readAgentModeCache(currentAgentId);
        setAgentMode(cached || 'yolo');
      }
    }
  }, [agentDetail, currentAgentId]);

  useEffect(() => {
    initSelectedComponentList(agentDetail?.manualComponents);
  }, [agentDetail?.manualComponents]);

  useEffect(() => {
    setSelectedComputerId(selectedRecommend ? '' : '-1');
    setSelectedModelId(undefined);
    setSelectedSpaceId(undefined);
  }, [selectedRecommend]);

  const handleEnter = async (
    inputMessage: string,
    files?: UploadFileInfo[],
    skillIds?: number[],
    modelId?: number,
    agentMode?: AgentMode,
  ) => {
    if (!tenantConfigInfo || !currentAgentId) {
      message.warning(dict('PC.Pages.Home.noTenantInfo'));
      return;
    }

    if (selectedProjectType) {
      const spaceId = showSpaceSelector
        ? selectedSpaceId
        : Number(getSpaceId());
      if (!spaceId) {
        message.warning(dict('PC.Pages.Home.noTenantInfo'));
        return;
      }

      await createProjectAndNavigate({
        payload: {
          type: selectedProjectType,
          prompt: inputMessage,
          files,
          skillIds,
          modelId: modelId || selectedModelId,
          tools: selectedComponentList,
          computerId: selectedComputerId,
          agentMode,
        },
        spaceId,
        tenantConfigInfo,
        setContext,
      });
      return;
    }

    await handleCreateConversation(currentAgentId, {
      message: inputMessage,
      files,
      infos: selectedComponentList,
      messageSourceType: 'home' as MessageSourceType,
      selectedComputerId,
      skillIds,
      modelId: modelId || selectedModelId,
      agentMode,
    });
  };

  const showTaskAgentToggle = !!(
    !selectedRecommend &&
    tenantConfigInfo?.defaultTaskAgentId &&
    tenantConfigInfo.defaultTaskAgentId > 0
  );

  const handleTabClick = (type: string) => {
    setActiveTab(type);
  };

  const handleToggleCollect = (_type: string, info: CategoryItemInfo) => {
    if (info.collect) {
      runUnCollectAgent(info.targetId);
    } else {
      runCollectAgent(info.targetId);
    }
  };

  const handleAgentClick = (agentInfo: CategoryItemInfo) => {
    const { targetId, lastConversationId } = agentInfo;

    if (lastConversationId) {
      history.push(`/home/chat/${lastConversationId}/${targetId}`);
      return;
    }

    history.push(`/agent/${targetId}`);
  };

  const handleRecommendSelect = (item: DisplayRecommendInfo) => {
    setSelectedRecommend((prev) => (prev?.id === item.id ? undefined : item));
    // 延迟以确保重新渲染后聚焦
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 0);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'items-center')}>
      <main className={cx(styles.inputSection)}>
        <div className={cx(styles.titleContainer)}>
          <h2
            className={cx(styles.title)}
            dangerouslySetInnerHTML={{ __html: tenantConfigInfo?.homeSlogan }}
          />
        </div>
        <ChatInputHome
          ref={chatInputRef}
          className={cx(styles.textarea)}
          onEnter={handleEnter}
          isClearInput={false}
          placeholder={selectedRecommend?.placeholder || undefined}
          manualComponents={
            agentDetail?.manualComponents || EMPTY_MANUAL_COMPONENTS
          }
          selectedComponentList={selectedComponentList}
          onSelectComponent={handleSelectComponent}
          showTaskAgentToggle={showTaskAgentToggle}
          isTaskAgentActive={effectiveTaskAgentActive}
          onToggleTaskAgent={() => setIsTaskAgentMode((prev) => !prev)}
          selectedComputerId={selectedComputerId}
          onComputerSelect={setSelectedComputerId}
          agentId={agentDetail?.agentId}
          agentSandboxId={agentDetail?.sandboxId}
          readonly={agentDetail?.allowPrivateSandbox === DefaultSelectedEnum.No}
          enableMention={
            agentDetail?.type === AgentTypeEnum.TaskAgent &&
            agentDetail?.allowAtSkill === DefaultSelectedEnum.Yes
          }
          allowOtherModel={agentDetail?.allowOtherModel}
          selectedModelId={selectedModelId}
          onModelSelect={setSelectedModelId}
          showSpaceSelector={showSpaceSelector}
          selectedSpaceId={selectedSpaceId}
          onSpaceSelect={setSelectedSpaceId}
          agentType={agentDetail?.type}
          selectedTag={
            selectedRecommend
              ? {
                  label: selectedRecommend.label,
                }
              : undefined
          }
          onClearSelectedTag={() => setSelectedRecommend(undefined)}
          agentMode={agentMode}
          onAgentModeChange={handleAgentModeChange}
          showAgentModeSelector={
            agentDetail?.allowChooseMode === DefaultSelectedEnum.Yes
          }
        />
        <ChatBoxRecommendNav
          items={recommendNavList}
          onSelect={handleRecommendSelect}
        />
      </main>
      <section className={cx(styles.recommendSection)}>
        <div className={cx(styles.wrapper)}>
          {loading ? (
            <Loading className={cx('h-full')} />
          ) : (
            homeCategoryInfo && (
              <DraggableHomeContent
                homeCategoryInfo={homeCategoryInfo}
                activeTab={activeTab}
                onTabClick={handleTabClick}
                onAgentClick={handleAgentClick}
                onToggleCollect={handleToggleCollect}
                onDataUpdate={runCategoryList}
              />
            )
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
