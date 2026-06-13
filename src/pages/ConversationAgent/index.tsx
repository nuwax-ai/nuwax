import {
  ConversationBottomConsole,
  DevLogActions,
  GitVersionRecordPanel,
  type ConsoleLayoutMode,
} from '@/components/business-component';
import { type AgentMode } from '@/components/business-component/AgentIntervention';
import FileTreeGitSourcePanel, {
  useConversationAgentSourceControl,
  type SelectedChangeFile,
} from '@/components/business-component/FileTreeGitSourcePanel';
import VncPreview from '@/components/business-component/VncPreview';
import CreateAgent from '@/components/CreateAgent';
import Loading from '@/components/custom/Loading';
import type { ChangeFileInfo } from '@/components/FileTreeView/type';
import PublishComponentModal from '@/components/PublishComponentModal';
import type { PromptVariable } from '@/components/TiptapVariableInput/types';
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { useTerminalWsUrl } from '@/hooks/useTerminalWsUrl';
import useUnifiedTheme from '@/hooks/useUnifiedTheme';
import AgentModelSetting from '@/pages/EditAgent/AgentModelSetting';
import DebugDetails from '@/pages/EditAgent/DebugDetails';
import SubscriptionSetting from '@/pages/EditAgent/SubscriptionSetting';
import SubscriptionStats from '@/pages/EditAgent/SubscriptionStats';
import { SystemUserTipsWordRef } from '@/pages/EditAgent/SystemTipsWord';
import {
  apiAgentComponentModelUpdate,
  apiAgentConfigInfo,
  apiAgentConfigUpdate,
} from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import { apiModelList } from '@/services/modelConfig';
import {
  apiDownloadAllFiles,
  apiUpdateStaticFile,
  apiUploadFiles,
} from '@/services/vncDesktop';
import {
  AgentComponentTypeEnum,
  HideDesktopEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { CreateUpdateModeEnum, PublishStatusEnum } from '@/types/enums/common';
import { ModelTypeEnum } from '@/types/enums/modelConfig';
import {
  AgentTypeEnum,
  EditAgentShowType,
  OpenCloseEnum,
} from '@/types/enums/space';
import {
  AgentBaseInfo,
  AgentComponentInfo,
  AgentConfigInfo,
  AgentConfigUpdateParams,
  ComponentModelBindConfig,
  GuidQuestionDto,
} from '@/types/interfaces/agent';
import { FileNode } from '@/types/interfaces/appDev';
import type { BindConfigWithSub } from '@/types/interfaces/common';
import { UpdateFileInfo } from '@/types/interfaces/fileTree';
import type {
  ModelConfigInfo,
  ModelListParams,
} from '@/types/interfaces/model';
import { RequestResponse } from '@/types/interfaces/request';
import { StaticFileInfo } from '@/types/interfaces/vncDesktop';
import { checkFileSizeExceedLimit } from '@/utils';
import { modalConfirm } from '@/utils/ant-custom';
import { addBaseTarget } from '@/utils/common';
import { updateFilesListContent, updateFilesListName } from '@/utils/fileTree';
import {
  TTYD_TERMINAL_WIRE_PROTOCOL,
  TTYD_TERMINAL_WS_SUBPROTOCOLS,
} from '@/utils/terminalWsUrl';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
import AgentArrangeConfigSection from './AgentArrangePanel/AgentArrangeConfigSection';
import AgentConversationChatPanel from './AgentConversationChatPanel';
import ConversationAgentChatSession from './ConversationAgentChatSession';
import ConversationAgentFilePreview from './ConversationAgentFilePreview';
import {
  getFileTabId,
  PREVIEW_TAB_PICKER_ID,
  usePreviewTabs,
  WORKSPACE_PREVIEW_TOOL_IDS,
  type PreviewToolId,
} from './ConversationAgentFilePreview/hooks/usePreviewTabs';
import PreviewTabBar from './ConversationAgentFilePreview/PreviewTabBar';
import type { ConversationAgentFileViewProps } from './hooks/types';
import { useConversationAgentDevLogs } from './hooks/useConversationAgentDevLogs';
import { useConversationAgentFileView } from './hooks/useConversationAgentFileView';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * ConversationAgent — 智能体对话开发页面（核心页面组件）
 *
 * ## 布局结构
 * 采用三栏式布局 + 底部终端控制台：
 * ┌─────────────────────────────────────────────────────────┐
 * │                    Header (导航栏)                       │
 * ├──────────────┬────────────────┬─────────────────────────┤
 * │  左侧面板     │   中间面板      │      右侧面板            │
 * │  (聊天区域)   │   (文件树)      │  (编排配置 / 文件预览)    │
 * │  始终显示     │   可收起/展开    │  + 底部终端 (始终显示)    │
 * ├──────────────┴────────────────┴─────────────────────────┤
 * │                 模态弹窗层 (发布/编辑/模型设置)             │
 * └─────────────────────────────────────────────────────────┘
 *
 * ## 核心职责
 * 1. 智能体配置加载与更新（agentConfigInfo）
 * 2. 聊天对话管理（通过 conversationInfo model）
 * 3. 文件树管理（CRUD、上传、重命名等）
 * 4. 编排面板与文件预览的切换显示
 * 5. 终端 WebSocket 连接管理
 * 6. 模型配置、发布、导入导出等操作
 *
 * ## 数据流
 * - URL 参数 (agentId) → 加载智能体配置 → 驱动 UI 渲染
 * - 用户操作 → handleChangeAgent → 调用 API 更新 → 同步本地状态
 * - conversationInfo model 管理聊天消息、文件树、预览等页面状态
 */
const ConversationAgent: React.FC = () => {
  // ==================== 路由参数 ====================
  const params = useParams();
  const location = useLocation();
  /** 当前空间 ID，从路由参数中获取 */
  const spaceId = Number(params.spaceId);

  /**
   * 从 URL query 参数中提取 agentId
   * 支持通过 URL 直接指定要加载的智能体（如 ?agentId=123）
   */
  const agentIdFromQuery = useMemo(() => {
    const queryAgentId = new URLSearchParams(location.search).get('agentId');
    return queryAgentId ? Number(queryAgentId) : 0;
  }, [location.search]);

  /**
   * 从 URL query 参数中提取 conversationId
   */
  const queryConversationId = useMemo(() => {
    const queryId = new URLSearchParams(location.search).get('conversationId');
    return queryId ? Number(queryId) : undefined;
  }, [location.search]);

  // ==================== Refs ====================
  /** 系统提示词编辑器引用，用于外部插入文本（如变量、工具标签） */
  const systemUserTipsWordRef = useRef<SystemUserTipsWordRef>(null);

  // ==================== 本地状态 ====================
  /** 当前智能体 ID */
  const [agentId, setAgentId] = useState<number>(agentIdFromQuery);
  /** 发布弹窗是否打开 */
  const [open, setOpen] = useState<boolean>(false);
  /** 编辑智能体基础信息弹窗是否打开 */
  const [openEditAgent, setOpenEditAgent] = useState<boolean>(false);
  /** 模型设置弹窗是否打开 */
  const [openAgentModel, setOpenAgentModel] = useState<boolean>(false);
  /** 底部开发者控制台（终端）是否显示 */
  const [showDevConsole] = useState<boolean>(true);
  /** 切换预览标签/文件时递增，用于终端从 expanded 恢复 default */
  const [devConsoleLayoutResetSignal, setDevConsoleLayoutResetSignal] =
    useState<number>(0);
  /** 递增后触发底部终端全屏展开（开发工具「终端」入口） */
  const [devConsoleExpandSignal, setDevConsoleExpandSignal] =
    useState<number>(0);
  /** 底部控制台当前激活 Tab（用于控制日志轮询） */
  const [devConsoleActiveTab, setDevConsoleActiveTab] = useState<
    'terminal' | 'logs'
  >('terminal');
  /** 底部控制台布局模式（collapsed 时停止日志轮询） */
  const [devConsoleLayoutMode, setDevConsoleLayoutMode] =
    useState<ConsoleLayoutMode>('collapsed');
  /** 从开发工具打开终端时跳过 onToolTabActivate 中的布局重置 */
  const skipDevConsoleResetRef = useRef<boolean>(false);
  /** 源代码管理中选中的变更文件（含区块） */
  const [selectedChangeFile, setSelectedChangeFile] =
    useState<SelectedChangeFile | null>(null);
  /** 标签选择面板是否展开 */
  /** 预览标签页操作 ref（供 fileViewProviderProps 回调使用） */
  const previewTabsRef = useRef<ReturnType<typeof usePreviewTabs> | null>(null);
  /** 刷新 Git 变更列表（delete 等场景需在 fileView 初始化后调用） */
  const refreshGitListRef = useRef<(() => Promise<void>) | null>(null);
  /** 统一主题样式（导航栏风格等） */
  const { navigationStyle } = useUnifiedTheme();

  /** 智能体完整配置信息，驱动整个页面的渲染 */
  const [agentConfigInfo, setAgentConfigInfo] = useState<AgentConfigInfo>();
  /** 当前可用的提示词变量列表（从智能体组件列表中提取） */
  const [promptVariables, setPromptVariables] = useState<PromptVariable[]>([]);
  /** 当前可用的工具列表（插件、工作流、MCP、技能、子智能体） */
  const [promptTools, setPromptTools] = useState<AgentComponentInfo[]>([]);
  // 当前选中的电脑 ID
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');

  /** 智能体配置加载中状态 */
  const [loadingAgentConfigInfo, setLoadingAgentConfigInfo] = useState<boolean>(
    !!agentId,
  );
  /** 空间下可用的模型列表（用于模型选择器） */
  const [originalModelConfigList, setOriginalModelConfigList] = useState<
    ModelConfigInfo[]
  >([]);
  /** 文件树区域是否显示（header 图标控制，控制中间面板的滑出/收起） */
  const [canShowFileView, setCanShowFileView] = useState<boolean>(true);
  /** 右侧预览区是否展示智能体电脑（VNC） */
  const [isAgentDesktopOpen, setIsAgentDesktopOpen] = useState<boolean>(false);

  // ==================== 全局状态模型 ====================
  /**
   * conversationInfo model：聊天核心状态管理
   * - 消息列表、会话信息、文件树数据
   * - 文件树可见性、固定状态、预览模式
   * - 文件操作（刷新、打开预览、关闭预览）
   * - TaskAgent 文件选中状态
   */
  const {
    showType,
    setShowType,
    setIsSuggest,
    messageList,
    setChatSuggestList,
    // setIsLoadingConversation,
    runQueryConversation,
    conversationInfo,
    isFileTreePinned,
    setIsFileTreePinned,
    closePreviewView,
    openDesktopView,
    fileTreeData,
    fileTreeDataLoading,
    handleRefreshFileList,
    refreshFileListImmediately,
    openPreviewView,
    taskAgentSelectedFileId,
    taskAgentSelectTrigger,
    setIsLoadingOtherInterface,
    onMessageSend,
    runAsync,
    resetInit,
  } = useModel('conversationInfo');

  /** 关闭远程智能体桌面（切换标签/文件等预览操作时调用） */
  const closeAgentDesktop = useCallback(() => {
    setIsAgentDesktopOpen(false);
    closePreviewView();
  }, [closePreviewView]);

  /** 文件树数据 ref，供防抖保存读取最新列表 */
  const fileTreeDataRef = useRef(fileTreeData);
  fileTreeDataRef.current = fileTreeData;

  /** conversationAgent model：页面独立聊天会话（与 conversationInfo 隔离） */
  const {
    runQueryConversation: runQueryAgentConversation,
    resetInit: resetAgentConversation,
  } = useModel('conversationAgent');
  /** tenantConfigInfo model：租户配置（页面标题、订阅开关等） */
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  /** spaceAgent model：当前空间下的智能体组件列表（变量、插件、工具等） */
  const { agentComponentList } = useModel('spaceAgent');

  // 是否开启订阅功能
  const isEnableSubscription = tenantConfigInfo?.enableSubscription !== 0;

  // ==================== 计算属性 ====================
  /** 开发会话 ID，用于聊天历史查询 */
  const devConversationId = agentConfigInfo?.devConversationId;

  /**
   * 获取有效的沙箱 ID
   */
  const getEffectiveSandboxId = (info: any = conversationInfo) => {
    try {
      // 优先级 1: 手动选择 (selectedComputerId)
      if (selectedComputerId) {
        return selectedComputerId;
      }

      // 优先级 2: 兜底从 location.state 获取 (仅 PUSH 跳转)。
      // 解决首次加载发消息时，状态未及时更新导致获取到内置 sandboxId 的问题。
      if (
        history.action === 'PUSH' &&
        (location.state as any)?.selectedComputerId
      ) {
        return (location.state as any).selectedComputerId;
      }

      // 优先级 3: 个人电脑 (sandboxId)
      if (info?.agent?.sandboxId) {
        return info.agent.sandboxId;
      }

      // 优先级 4: 共享电脑 (sandboxServerId)
      const sandboxServerId = info?.sandboxServerId;
      if (sandboxServerId) {
        return String(sandboxServerId);
      }

      return '';
    } catch {
      return selectedComputerId;
    }
  };

  /**
   * 最终选中的沙箱电脑 ID
   * 用于终端连接和文件预览
   */
  const finalSelectedComputerId = useMemo(() => {
    return getEffectiveSandboxId();
  }, [selectedComputerId, conversationInfo, history.action, location.state]);

  /**
   * 终端 WebSocket 连接地址（ttyd）
   */
  const terminalWsUrl = useTerminalWsUrl(
    agentConfigInfo?.tenantId,
    finalSelectedComputerId,
  );

  /** 沙盒开发日志：仅在底部控制台打开且处于日志 Tab 时轮询 */
  const devLogs = useConversationAgentDevLogs(queryConversationId, {
    enabled:
      showDevConsole &&
      devConsoleActiveTab === 'logs' &&
      devConsoleLayoutMode !== 'collapsed' &&
      !!queryConversationId,
    pollInterval: 5000,
    tailLines: 1000,
  });

  // ==================== 数据请求 ====================
  /** 加载空间下可用的聊天模型列表 */
  const runMode = async (modelParams: ModelListParams) => {
    const result = await apiModelList(modelParams);
    setOriginalModelConfigList(result?.data || []);
  };

  // ==================== 副作用 (Effects) ====================

  /**
   * devConversationId 就绪后查询开发会话历史，写入 conversationAgent.messageList
   * 注意：不要把 runQueryConversation / resetInit 放入依赖，否则 cleanup 会清空 messageList 并导致循环请求
   */
  useEffect(() => {
    if (!devConversationId) {
      return;
    }
    runQueryAgentConversation(devConversationId);
  }, [devConversationId]);

  /** 离开 ConversationAgent 页面时清理 conversationAgent 会话状态 */
  useEffect(() => {
    return () => {
      resetAgentConversation();
    };
  }, []);

  /**
   * 当页面加载结束且携带了初始消息状态时，自动触发消息发送
   */
  useEffect(() => {
    // 优先使用路由参数中指定的 conversationId
    const id = queryConversationId;

    if (id) {
      const state = (location.state || history.location.state) as any;
      if (
        state &&
        (state.message?.trim() || state.files?.length || state.skillIds?.length)
      ) {
        const asyncFun = async () => {
          let data = null;
          try {
            const { data: _data } = await runAsync(id);
            data = _data;
          } catch (error) {
            console.error(
              'Failed to query conversation before auto-send',
              error,
            );
          }

          const list = data?.messageList || [];
          const len = list?.length || 0;
          // 会话消息列表为空或者只有一条消息并且此消息时开场白时，可以发送消息
          const isCanMessage =
            !len ||
            (len === 1 && list[0].messageType === MessageTypeEnum.ASSISTANT);

          if (isCanMessage) {
            // 确定沙箱 ID
            const effectiveSandboxId = String(getEffectiveSandboxId(data));
            onMessageSend({
              id,
              messageInfo: state.message || '',
              files: state.files,
              infos: state.infos || [],
              sandboxId: effectiveSandboxId,
              debug: true,
              isSync: false,
              skillIds: state.skillIds,
              modelId: state.modelId,
              agentMode:
                (localStorage.getItem('nuwax_agent_mode_cache') as AgentMode) ||
                'yolo',
              data,
            });
          }
        };
        asyncFun();
      }
    }
  }, [
    location.state,
    history.location.state,
    selectedComputerId,
    queryConversationId,
  ]);

  /** 空间变化时重新加载模型列表 */
  useEffect(() => {
    runMode({
      spaceId,
      modelType: ModelTypeEnum.Chat,
    });
  }, [spaceId]);

  /** URL 中的 agentId 变化时同步到本地状态 */
  useEffect(() => {
    setAgentId(agentIdFromQuery);
  }, [agentIdFromQuery]);

  // 如果 URL 中有 conversationId，通过状态管理器的方法查询当前会话
  useEffect(() => {
    if (queryConversationId) {
      setLoadingAgentConfigInfo(true);
      runQueryConversation(queryConversationId);
    }

    // 在 queryConversationId 变更前或组件卸载时清理会话数据
    return () => {
      resetInit();
    };
  }, [queryConversationId]);

  // 监听状态管理器中的 conversationInfo 变化以关闭加载状态
  useEffect(() => {
    if (conversationInfo) {
      setLoadingAgentConfigInfo(false);
    }
  }, [conversationInfo]);

  /**
   * 智能体配置加载请求（带防抖）
   * 用于首次加载或 agentId 切换时获取完整配置
   */
  const { run: runAgentConfigInfo } = useRequest(apiAgentConfigInfo, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<AgentConfigInfo>) => {
      setLoadingAgentConfigInfo(false);
      const data = result?.data;
      // 回显模型选择 (如果从创建项目页面带过来)
      if (
        data &&
        history.action === 'PUSH' &&
        (location.state as any)?.modelId
      ) {
        if (!data.modelComponentConfig) {
          data.modelComponentConfig = {} as any;
        }
        data.modelComponentConfig.targetId = (location.state as any).modelId;

        // 尝试从列表中回显名称
        const matchedModel = originalModelConfigList.find(
          (m) => m.id === (location.state as any).modelId,
        );
        if (matchedModel) {
          data.modelComponentConfig.name = matchedModel.name;
        }
      }
      setAgentConfigInfo(data);
    },
    onError: () => {
      setLoadingAgentConfigInfo(false);
    },
  });

  /**
   * 智能体配置局部刷新请求
   * 仅更新 pageHomeIndex 字段（首页索引），用于 expandPageArea 变更后同步
   */
  const { run: runUpdateAgent } = useRequest(apiAgentConfigInfo, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<AgentConfigInfo>) => {
      const { data } = result;
      const _agentConfigInfo = {
        ...agentConfigInfo,
        pageHomeIndex: data?.pageHomeIndex,
      } as AgentConfigInfo;
      setAgentConfigInfo(_agentConfigInfo);
    },
  });

  /** 将配置加载状态同步到全局 model，供其他组件感知 */
  useEffect(() => {
    setIsLoadingOtherInterface(loadingAgentConfigInfo);
  }, [loadingAgentConfigInfo]);

  /**
   * agentId 变化时触发配置加载
   * - agentId 为 0 时（新建场景）跳过请求
   * - 同时重置页面标题
   */
  useEffect(() => {
    if (!agentId) {
      setLoadingAgentConfigInfo(false);
      return;
    }
    setLoadingAgentConfigInfo(true);
    runAgentConfigInfo(agentId);
  }, [agentId, runAgentConfigInfo]);

  /** 初始化页面基础配置：为页面中所有链接添加 target 属性 */
  useEffect(() => {
    addBaseTarget();
  }, [location]);

  /**
   * 智能体组件列表变化时，同步提取变量和工具信息
   * - 变量（Variable 类型）：转换为提示词编辑器可用的 PromptVariable 格式
   * - 工具（Plugin/Workflow/MCP/Skill/SubAgent 类型）：用于编排面板的工具选择
   */
  useEffect(() => {
    const _variablesInfo = agentComponentList?.find(
      (item: AgentComponentInfo) =>
        item.type === AgentComponentTypeEnum.Variable,
    );
    setPromptVariables(
      transformToPromptVariables(_variablesInfo?.bindConfig?.variables || []),
    );
    setPromptTools(
      agentComponentList
        ?.filter(
          (item: AgentComponentInfo) =>
            item.type === AgentComponentTypeEnum.Plugin ||
            item.type === AgentComponentTypeEnum.Workflow ||
            item.type === AgentComponentTypeEnum.MCP ||
            item.type === AgentComponentTypeEnum.Skill ||
            item.type === AgentComponentTypeEnum.SubAgent,
        )
        ?.map((item: AgentComponentInfo) => ({
          ...item,
          id: item.targetId || 0,
        })) || [],
    );
  }, [agentComponentList]);

  // ==================== 事件处理函数 ====================

  /**
   * 变量列表变更回调
   * 保留系统变量（systemVariable），合并用户自定义变量
   */
  const handleVariablesChange = useCallback(
    (variables: BindConfigWithSub[]) => {
      setPromptVariables((prev) => {
        const systemVariables = prev.filter((item) => item.systemVariable);
        return [
          ...systemVariables,
          ...transformToPromptVariables(variables || []),
        ];
      });
    },
    [],
  );

  /**
   * 工具列表变更回调
   * 从更新后的组件列表中筛选出工具类型的组件
   */
  const handleToolsChange = useCallback(
    (_agentComponentList: AgentComponentInfo[]) => {
      setPromptTools(
        _agentComponentList
          ?.filter(
            (item: AgentComponentInfo) =>
              item.type === AgentComponentTypeEnum.Plugin ||
              item.type === AgentComponentTypeEnum.Workflow ||
              item.type === AgentComponentTypeEnum.MCP ||
              item.type === AgentComponentTypeEnum.Skill ||
              item.type === AgentComponentTypeEnum.SubAgent,
          )
          ?.map((item: AgentComponentInfo) => ({
            ...item,
            id: item.targetId || 0,
          })) || [],
      );
    },
    [],
  );

  /** 智能体配置更新请求（带 600ms 防抖，避免频繁保存） */
  const { runAsync: runUpdate } = useRequest(apiAgentConfigUpdate, {
    manual: true,
    debounceWait: 600,
  });

  /**
   * 更新智能体配置的本地状态（乐观更新）
   * - 立即更新本地 agentConfigInfo 状态
   * - 若智能体已发布，自动更新修改时间
   * - 若更新的是引导问题且消息列表为空，同步更新聊天建议列表
   * @returns 更新后的配置对象
   */
  const handleUpdateEventQuestions = (
    value: string | string[] | number | GuidQuestionDto[],
    attr: string,
  ) => {
    const _agentConfigInfo = {
      ...agentConfigInfo,
      [attr]: value,
    } as AgentConfigInfo;

    if (_agentConfigInfo.publishStatus === PublishStatusEnum.Published) {
      _agentConfigInfo.modified = dayjs().toString();
    }

    setAgentConfigInfo(_agentConfigInfo);

    if (attr === 'guidQuestionDtos' && !messageList?.length) {
      const _suggestList = value as GuidQuestionDto[];
      const list =
        _suggestList?.filter((item) => !!item.info)?.map((item) => item.info) ||
        [];
      setChatSuggestList(list);
    }

    return _agentConfigInfo;
  };

  /**
   * 智能体配置变更的统一入口（编排面板各属性修改时调用）
   *
   * 处理流程：
   * 1. 乐观更新本地状态（handleUpdateEventQuestions）
   * 2. 处理特殊属性的副作用（openSuggest → 建议列表显隐、expandPageArea → 刷新配置、hideDesktop → 关闭预览）
   * 3. 调用 API 持久化更新（runUpdate）
   * 4. 若修改了开场白或引导问题且消息列表较短，重新查询会话以刷新 UI
   */
  const handleChangeAgent = useCallback(
    async (
      value: string | string[] | number | GuidQuestionDto[],
      attr: string,
    ) => {
      const currentConfig = agentConfigInfo;
      if (!currentConfig) {
        return;
      }

      const _agentConfigInfo = handleUpdateEventQuestions(value, attr);

      // 特殊属性的副作用处理
      if (attr === 'openSuggest') {
        setIsSuggest(value === OpenCloseEnum.Open);
      }
      if (attr === 'expandPageArea') {
        runUpdateAgent(agentId);
      }
      if (attr === 'hideDesktop' && value === HideDesktopEnum.Yes) {
        closeAgentDesktop();
      }

      // 解构出需要持久化的配置字段
      const {
        id,
        name,
        description,
        icon,
        userPrompt,
        openSuggest,
        systemPrompt,
        suggestPrompt,
        openingChatMsg,
        openScheduledTask,
        openLongMemory,
        expandPageArea,
        guidQuestionDtos,
        hideDesktop,
        allowOtherModel,
        allowAtSkill,
        allowPrivateSandbox,
      } = _agentConfigInfo;

      const updateParams = {
        id,
        name,
        description,
        icon,
        systemPrompt,
        userPrompt,
        openSuggest,
        suggestPrompt,
        openingChatMsg,
        openScheduledTask,
        openLongMemory,
        expandPageArea,
        guidQuestionDtos,
        hideDesktop,
        allowOtherModel,
        allowAtSkill,
        allowPrivateSandbox,
      } as AgentConfigUpdateParams;

      await runUpdate(updateParams);

      // 开场白/引导问题修改后，若消息列表较短则重新查询会话以即时预览效果
      // const messageListLength = messageList?.length || 0;
      // if (
      //   (attr === 'openingChatMsg' && messageListLength <= 1) ||
      //   (attr === 'guidQuestionDtos' && messageListLength === 1)
      // ) {
      //   setIsLoadingConversation(false);
      //   runQueryConversation(queryConversationId);
      //   // if (agentConfigInfo) {
      //   //   const { devConversationId: convId } = agentConfigInfo;
      //   //   setIsLoadingConversation(false);
      //   //   runQueryConversation(convId);
      //   // }
      // }
    },
    [agentConfigInfo, agentId, messageList?.length, closeAgentDesktop],
  );

  /**
   * 向系统提示词编辑器中插入文本（变量标签、工具标签等）
   * 通过 ref 调用编辑器实例的 insertText 方法
   */
  const handleInsertSystemPrompt = (text: string) => {
    systemUserTipsWordRef.current?.insertText(text);
  };

  /**
   * 确认编辑智能体基础信息（名称、图标、描述等）
   * 将编辑后的信息合并到本地配置并关闭弹窗
   */
  const handlerConfirmEditAgent = (info: AgentBaseInfo) => {
    const _agentConfigInfo = {
      ...agentConfigInfo,
      ...info,
    } as AgentConfigInfo;
    setAgentConfigInfo(_agentConfigInfo);
    setOpenEditAgent(false);
  };

  /**
   * 设置智能体绑定的 AI 模型
   * 更新模型组件配置（targetId、名称、绑定配置）
   */
  const handleSetModel = async (
    targetId: number | null,
    name: string,
    config: ComponentModelBindConfig,
  ) => {
    setOpenAgentModel(false);
    const _agentConfigInfo = cloneDeep(agentConfigInfo) as AgentConfigInfo;
    _agentConfigInfo.modelComponentConfig.bindConfig = config;
    _agentConfigInfo.modelComponentConfig.targetId = targetId;
    _agentConfigInfo.modelComponentConfig.name =
      name || _agentConfigInfo.modelComponentConfig.name;
    setAgentConfigInfo(_agentConfigInfo);
  };

  /**
   * 确认发布智能体
   * 更新发布状态为"已发布"，记录发布时间
   */
  const handleConfirmPublish = () => {
    setOpen(false);
    const time = dayjs().toString();
    const _agentConfigInfo = {
      ...agentConfigInfo,
      publishDate: time,
      modified: time,
      publishStatus: PublishStatusEnum.Published,
    } as AgentConfigInfo;
    setAgentConfigInfo(_agentConfigInfo);
  };

  // ==================================== 文件操作处理函数 ====================================
  // 以下函数封装了文件树 CRUD 操作，统一通过 apiUpdateStaticFile 接口提交变更

  /**
   * 创建文件或文件夹节点
   * 根据父节点路径拼接新路径，调用 API 创建后刷新文件树
   * @param fileNode 父节点信息（包含 parentPath 和 type）
   * @param newName 新文件/文件夹名称
   * @returns 是否创建成功
   */
  const handleCreateFileNode = async (
    fileNode: FileNode,
    newName: string,
  ): Promise<boolean> => {
    if (!queryConversationId) {
      return false;
    }
    const trimmedName = newName.trim();
    if (!trimmedName) {
      return false;
    }
    const parentPath = fileNode.parentPath || '';
    const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;
    const newFile: UpdateFileInfo = {
      name: newPath,
      binary: false,
      sizeExceeded: false,
      contents: '',
      renameFrom: '',
      operation: 'create',
      isDir: fileNode.type === 'folder',
    };
    const { code } = await apiUpdateStaticFile({
      cId: queryConversationId,
      files: [newFile],
    });
    if (code === SUCCESS_CODE) {
      await handleRefreshFileList(queryConversationId);
      void refreshGitListRef.current?.();
    }
    return code === SUCCESS_CODE;
  };

  /**
   * 删除文件或文件夹
   * 弹出确认对话框，用户确认后调用 API 删除并刷新文件树
   * - 文件夹删除时 isDir=true
   * - 文件删除时从 fileTreeData 中查找完整文件信息
   * @returns Promise<boolean> 是否删除成功
   */
  const handleDeleteFile = async (fileNode: FileNode): Promise<boolean> => {
    return new Promise((resolve) => {
      modalConfirm(
        dict('PC.Pages.EditAgent.deleteFileConfirmTitle'),
        fileNode.name,
        async () => {
          if (!queryConversationId) {
            resolve(false);
            return;
          }
          let updatedFilesList: UpdateFileInfo[] = [];
          if (fileNode.type === 'folder') {
            // 文件夹删除：直接发送文件夹 ID
            updatedFilesList = [
              {
                contents: '',
                name: fileNode.id,
                operation: 'delete',
                isDir: true,
              },
            ];
          } else {
            // 文件删除：需要查找完整的文件信息
            const currentFile = fileTreeData?.find(
              (item: StaticFileInfo) => item.fileId === fileNode.id,
            );
            if (!currentFile) {
              resolve(false);
              return;
            }
            currentFile.operation = 'delete';
            currentFile.contents = '';
            updatedFilesList = [currentFile] as UpdateFileInfo[];
          }
          const { code } = await apiUpdateStaticFile({
            cId: queryConversationId,
            files: updatedFilesList,
          });
          if (code === SUCCESS_CODE) {
            handleRefreshFileList(queryConversationId);
            resolve(true);
          } else {
            resolve(false);
          }
        },
        () => resolve(false),
      );
    });
  };

  /**
   * 确认文件重命名
   * 使用工具函数更新文件列表中的名称，调用 API 持久化后刷新文件树
   */
  const handleConfirmRenameFile = async (
    fileNode: FileNode,
    newName: string,
  ) => {
    if (!queryConversationId) {
      return false;
    }
    const updatedFilesList = updateFilesListName(
      fileTreeData || [],
      fileNode,
      newName,
    );
    const { code } = await apiUpdateStaticFile({
      cId: queryConversationId,
      files: updatedFilesList as UpdateFileInfo[],
    });
    if (code === SUCCESS_CODE) {
      await handleRefreshFileList(queryConversationId);
    }
    return code === SUCCESS_CODE;
  };

  /**
   * 批量保存文件内容
   * 编辑器中修改文件后调用，将变更内容提交到后端
   * @param data 包含文件 ID、新内容、原始内容的数组
   * @returns 是否保存成功
   */
  const handleSaveFiles = async (
    data: {
      fileId: string;
      fileContent: string;
      originalFileContent: string;
    }[],
  ) => {
    if (!queryConversationId) {
      return false;
    }
    const updatedFilesList = updateFilesListContent(
      fileTreeData || [],
      data,
      'modify',
    );
    const { code } = await apiUpdateStaticFile({
      cId: queryConversationId,
      files: updatedFilesList as UpdateFileInfo[],
    });
    return code === SUCCESS_CODE;
  };

  /**
   * 编辑器内容变更：防抖实时保存单个文件到服务端
   */
  const handleSaveFileContent = useMemo(
    () =>
      debounce(
        async (
          fileId: string,
          content: string,
          originalFileContent: string,
        ): Promise<boolean> => {
          if (!queryConversationId) {
            return false;
          }
          const updatedFilesList = updateFilesListContent(
            fileTreeDataRef.current || [],
            [{ fileId, fileContent: content, originalFileContent }],
            'modify',
          );
          if (updatedFilesList.length === 0) {
            return false;
          }
          const { code } = await apiUpdateStaticFile({
            cId: queryConversationId,
            files: updatedFilesList as UpdateFileInfo[],
          });
          if (code === SUCCESS_CODE) {
            void refreshGitListRef.current?.();
          }
          return code === SUCCESS_CODE;
        },
        500,
      ),
    [queryConversationId],
  );

  /**
   * 批量上传文件
   * 先校验文件大小是否超限，通过后调用上传接口并刷新文件树
   */
  const handleUploadMultipleFiles = async (
    files: File[],
    filePaths: string[],
  ) => {
    if (!queryConversationId) {
      return;
    }

    // 检查文件大小是否超过最大上传文件大小
    const { isExceedLimitSize, maxFileSize } = checkFileSizeExceedLimit(
      files || [],
    );
    // 如果超过最大上传文件大小，则提示错误
    if (isExceedLimitSize) {
      message.error(
        dict('PC.Common.Global.uploadFileSizeExceed').replace(
          '{0}',
          String(maxFileSize),
        ),
      );
      return;
    }

    await apiUploadFiles({
      cId: queryConversationId,
      files,
      filePaths,
    });
    await handleRefreshFileList(queryConversationId);
    void refreshGitListRef.current?.();
  };

  /**
   * 切换中间文件树栏显隐（仅由 header 图标控制，不受预览面板状态影响）
   * 远程桌面打开时：先关闭桌面，再展开文件树与右侧工作区
   */
  const handleToggleFileTreeSidebar = useCallback(() => {
    if (isAgentDesktopOpen) {
      closeAgentDesktop();
      setCanShowFileView(true);
      if (queryConversationId) {
        handleRefreshFileList(queryConversationId);
      }
      return;
    }

    setCanShowFileView((prev) => {
      const nextVisible = !prev;
      if (nextVisible && queryConversationId) {
        handleRefreshFileList(queryConversationId);
      }
      return nextVisible;
    });
  }, [
    isAgentDesktopOpen,
    closeAgentDesktop,
    handleRefreshFileList,
    queryConversationId,
  ]);

  /**
   * 打开 / 切换智能体电脑（与编排页 PreviewAndDebug 行为一致）
   */
  const handleOpenDesktopPanel = useCallback(async () => {
    const convId = queryConversationId;
    if (!convId) {
      message.warning(dict('PC.Pages.PreviewAndDebug.convIdNotFoundDesktop'));
      return;
    }

    if (isAgentDesktopOpen) {
      closePreviewView();
      setIsAgentDesktopOpen(false);
      return;
    }

    await openDesktopView(convId);
    setCanShowFileView(false);
    setIsAgentDesktopOpen(true);
  }, [
    queryConversationId,
    isAgentDesktopOpen,
    openDesktopView,
    closePreviewView,
  ]);

  /** 是否显示文件面板相关入口（通用型智能体 + 有效消息） */
  const isShowFilePanel = useMemo(() => {
    if (agentConfigInfo?.type !== AgentTypeEnum.TaskAgent) {
      return false;
    }
    if (!messageList?.length) {
      return false;
    }
    if (messageList.length === 1) {
      return !!messageList[0]?.id;
    }
    return true;
  }, [agentConfigInfo?.type, messageList]);

  /** 是否显示智能体电脑入口（云端电脑 + 未隐藏远程桌面） */
  const isShowDesktop =
    isShowFilePanel &&
    agentConfigInfo?.hideDesktop === HideDesktopEnum.No &&
    finalSelectedComputerId === '-1';

  /**
   * 关闭预览面板
   * 同时关闭文件预览视图和取消文件树固定状态
   */
  const handleClosePreviewPanel = useCallback(() => {
    closeAgentDesktop();
    setIsFileTreePinned(false);
    setSelectedChangeFile(null);
    previewTabsRef.current?.clearTabs();
  }, [closeAgentDesktop, setIsFileTreePinned]);

  /** 切换预览标签/文件时，底部终端若处于 expanded 则恢复 default */
  const resetDevConsoleExpandedLayout = useCallback(() => {
    setDevConsoleLayoutResetSignal((n) => n + 1);
  }, []);

  // ==================================== 文件视图 & 编排面板 ====================================
  /**
   * 文件视图 Hook 的完整配置属性
   * 聚合文件树、文件操作回调、沙箱信息、空闲检测等配置，
   * 传递给 useConversationAgentFileView 以获得 tree/preview 渲染组件
   */
  const fileViewProviderProps = useMemo((): ConversationAgentFileViewProps => {
    return {
      className: cx(styles['file-tree-sidebar']),
      taskAgentSelectedFileId, // TaskAgent 自动选中的文件 ID
      taskAgentSelectTrigger, // 触发选中的事件标识
      originalFiles: fileTreeData, // 原始文件树数据
      fileTreeDataLoading, // 文件树加载状态
      targetId: queryConversationId?.toString() || '', // 关联的会话 ID
      readOnly: false, // 文件是否只读
      onUploadFiles: async (files, filePaths) => {
        await handleUploadMultipleFiles(files, filePaths);
      },
      onExportProject: async () => {
        if (queryConversationId) {
          await apiDownloadAllFiles(queryConversationId);
        }
      },
      onRenameFile: handleConfirmRenameFile,
      onCreateFileNode: handleCreateFileNode,
      onDeleteFile: handleDeleteFile,
      onSaveFiles: handleSaveFiles,
      onSaveFileContent: async (fileId, content, originalFileContent) => {
        const result = await handleSaveFileContent(
          fileId,
          content,
          originalFileContent,
        );
        return result ?? false;
      },
      agentSandboxId: finalSelectedComputerId, // 沙箱 ID（终端连接用）
      agentSandboxName: '',
      onClose: handleClosePreviewPanel, // 关闭预览回调
      isFileTreePinned, // 文件树是否固定
      onFileTreePinnedChange: setIsFileTreePinned,
      isFileTreeSidebarVisible: canShowFileView,
      isCanDeleteSkillFile: true, // 是否允许删除技能文件
      onRefreshFileTree: async () => {
        if (queryConversationId) {
          await refreshFileListImmediately(queryConversationId);
        }
      },
      hideDesktop: agentConfigInfo?.hideDesktop, // 是否隐藏桌面预览
      /** 静态文件基础路径，用于文件预览资源加载 */
      staticFileBasePath: `/api/computer/static/${queryConversationId}`,
      /** 文件树选中文件时，切换右侧面板为文件预览并打开标签 */
      onFileSelectOpenPreview: (fileId?: string) => {
        closeAgentDesktop();
        setSelectedChangeFile(null);
        if (fileId) {
          resetDevConsoleExpandedLayout();
          previewTabsRef.current?.openFileTab(fileId, false, {
            skipActivate: true,
          });
        }
        if (queryConversationId) {
          openPreviewView(queryConversationId);
        }
      },
      /** 文件重命名后同步更新预览区标签页标题与 fileId */
      onFileRenamed: (oldFileId, newFileId) => {
        previewTabsRef.current?.renameFileTab(oldFileId, newFileId);
        setSelectedChangeFile((current) =>
          current?.fileId === oldFileId
            ? { ...current, fileId: newFileId }
            : current,
        );
      },
      /** 文件/文件夹删除后关闭预览标签并刷新 Git status */
      onFileDeleted: (fileNode) => {
        previewTabsRef.current?.closeFileTabs(
          fileNode.id,
          fileNode.type === 'folder',
        );
        setSelectedChangeFile((current) => {
          if (!current?.fileId) {
            return current;
          }
          if (fileNode.type === 'folder') {
            const isUnderFolder =
              current.fileId === fileNode.id ||
              current.fileId.startsWith(`${fileNode.id}/`);
            return isUnderFolder ? null : current;
          }
          return current.fileId === fileNode.id ? null : current;
        });
        void refreshGitListRef.current?.();
      },
    };
  }, [
    taskAgentSelectedFileId,
    taskAgentSelectTrigger,
    fileTreeData,
    fileTreeDataLoading,
    queryConversationId,
    handleUploadMultipleFiles,
    handleConfirmRenameFile,
    handleCreateFileNode,
    handleDeleteFile,
    handleSaveFiles,
    handleSaveFileContent,
    finalSelectedComputerId,
    handleClosePreviewPanel,
    isFileTreePinned,
    setIsFileTreePinned,
    canShowFileView,
    refreshFileListImmediately,
    agentConfigInfo?.type,
    agentConfigInfo?.hideDesktop,
    openPreviewView,
    resetDevConsoleExpandedLayout,
    closeAgentDesktop,
  ]);

  /** 初始化文件视图 Hook，获取文件树和预览的渲染组件 */
  const fileView = useConversationAgentFileView(fileViewProviderProps);
  refreshGitListRef.current = fileView.refreshGitList;

  useEffect(
    () => () => {
      handleSaveFileContent.cancel();
    },
    [handleSaveFileContent],
  );

  /** 预览区标签页管理 */
  const previewTabs = usePreviewTabs({
    // 打开文件标签
    onFileTabActivate: async (fileId, isDiff) => {
      closeAgentDesktop();
      // 重置终端布局
      resetDevConsoleExpandedLayout();
      // 选中差异文件
      if (isDiff) {
        setSelectedChangeFile((prev) =>
          prev?.fileId === fileId ? prev : { fileId, section: 'unstaged' },
        );
      } else {
        // 选中普通文件
        setSelectedChangeFile(null);
        // 选中文件
        if (fileView.preview.selectedFileId !== fileId) {
          await fileView.tree.handleFileSelect(fileId);
        }
      }
      // 打开预览视图
      if (queryConversationId) {
        openPreviewView(queryConversationId);
      }
    },
    // 打开标签选择器
    onPickerTabActivate: async () => {
      closeAgentDesktop();
      // 重置终端布局
      resetDevConsoleExpandedLayout();
      // 打开预览视图
      if (queryConversationId) {
        await openPreviewView(queryConversationId);
      }
    },
    // 打开工具标签
    onToolTabActivate: (toolId: PreviewToolId) => {
      closeAgentDesktop();
      // 终端全屏展开
      if (toolId === 'terminal') {
        setDevConsoleExpandSignal((n) => n + 1);
        setSelectedChangeFile(null);
        // 打开预览视图
        if (queryConversationId) {
          openPreviewView(queryConversationId);
        }
        return;
      }
      // 从开发工具打开终端时跳过 onToolTabActivate 中的布局重置
      if (skipDevConsoleResetRef.current) {
        skipDevConsoleResetRef.current = false;
        setSelectedChangeFile(null);
        // 打开预览视图
        if (queryConversationId) {
          openPreviewView(queryConversationId);
        }
        return;
      }
      // 重置终端布局
      resetDevConsoleExpandedLayout();
      // 选中差异文件
      setSelectedChangeFile(null);
      // 预览 / 编排 / 版本控制：工作区页签，收起文件预览侧栏
      if (WORKSPACE_PREVIEW_TOOL_IDS.includes(toolId)) {
        closePreviewView();
        return;
      }

      // 打开预览视图
      if (queryConversationId) {
        openPreviewView(queryConversationId);
      }
    },
  });

  previewTabsRef.current = previewTabs;

  // ==================================== git 版本控制 ====================================

  /** 将文件路径添加到 .gitignore */
  const handleAddToGitignore = useCallback(
    async (fileId: string) => {
      if (!queryConversationId) {
        return;
      }

      const gitignoreId = '.gitignore';
      const existing = fileTreeData?.find(
        (item: StaticFileInfo) => item.fileId === gitignoreId,
      );
      const currentContent = existing?.contents ?? '';
      const entry = fileId.startsWith('/') ? fileId.slice(1) : fileId;

      if (
        currentContent
          .split('\n')
          .some(
            (line: string) => line.trim() === entry || line.trim() === fileId,
          )
      ) {
        message.info(
          dict('PC.Pages.ConversationAgentSourceControl.alreadyInGitignore'),
        );
        return;
      }

      const newContent = currentContent
        ? `${currentContent.replace(/\n$/, '')}\n${entry}`
        : entry;

      try {
        if (existing) {
          const updatedFilesList = updateFilesListContent(
            fileTreeData || [],
            [
              {
                fileId: gitignoreId,
                fileContent: newContent,
                originalFileContent: currentContent,
              },
            ],
            'modify',
          );
          const { code } = await apiUpdateStaticFile({
            cId: queryConversationId,
            files: updatedFilesList as UpdateFileInfo[],
          });
          if (code !== SUCCESS_CODE) {
            message.error(
              dict('PC.Pages.ConversationAgentSourceControl.gitignoreFailed'),
            );
            return;
          }
        } else {
          const { code } = await apiUpdateStaticFile({
            cId: queryConversationId,
            files: [
              {
                name: gitignoreId,
                contents: `${newContent}\n`,
                operation: 'create',
                binary: false,
                sizeExceeded: false,
                renameFrom: '',
                isDir: false,
              },
            ],
          });
          if (code !== SUCCESS_CODE) {
            message.error(
              dict('PC.Pages.ConversationAgentSourceControl.gitignoreFailed'),
            );
            return;
          }
        }

        message.success(
          dict('PC.Pages.ConversationAgentSourceControl.gitignoreSuccess'),
        );
        await handleRefreshFileList(queryConversationId);
      } catch (error) {
        console.error('Add to gitignore failed:', error);
        message.error(
          dict('PC.Pages.ConversationAgentSourceControl.gitignoreFailed'),
        );
      }
    },
    [fileTreeData, handleRefreshFileList],
  );

  /**
   * 源代码管理（Git）统一 Hook
   * 封装暂存/取消暂存/提交推送等 Git 操作，差异逻辑通过 adapters 由页面注入
   */
  const gitSourceControl = useConversationAgentSourceControl({
    cid: queryConversationId ?? null,
    changeFiles: fileView.changeFiles,
    selectedChangeFile,
    setSelectedChangeFile,
    adapters: {
      // 保存变更文件到沙箱
      saveChangeFiles: (files: ChangeFileInfo[]) => handleSaveFiles(files),
      // 放弃单个文件的更改
      discardChangeFile: (fileId: string) =>
        fileView.preview.discardChangeFile(fileId),
      // 打开更改文件（选中文件并预览，非 diff）
      openChangeFile: (fileId: string) => {
        closeAgentDesktop();
        previewTabs.openFileTab(fileId, false);
      },
      // 将文件路径添加到 .gitignore
      addFileToGitignore: handleAddToGitignore,
      // 选中修改文件，在右侧预览区展示 diff
      onDiffFileSelect: (fileId: string) => {
        closeAgentDesktop();
        previewTabs.openFileTab(fileId, true);
      },
      // 放弃更改后关闭预览 Tab
      onAfterDiscardChange: (fileId: string) => {
        previewTabs.closeTab(getFileTabId(fileId, true));
        previewTabs.closeTab(getFileTabId(fileId, false));
      },
      // 提交成功后清空本地修改并关闭 Tab
      onCommitSuccess: async () => {
        await fileView.preview.saveFiles();
        previewTabs.clearTabs();
      },
      // 刷新 Git 变更列表（git status + 文件树）
      refreshFileList: queryConversationId
        ? async () => {
            await fileView.refreshGitList();
          }
        : undefined,
    },
  });

  /** 通用智能体直接切换模型，无需弹窗 */
  const handleArrangeModelChange = useCallback(
    async (modelId: number, name: string) => {
      const componentId = agentConfigInfo?.modelComponentConfig?.id;
      if (!componentId) return;
      const bindConfig = agentConfigInfo?.modelComponentConfig
        ?.bindConfig as ComponentModelBindConfig;
      await apiAgentComponentModelUpdate({
        id: componentId,
        targetId: modelId,
        bindConfig,
      });
      const _agentConfigInfo = cloneDeep(agentConfigInfo) as AgentConfigInfo;
      _agentConfigInfo.modelComponentConfig.targetId = modelId;
      _agentConfigInfo.modelComponentConfig.name = name;
      setAgentConfigInfo(_agentConfigInfo);
    },
    [agentConfigInfo, setAgentConfigInfo],
  );

  // ==================================== 渲染组件元素 ====================================

  /** 「预览」页签：调试对话（原编排面板「调试」Tab） */
  const arrangeDebugChatPanel = useMemo(
    () => (
      <ConversationAgentChatSession
        agentId={agentId}
        agentConfigInfo={agentConfigInfo}
        onAgentConfigInfo={setAgentConfigInfo}
      />
    ),
    [agentId, agentConfigInfo],
  );

  /** 「编排」页签：模型、提示词、变量与工具配置 */
  const arrangeConfigPanel = useMemo(
    () => (
      <AgentArrangeConfigSection
        agentId={agentId}
        agentConfigInfo={agentConfigInfo}
        originalModelConfigList={originalModelConfigList}
        systemUserTipsWordRef={systemUserTipsWordRef}
        promptVariables={promptVariables}
        promptTools={promptTools}
        onChangeAgent={handleChangeAgent}
        onInsertSystemPrompt={handleInsertSystemPrompt}
        onVariablesChange={handleVariablesChange}
        onToolsChange={handleToolsChange}
        onOpenAgentModel={() => setOpenAgentModel(true)}
        onModelChange={handleArrangeModelChange}
      />
    ),
    [
      agentId,
      agentConfigInfo,
      originalModelConfigList,
      promptVariables,
      promptTools,
      handleChangeAgent,
      handleInsertSystemPrompt,
      handleVariablesChange,
      handleToolsChange,
      handleArrangeModelChange,
    ],
  );

  /** 「订阅设置」页签（租户未开启订阅时不渲染） */
  const subscriptionSettingPanel = useMemo(
    () =>
      isEnableSubscription && agentId ? (
        <SubscriptionSetting agentId={agentId} spaceId={spaceId} visible />
      ) : null,
    [isEnableSubscription, agentId, spaceId],
  );

  /** 「订阅统计」页签（租户未开启订阅时不渲染） */
  const subscriptionStatsPanel = useMemo(
    () =>
      isEnableSubscription && agentId ? (
        <SubscriptionStats agentId={agentId} visible />
      ) : null,
    [isEnableSubscription, agentId],
  );

  /** 「版本控制」页签：Git 提交记录 */
  const arrangeVersionPanel = useMemo(
    () => (
      <GitVersionRecordPanel
        workspace={{
          workspaceType: 'taskAgent',
          cid: queryConversationId ?? null,
        }}
        branch={fileView.gitBranch}
        onRollbackSuccess={() => {
          if (queryConversationId) {
            handleRefreshFileList(queryConversationId);
          }
        }}
      />
    ),
    [queryConversationId, fileView.gitBranch, handleRefreshFileList],
  );

  /**
   * 渲染智能体电脑（VNC），占满文件树 + 右侧面板工作区
   */
  const renderAgentDesktopPanel = () => (
    <div className={cx(styles['agent-desktop-workspace'])}>
      <VncPreview
        serviceUrl={process.env.BASE_URL || ''}
        cId={String(queryConversationId)}
        autoConnect
        className={styles['agent-desktop-vnc']}
        idleDetection={{
          enabled: agentConfigInfo?.type === AgentTypeEnum.TaskAgent,
          onIdleTimeout: closeAgentDesktop,
        }}
      />
    </div>
  );

  /**
   * 渲染右侧面板
   * 布局：顶部 PreviewTabBar（始终）+ 内容区（文件 / 工作区工具页）+ 底部终端
   */
  const renderRightPanel = () => (
    <div className={cx(styles['right-panel'])}>
      <div className={cx(styles['right-panel-body'])}>
        {/* 顶部标签栏 */}
        <PreviewTabBar
          // 标签列表
          tabs={previewTabs.tabs}
          // 选中标签 ID
          activeTabId={previewTabs.activeTabId}
          // 选中标签
          onTabSelect={(tabId) => {
            closeAgentDesktop();
            previewTabs.selectTab(tabId);
          }}
          // 关闭标签
          onTabClose={previewTabs.closeTab}
          // 关闭其他标签
          onCloseOtherTabs={previewTabs.closeOtherTabs}
          // 关闭所有标签
          onCloseAllTabs={previewTabs.closeAllTabs}
          // 切换标签固定状态
          onTogglePinTab={previewTabs.togglePinTab}
          // 重新排序标签
          onTabReorder={previewTabs.reorderTabs}
          // 打开标签选择器
          onAddTab={() => {
            closeAgentDesktop();
            previewTabs.openPickerTab();
          }}
          // 智能体配置（保存时间、未发布提示）
          agentConfigInfo={agentConfigInfo}
          // 打开发布弹窗
          onPublish={() => setOpen(true)}
        />
        {/* Tab 栏下方：预览内容 + 底部终端（终端放大时仅覆盖此区域） */}
        <div className={cx(styles['right-panel-main'])}>
          <div className={cx(styles['right-panel-content'])}>
            <ConversationAgentFilePreview
              // 预览文件
              preview={fileView.preview}
              // 差异文件
              diffFile={gitSourceControl.selectedDiffFile ?? undefined}
              // 选中标签
              activeTab={previewTabs.activeTab}
              // 调试对话面板
              debugPanel={arrangeDebugChatPanel}
              // 编排配置面板
              arrangeConfigPanel={arrangeConfigPanel}
              // 版本控制面板（Git 提交记录）
              versionPanel={arrangeVersionPanel}
              // 订阅设置面板
              subscriptionSettingPanel={subscriptionSettingPanel}
              // 订阅统计面板
              subscriptionStatsPanel={subscriptionStatsPanel}
              // 选择工具
              onSelectTool={(toolId) => {
                closeAgentDesktop();
                if (toolId === 'terminal') {
                  skipDevConsoleResetRef.current = true;
                  setDevConsoleExpandSignal((n) => n + 1);
                  previewTabs.closeTab(PREVIEW_TAB_PICKER_ID);
                  return;
                }
                previewTabs.closeTab(PREVIEW_TAB_PICKER_ID);
                previewTabs.openToolTab(toolId);
              }}
              providerClassName={fileView.className}
              className={cx(styles['file-preview-panel'], 'w-full', 'h-full')}
            />
          </div>

          {/* 底部终端、开发日志合集面板 */}
          <ConversationBottomConsole
            visible={showDevConsole}
            wsUrl={terminalWsUrl}
            wireProtocol={TTYD_TERMINAL_WIRE_PROTOCOL}
            wsSubprotocols={[...TTYD_TERMINAL_WS_SUBPROTOCOLS]}
            layoutResetSignal={devConsoleLayoutResetSignal}
            expandSignal={devConsoleExpandSignal}
            onLayoutModeChange={setDevConsoleLayoutMode}
            onActiveTabChange={(tab) => {
              setDevConsoleActiveTab(tab);
            }}
            devLog={{
              logs: devLogs.logs,
              isLoading: devLogs.isLoading,
              lastLine: devLogs.lastLine,
            }}
            logsExtra={
              <DevLogActions
                onRefresh={devLogs.refreshLogs}
                onClear={devLogs.clearLogs}
              />
            }
          />
        </div>
      </div>
    </div>
  );

  // ==================== 加载状态 ====================
  // 配置加载中时显示全屏 Loading，避免渲染不完整的页面
  if (loadingAgentConfigInfo && agentId) {
    return (
      <div
        className={cx(
          'h-full',
          'flex',
          'flex-1',
          'items-center',
          'justify-center',
        )}
      >
        <Loading />
      </div>
    );
  }

  // ==================== 主渲染 ====================
  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      {/* 主内容区域 */}
      <section
        className={cx(
          'flex',
          'flex-1',
          styles.section,
          `xagi-nav-${navigationStyle}`,
        )}
      >
        <div className={cx(styles['main-row'], 'w-full')}>
          {/* 左侧面板：聊天区域（始终显示） */}
          <div className={cx(styles['left-panel'])}>
            <AgentConversationChatPanel
              selectedComputerId={finalSelectedComputerId}
              onChangeSelectedComputerId={setSelectedComputerId}
              // 切换文件树侧边栏显隐
              onToggleFileTreeSidebar={handleToggleFileTreeSidebar}
              // 智能体配置信息
              agentConfigInfo={agentConfigInfo}
              // 编辑智能体
              onEditAgent={() => setOpenEditAgent(true)}
              // 文件树侧边栏是否可见
              isFileTreeSidebarVisible={canShowFileView}
              // 智能体电脑
              isShowDesktop={isShowDesktop}
              isAgentDesktopOpen={isAgentDesktopOpen}
              onOpenDesktopPanel={handleOpenDesktopPanel}
            />
          </div>

          {/* 中间面板（文件树） + 右侧面板（编排/预览 + 终端） */}
          {isAgentDesktopOpen && queryConversationId ? (
            renderAgentDesktopPanel()
          ) : (
            <>
              {/* 中间面板：文件树侧边栏（仅由 canShowFileView 控制显隐） */}
              <div
                className={cx(styles['middle-panel'], {
                  [styles['middle-panel-visible']]: canShowFileView,
                  [styles['middle-panel-hidden']]: !canShowFileView,
                })}
              >
                {/* ConversationAgent 中间面板（公共 FileTreeGitSourcePanel，内部渲染文件树） */}
                <FileTreeGitSourcePanel
                  className={cx(styles['file-tree-sidebar'], 'w-full')}
                  tree={fileView.tree}
                  treeClassName="w-full h-full"
                  sourceControl={{
                    gitWorkspace: {
                      workspaceType: 'taskAgent',
                      cid: queryConversationId ?? null,
                    },
                    changeFiles: fileView.changeFiles,
                    selectedChangeFile: gitSourceControl.selectedChangeFile,
                    isCommitting:
                      gitSourceControl.isCommitting ||
                      fileView.preview.isSavingFiles,
                    isRefreshingGitList: fileView.isRefreshingGitList,
                    onRefreshGitList: fileView.refreshGitList,
                    onDiffFileSelect: gitSourceControl.handleDiffFileSelect,
                    onOpenChangeFile: gitSourceControl.handleOpenChangeFile,
                    onAfterDiscardChange:
                      gitSourceControl.handleAfterDiscardChange,
                    onAddToGitignore: (fileId) => {
                      void gitSourceControl.handleAddToGitignore(fileId);
                    },
                    onCommit: gitSourceControl.handleCommit,
                  }}
                />
              </div>
              {/* 右侧面板：编排配置 / 文件预览 + 终端 */}
              {renderRightPanel()}
            </>
          )}
        </div>

        {/* 调试详情抽屉（按需显示） */}
        <DebugDetails
          visible={showType === EditAgentShowType.Debug_Details}
          onClose={() => setShowType(EditAgentShowType.Hide)}
        />
      </section>

      {/* ==================== 模态弹窗层 ==================== */}

      {/* 发布智能体弹窗 */}
      <PublishComponentModal
        targetId={agentId}
        open={open}
        spaceId={spaceId}
        category={agentConfigInfo?.category}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirmPublish}
      />
      {/* 编辑智能体基础信息弹窗（名称、图标、描述） */}
      <CreateAgent
        type={agentConfigInfo?.type as AgentTypeEnum}
        spaceId={spaceId}
        mode={CreateUpdateModeEnum.Update}
        agentConfigInfo={agentConfigInfo}
        open={openEditAgent}
        onCancel={() => setOpenEditAgent(false)}
        onConfirmUpdate={handlerConfirmEditAgent}
      />
      {/* 模型设置弹窗（选择 AI 模型和参数配置） */}
      <AgentModelSetting
        originalModelConfigList={originalModelConfigList}
        spaceId={spaceId}
        agentConfigInfo={agentConfigInfo}
        modelComponentConfig={
          agentConfigInfo?.modelComponentConfig as AgentComponentInfo
        }
        open={openAgentModel}
        devConversationId={agentConfigInfo?.devConversationId}
        onCancel={handleSetModel}
      />
    </div>
  );
};

export default ConversationAgent;
