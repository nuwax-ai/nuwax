import ChatInputHome from '@/components/ChatInputHome';
import ModelSelector from '@/components/ChatInputHome/ModelSelector';
import type { AgentMode } from '@/components/business-component/AgentIntervention';
import { useAppDevModelSelector } from '@/hooks/useAppDevModelSelector';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import { dict } from '@/services/i18nRuntime';
import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
} from '@/types/enums/agent';
import { AgentSubTypeEnum, AgentTypeEnum } from '@/types/enums/space';
import { AgentDetailDto, ModelOptionDto } from '@/types/interfaces/agent';
import { message, Select } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModel, useParams } from 'umi';
import TabsList from './components/TabsList';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface SubmitPayload {
  type: AgentComponentTypeEnum;
  subType?: string;
  prompt: string;
  files?: any[];
  skillIds?: number[];
  modelId?: number;
  tools?: any[];
  computerId?: string;
  agentMode?: AgentMode;
}

interface PromptBoxProps {
  onSubmit: (payload: SubmitPayload) => Promise<void> | void;
}

interface TabItem {
  key: string;
  label: string;
  placeholder: string;
}

const PromptBox: React.FC<PromptBoxProps> = ({ onSubmit }) => {
  const tabs: TabItem[] = [
    {
      key: AgentComponentTypeEnum.Agent,
      label: dict('PC.Pages.SpaceCreateProject.tabAgent'),
      placeholder: dict('PC.Pages.SpaceCreateProject.placeholderAgent'),
    },
    {
      key: AgentComponentTypeEnum.PageApp,
      label: dict('PC.Pages.SpaceCreateProject.tabPageApp'),
      placeholder: dict('PC.Pages.SpaceCreateProject.placeholderPageApp'),
    },
    {
      key: AgentComponentTypeEnum.Skill,
      label: dict('PC.Pages.SpaceCreateProject.tabSkill'),
      placeholder: dict('PC.Pages.SpaceCreateProject.placeholderSkill'),
    },
    {
      key: AgentComponentTypeEnum.Plugin,
      label: dict('PC.Pages.SpaceCreateProject.tabPlugin'),
      placeholder: dict('PC.Pages.SpaceCreateProject.placeholderPlugin'),
    },
  ];

  const [activeTab, setActiveTab] = useState<string>(
    AgentComponentTypeEnum.Agent,
  );
  // 智能体子类型选择（仅智能体 tab 下显示）
  const subTypeOptions = [
    { label: '问答型', value: AgentSubTypeEnum.ChatBot },
    { label: '通用型', value: AgentSubTypeEnum.General },
    { label: '自定义', value: AgentSubTypeEnum.Custom },
    { label: 'AgentFlow', value: AgentSubTypeEnum.Flow },
    { label: 'AgentGroup', value: AgentSubTypeEnum.Group },
  ];
  const [subType, setSubType] = useState<AgentSubTypeEnum>(
    AgentSubTypeEnum.ChatBot,
  );

  const params = useParams();
  const spaceId = Number(params.spaceId);
  const isPageApp = activeTab === AgentComponentTypeEnum.PageApp;

  // 提交中状态，防止连续发送
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取租户配置信息
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  // 根据不同的 Tab 场景选择对应的智能体 ID
  const currentAgentId = useMemo(() => {
    if (!tenantConfigInfo) return undefined;

    switch (activeTab) {
      case AgentComponentTypeEnum.Agent:
        return tenantConfigInfo.agentDevAgentId;
      case AgentComponentTypeEnum.PageApp:
        return undefined; // 网页应用不依赖智能体 ID，不请求详情
      case AgentComponentTypeEnum.Skill:
        return tenantConfigInfo.skillDevAgentId;
      case AgentComponentTypeEnum.Plugin:
        return tenantConfigInfo.pluginDevAgentId;
      default:
        return undefined;
    }
  }, [activeTab, tenantConfigInfo]);

  // 选中的模型 ID
  const [selectedModelId, setSelectedModelId] = useState<number>();

  // 选中的云电脑 ID
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');

  // 选中的 Agent 模式（yolo/ask），随新建流程透传到目标会话页
  const [agentMode, setAgentMode] = useState<AgentMode>('yolo');

  // 默认智能体配置详情
  const [agentDetail, setAgentDetail] = useState<AgentDetailDto>();

  // 会话输入框已选择组件
  const {
    selectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  // 已发布的智能体详情接口
  const runDetail = useCallback(async (agentId: number) => {
    try {
      const { data } = await apiPublishedAgentInfo(agentId);
      setAgentDetail(data);
    } catch {
      // 消费 Promise，避免 dev overlay
    }
  }, []);

  // 切换 Tab 时重置选中的电脑和模型，防止上一个 Tab 的选择被错误带入
  useEffect(() => {
    setSelectedComputerId('');
    setSelectedModelId(undefined);
  }, [activeTab]);

  // 网页应用编码模型，复用开发详情页同款 Hook
  const { models: codingModels } = useAppDevModelSelector(
    spaceId,
    undefined,
    isPageApp,
  );

  useEffect(() => {
    // 切换 Tab 时立刻清空旧的详情数据，防止 pending 期间或接口失败时展示旧的快捷标签和模型
    setAgentDetail(undefined);
    if (currentAgentId) {
      runDetail(currentAgentId);
    }
  }, [currentAgentId, runDetail]);

  // 过滤出与当前 Tab 匹配的详情数据，防止切换 Tab 的瞬间渲染旧的详情数据，导致组件卸载重装时误触发旧 ID 的接口请求
  const matchingAgentDetail = useMemo(() => {
    if (agentDetail && agentDetail.agentId === currentAgentId) {
      return agentDetail;
    }
    return undefined;
  }, [agentDetail, currentAgentId]);

  // 初始化选中的组件列表
  useEffect(() => {
    initSelectedComponentList(matchingAgentDetail?.manualComponents);
  }, [matchingAgentDetail?.manualComponents]);

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const subTypeRef = useRef(subType);
  subTypeRef.current = subType;

  const currentTab = tabs.find((t) => t.key === activeTab) || tabs[0];

  const usageScenarios = useMemo(() => {
    return activeTab === AgentComponentTypeEnum.PageApp
      ? [AgentTypeEnum.PageApp]
      : [AgentTypeEnum.TaskAgent];
  }, [activeTab]);

  const handleSend = useCallback(
    (msg: string, files?: any[], skillIds?: number[], modelId?: number) => {
      if (isSubmitting) return;
      if (!msg?.trim() && !files?.length) {
        message.warning(
          dict('PC.Pages.SpaceCreateProject.inputRequiredWarning'),
        );
        return;
      }
      setIsSubmitting(true);
      Promise.resolve(
        onSubmit({
          type: activeTabRef.current as AgentComponentTypeEnum,
          subType: subTypeRef.current,
          prompt: msg,
          files,
          skillIds,
          modelId,
          tools: selectedComponentList,
          computerId: selectedComputerId,
          agentMode,
        }),
      ).finally(() => setIsSubmitting(false));
    },
    [
      onSubmit,
      selectedComponentList,
      selectedComputerId,
      agentMode,
      isSubmitting,
      subType,
    ],
  );

  return (
    <div className={cx(styles['prompt-box-card'])}>
      <ChatInputHome
        key={currentTab.key}
        wholeDisabled={isSubmitting}
        onEnter={handleSend}
        placeholder={currentTab.placeholder}
        usageScenarios={usageScenarios}
        manualComponents={matchingAgentDetail?.manualComponents || []}
        selectedComponentList={selectedComponentList}
        onSelectComponent={handleSelectComponent}
        enableMention={
          !matchingAgentDetail ||
          matchingAgentDetail.allowAtSkill === DefaultSelectedEnum.Yes
        }
        allowOtherModel={isPageApp ? undefined : DefaultSelectedEnum.Yes}
        selectedModelId={selectedModelId}
        onModelSelect={setSelectedModelId}
        isTaskAgentActive={activeTab !== AgentComponentTypeEnum.PageApp}
        selectedComputerId={selectedComputerId}
        onComputerSelect={setSelectedComputerId}
        agentType={matchingAgentDetail?.type}
        agentId={matchingAgentDetail?.agentId}
        showAgentModeSelector={
          !isPageApp && tenantConfigInfo?.enableAgentMode !== 0
        }
        agentMode={agentMode}
        onAgentModeChange={setAgentMode}
        prefix={
          isPageApp ? (
            <ModelSelector
              modelList={
                codingModels?.chatModelList as unknown as ModelOptionDto[]
              }
              selectedModelId={selectedModelId}
              onModelSelect={setSelectedModelId}
            />
          ) : undefined
        }
        tabsSlot={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TabsList
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
            {activeTab === AgentComponentTypeEnum.Agent && (
              <Select
                size="small"
                value={subType}
                onChange={(v) => setSubType(v as AgentSubTypeEnum)}
                options={subTypeOptions}
                style={{ width: 120 }}
              />
            )}
          </div>
        }
      />
    </div>
  );
};

export default PromptBox;
