import CreateAgent from '@/components/CreateAgent';
import Loading from '@/components/custom/Loading';
import PublishComponentModal from '@/components/PublishComponentModal';
import type { PromptVariable } from '@/components/TiptapVariableInput/types';
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import { SUCCESS_CODE } from '@/constants/codes.constants';
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
  apiGitCommitPush,
  apiGitStash,
  apiGitStashPop,
  apiUpdateStaticFile,
  apiUploadFiles,
} from '@/services/vncDesktop';
import { AgentComponentTypeEnum, HideDesktopEnum } from '@/types/enums/agent';
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
import type {
  ModelConfigInfo,
  ModelListParams,
} from '@/types/interfaces/model';
import { RequestResponse } from '@/types/interfaces/request';
import {
  StaticFileInfo,
  VncDesktopUpdateFileInfo,
} from '@/types/interfaces/vncDesktop';
import { checkFileSizeExceedLimit } from '@/utils';
import { modalConfirm } from '@/utils/ant-custom';
import { addBaseTarget } from '@/utils/common';
import { updateFilesListContent, updateFilesListName } from '@/utils/fileTree';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import cloneDeep from 'lodash/cloneDeep';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useModel, useParams } from 'umi';
import AgentArrangeConfigSection from './AgentArrangePanel/AgentArrangeConfigSection';
import AgentConversationChatPanel from './AgentConversationChatPanel';
import AgentGitVersionRecordPanel from './AgentGitVersionRecordPanel';
import ConversationAgentBottomConsole from './ConversationAgentBottomConsole';
import ConversationAgentFilePreview from './ConversationAgentFilePreview';
import {
  getFileTabId,
  PREVIEW_TAB_PICKER_ID,
  usePreviewTabs,
  WORKSPACE_PREVIEW_TOOL_IDS,
  type PreviewToolId,
} from './ConversationAgentFilePreview/hooks/usePreviewTabs';
import PreviewTabBar from './ConversationAgentFilePreview/PreviewTabBar';
import ConversationAgentMiddlePanel from './ConversationAgentMiddlePanel';
import type { ConversationAgentFileViewProps } from './hooks/types';
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
 * 2. 聊天对话管理（通过 conversationAgent model）
 * 3. 文件树管理（CRUD、上传、重命名等）
 * 4. 编排面板与文件预览的切换显示
 * 5. 终端 WebSocket 连接管理
 * 6. 模型配置、发布、导入导出等操作
 *
 * ## 数据流
 * - URL 参数 (agentId) → 加载智能体配置 → 驱动 UI 渲染
 * - 用户操作 → handleChangeAgent → 调用 API 更新 → 同步本地状态
 * - conversationAgent model 管理聊天消息、文件树、预览等页面状态
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
  /** 是否正在 Git 提交推送 */
  const [isGitPushing, setIsGitPushing] = useState<boolean>(false);
  /** 源代码管理中选中查看 diff 的文件 ID */
  const [selectedDiffFileId, setSelectedDiffFileId] = useState<string | null>(
    null,
  );
  /** 源代码管理中已暂存（git stash）的文件 ID 集合 */
  const [stagedFileIds, setStagedFileIds] = useState<Set<string>>(
    () => new Set(),
  );
  /** 标签选择面板是否展开 */
  /** 预览标签页操作 ref（供 fileViewProviderProps 回调使用） */
  const previewTabsRef = useRef<ReturnType<typeof usePreviewTabs> | null>(null);
  /** 统一主题样式（导航栏风格等） */
  const { navigationStyle } = useUnifiedTheme();

  /** 智能体完整配置信息，驱动整个页面的渲染 */
  const [agentConfigInfo, setAgentConfigInfo] = useState<AgentConfigInfo>();
  /** 当前可用的提示词变量列表（从智能体组件列表中提取） */
  const [promptVariables, setPromptVariables] = useState<PromptVariable[]>([]);
  /** 当前可用的工具列表（插件、工作流、MCP、技能、子智能体） */
  const [promptTools, setPromptTools] = useState<AgentComponentInfo[]>([]);
  /** 当前用户手动选择的沙箱电脑 ID（优先于自动分配） */
  const [currentSelectedComputerId, setCurrentSelectedComputerId] =
    useState<string>('');
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

  // ==================== 全局状态模型 ====================
  /**
   * conversationAgent model：聊天核心状态管理
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
    setIsLoadingConversation,
    runQueryConversation,
    conversationInfo,
    isFileTreePinned,
    setIsFileTreePinned,
    closePreviewView,
    fileTreeData,
    fileTreeDataLoading,
    handleRefreshFileList,
    refreshFileListImmediately,
    openPreviewView,
    taskAgentSelectedFileId,
    taskAgentSelectTrigger,
    setIsLoadingOtherInterface,
  } = useModel('conversationAgent');
  /** tenantConfigInfo model：租户配置（页面标题、订阅开关等） */
  const { setTitle, tenantConfigInfo } = useModel('tenantConfigInfo');
  const showSubscriptionTabs = tenantConfigInfo?.enableSubscription !== 0;
  /** spaceAgent model：当前空间下的智能体组件列表（变量、插件、工具等） */
  const { agentComponentList } = useModel('spaceAgent');

  // ==================== 计算属性 ====================
  /** 开发会话 ID，用于文件操作和 SSE 连接 */
  const devConversationId = agentConfigInfo?.devConversationId;

  /**
   * 最终选中的沙箱电脑 ID
   * 优先级：用户手动选择 > 会话关联的 agent sandboxId > 会话 sandboxServerId
   * 用于终端连接和文件预览
   */
  const finalSelectedComputerId = useMemo(() => {
    return (
      currentSelectedComputerId ||
      conversationInfo?.agent?.sandboxId ||
      conversationInfo?.sandboxServerId ||
      ''
    );
  }, [currentSelectedComputerId, conversationInfo]);

  /**
   * 终端 WebSocket 连接地址（本地 ttyd 联调）
   * http://localhost:7681/ → ws://localhost:7681/ws
   */
  const terminalWsUrl = useMemo(() => {
    // const httpBase = 'http://localhost:7681/';
    const httpBase = 'ws://192.168.1.34:8088/computer/ttyd/6/1548510/ws';
    try {
      const u = new URL(httpBase);
      const wsScheme = u.protocol === 'https:' ? 'wss:' : 'ws:';
      const path = u.pathname === '/' || u.pathname === '' ? '/ws' : u.pathname;
      return `${wsScheme}//${u.host}${path}`;
    } catch {
      return httpBase || 'ws://localhost:7681/ws';
    }
  }, []);

  // ==================== 数据请求 ====================
  /** 加载空间下可用的聊天模型列表 */
  const runMode = async (modelParams: ModelListParams) => {
    const result = await apiModelList(modelParams);
    setOriginalModelConfigList(result?.data || []);
  };

  // ==================== 副作用 (Effects) ====================

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

  /**
   * 智能体配置加载请求（带防抖）
   * 用于首次加载或 agentId 切换时获取完整配置
   */
  const { run } = useRequest(apiAgentConfigInfo, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<AgentConfigInfo>) => {
      setLoadingAgentConfigInfo(false);
      setAgentConfigInfo(result?.data);
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
    run(agentId);
    setTitle();
  }, [agentId]);

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
        closePreviewView();
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
      const messageListLength = messageList?.length || 0;
      if (
        (attr === 'openingChatMsg' && messageListLength <= 1) ||
        (attr === 'guidQuestionDtos' && messageListLength === 1)
      ) {
        if (agentConfigInfo) {
          const { devConversationId: convId } = agentConfigInfo;
          setIsLoadingConversation(false);
          runQueryConversation(convId);
        }
      }
    },
    [agentConfigInfo, agentId, messageList?.length, closePreviewView],
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

  // ==================== 文件操作处理函数 ====================
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
    if (!devConversationId) {
      return false;
    }
    const trimmedName = newName.trim();
    if (!trimmedName) {
      return false;
    }
    const parentPath = fileNode.parentPath || '';
    const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;
    const newFile: VncDesktopUpdateFileInfo = {
      name: newPath,
      binary: false,
      sizeExceeded: false,
      contents: '',
      renameFrom: '',
      operation: 'create',
      isDir: fileNode.type === 'folder',
    };
    const { code } = await apiUpdateStaticFile({
      cId: devConversationId,
      files: [newFile],
    });
    if (code === SUCCESS_CODE) {
      await handleRefreshFileList(devConversationId);
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
          if (!devConversationId) {
            resolve(false);
            return;
          }
          let updatedFilesList: VncDesktopUpdateFileInfo[] = [];
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
            updatedFilesList = [currentFile] as VncDesktopUpdateFileInfo[];
          }
          const { code } = await apiUpdateStaticFile({
            cId: devConversationId,
            files: updatedFilesList,
          });
          if (code === SUCCESS_CODE) {
            handleRefreshFileList(devConversationId);
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
    if (!devConversationId) {
      return false;
    }
    const updatedFilesList = updateFilesListName(
      fileTreeData || [],
      fileNode,
      newName,
    );
    const { code } = await apiUpdateStaticFile({
      cId: devConversationId,
      files: updatedFilesList as VncDesktopUpdateFileInfo[],
    });
    if (code === SUCCESS_CODE) {
      await handleRefreshFileList(devConversationId);
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
    if (!devConversationId) {
      return false;
    }
    const updatedFilesList = updateFilesListContent(
      fileTreeData || [],
      data,
      'modify',
    );
    const { code } = await apiUpdateStaticFile({
      cId: devConversationId,
      files: updatedFilesList as VncDesktopUpdateFileInfo[],
    });
    return code === SUCCESS_CODE;
  };

  /**
   * Git 提交并推送到远程仓库
   * 先保存文件到沙箱，再执行 git commit + push
   * @param commitMessage 提交信息
   * @param changeFilesList 当前修改的文件列表
   */
  const handleGitCommitPush = useCallback(
    async (
      commitMessage: string,
      changeFilesList: Array<{
        fileId: string;
        fileContent: string;
        originalFileContent: string;
      }>,
    ) => {
      if (!devConversationId) {
        message.error(
          dict('PC.Pages.ConversationAgent.gitPush.noConversation'),
        );
        return false;
      }

      setIsGitPushing(true);
      try {
        // 1. 先保存文件到沙箱
        if (changeFilesList.length > 0) {
          const updatedFilesList = updateFilesListContent(
            fileTreeData || [],
            changeFilesList,
            'modify',
          );
          const saveResult = await apiUpdateStaticFile({
            cId: devConversationId,
            files: updatedFilesList as VncDesktopUpdateFileInfo[],
          });
          if (saveResult.code !== SUCCESS_CODE) {
            message.error(
              dict('PC.Pages.ConversationAgent.gitPush.saveFailed'),
            );
            return false;
          }
        }

        // 2. 执行 git commit + push
        const { code } = await apiGitCommitPush({
          cId: devConversationId,
          message:
            commitMessage ||
            dict('PC.Pages.ConversationAgent.gitPush.defaultMessage'),
          files: changeFilesList.map((f) => ({
            path: f.fileId,
            content: f.fileContent,
          })),
        });

        if (code === SUCCESS_CODE) {
          message.success(dict('PC.Pages.ConversationAgent.gitPush.success'));
          return true;
        } else {
          message.error(dict('PC.Pages.ConversationAgent.gitPush.failed'));
          return false;
        }
      } catch (error) {
        console.error('Git commit push failed:', error);
        message.error(dict('PC.Pages.ConversationAgent.gitPush.failed'));
        return false;
      } finally {
        setIsGitPushing(false);
      }
    },
    [devConversationId, fileTreeData],
  );

  /**
   * 批量上传文件
   * 先校验文件大小是否超限，通过后调用上传接口并刷新文件树
   */
  const handleUploadMultipleFiles = async (
    files: File[],
    filePaths: string[],
  ) => {
    if (!devConversationId) {
      return;
    }
    const { isExceedLimitSize } = checkFileSizeExceedLimit(files || []);
    if (isExceedLimitSize) {
      return;
    }
    await apiUploadFiles({
      cId: devConversationId,
      files,
      filePaths,
    });
    await handleRefreshFileList(devConversationId);
  };

  /**
   * 切换中间文件树栏显隐（仅由 header 图标控制，不受预览面板状态影响）
   */
  const handleToggleFileTreeSidebar = useCallback(() => {
    setCanShowFileView((prev) => {
      const nextVisible = !prev;
      if (nextVisible) {
        const convId = agentConfigInfo?.devConversationId;
        if (convId) {
          handleRefreshFileList(convId);
        }
      }
      return nextVisible;
    });
  }, [agentConfigInfo?.devConversationId, handleRefreshFileList]);

  /**
   * 关闭预览面板
   * 同时关闭文件预览视图和取消文件树固定状态
   */
  const handleClosePreviewPanel = useCallback(() => {
    closePreviewView();
    setIsFileTreePinned(false);
    setSelectedDiffFileId(null);
    previewTabsRef.current?.clearTabs();
  }, [closePreviewView, setIsFileTreePinned]);

  /** 切换预览标签/文件时，底部终端若处于 expanded 则恢复 default */
  const resetDevConsoleExpandedLayout = useCallback(() => {
    setDevConsoleLayoutResetSignal((n) => n + 1);
  }, []);

  // ==================== 文件视图 & 编排面板 ====================
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
      targetId: devConversationId?.toString() || '', // 关联的会话 ID
      readOnly: false, // 文件是否只读
      onUploadFiles: async (files, filePaths) => {
        await handleUploadMultipleFiles(files, filePaths);
      },
      onRenameFile: handleConfirmRenameFile,
      onCreateFileNode: handleCreateFileNode,
      onDeleteFile: handleDeleteFile,
      onSaveFiles: handleSaveFiles,
      agentSandboxId: finalSelectedComputerId, // 沙箱 ID（终端连接用）
      agentSandboxName: '',
      onClose: handleClosePreviewPanel, // 关闭预览回调
      isFileTreePinned, // 文件树是否固定
      onFileTreePinnedChange: setIsFileTreePinned,
      isFileTreeSidebarVisible: canShowFileView,
      isCanDeleteSkillFile: true, // 是否允许删除技能文件
      onRefreshFileTree: async () => {
        if (devConversationId) {
          await refreshFileListImmediately(devConversationId);
        }
      },
      hideDesktop: agentConfigInfo?.hideDesktop, // 是否隐藏桌面预览
      /** 静态文件基础路径，用于文件预览资源加载 */
      staticFileBasePath: devConversationId
        ? `/api/computer/static/${devConversationId}`
        : undefined,
      /** 文件树选中文件时，切换右侧面板为文件预览并打开标签 */
      onFileSelectOpenPreview: (fileId?: string) => {
        setSelectedDiffFileId(null);
        if (fileId) {
          resetDevConsoleExpandedLayout();
          previewTabsRef.current?.openFileTab(fileId, false, {
            skipActivate: true,
          });
        }
        if (devConversationId) {
          openPreviewView(devConversationId);
        }
      },
      /** 文件重命名后同步更新预览区标签页标题与 fileId */
      onFileRenamed: (oldFileId, newFileId) => {
        previewTabsRef.current?.renameFileTab(oldFileId, newFileId);
        setSelectedDiffFileId((current) =>
          current === oldFileId ? newFileId : current,
        );
      },
    };
  }, [
    taskAgentSelectedFileId,
    taskAgentSelectTrigger,
    fileTreeData,
    fileTreeDataLoading,
    devConversationId,
    handleUploadMultipleFiles,
    handleConfirmRenameFile,
    handleCreateFileNode,
    handleDeleteFile,
    handleSaveFiles,
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
  ]);

  /** 初始化文件视图 Hook，获取文件树和预览的渲染组件 */
  const fileView = useConversationAgentFileView(fileViewProviderProps);

  /** 预览区标签页管理 */
  const previewTabs = usePreviewTabs({
    onFileTabActivate: async (fileId, isDiff) => {
      resetDevConsoleExpandedLayout();
      if (isDiff) {
        setSelectedDiffFileId(fileId);
      } else {
        setSelectedDiffFileId(null);
        if (fileView.preview.selectedFileId !== fileId) {
          await fileView.tree.handleFileSelect(fileId);
        }
      }
      if (devConversationId) {
        openPreviewView(devConversationId);
      }
    },
    onPickerTabActivate: () => {
      resetDevConsoleExpandedLayout();
      if (devConversationId) {
        openPreviewView(devConversationId);
      }
    },
    onToolTabActivate: (toolId: PreviewToolId) => {
      resetDevConsoleExpandedLayout();
      setSelectedDiffFileId(null);
      // 预览 / 编排 / 版本控制：工作区页签，收起文件预览侧栏
      if (WORKSPACE_PREVIEW_TOOL_IDS.includes(toolId)) {
        closePreviewView();
        return;
      }
      if (devConversationId) {
        openPreviewView(devConversationId);
      }
    },
  });

  previewTabsRef.current = previewTabs;

  /** 当前选中查看 diff 的文件数据 */
  const selectedDiffFile = useMemo(
    () =>
      fileView.changeFiles.find((item) => item.fileId === selectedDiffFileId),
    [fileView.changeFiles, selectedDiffFileId],
  );

  /** 更改列表变化时，清理已不存在的暂存标记 */
  useEffect(() => {
    setStagedFileIds((prev) => {
      const changeIds = new Set(fileView.changeFiles.map((f) => f.fileId));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (changeIds.has(id)) {
          next.add(id);
        }
      });
      return next.size === prev.size ? prev : next;
    });
  }, [fileView.changeFiles]);

  /** 打开更改文件（选中文件并预览，非 diff） */
  const handleOpenChangeFile = useCallback(
    async (fileId: string) => {
      previewTabs.openFileTab(fileId, false);
    },
    [previewTabs],
  );

  /** 放弃单个文件的更改 */
  const handleDiscardChange = useCallback(
    (fileId: string) => {
      fileView.preview.discardChangeFile(fileId);
      setStagedFileIds((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
      previewTabs.closeTab(getFileTabId(fileId, true));
      previewTabs.closeTab(getFileTabId(fileId, false));
      if (selectedDiffFileId === fileId) {
        setSelectedDiffFileId(null);
      }
    },
    [fileView.preview, previewTabs, selectedDiffFileId],
  );

  /** 暂存更改（git stash） */
  const handleStageChange = useCallback(
    async (fileId: string) => {
      if (!devConversationId) {
        return;
      }
      try {
        const { code } = await apiGitStash({
          cId: devConversationId,
          files: [fileId],
        });
        if (code !== SUCCESS_CODE) {
          message.warning(
            dict('PC.Pages.ConversationAgentSourceControl.stageFailed'),
          );
        }
      } catch (error) {
        console.error('Git stash failed:', error);
        message.warning(
          dict('PC.Pages.ConversationAgentSourceControl.stageFailed'),
        );
      }
      setStagedFileIds((prev) => new Set(prev).add(fileId));
    },
    [devConversationId],
  );

  /** 取消暂存（git stash pop） */
  const handleUnstageChange = useCallback(
    async (fileId: string) => {
      if (!devConversationId) {
        return;
      }
      try {
        const { code } = await apiGitStashPop({
          cId: devConversationId,
          files: [fileId],
        });
        if (code !== SUCCESS_CODE) {
          message.warning(
            dict('PC.Pages.ConversationAgentSourceControl.unstageFailed'),
          );
        }
      } catch (error) {
        console.error('Git stash pop failed:', error);
        message.warning(
          dict('PC.Pages.ConversationAgentSourceControl.unstageFailed'),
        );
      }
      setStagedFileIds((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    },
    [devConversationId],
  );

  /** 将文件路径添加到 .gitignore */
  const handleAddToGitignore = useCallback(
    async (fileId: string) => {
      if (!devConversationId) {
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
            cId: devConversationId,
            files: updatedFilesList as VncDesktopUpdateFileInfo[],
          });
          if (code !== SUCCESS_CODE) {
            message.error(
              dict('PC.Pages.ConversationAgentSourceControl.gitignoreFailed'),
            );
            return;
          }
        } else {
          const { code } = await apiUpdateStaticFile({
            cId: devConversationId,
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
        await handleRefreshFileList(devConversationId);
      } catch (error) {
        console.error('Add to gitignore failed:', error);
        message.error(
          dict('PC.Pages.ConversationAgentSourceControl.gitignoreFailed'),
        );
      }
    },
    [devConversationId, fileTreeData, handleRefreshFileList],
  );

  // ==================== 渲染函数 ====================

  /** 「预览」页签：调试对话（原编排面板「调试」Tab） */
  const arrangeDebugChatPanel = useMemo(
    () => (
      <AgentConversationChatPanel
        agentId={agentId}
        agentConfigInfo={agentConfigInfo}
        hideHeader
        className={cx(styles['arrange-debug-chat'])}
        onAgentConfigInfo={setAgentConfigInfo}
        onChangeSelectedComputerId={setCurrentSelectedComputerId}
        onEditAgent={() => setOpenEditAgent(true)}
        isFileTreeSidebarVisible={canShowFileView}
        onToggleFileTreeSidebar={handleToggleFileTreeSidebar}
      />
    ),
    [
      agentId,
      agentConfigInfo,
      canShowFileView,
      handleToggleFileTreeSidebar,
      setAgentConfigInfo,
      setCurrentSelectedComputerId,
    ],
  );

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
      showSubscriptionTabs && agentId ? (
        <SubscriptionSetting agentId={agentId} spaceId={spaceId} visible />
      ) : null,
    [showSubscriptionTabs, agentId, spaceId],
  );

  /** 「订阅统计」页签（租户未开启订阅时不渲染） */
  const subscriptionStatsPanel = useMemo(
    () =>
      showSubscriptionTabs && agentId ? (
        <SubscriptionStats agentId={agentId} visible />
      ) : null,
    [showSubscriptionTabs, agentId],
  );

  /** 「版本控制」页签：Git 提交记录 */
  const arrangeVersionPanel = useMemo(
    () => (
      <AgentGitVersionRecordPanel
        conversationId={devConversationId}
        defaultAuthor={agentConfigInfo?.name}
        onRollbackSuccess={() => {
          if (devConversationId) {
            handleRefreshFileList(devConversationId);
          }
        }}
      />
    ),
    [devConversationId, agentConfigInfo?.name, handleRefreshFileList],
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
          tabs={previewTabs.tabs}
          activeTabId={previewTabs.activeTabId}
          onTabSelect={previewTabs.selectTab}
          onTabClose={previewTabs.closeTab}
          onCloseOtherTabs={previewTabs.closeOtherTabs}
          onCloseAllTabs={previewTabs.closeAllTabs}
          onTogglePinTab={previewTabs.togglePinTab}
          onTabReorder={previewTabs.reorderTabs}
          onAddTab={previewTabs.openPickerTab}
        />
        {/* Tab 栏下方：预览内容 + 底部终端（终端放大时仅覆盖此区域） */}
        <div className={cx(styles['right-panel-main'])}>
          <div className={cx(styles['right-panel-content'])}>
            <ConversationAgentFilePreview
              // 预览文件
              preview={fileView.preview}
              // 差异文件
              diffFile={selectedDiffFile}
              activeTab={previewTabs.activeTab}
              // 调试对话面板
              debugPanel={arrangeDebugChatPanel}
              // 编排配置面板
              arrangeConfigPanel={arrangeConfigPanel}
              // 版本控制面板（Git 提交记录）
              versionPanel={arrangeVersionPanel}
              subscriptionSettingPanel={subscriptionSettingPanel}
              subscriptionStatsPanel={subscriptionStatsPanel}
              onSelectTool={(toolId) => {
                previewTabs.closeTab(PREVIEW_TAB_PICKER_ID);
                previewTabs.openToolTab(toolId);
              }}
              providerClassName={fileView.className}
              className={cx(styles['file-preview-panel'], 'w-full', 'h-full')}
            />
          </div>
          <ConversationAgentBottomConsole
            visible={showDevConsole}
            wsUrl={terminalWsUrl}
            wireProtocol="ttyd"
            wsSubprotocols={['tty']}
            layoutResetSignal={devConsoleLayoutResetSignal}
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
              agentId={agentId}
              agentConfigInfo={agentConfigInfo}
              onAgentConfigInfo={setAgentConfigInfo}
              onChangeSelectedComputerId={setCurrentSelectedComputerId}
              onEditAgent={() => setOpenEditAgent(true)}
              isFileTreeSidebarVisible={canShowFileView}
              onToggleFileTreeSidebar={handleToggleFileTreeSidebar}
            />
          </div>

          {/* 中间面板（文件树） + 右侧面板（编排/预览 + 终端） */}
          {/* 中间面板：文件树侧边栏（仅由 canShowFileView 控制显隐） */}
          <div
            className={cx(styles['middle-panel'], {
              [styles['middle-panel-visible']]: canShowFileView,
              [styles['middle-panel-hidden']]: !canShowFileView,
            })}
          >
            <ConversationAgentMiddlePanel
              fileView={fileView}
              className={cx(styles['file-tree-sidebar'], 'w-full')}
              selectedDiffFileId={selectedDiffFileId}
              stagedFileIds={stagedFileIds}
              onDiffFileSelect={(fileId) => {
                previewTabs.openFileTab(fileId, true);
              }}
              onOpenChangeFile={handleOpenChangeFile}
              onDiscardChange={handleDiscardChange}
              onStageChange={handleStageChange}
              onUnstageChange={handleUnstageChange}
              onAddToGitignore={handleAddToGitignore}
              isCommitting={isGitPushing || fileView.preview.isSavingFiles}
              onCommit={async (message: string) => {
                const isSuccess = await handleGitCommitPush(
                  message,
                  fileView.changeFiles,
                );
                if (isSuccess) {
                  await fileView.preview.saveFiles();
                  setSelectedDiffFileId(null);
                  setStagedFileIds(new Set());
                  previewTabs.clearTabs();
                }
              }}
            />
          </div>
          {/* 右侧面板：编排配置 / 文件预览 + 终端 */}
          {renderRightPanel()}
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
