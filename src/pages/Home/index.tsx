import type { AgentMode } from '@/components/business-component/AgentIntervention';
import {
  readAgentModeCache,
  writeAgentModeCache,
} from '@/components/business-component/AgentIntervention/hooks/useAgentInterventionLayer';
import ChatInputHome, {
  type ChatInputHomeRef,
} from '@/components/ChatInputHome';
import { getWorkspaceDirPolicy } from '@/constants/workspaceDirPolicy.constants';
import useConversation from '@/hooks/useConversation';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import { apiDisplayRecommendList } from '@/services/displayRecommend';
import { dict } from '@/services/i18nRuntime';
import { fetchChatboxCategories } from '@/services/square';
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
  MessageSourceType,
  UploadFileInfo,
} from '@/types/interfaces/common';
import {
  DisplayRecommendFunctionTypeEnum,
  type DisplayRecommendInfo,
} from '@/types/interfaces/displayRecommend';
import type { SquareCategoryInfo } from '@/types/interfaces/square';
import { App } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModel } from 'umi';
import { createProjectAndNavigate } from '../SpaceCreateProject/utils/projectCreateStrategy';
import ChatBoxRecommendNav from './components/ChatBoxRecommendNav';
import HomeCategoryTabs, {
  type HomeCategoryDef,
} from './components/HomeCategoryTabs';
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
  [DisplayRecommendFunctionTypeEnum.UserAppDev]: AgentComponentTypeEnum.UserApp,
  [DisplayRecommendFunctionTypeEnum.NormalProjectDev]:
    AgentComponentTypeEnum.NormalProject,
};

const TASK_AGENT_FUNCTION_TYPES = new Set<string>([
  DisplayRecommendFunctionTypeEnum.AgentDev,
  DisplayRecommendFunctionTypeEnum.SkillDev,
  DisplayRecommendFunctionTypeEnum.PluginDev,
  DisplayRecommendFunctionTypeEnum.UserAppDev,
  DisplayRecommendFunctionTypeEnum.NormalProjectDev,
]);

const SPACE_SELECTOR_FUNCTION_TYPES = new Set<string>([
  DisplayRecommendFunctionTypeEnum.AgentDev,
  DisplayRecommendFunctionTypeEnum.PageAppDev,
  DisplayRecommendFunctionTypeEnum.SkillDev,
  DisplayRecommendFunctionTypeEnum.PluginDev,
  DisplayRecommendFunctionTypeEnum.UserAppDev,
  DisplayRecommendFunctionTypeEnum.NormalProjectDev,
]);

/** 首页本地补充导航项 ID，避免与后台推荐 ID 冲突 */

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
  /** 发起会话时选择的工作目录（wiki #17：仅个人电脑时随会话创建记录） */
  const [workspaceDir, setWorkspaceDir] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<number>();
  const [selectedSpaceId, setSelectedSpaceId] = useState<number>();
  const [agentMode, setAgentMode] = useState<AgentMode>('yolo');
  const [recommendNavList, setRecommendNavList] = useState<
    DisplayRecommendInfo[]
  >([]);
  /** 内容分类 pill 数据源:已发布分类接口的 ChatBox 分类(与推荐管理配置同源) */
  const [chatboxCategories, setChatboxCategories] = useState<
    SquareCategoryInfo[]
  >([]);
  const [selectedRecommend, setSelectedRecommend] =
    useState<DisplayRecommendInfo>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  // 输入区上方内容分类:用户手动选择(null=未选过,自动取第一个有内容的分类)
  const [userPickedCategory, setUserPickedCategory] = useState<string | null>(
    null,
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
  // 全栈应用等不支持个人电脑的类型：电脑选择锁定云端、工作目录栏一并隐藏
  const disablePersonalComputer = selectedProjectType
    ? !getWorkspaceDirPolicy(selectedProjectType).personalComputer
    : false;
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

  useEffect(() => {
    runRecommendNavList();
  }, [runRecommendNavList]);

  useEffect(() => {
    let cancelled = false;
    fetchChatboxCategories()
      .then((children) => {
        if (!cancelled) {
          setChatboxCategories(children);
        }
      })
      .catch((error) => {
        console.error('fetch chatbox categories failed:', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
            // 自定义工作目录（wiki #17）：仅个人电脑生效，选中目录被占用时创建报错
            workspaceDir:
              selectedComputerId && selectedComputerId !== '-1'
                ? workspaceDir || undefined
                : undefined,
            agentMode,
            agentId: currentAgentId,
            // 首页选中 agent 创建项目：把该 agent 作为项目调试智能体传给后端
            devAgentId: currentAgentId,
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
        workspaceDir:
          selectedComputerId && selectedComputerId !== '-1'
            ? workspaceDir || undefined
            : undefined,
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

  // 内容分类列表(对话任务/项目开发/AI教育等):pill 来自已发布分类接口的
  // ChatBox 分类,推荐按 category(分类 key)归入对应 pill;
  // 存量未配置分类的推荐归入第一个 pill,避免内容丢失
  const categoryNavList = useMemo<HomeCategoryDef[]>(() => {
    if (chatboxCategories.length === 0) return [];
    const firstKey = chatboxCategories[0].key;
    return chatboxCategories.map((category) => ({
      key: category.key,
      label: category.label,
      items: recommendNavList.filter(
        (item) => (item.category || firstKey) === category.key,
      ),
    }));
  }, [chatboxCategories, recommendNavList]);

  // 默认分类 = 第一个有内容的分类(数据到达时 Segmented 才首挂,值直接就位,
  // 避免挂载后回落引发滑块从起始分类滑过来的无意义动画);用户手动点过则优先
  const autoCategoryKey =
    categoryNavList.find((c) => c.items.length > 0)?.key ??
    chatboxCategories[0]?.key ??
    '';
  const activeCategory = userPickedCategory ?? autoCategoryKey;

  const activeCategoryItems =
    categoryNavList.find((c) => c.key === activeCategory)?.items ?? [];

  const handleCategoryChange = (key: string) => {
    setUserPickedCategory(key);
    // 切换分类后清掉已选 pill,避免跨分类残留选中态
    if (selectedRecommend) {
      setSelectedRecommend(undefined);
      chatInputRef.current?.clear();
    }
  };

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
          <p className={cx(styles['hero-subtitle'])}>
            {dict('PC.Pages.Home.heroSubtitle')}
          </p>
        </div>
        {/* 推荐数据到达后再渲染分类区:Segmented 首挂时选中值即最终值,
            避免挂载后调整引发滑块从起始分类滑过来的动画 */}
        {recommendNavList.length > 0 && (
          <HomeCategoryTabs
            categories={categoryNavList}
            activeKey={activeCategory}
            onChange={handleCategoryChange}
          />
        )}
        <ChatBoxRecommendNav
          items={activeCategoryItems}
          selectedId={selectedRecommend?.id}
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
          onComputerSelect={(id) => {
            setSelectedComputerId(id);
            // 切回云电脑时清掉已选工作目录（仅个人电脑生效）
            if (id === '-1' && workspaceDir) setWorkspaceDir('');
          }}
          workspaceDir={workspaceDir}
          onWorkspaceDirChange={
            // 无目录能力的类型（全栈等）不传回调 → 工作目录栏不渲染
            disablePersonalComputer ? undefined : setWorkspaceDir
          }
          disablePersonalComputer={disablePersonalComputer}
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
      <footer className={cx(styles['foot-tip'])}>
        {dict('PC.Pages.Home.aiGeneratedTip')}
      </footer>
    </div>
  );
};

export default Home;
