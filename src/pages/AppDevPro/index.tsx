import {
  ConversationBottomConsole,
  DevLogActions,
  GitVersionRecordPanel,
  type ConsoleLayoutMode,
} from '@/components/business-component';
import { type AgentMode } from '@/components/business-component/AgentIntervention';
import FileTreeGitSourcePanel, {
  useSourceControl,
  type ChangeListSection,
  type SelectedChangeFile,
} from '@/components/business-component/FileTreeGitSourcePanel';
import { useFileTreePreviewView } from '@/components/business-component/FileTreePreviewPanel/hooks/useFileTreePreviewView';
import type { FileTreePreviewViewProps } from '@/components/business-component/FileTreePreviewPanel/types';
import Loading from '@/components/custom/Loading';
import { isAgentVersionControlEnabled } from '@/constants/agent.constants';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { useTerminalWsUrl } from '@/hooks/useTerminalWsUrl';
import useUnifiedTheme from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import {
  apiDownloadAllFiles,
  apiImportProject,
  apiUpdateStaticFile,
  apiUploadFiles,
} from '@/services/vncDesktop';
import { MessageTypeEnum } from '@/types/enums/agent';
import { FileNode } from '@/types/interfaces/appDev';
import { UpdateFileInfo } from '@/types/interfaces/fileTree';
import { RequestResponse } from '@/types/interfaces/request';
import { StaticFileInfo } from '@/types/interfaces/vncDesktop';
import { checkFileSizeExceedLimit } from '@/utils';
import { modalConfirm } from '@/utils/ant-custom';
import { addBaseTarget } from '@/utils/common';
import { updateFilesListContent, updateFilesListName } from '@/utils/fileTree';
// import { createLogger } from '@/utils/logger';
import {
  TTYD_TERMINAL_WIRE_PROTOCOL,
  TTYD_TERMINAL_WS_SUBPROTOCOLS,
} from '@/utils/terminalWsUrl';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
import AgentConversationChatPanel from './AgentConversationChatPanel';
import AppDevProHeader from './AppDevProHeader';
import AppDevAppPreviewPanel from './components/AppDevAppPreviewPanel';
import AppDevDatabasePanel from './components/AppDevDatabasePanel';
import AppDevPublishProgressModal from './components/AppDevPublishProgressModal';
import AppDevRemoteDesktopPanel from './components/AppDevRemoteDesktopPanel';
import AppDevSettingsModal from './components/AppDevSettingsModal';
import ConversationAgentFilePreview from './ConversationAgentFilePreview';
import {
  getFileTabId,
  getToolTabId,
  usePreviewTabs,
  WORKSPACE_PREVIEW_TOOL_IDS,
  type PreviewToolId,
} from './ConversationAgentFilePreview/hooks/usePreviewTabs';
import PreviewTabBar from './ConversationAgentFilePreview/PreviewTabBar';
import { useConversationAgentDevLogs } from './hooks/useConversationAgentDevLogs';
import { useUserAppPublish } from './hooks/useUserAppPublish';
import { useUserAppRuntime } from './hooks/useUserAppRuntime';
import ImportProjectModal from './ImportProjectModal';
import styles from './index.less';
import {
  apiUserAppDomainList,
  getUserAppPreviewUrl,
  type UserAppDomainInfo,
} from './services/appDomain';
import { UserAppDbEnvEnum } from './services/appDb';
import { apiUserAppGetById } from './services/appDevPro';
import type { UserAppInfo } from './type';

const cx = classNames.bind(styles);
// const devConversationPollLogger = createLogger(
//   '[ConversationAgent][DevConversationPoll]',
// );

/**
 * AppDevPro — 应用开发页面（从 ConversationAgent 布局演化，预览区不展示智能体）
 *
 * ## 布局结构
 * 采用三栏式布局 + 底部终端控制台：
 * ┌─────────────────────────────────────────────────────────┐
 * │                    Header (导航栏)                       │
 * ├──────────────┬────────────────┬─────────────────────────┤
 * │  左侧面板     │   中间面板      │      右侧面板            │
 * │  (聊天区域)   │   (文件树)      │  (文件预览 / 版本控制)    │
 * │  始终显示     │   可收起/展开    │  + 底部终端 (始终显示)    │
 * ├──────────────┴────────────────┴─────────────────────────┤
 * │                 模态弹窗层 (导入项目等)                    │
 * └─────────────────────────────────────────────────────────┘
 */
const AppDevPro: React.FC = () => {
  // ==================== 路由参数 ====================
  const params = useParams();
  const location = useLocation();
  /** 当前空间 ID，从路由参数中获取 */
  const spaceId = Number(params.spaceId);

  /**
   * 从 URL query 参数中提取 appId
   * 支持通过 URL 直接指定要加载的应用（如 ?appId=123）
   */
  const appIdFromQuery = useMemo(() => {
    const queryAppId = new URLSearchParams(location.search).get('appId');
    return queryAppId ? Number(queryAppId) : 0;
  }, [location.search]);

  /**
   * 从 URL query 参数中提取 conversationId
   */
  const queryConversationId = useMemo(() => {
    const queryId = new URLSearchParams(location.search).get('conversationId');
    return queryId ? Number(queryId) : undefined;
  }, [location.search]);

  // ==================== 本地状态 ====================
  /** 当前应用 ID */
  const [appId, setAppId] = useState<number>(appIdFromQuery);
  /** 底部开发者控制台（终端）是否显示 */
  const [showDevConsole] = useState<boolean>(true);
  /** 切换预览标签/文件时递增，用于终端从 expanded 恢复 default */
  const [devConsoleLayoutResetSignal, setDevConsoleLayoutResetSignal] =
    useState<number>(0);
  /** 递增后触发底部终端全屏展开（开发工具「终端」入口） */
  const [devConsoleExpandSignal, setDevConsoleExpandSignal] =
    useState<number>(0);
  /** 递增后折叠底部终端（仅保留头部，不改变 ensure/连接状态） */
  const [devConsoleCollapseSignal, setDevConsoleCollapseSignal] =
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
  /** 导入项目弹窗 */
  const [openImportProject, setOpenImportProject] = useState<boolean>(false);
  /** 是否正在导入项目 */
  const [isImportingProject, setIsImportingProject] = useState<boolean>(false);
  /** 标签选择面板是否展开 */
  /** 预览标签页操作 ref（供 fileViewProviderProps 回调使用） */
  const previewTabsRef = useRef<ReturnType<typeof usePreviewTabs> | null>(null);
  /** 清空文件树选中态 ref（导入项目等场景使用） */
  const clearFileTreeSelectionRef = useRef<(() => void) | null>(null);
  const isVersionControlEnabledRef = useRef(false);
  /** 刷新文件树，并在存在当前选中文件时同步刷新文件内容 */
  const refreshFileTreeAndSelectedFileRef = useRef<
    (() => Promise<void>) | null
  >(null);
  /** 统一主题样式（导航栏风格等） */
  const { navigationStyle } = useUnifiedTheme();

  /** 会话/页面数据加载中（用于首屏 Loading） */
  const [loadingAgentConfigInfo, setLoadingAgentConfigInfo] = useState<boolean>(
    !!queryConversationId,
  );
  /** 当前选中的电脑 ID */
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');
  /** 文件树区域是否显示（header 图标控制，默认折叠） */
  const [canShowFileView, setCanShowFileView] = useState<boolean>(false);
  /** 项目设置弹窗 */
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  /** 全栈应用详情 */
  const [userAppInfo, setUserAppInfo] = useState<UserAppInfo | null>(null);
  /** 应用绑定的域名列表 */
  const [userAppDomainList, setUserAppDomainList] = useState<
    UserAppDomainInfo[]
  >([]);
  /** 当前环境：开发 / 线上，Header 中间切换 */
  const [dbEnv, setDbEnv] = useState<UserAppDbEnvEnum>(UserAppDbEnvEnum.Dev);
  /** 应用预览 iframe 刷新计数 */
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  // ==================== 全局状态模型 ====================
  /**
   * conversationInfo model：聊天核心状态管理
   * - 消息列表、会话信息、文件树数据
   * - 文件树可见性、固定状态、预览模式
   * - 文件操作（刷新、打开预览、关闭预览）
   * - TaskAgent 文件选中状态
   */
  const {
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
    setTaskAgentSelectedFileId,
    setIsLoadingOtherInterface,
    onMessageSend,
    runAsync,
    resetInit,
    restartVncPod,
    setPodAppStage,
    restartAgent,
    refreshGitListRef,
  } = useModel('conversationInfo');

  /** 文件树数据 ref，供防抖保存读取最新列表 */
  const fileTreeDataRef = useRef(fileTreeData);
  /** 文件树数据 ref，供防抖保存读取最新列表 */
  fileTreeDataRef.current = fileTreeData;

  /**
   * 仅在 AppDevPro 把当前环境写入 conversationInfo，
   * 供 ensure/restart/keepalive/stop 老接口附带 appStage；离开页面时清空，避免污染其它页面。
   */
  useEffect(() => {
    setPodAppStage(dbEnv);
  }, [dbEnv, setPodAppStage]);

  useEffect(
    () => () => {
      setPodAppStage(undefined);
    },
    [setPodAppStage],
  );

  /** 是否开启版本管控（会话信息加载完成且 enableVersionControl 为 1） */
  const enableVersionControl = conversationInfo?.agent?.enableVersionControl;

  /** 是否开启版本管控 */
  const isVersionControlEnabled = useMemo(
    () =>
      !!conversationInfo && isAgentVersionControlEnabled(enableVersionControl),
    [conversationInfo, enableVersionControl],
  );

  /** 常驻工作区工具页签（应用预览改为按需打开，可关闭） */
  const workspaceToolIds = useMemo((): PreviewToolId[] => {
    const tools: PreviewToolId[] = [];
    if (isVersionControlEnabled) {
      tools.push('version-control');
    }
    return tools;
  }, [isVersionControlEnabled]);

  // 版本管控是否开启的 ref
  isVersionControlEnabledRef.current = isVersionControlEnabled;

  /** 仅在开启版本管控时拉取 git status */
  const refreshGitListIfEnabled = useCallback(() => {
    if (!isVersionControlEnabledRef.current) {
      return;
    }
    void refreshGitListRef.current?.();
  }, []);

  // ==================== 计算属性 ====================

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
  const terminalWsUrl = useTerminalWsUrl(queryConversationId);

  /** 沙盒开发日志：仅在底部控制台打开且处于日志 Tab 时轮询 */
  const devLogs = useConversationAgentDevLogs(appId, {
    enabled:
      showDevConsole &&
      devConsoleActiveTab === 'logs' &&
      devConsoleLayoutMode !== 'collapsed' &&
      !!appId,
    pollInterval: 5000,
    tailLines: 1000,
  });

  // ==================== 副作用 (Effects) ====================

  /**
   * 当页面加载结束且携带了初始消息状态时，自动触发消息发送
   */
  useEffect(() => {
    // 优先使用路由参数中指定的 conversationId
    const id = queryConversationId;

    // 如果 id 存在，则自动触发消息发送
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

          // 会话消息列表
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
              agentMode: (state.agentMode as AgentMode) || 'yolo',
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

  /** URL 中的 appId 变化时同步到本地状态 */
  useEffect(() => {
    setAppId(appIdFromQuery);
  }, [appIdFromQuery]);

  /** 打开导入项目弹窗 */
  const handleImportProject = useCallback(async () => {
    if (!queryConversationId) {
      return;
    }
    setOpenImportProject(true);
  }, [queryConversationId]);

  /** 确认导入项目：上传 zip、刷新文件树与 Git 列表、安装依赖 */
  const handleImportProjectConfirm = useCallback(
    async (file: File) => {
      if (!queryConversationId) {
        return;
      }

      try {
        setIsImportingProject(true);
        const { code } = await apiImportProject({
          cId: queryConversationId,
          file,
        });

        if (code === SUCCESS_CODE) {
          message.success(dict('PC.Pages.AppDevIndex.importProjectSuccess'));
          setOpenImportProject(false);
          // 导入后重置顶部标签栏：仅保留预览、版本管控，关闭已打开的文件/diff 等页签
          setSelectedChangeFile(null);
          previewTabsRef.current?.closeAllTabs();
          clearFileTreeSelectionRef.current?.();
          setTaskAgentSelectedFileId('');
          void refreshFileListImmediately(queryConversationId);
          void refreshGitListIfEnabled();
        }
      } catch (error) {
        console.error('[ConversationAgent] import project failed', error);
      } finally {
        setIsImportingProject(false);
      }
    },
    [
      queryConversationId,
      refreshFileListImmediately,
      refreshGitListIfEnabled,
      setTaskAgentSelectedFileId,
    ],
  );

  // 如果 URL 中有 conversationId，通过状态管理器的方法查询当前会话
  useEffect(() => {
    if (queryConversationId) {
      setLoadingAgentConfigInfo(true);

      // 查询会话
      runQueryConversation(queryConversationId);

      // 立即刷新文件列表
      void refreshFileListImmediately(queryConversationId);
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

  /** 按应用 ID 查询项目详情 */
  const { run: runGetUserAppInfo } = useRequest(apiUserAppGetById, {
    manual: true,
    onSuccess: (result: RequestResponse<UserAppInfo>) => {
      if (result?.code === SUCCESS_CODE && result.data) {
        setUserAppInfo(result.data);
      }
    },
  });

  /** 发布：构建 → SSE 进度 → 提交发布申请 */
  const publishFlow = useUserAppPublish({
    appId,
    spaceId,
    onPublished: () => {
      if (appId) {
        runGetUserAppInfo(appId);
      }
    },
  });

  /** 应用预览：按环境启动 / 重启 / 停止，启动过程走任务 SSE */
  const previewRuntime = useUserAppRuntime({
    appId,
    env: dbEnv,
    userAppInfo,
    onReady: () => {
      setPreviewRefreshKey((prev) => prev + 1);
    },
  });

  /** 预览启动 / 重启进度弹窗文案 */
  const previewRuntimeModalCopy = useMemo(() => {
    const isRestart = previewRuntime.action === 'restart';
    return {
      title: isRestart
        ? dict('PC.Pages.AppDevPro.restartService')
        : dict('PC.Pages.AppDevPro.startService'),
      startingText: isRestart
        ? dict('PC.Pages.AppDevPro.restartingService')
        : dict('PC.Pages.AppDevPro.startingService'),
      runningText: isRestart
        ? dict('PC.Pages.AppDevPro.restartingService')
        : dict('PC.Pages.AppDevPro.startingService'),
      successText: isRestart
        ? dict('PC.Pages.AppDevPro.restartSuccess')
        : dict('PC.Pages.AppDevPro.startSuccess'),
      failedText: isRestart
        ? dict('PC.Pages.AppDevPro.restartFailed')
        : dict('PC.Pages.AppDevPro.startFailed'),
      cancelledText: dict('PC.Pages.AppDevPro.startCancelled'),
      cancelTitle: dict('PC.Pages.AppDevPro.cancelStartTitle'),
      cancelContent: dict('PC.Pages.AppDevPro.cancelStartContent'),
    };
  }, [previewRuntime.action]);

  /** 查询应用绑定的域名列表 */
  const { run: runGetUserAppDomainList, loading: userAppDomainListLoading } =
    useRequest(apiUserAppDomainList, {
      manual: true,
      onSuccess: (result: RequestResponse<UserAppDomainInfo[]>) => {
        if (result?.code === SUCCESS_CODE) {
          setUserAppDomainList(result.data || []);
        }
      },
    });

  /** 将加载状态同步到全局 model，供其他组件感知 */
  useEffect(() => {
    setIsLoadingOtherInterface(loadingAgentConfigInfo);
  }, [loadingAgentConfigInfo]);

  /** appId 变化时拉取应用详情 */
  useEffect(() => {
    if (!appId) {
      setUserAppInfo(null);
      return;
    }
    runGetUserAppInfo(appId);
  }, [appId, runGetUserAppInfo]);

  /** appId 变化时拉取域名列表 */
  useEffect(() => {
    if (!appId) {
      setUserAppDomainList([]);
      return;
    }
    runGetUserAppDomainList(appId);
  }, [appId, runGetUserAppDomainList]);

  /** 初始化页面基础配置：为页面中所有链接添加 target 属性 */
  useEffect(() => {
    addBaseTarget();
  }, [location]);

  // ==================== 事件处理函数 ====================

  /**
   * 聊天会话结束后统一刷新页面数据
   * - 刷新文件树
   * - 刷新 Git 源代码管理列表
   */
  const handleConversationEnd = useCallback(() => {
    // 刷新文件树；如果当前有选中文件，同步刷新当前文件内容
    if (queryConversationId) {
      const refreshFileTreeAndSelectedFile =
        refreshFileTreeAndSelectedFileRef.current;
      if (refreshFileTreeAndSelectedFile) {
        void refreshFileTreeAndSelectedFile();
      } else {
        void refreshFileListImmediately(queryConversationId);
      }
    }

    // 刷新 Git 源代码管理状态列表
    void refreshGitListIfEnabled();
  }, [
    queryConversationId,
    refreshFileListImmediately,
    refreshGitListIfEnabled,
  ]);

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
    // 去除空格
    const trimmedName = newName.trim();
    if (!trimmedName) {
      return false;
    }
    // 如果文件夹名称与父节点名称相同，则提示错误
    const parentPath = fileNode.parentPath || '';
    // 文件夹路径拼接
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
    // 创建文件
    const { code } = await apiUpdateStaticFile({
      cId: queryConversationId,
      files: [newFile],
    });
    if (code === SUCCESS_CODE) {
      // 刷新文件树
      await handleRefreshFileList(queryConversationId);
      void refreshGitListIfEnabled();
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
            // 刷新文件树
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
      void refreshGitListIfEnabled();
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
            void refreshGitListIfEnabled();
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
    void refreshGitListIfEnabled();
  };

  /**
   * 切换中间文件树栏显隐（与终端全屏互斥）
   */
  const handleToggleFileTreeSidebar = useCallback(() => {
    const isTerminalExpanded =
      devConsoleLayoutMode === 'expanded' && devConsoleActiveTab === 'terminal';

    // 如果终端全屏，则折叠终端，并打开文件树
    if (isTerminalExpanded) {
      setDevConsoleCollapseSignal((n) => n + 1);
      setCanShowFileView(true);
      if (queryConversationId) {
        handleRefreshFileList(queryConversationId);
      }
      return;
    }

    // 切换文件树显隐
    setCanShowFileView((prev) => {
      const nextVisible = !prev;
      if (nextVisible && queryConversationId) {
        handleRefreshFileList(queryConversationId);
      }
      return nextVisible;
    });
  }, [
    devConsoleActiveTab,
    devConsoleLayoutMode,
    handleRefreshFileList,
    queryConversationId,
  ]);

  /**
   * 关闭预览面板
   * 同时关闭文件预览视图和取消文件树固定状态
   */
  const handleClosePreviewPanel = useCallback(() => {
    closePreviewView();
    setIsFileTreePinned(false);
    setSelectedChangeFile(null);
    previewTabsRef.current?.clearTabs();
  }, [closePreviewView, setIsFileTreePinned]);

  /** 切换预览标签/文件时，底部终端若处于 expanded 则恢复 default */
  const resetDevConsoleExpandedLayout = useCallback(() => {
    setDevConsoleLayoutResetSignal((n) => n + 1);
  }, []);

  /** 打开 / 收起底部终端全屏（与文件树、智能体电脑互斥；再次点击仅折叠，不影响 ensure/连接） */
  const handleOpenTerminalPanel = useCallback(() => {
    const isTerminalExpanded =
      devConsoleLayoutMode === 'expanded' && devConsoleActiveTab === 'terminal';

    if (isTerminalExpanded) {
      setDevConsoleCollapseSignal((n) => n + 1);
      return;
    }

    setSelectedChangeFile(null);
    if (queryConversationId) {
      void openPreviewView(queryConversationId);
    }
    // 清除陈旧 collapse 信号，避免从智能体电脑切回时 remount 折叠 effect 覆盖 expand
    setDevConsoleCollapseSignal(0);
    setDevConsoleExpandSignal((n) => n + 1);
  }, [
    devConsoleActiveTab,
    devConsoleLayoutMode,
    openPreviewView,
    queryConversationId,
  ]);

  /** 是否打开终端面板 */
  const isTerminalPanelOpen =
    devConsoleLayoutMode === 'expanded' && devConsoleActiveTab === 'terminal';

  /** 顶部入口互斥 active：同一时刻仅高亮一个 */
  const isFileTreeIconActive = canShowFileView && !isTerminalPanelOpen;
  const isTerminalIconActive = isTerminalPanelOpen;

  // ==================================== 文件视图 & 编排面板 ====================================
  /**
   * 文件视图 Hook 的完整配置属性
   * 聚合文件树、文件操作回调、沙箱信息、空闲检测等配置，
   * 传递给 useFileTreePreviewView 以获得 tree/preview 渲染组件
   */
  const fileViewProviderProps = useMemo((): FileTreePreviewViewProps => {
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
      /** 导入项目 */
      onImportProject: handleImportProject,
      /** 是否正在导入项目 */
      isImportingProject,
      onRestartServer: () => {
        if (queryConversationId) {
          restartVncPod(queryConversationId, finalSelectedComputerId);
        }
      },
      /** 全栈应用环境，computer/pod 老接口附带 appStage */
      appStage: dbEnv,
      /** 重命名文件 */
      onRenameFile: handleConfirmRenameFile,
      /** 创建文件 */
      onCreateFileNode: handleCreateFileNode,
      /** 删除文件 */
      onDeleteFile: handleDeleteFile,
      /** 保存文件 */
      onSaveFiles: handleSaveFiles,
      /** 保存单个文件 */
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
      /** 文件树侧栏是否可见 */
      isFileTreeSidebarVisible: canShowFileView,
      isCanDeleteSkillFile: true, // 是否允许删除技能文件
      onRefreshFileTree: async () => {
        if (queryConversationId) {
          await refreshFileListImmediately(queryConversationId);
        }
      },
      /** 静态文件基础路径，用于文件预览资源加载 */
      staticFileBasePath: `/api/computer/static/${queryConversationId}`,
      /** 仅配置加载完成且开启版本管理时拉取 Git status */
      enableGitStatus: isVersionControlEnabled,
      enableVersionControl,
      /** 文件树选中文件时，切换右侧面板为文件预览并打开标签 */
      onFileSelectOpenPreview: (fileId?: string) => {
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
        void refreshGitListIfEnabled();
      },
      /** 刷新文件树后，当前选中文件不存在时关闭对应标签 */
      onSelectedFileMissing: (fileId) => {
        previewTabsRef.current?.closeTab(getFileTabId(fileId, true));
        previewTabsRef.current?.closeTab(getFileTabId(fileId, false));
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
    enableVersionControl,
    isVersionControlEnabled,
    openPreviewView,
    resetDevConsoleExpandedLayout,
    handleImportProject,
    isImportingProject,
    restartVncPod,
    dbEnv,
  ]);

  /** 初始化文件视图 Hook，获取文件树和预览的渲染组件 */
  const fileView = useFileTreePreviewView(fileViewProviderProps);
  // 刷新 Git 列表
  refreshGitListRef.current = fileView.refreshGitList;
  // 清空文件树选中
  clearFileTreeSelectionRef.current = fileView.tree.clearSelection ?? null;

  // 刷新文件树，并在存在当前选中文件时同步刷新文件内容
  refreshFileTreeAndSelectedFileRef.current =
    fileView.tree.handleRefreshFileList;

  useEffect(
    () => () => {
      handleSaveFileContent.cancel();
    },
    [handleSaveFileContent],
  );

  /** 预览区标签页管理 */
  const previewTabs = usePreviewTabs({
    workspaceToolIds,
    // 打开文件标签
    onFileTabActivate: async (fileId, isDiff) => {
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
    // 打开工具标签
    onToolTabActivate: (toolId: PreviewToolId) => {
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
      // 预览 / 编排 / 版本控制 / 数据库：工作区页签，收起文件预览侧栏
      if (
        WORKSPACE_PREVIEW_TOOL_IDS.includes(toolId) ||
        toolId === 'database' ||
        toolId === 'remote-desktop'
      ) {
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

  /** 进入页面时默认打开应用预览页签（可关闭，也可从 Header 再次打开） */
  useEffect(() => {
    previewTabsRef.current?.openToolTab('preview');
  }, []);

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
          await apiUpdateStaticFile({
            cId: queryConversationId,
            files: updatedFilesList as UpdateFileInfo[],
          });
        } else {
          await apiUpdateStaticFile({
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
        }

        message.success(
          dict('PC.Pages.ConversationAgentSourceControl.gitignoreSuccess'),
        );
        await handleRefreshFileList(queryConversationId);
      } catch (error) {
        console.error('Add to gitignore failed:', error);
      }
    },
    [fileTreeData, handleRefreshFileList],
  );

  /**
   * 源代码管理（Git）统一 Hook
   * 封装暂存/取消暂存/提交推送等 Git 操作，差异逻辑通过 callbacks 由页面注入
   */
  const gitSourceControl = useSourceControl({
    workspace: {
      workspaceType: 'taskAgent',
      cid: queryConversationId ?? null,
    },
    changeFiles: fileView.changeFiles,
    selectedChangeFile,
    setSelectedChangeFile,
    callbacks: {
      // 打开更改文件（选中文件并预览，非 diff）
      openChangeFile: (fileId: string) => {
        previewTabs.openFileTab(fileId, false);
      },
      // 将文件路径添加到 .gitignore
      addFileToGitignore: handleAddToGitignore,
      // 选中修改文件，在右侧预览区展示 diff
      onDiffFileSelect: (fileId: string) => {
        previewTabs.openFileTab(fileId, true);
      },
      // 放弃更改后关闭预览 Tab
      onAfterDiscardChange: (fileId: string) => {
        previewTabs.closeTab(getFileTabId(fileId, true));
      },
      // 批量放弃更改完成后，只刷新一次文件树
      onAfterDiscardChanges: async () => {
        await fileView.tree.handleRefreshFileList();
      },
      // 提交成功后刷新 Git 状态，不关闭顶部工作区/文件标签
      onCommitSuccess: async () => {
        await fileView.refreshGitList();
      },
      // 刷新 Git 变更列表（git status + 文件树）
      onRefreshGitList: async () => {
        await fileView.refreshGitList();
      },
    },
  });

  /** Git status 中 untracked 数组内的文件（走普通文件预览，不走 diff） */
  const isGitUntrackedFile = useCallback(
    (fileId: string) =>
      fileView.changeFiles.some(
        (item) => item.fileId === fileId && item.unstagedStatus === 'untracked',
      ),
    [fileView.changeFiles],
  );

  /** 源代码管理点击：untracked 走文件预览，其余走 diff */
  const handleGitDiffFileSelect = useCallback(
    (fileId: string, section: ChangeListSection) => {
      if (isGitUntrackedFile(fileId)) {
        gitSourceControl.handleOpenChangeFile(fileId);
        return;
      }
      gitSourceControl.handleDiffFileSelect(fileId, section);
    },
    [isGitUntrackedFile, gitSourceControl],
  );

  /**
   * 顶部预览 Tab 切换：diff 标签需重新拉取 Git diff（与源代码管理点击一致）
   */
  const handlePreviewTabSelect = useCallback(
    (tabId: string) => {
      if (tabId.startsWith('diff:')) {
        const fileId = tabId.slice('diff:'.length);
        if (isGitUntrackedFile(fileId)) {
          gitSourceControl.handleOpenChangeFile(fileId);
          return;
        }
        const changeFile = fileView.changeFiles.find(
          (item) => item.fileId === fileId,
        );
        const section: ChangeListSection =
          gitSourceControl.selectedChangeFile?.fileId === fileId
            ? gitSourceControl.selectedChangeFile.section
            : changeFile?.unstagedStatus
            ? 'unstaged'
            : changeFile?.stagedStatus
            ? 'staged'
            : 'unstaged';
        gitSourceControl.handleDiffFileSelect(fileId, section);
        return;
      }
      previewTabs.selectTab(tabId);
    },
    [fileView.changeFiles, gitSourceControl, isGitUntrackedFile, previewTabs],
  );

  /** 打开数据库页签（已存在则激活） */
  const handleOpenDatabasePanel = useCallback(() => {
    previewTabs.openToolTab('database');
  }, [previewTabs]);

  /** 打开应用预览页签（已存在则激活），并按需启动当前环境服务 */
  const handleOpenAppPreview = useCallback(() => {
    previewTabs.openToolTab('preview');
    previewRuntime.startIfNeeded();
  }, [previewRuntime, previewTabs]);

  /** 停止当前环境预览服务 */
  const handleStopPreviewRuntime = useCallback(() => {
    modalConfirm(
      dict('PC.Pages.AppDevPro.confirmStopTitle'),
      dict('PC.Pages.AppDevPro.confirmStopContent'),
      () => {
        void previewRuntime.stop();
      },
    );
  }, [previewRuntime]);

  /** 刷新应用预览 iframe */
  const handleRefreshPreview = useCallback(() => {
    setPreviewRefreshKey((prev) => prev + 1);
  }, []);

  /**
   * 打开 / 关闭远程桌面页签
   * 内容区与数据库页签同一尺寸；再次点击关闭
   */
  const handleOpenDesktopPanel = useCallback(() => {
    if (!appId) {
      message.warning(dict('PC.Pages.AppDevPro.remoteDesktopEmpty'));
      return;
    }

    if (previewTabs.activeTab?.toolId === 'remote-desktop') {
      previewTabs.closeTab(getToolTabId('remote-desktop'));
      return;
    }

    previewTabs.openToolTab('remote-desktop');
  }, [appId, previewTabs]);

  /** 切换环境：离开开发环境时关闭远程桌面页签 */
  const handleEnvChange = useCallback(
    (nextEnv: UserAppDbEnvEnum) => {
      setDbEnv(nextEnv);
      if (nextEnv !== UserAppDbEnvEnum.Dev) {
        previewTabs.closeTab(getToolTabId('remote-desktop'));
      }
    },
    [previewTabs],
  );

  /** 数据库页签是否激活（Header 图标高亮） */
  const isDatabasePanelOpen = previewTabs.activeTab?.toolId === 'database';
  /** 应用预览页签是否激活（Header 图标高亮） */
  const isAppPreviewOpen = previewTabs.activeTab?.toolId === 'preview';
  /** 远程桌面页签是否激活（Header 图标高亮） */
  const isAgentDesktopOpen =
    previewTabs.activeTab?.toolId === 'remote-desktop';

  /** 当前环境对应的应用预览地址 */
  const appPreviewUrl = useMemo(
    () => getUserAppPreviewUrl(userAppDomainList, dbEnv),
    [userAppDomainList, dbEnv],
  );

  /** 「数据库」页签：按 Header 所选环境加载 iframe */
  const databasePanel = useMemo(
    () => <AppDevDatabasePanel appId={appId} env={dbEnv} />,
    [appId, dbEnv],
  );

  /** 「应用预览」页签：嵌入当前环境访问地址 */
  const appPreviewPanel = useMemo(
    () => (
      <AppDevAppPreviewPanel
        previewUrl={appPreviewUrl}
        refreshKey={previewRefreshKey}
      />
    ),
    [appPreviewUrl, previewRefreshKey],
  );

  /** 「远程桌面」页签：与数据库同一内容区嵌入 iframe */
  const remoteDesktopPanel = useMemo(
    () => <AppDevRemoteDesktopPanel appId={appId} />,
    [appId],
  );

  // ==================================== 渲染组件元素 ====================================

  /** 「版本控制」页签：Git 提交记录 */
  const versionControlPanel = useMemo(() => {
    if (!isVersionControlEnabled) {
      return null;
    }
    return (
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
          // 回滚成功后同步刷新 Git 源代码管理状态列表
          void refreshGitListIfEnabled();
        }}
      />
    );
  }, [
    isVersionControlEnabled,
    queryConversationId,
    fileView.gitBranch,
    handleRefreshFileList,
  ]);

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
          onTabSelect={handlePreviewTabSelect}
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
          permanentWorkspaceToolIds={workspaceToolIds}
          /** 重启智能体电脑 */
          onRestartServer={() => {
            if (queryConversationId) {
              restartVncPod(queryConversationId, finalSelectedComputerId);
            }
          }}
          onRestartAgent={() => {
            if (queryConversationId) {
              restartAgent(queryConversationId);
            }
          }}
          /** 导出项目 */
          onExportProject={() => {
            void fileView.tree.handleExportProject?.();
          }}
          /** 是否为云电脑 */
          isCloudComputer={finalSelectedComputerId === '-1'}
          previewUrl={appPreviewUrl}
          onRefreshPreview={handleRefreshPreview}
          onStartPreviewRuntime={previewRuntime.start}
          onRestartPreviewRuntime={previewRuntime.restart}
          onStopPreviewRuntime={handleStopPreviewRuntime}
          previewRuntimeBusy={previewRuntime.busy}
          previewRuntimeRunning={previewRuntime.running}
          previewRuntimeStopping={previewRuntime.stopping}
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
              // 应用预览页签
              previewPanel={appPreviewPanel}
              // 数据库页签
              databasePanel={databasePanel}
              remoteDesktopPanel={remoteDesktopPanel}
              // 版本控制面板（Git 提交记录）
              versionPanel={versionControlPanel}
              providerClassName={fileView.className}
              className={cx(styles['file-preview-panel'], 'w-full', 'h-full')}
            />
          </div>

          {/* 底部终端、开发日志合集面板 */}
          {/** 云端电脑传入 conversationId 以启动容器；个人电脑直接通过 wsUrl 连接终端 */}
          <ConversationBottomConsole
            // 在ConversationAgent中，conversationId 为 queryConversationId
            conversationId={
              finalSelectedComputerId === '-1' ? queryConversationId : undefined
            }
            appStage={dbEnv}
            visible={showDevConsole}
            wsUrl={terminalWsUrl}
            wireProtocol={TTYD_TERMINAL_WIRE_PROTOCOL}
            wsSubprotocols={[...TTYD_TERMINAL_WS_SUBPROTOCOLS]}
            layoutResetSignal={devConsoleLayoutResetSignal}
            expandSignal={devConsoleExpandSignal}
            collapseSignal={devConsoleCollapseSignal}
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
  // 会话加载中时显示全屏 Loading，避免渲染不完整的页面
  if (loadingAgentConfigInfo && queryConversationId) {
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
      {/* 页面顶部 Header：返回、项目信息、文件树/终端入口 */}
      <AppDevProHeader
        className={styles['page-header']}
        userAppInfo={userAppInfo}
        spaceId={spaceId}
        onConfirmUpdate={setUserAppInfo}
        onPublish={publishFlow.startPublish}
        publishing={publishFlow.publishing}
        isFileTreeSidebarVisible={isFileTreeIconActive}
        onToggleFileTreeSidebar={handleToggleFileTreeSidebar}
        isTerminalPanelOpen={isTerminalIconActive}
        onOpenTerminalPanel={handleOpenTerminalPanel}
        onOpenSettings={() => setSettingsOpen(true)}
        isDatabasePanelOpen={isDatabasePanelOpen}
        onOpenDatabase={handleOpenDatabasePanel}
        isAppPreviewOpen={isAppPreviewOpen}
        onOpenAppPreview={handleOpenAppPreview}
        isShowDesktop={dbEnv === UserAppDbEnvEnum.Dev}
        isAgentDesktopOpen={isAgentDesktopOpen}
        onOpenDesktopPanel={handleOpenDesktopPanel}
        env={dbEnv}
        onEnvChange={handleEnvChange}
      />

      {/* 主内容区域：左聊天 | 中文件树 | 右预览/终端 */}
      <section
        className={cx(
          'flex',
          'flex-1',
          styles.section,
          `xagi-nav-${navigationStyle}`,
        )}
      >
        <div className={cx(styles['main-row'])}>
          {/* 左侧面板：聊天区域（始终显示） */}
          <div className={cx(styles['left-panel'])}>
            <AgentConversationChatPanel
              selectedComputerId={finalSelectedComputerId}
              onChangeSelectedComputerId={setSelectedComputerId}
              onConversationEnd={handleConversationEnd}
            />
          </div>

          <div
            className={cx('flex', 'flex-1', styles['content-container'], {
              [styles['content-container-fullscreen']]:
                fileView.preview.isFullscreen,
            })}
          >
            {/* 中间面板（文件树） + 右侧面板（文件预览 + 终端） */}
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
                  showSourceControl={isVersionControlEnabled}
                  enableVersionControl={enableVersionControl}
                  tree={fileView.tree}
                  treeClassName="w-full h-full"
                  onImportProject={handleImportProject}
                  importProjectLabel={dict(
                    'PC.Pages.AppDevFileTreeContextMenu.importProject',
                  )}
                  isImportingProject={isImportingProject}
                  sourceControl={{
                    changeFiles: fileView.changeFiles,
                    selectedChangeFile: gitSourceControl.selectedChangeFile,
                    isCommitting:
                      gitSourceControl.isCommitting ||
                      fileView.preview.isSavingFiles,
                    isRefreshingGitList: fileView.isRefreshingGitList,
                    onRefreshGitList: fileView.refreshGitList,
                    onDiffFileSelect: handleGitDiffFileSelect,
                    onOpenChangeFile: gitSourceControl.handleOpenChangeFile,
                    onDiscardChanges: gitSourceControl.handleDiscardChange,
                    onStageChanges: gitSourceControl.handleStageChanges,
                    onUnstageChanges: gitSourceControl.handleUnstageChanges,
                    onAddToGitignore: (fileId) => {
                      void gitSourceControl.handleAddToGitignore(fileId);
                    },
                    onCommit: gitSourceControl.handleCommit,
                  }}
                />
              </div>
              {/* 右侧面板：文件预览 + 终端 */}
              {renderRightPanel()}
            </>
          </div>
        </div>
      </section>

      {/* ==================== 模态弹窗层 ==================== */}

      {/* 导入项目弹窗 */}
      <ImportProjectModal
        open={openImportProject}
        loading={isImportingProject}
        onCancel={() => setOpenImportProject(false)}
        onConfirm={handleImportProjectConfirm}
      />

      {/* 项目设置：复用平台认证 + 域名绑定 */}
      <AppDevSettingsModal
        open={settingsOpen}
        projectInfo={
          userAppInfo
            ? {
                projectId: userAppInfo.id,
                name: userAppInfo.name,
              }
            : null
        }
        domains={userAppDomainList}
        domainListLoading={userAppDomainListLoading}
        onCancel={() => setSettingsOpen(false)}
        onSuccess={() => {
          if (appId) {
            runGetUserAppDomainList(appId);
          }
        }}
      />

      {/* 发布进度：构建日志 + 提交申请 */}
      <AppDevPublishProgressModal
        open={publishFlow.open}
        phase={publishFlow.phase}
        services={publishFlow.services}
        overallProgress={publishFlow.overallProgress}
        errorMessage={publishFlow.errorMessage}
        cancelLoading={publishFlow.cancelLoading}
        onCancelTask={publishFlow.cancelTask}
        onClose={publishFlow.closeModal}
      />

      {/* 应用预览启动 / 重启进度 */}
      <AppDevPublishProgressModal
        open={previewRuntime.open}
        phase={previewRuntime.phase}
        services={previewRuntime.services}
        overallProgress={previewRuntime.overallProgress}
        errorMessage={previewRuntime.errorMessage}
        cancelLoading={previewRuntime.cancelLoading}
        onCancelTask={previewRuntime.cancelTask}
        onClose={previewRuntime.closeModal}
        showSteps={false}
        title={previewRuntimeModalCopy.title}
        startingText={previewRuntimeModalCopy.startingText}
        runningText={previewRuntimeModalCopy.runningText}
        successText={previewRuntimeModalCopy.successText}
        failedText={previewRuntimeModalCopy.failedText}
        cancelledText={previewRuntimeModalCopy.cancelledText}
        cancelTitle={previewRuntimeModalCopy.cancelTitle}
        cancelContent={previewRuntimeModalCopy.cancelContent}
      />
    </div>
  );
};

export default AppDevPro;
