import ChatInputHome from '@/components/ChatInputHome';
import type { AgentMode } from '@/components/business-component/AgentIntervention';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
} from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import { AgentDetailDto } from '@/types/interfaces/agent';
import { message } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModel } from 'umi';
import TabsList from './components/TabsList';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface SubmitPayload {
  type: AgentComponentTypeEnum;
  prompt: string;
  files?: any[];
  skillIds?: number[];
  modelId?: number;
  tools?: any[];
  computerId?: string;
  agentMode?: AgentMode;
}

interface PromptBoxProps {
  onSubmit: (payload: SubmitPayload) => void;
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
      label: '智能体',
      placeholder:
        '描述你想要的智能体，例如：帮我创建一个代码审查助手，能自动检测代码问题并给出优化建议',
    },
    {
      key: AgentComponentTypeEnum.PageApp,
      label: '网页应用',
      placeholder:
        '描述你想要的网页应用，例如：帮我开发一个颜值管理网站，支持上传照片智能评估颜值与肤质',
    },
    {
      key: AgentComponentTypeEnum.Skill,
      label: '技能',
      placeholder:
        '描述你想要的自定义技能，例如：帮我写一个根据经纬度查询当前天气状况的API接口',
    },
    {
      key: AgentComponentTypeEnum.Plugin,
      label: '插件',
      placeholder:
        '描述你想要的插件工具，例如：帮我对接第三方图片转换的HTTP接口插件',
    },
  ];

  const [activeTab, setActiveTab] = useState<string>(
    AgentComponentTypeEnum.Agent,
  );

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

  const currentTab = tabs.find((t) => t.key === activeTab) || tabs[0];

  const usageScenarios = useMemo(() => {
    return activeTab === AgentComponentTypeEnum.PageApp
      ? [AgentTypeEnum.PageApp]
      : [AgentTypeEnum.TaskAgent];
  }, [activeTab]);

  const handleSend = useCallback(
    (msg: string, files?: any[], skillIds?: number[], modelId?: number) => {
      if (!msg?.trim() && !files?.length) {
        message.warning('请输入您的任务描述！');
        return;
      }
      onSubmit({
        type: activeTabRef.current as AgentComponentTypeEnum,
        prompt: msg,
        files,
        skillIds,
        modelId,
        tools: selectedComponentList,
        computerId: selectedComputerId,
        agentMode,
      });
    },
    [onSubmit, selectedComponentList, selectedComputerId, agentMode],
  );

  return (
    <div className={cx(styles['prompt-box-card'])}>
      <ChatInputHome
        key={currentTab.key}
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
        allowOtherModel={
          activeTab === AgentComponentTypeEnum.PageApp
            ? undefined
            : DefaultSelectedEnum.Yes
        }
        selectedModelId={selectedModelId}
        onModelSelect={setSelectedModelId}
        isTaskAgentActive={activeTab !== AgentComponentTypeEnum.PageApp}
        selectedComputerId={selectedComputerId}
        onComputerSelect={setSelectedComputerId}
        agentType={matchingAgentDetail?.type}
        agentId={matchingAgentDetail?.agentId}
        showAgentModeSelector={tenantConfigInfo?.enableAgentMode !== 0}
        agentMode={agentMode}
        onAgentModeChange={setAgentMode}
        tabsSlot={
          <TabsList tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        }
      />
    </div>
  );
};

export default PromptBox;
