import type { AgentMode } from '@/components/business-component/AgentIntervention';
import {
  readAgentModeCache,
  writeAgentModeCache,
} from '@/components/business-component/AgentIntervention/hooks/useAgentInterventionLayer';
import ChatInputHome, {
  type ChatInputHomeRef,
} from '@/components/ChatInputHome';
import Loading from '@/components/custom/Loading';
import { EVENT_TYPE } from '@/constants/event.constants';
import { useChatFinishedWhenListExecuting } from '@/hooks/useChatFinishedWhenListExecuting';
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
  AgentInfo,
  AgentManualComponentInfo,
  AgentRecentConversationInfo,
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
import { hasExecutingTaskInList } from '@/utils/conversationTaskStatusSync';
import eventBus from '@/utils/eventBus';
import { jumpTo } from '@/utils/router';
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
  // 最近使用智能体（含各自最近会话与执行状态），与左侧栏共享全局 model
  const { usedAgentList, runUsed } = useModel('conversationHistory');
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
  const [submitting, setSubmitting] = useState<boolean>(false);
  // 最近会话折叠区交互状态：选中展开 / 用户手动展开 / 用户手动收起（抑制执行中自动展开）
  const [selectedAgentId, setSelectedAgentId] = useState<number>();
  const [manualExpandedIds, setManualExpandedIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [manualCollapsedIds, setManualCollapsedIds] = useState<Set<number>>(
    () => new Set(),
  );

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
    runUsed();
  }, [runCategoryList, runRecommendNavList, runUsed]);

  // agentId → 最近会话列表映射（仅保留有会话的智能体）
  const recentConversationMap = useMemo(() => {
    const map = new Map<number, AgentRecentConversationInfo[]>();
    usedAgentList?.forEach((agent: AgentInfo) => {
      if (agent.agentId && agent.conversationList?.length) {
        map.set(agent.agentId, agent.conversationList);
      }
    });
    return map;
  }, [usedAgentList]);

  // 最终展开集合：用户手动展开 ∪ 执行中(未被手动收起抑制) ∪ 当前选中
  const expandedAgentIds = useMemo(() => {
    const ids = new Set<number>(manualExpandedIds);
    recentConversationMap.forEach((list, agentId) => {
      if (hasExecutingTaskInList(list) && !manualCollapsedIds.has(agentId)) {
        ids.add(agentId);
      }
    });
    if (selectedAgentId !== undefined) {
      ids.add(selectedAgentId);
    }
    return ids;
  }, [
    recentConversationMap,
    manualExpandedIds,
    manualCollapsedIds,
    selectedAgentId,
  ]);

  const allRecentConversations = useMemo(
    () => [...recentConversationMap.values()].flat(),
    [recentConversationMap],
  );

  const handleChatFinishedRefresh = useCallback(() => {
    runUsed();
  }, [runUsed]);

  // 存在执行中会话时订阅 ChatFinished，结束后静默刷新
  useChatFinishedWhenListExecuting({
    conversationList: allRecentConversations,
    onChatFinished: handleChatFinishedRefresh,
  });

  // 会话执行态乐观更新 / 列表静默刷新事件 → 重拉最近使用列表
  useEffect(() => {
    const handleRefresh = () => {
      runUsed();
    };
    eventBus.on(EVENT_TYPE.UpdateConversationListTaskStatus, handleRefresh);
    eventBus.on(EVENT_TYPE.RefreshConversationList, handleRefresh);
    return () => {
      eventBus.off(EVENT_TYPE.UpdateConversationListTaskStatus, handleRefresh);
      eventBus.off(EVENT_TYPE.RefreshConversationList, handleRefresh);
    };
  }, [runUsed]);

  // 手动收起的抑制只在执行期间有效：该智能体全部会话进入终态后自动解除
  useEffect(() => {
    setManualCollapsedIds((prev) => {
      if (prev.size === 0) {
        return prev;
      }
      const next = new Set<number>();
      prev.forEach((agentId) => {
        const list = recentConversationMap.get(agentId);
        if (list && hasExecutingTaskInList(list)) {
          next.add(agentId);
        }
      });
      return next.size === prev.size ? prev : next;
    });
  }, [recentConversationMap]);

  useEffect(() => {
    setAgentDetail(undefined);
    chatInputRef.current?.clear();
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
    if (submitting) return;

    if (!tenantConfigInfo || !currentAgentId) {
      message.warning(dict('PC.Pages.Home.noTenantInfo'));
      return;
    }

    setSubmitting(true);
    try {
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
            agentId: currentAgentId,
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
    } finally {
      setSubmitting(false);
    }
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

  // 卡片点击：有最近会话→切换选中（选中即展开）；无会话→保持原跳转
  const handleAgentClick = (agentInfo: CategoryItemInfo) => {
    const { targetId, lastConversationId } = agentInfo;

    if (!recentConversationMap.has(targetId)) {
      if (lastConversationId) {
        history.push(`/home/chat/${lastConversationId}/${targetId}`);
        return;
      }
      jumpTo(`/agent/${targetId}`);
      return;
    }

    const nextSelected = selectedAgentId === targetId ? undefined : targetId;
    setSelectedAgentId(nextSelected);
    if (nextSelected === targetId) {
      // 选中展开优先于手动收起
      setManualCollapsedIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    } else {
      // 取消选中时收起卡片：执行中的卡片需同步抑制自动展开，否则会立刻弹回
      setManualCollapsedIds((prev) => {
        const list = recentConversationMap.get(targetId);
        if (list && hasExecutingTaskInList(list)) {
          return new Set(prev).add(targetId);
        }
        return prev;
      });
    }
  };

  // 折叠头手动展开/收起；收起时抑制执行中自动展开并取消选中
  const handleToggleRecentExpand = useCallback(
    (agentId: number, expanded: boolean) => {
      if (expanded) {
        setManualExpandedIds((prev) => new Set(prev).add(agentId));
        setManualCollapsedIds((prev) => {
          const next = new Set(prev);
          next.delete(agentId);
          return next;
        });
        return;
      }
      setManualExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(agentId);
        return next;
      });
      setManualCollapsedIds((prev) => new Set(prev).add(agentId));
      setSelectedAgentId((prev) => (prev === agentId ? undefined : prev));
    },
    [],
  );

  const handleRecentConversationClick = useCallback(
    (agentId: number, conversationId: number | string) => {
      history.push(`/home/chat/${conversationId}/${agentId}`);
    },
    [],
  );

  const handleViewAllRecent = useCallback((agentId: number) => {
    history.push(`/history-conversation?agentId=${agentId}`);
  }, []);

  const handleRecommendSelect = (item: DisplayRecommendInfo) => {
    setSelectedRecommend((prev) => (prev?.id === item.id ? undefined : item));
    // 延迟以确保重新渲染后聚焦
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 0);
  };

  return (
    <div
      id="home-container"
      className={cx(styles.container, 'flex', 'flex-col', 'items-center')}
    >
      <main className={cx(styles.inputSection)}>
        <div className={cx(styles.titleContainer)}>
          <h2
            className={cx(styles.title)}
            dangerouslySetInnerHTML={{ __html: tenantConfigInfo?.homeSlogan }}
          />
        </div>
        <ChatBoxRecommendNav
          items={recommendNavList}
          onSelect={handleRecommendSelect}
        />
        <ChatInputHome
          ref={chatInputRef}
          className={cx(styles.textarea)}
          onEnter={handleEnter}
          isClearInput={false}
          wholeDisabled={submitting}
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
          readonly={!agentDetail?.allowPrivateSandbox}
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
          onClearSelectedTag={() => {
            setSelectedRecommend(undefined);
            chatInputRef.current?.clear();
            chatInputRef.current?.focus();
          }}
          agentMode={agentMode}
          onAgentModeChange={handleAgentModeChange}
          showAgentModeSelector={
            agentDetail?.allowChooseMode === DefaultSelectedEnum.Yes
          }
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
                recentConversationMap={recentConversationMap}
                expandedAgentIds={expandedAgentIds}
                selectedAgentId={selectedAgentId}
                onToggleRecentExpand={handleToggleRecentExpand}
                onRecentConversationClick={handleRecentConversationClick}
                onViewAllRecent={handleViewAllRecent}
              />
            )
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
