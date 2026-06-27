import ChatInputHome from '@/components/ChatInputHome';
import Loading from '@/components/custom/Loading';
import useConversation from '@/hooks/useConversation';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import {
  apiCollectAgent,
  apiHomeCategoryList,
  apiPublishedAgentInfo,
  apiUnCollectAgent,
} from '@/services/agentDev';
import { dict } from '@/services/i18nRuntime';
import { DefaultSelectedEnum } from '@/types/enums/agent';
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
import { App, message as antdMessage } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { history, useModel, useRequest } from 'umi';
import DraggableHomeContent from './DraggableHomeContent';
import styles from './index.less';

const cx = classNames.bind(styles);
const EMPTY_MANUAL_COMPONENTS: AgentManualComponentInfo[] = [];

const Home: React.FC = () => {
  const { message } = App.useApp();
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const { handleCreateConversation } = useConversation();
  const {
    selectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  const [agentDetail, setAgentDetail] = useState<AgentDetailDto>();
  const [isTaskAgentMode, setIsTaskAgentMode] = useState<boolean>(false);
  const [selectedComputerId, setSelectedComputerId] =
    useState<string>('remote');
  const [selectedModelId, setSelectedModelId] = useState<number>();
  const [activeTab, setActiveTab] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const [homeCategoryInfo, setHomeCategoryInfo] =
    useState<HomeAgentCategoryInfo>();

  const currentAgentId =
    isTaskAgentMode && tenantConfigInfo?.defaultTaskAgentId
      ? tenantConfigInfo.defaultTaskAgentId
      : tenantConfigInfo?.defaultAgentId;

  const runDetail = useCallback(async (agentId: number) => {
    try {
      const { data } = await apiPublishedAgentInfo(agentId);
      setAgentDetail(data);
    } catch {
      // 全局 request errorHandler 已展示用户提示，这里只消费 Promise，避免 dev overlay。
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
  }, [runCategoryList]);

  useEffect(() => {
    if (currentAgentId) {
      runDetail(currentAgentId);
    }
  }, [currentAgentId, runDetail]);

  useEffect(() => {
    initSelectedComponentList(agentDetail?.manualComponents);
  }, [agentDetail?.manualComponents]);

  const handleEnter = async (
    inputMessage: string,
    files?: UploadFileInfo[],
    skillIds?: number[],
    modelId?: number,
  ) => {
    if (!tenantConfigInfo || !currentAgentId) {
      message.warning(dict('PC.Pages.Home.noTenantInfo'));
      return;
    }

    await handleCreateConversation(currentAgentId, {
      message: inputMessage,
      files,
      infos: selectedComponentList,
      messageSourceType: 'home' as MessageSourceType,
      skillIds,
      modelId: modelId || selectedModelId,
    });
  };

  const showTaskAgentToggle = !!(
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

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'items-center')}>
      <main className={cx(styles.inputSection)}>
        <h2
          className={cx(styles.title)}
          dangerouslySetInnerHTML={{ __html: tenantConfigInfo?.homeSlogan }}
        />
        <ChatInputHome
          key={`home-${currentAgentId}-${isTaskAgentMode}`}
          className={cx(styles.textarea)}
          onEnter={handleEnter}
          isClearInput={false}
          manualComponents={
            agentDetail?.manualComponents || EMPTY_MANUAL_COMPONENTS
          }
          selectedComponentList={selectedComponentList}
          onSelectComponent={handleSelectComponent}
          showTaskAgentToggle={showTaskAgentToggle}
          isTaskAgentActive={isTaskAgentMode}
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
          agentType={agentDetail?.type}
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
              />
            )
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
