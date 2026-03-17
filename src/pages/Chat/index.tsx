import AgentChatEmpty from '@/components/AgentChatEmpty';
import AgentSidebar, { AgentSidebarRef } from '@/components/AgentSidebar';
import SvgIcon from '@/components/base/SvgIcon';
import {
  CopyToSpaceComponent,
  PagePreviewIframe,
} from '@/components/business-component';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import FileTreeView from '@/components/FileTreeView';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import ResizableSplit from '@/components/ResizableSplit';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { MESSAGE_PAGE_SIZE } from '@/constants/common.constants';
import { EVENT_TYPE } from '@/constants/event.constants';
import useAgentDetails from '@/hooks/useAgentDetails';
import { useConversationScrollDetection } from '@/hooks/useConversationScrollDetection';
import useExclusivePanels from '@/hooks/useExclusivePanels';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import useMessageEventDelegate from '@/hooks/useMessageEventDelegate';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { apiAgentConversationCreate } from '@/services/agentConfig';
import {
  apiDownloadAllFiles,
  apiUpdateStaticFile,
  apiUploadFiles,
} from '@/services/vncDesktop';
import {
  AgentComponentTypeEnum,
  AllowCopyEnum,
  HideDesktopEnum,
  MessageTypeEnum,
  TaskStatus,
} from '@/types/enums/agent';
import { AgentTypeEnum } from '@/types/enums/space';
import { FileNode } from '@/types/interfaces/appDev';
import type {
  MessageSourceType,
  UploadFileInfo,
} from '@/types/interfaces/common';
import type {
  ConversationInfo,
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import {
  IUpdateStaticFileParams,
  StaticFileInfo,
  VncDesktopUpdateFileInfo,
} from '@/types/interfaces/vncDesktop';
import { modalConfirm } from '@/utils/ant-custom';
import {
  addBaseTarget,
  arraysContainSameItems,
  parsePageAppProjectId,
} from '@/utils/common';
import eventBus from '@/utils/eventBus';
import { exportWholeProjectZip } from '@/utils/exportImportFile';
import { updateFilesListContent, updateFilesListName } from '@/utils/fileTree';
import { jumpToPageDevelop } from '@/utils/router';
import { LoadingOutlined } from '@ant-design/icons';
import { Form, message as messageAntd } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
import ConversationStatus from './components/ConversationStatus';
import DropdownChangeName from './DropdownChangeName';
import { useAutoPreviewFile } from './hooks/useAutoPreviewFile';
import styles from './index.less';
import ShowArea from './ShowArea';

const cx = classNames.bind(styles);
/**
 * 主页咨询聊天页面
 */
const Chat: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const { handleAutoPreviewLastFile } = useAutoPreviewFile();
  // 会话ID
  const id = Number(params.id);
  const agentId = Number(params.agentId);
  // 附加state
  const message = location.state?.message;
  const files = location.state?.files;
  const infos = location.state?.infos;
  // 消息来源
  const messageSourceType: MessageSourceType =
    (location.state?.messageSourceType as MessageSourceType) || 'new_chat'; // new_chat 新增会话
  // 默认的智能体详情信息
  const defaultAgentDetail = location.state?.defaultAgentDetail;
  // 用户填写的变量参数，此处用于第一次发送消息时，传递变量参数
  const firstVariableParams = location.state?.variableParams;

  const [form] = Form.useForm();
  // 变量参数
  const [variableParams, setVariableParams] = useState<Record<
    string,
    string | number
  > | null>(null);
  const [clearLoading, setClearLoading] = useState<boolean>(false);
  // 是否发送过消息,如果是,则禁用变量参数
  const isSendMessageRef = useRef<boolean>(false);

  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const sidebarRef = useRef<AgentSidebarRef>(null);

  // 复制模板弹窗状态
  const [openCopyModal, setOpenCopyModal] = useState<boolean>(false);
  // 是否锁定电脑选择（仅在从 AgentDetails 页面带有 selectedComputerId 且为 PUSH 跳转时生效）
  const [isSelectionLocked, setIsSelectionLocked] = useState<boolean>(false);

  // 当前选中的电脑 ID（任务型智能体）
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');
  // 用户选择的智能体电脑名称
  // const [selectedComputerName, setSelectedComputerName] = useState<string>('');

  // 记录用户是否已发送消息（用于锁定电脑选择）
  const [hasUserSentMessage, setHasUserSentMessage] = useState<boolean>(false);

  // 仅在本次会话中使用从 AgentDetails 页面带过来的 selectedComputerId；
  // 刷新（POP）或新建会话（REPLACE）时，不再沿用之前的选择。
  useEffect(() => {
    const passedDetails = location.state?.selectedComputerId;

    // PUSH: 正常跳转 (AgentDetails -> Chat)
    const isPushWithComputer = history.action === 'PUSH' && !!passedDetails;

    if (isPushWithComputer) {
      setSelectedComputerId(passedDetails);
      setIsSelectionLocked(true);
    } else {
      setSelectedComputerId('');
      setIsSelectionLocked(false);
    }
  }, [history.action, location.key]);

  // 智能体详情
  const { agentDetail, setAgentDetail, handleToggleCollectSuccess } =
    useAgentDetails();

  // 会话输入框已选择组件
  const {
    selectedComponentList,
    setSelectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  const {
    conversationInfo,
    loadingConversation,
    manualComponents,
    messageList,
    setMessageList,
    chatSuggestList,
    runAsync,
    setIsLoadingConversation,
    loadingSuggest,
    onMessageSend,
    messageViewRef,
    messageViewScrollToBottom,
    allowAutoScrollRef,
    scrollTimeoutRef,
    showScrollBtn,
    setShowScrollBtn,
    resetInit,
    handleClearSideEffect,
    setIsLoadingOtherInterface,
    requiredNameList,
    setConversationInfo,
    variables,
    showType,
    setShowType,
    // 文件树显隐状态
    isFileTreeVisible,
    // 文件树是否固定（用户点击后固定）
    isFileTreePinned,
    setIsFileTreePinned,
    closePreviewView,
    // 清除文件面板信息
    clearFilePanelInfo,
    // 文件树数据
    fileTreeData,
    fileTreeDataLoading,
    // 文件树视图模式
    viewMode,
    // 处理文件列表刷新事件
    handleRefreshFileList,
    openPreviewView,
    openDesktopView,
    restartVncPod,
    restartAgent,
    // 任务智能体会话中点击选中的文件ID
    taskAgentSelectedFileId,
    // 任务智能体文件选择触发标志
    taskAgentSelectTrigger,
    // 会话是否正在进行中（有消息正在处理）
    isConversationActive,
    // 加载更多消息相关
    isMoreMessage,
    setIsMoreMessage,
    loadingMore,
    handleLoadMoreMessage,
  } = useModel('conversationInfo');

  // 页面预览相关状态
  const { pagePreviewData, showPagePreview, hidePagePreview } =
    useModel('chat');

  const { isMobile } = useModel('layout');
  // 会话记录
  const { runHistory, runHistoryItem } = useModel('conversationHistory');

  // 统一 Agent 数据源：优先使用会话关联的智能体快照，兜底使用详情接口数据
  const effectiveAgent = useMemo(() => {
    return conversationInfo?.agent || agentDetail;
  }, [conversationInfo?.agent, agentDetail]);

  /**
   * 是否显示文件预览 / 智能体电脑切换按钮：
   * 1. 仅通用型智能体 (TaskAgent)
   * 2. 必须存在消息
   * 3. 如果只有一条消息，则该消息的 id 必须非空（id 为空视为无效消息）
   */
  const isShowFilePanel = useMemo(() => {
    if (effectiveAgent?.type !== AgentTypeEnum.TaskAgent) {
      return false;
    }

    if (!messageList || messageList.length === 0) {
      return false;
    }

    if (messageList.length === 1) {
      const first = messageList[0];
      return !!first?.id;
    }

    return true;
  }, [effectiveAgent?.type, messageList]);

  // 获取有效的沙箱ID
  const getEffectiveSandboxId = (info: ConversationInfo = conversationInfo) => {
    try {
      // 优先级 1: 手动选择 (selectedComputerId)
      if (selectedComputerId) {
        return selectedComputerId;
      }

      // 优先级 2: 兜底从 location.state 获取 (仅 PUSH 跳转)。
      // 解决首次加载发消息时，状态未及时更新导致获取到内置 sandboxId 的问题。
      if (history.action === 'PUSH' && location.state?.selectedComputerId) {
        return location.state.selectedComputerId;
      }

      // 优先级 3: 个人电脑 (sandboxId)
      if (effectiveAgent?.sandboxId) {
        return effectiveAgent.sandboxId;
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

  // 从 pagePreviewData 的 params 或 URI 中获取工作流信息
  // 支持多种可能的参数名：workflowId, workflow_id, id
  // 也支持从 URI 路径中解析（如 /square/workflow/123）
  const workflowId = useMemo(() => {
    // 1. 先从 params 中获取
    if (pagePreviewData?.params) {
      const params = pagePreviewData.params;
      const workflowIdFromParams =
        params.workflowId || params.workflow_id || params.id;
      if (workflowIdFromParams) {
        const id = Number(workflowIdFromParams);
        if (!isNaN(id)) return id;
      }
    }

    // 2. 从 URI 路径中解析（如 /square/workflow/123 或 /workflow/123）
    if (pagePreviewData?.uri) {
      const uri = pagePreviewData.uri;
      const workflowMatch = uri.match(/[/]workflow[/](\d+)/i);
      if (workflowMatch && workflowMatch[1]) {
        const id = Number(workflowMatch[1]);
        if (!isNaN(id)) return id;
      }
    }

    return null;
  }, [pagePreviewData?.params, pagePreviewData?.uri]);

  // 判断是否显示复制按钮（智能体允许复制即可显示，支持复制智能体或工作流模板）
  const showCopyButton = useMemo(() => {
    const shouldShow = effectiveAgent?.allowCopy === AllowCopyEnum.Yes;
    return shouldShow;
  }, [
    workflowId,
    effectiveAgent?.allowCopy,
    effectiveAgent?.agentId,
    pagePreviewData,
  ]);

  const values = Form.useWatch([], { form, preserve: true });

  useEffect(() => {
    // 监听form表单值变化
    if (values && Object.keys(values).length === 0) {
      return;
    }
    form
      .validateFields({ validateOnly: true })
      .then(() => setVariableParams(values))
      .catch(() => setVariableParams(null));
  }, [form, values]);

  // 用户在智能体主页填写的变量信息
  useEffect(() => {
    if (!!firstVariableParams) {
      setVariableParams(firstVariableParams);
    }
  }, [firstVariableParams]);

  // 导航拦截：追踪会话是否在本次会话中变为活跃状态
  // 使用 ref 追踪初始状态，避免在刷新时因历史消息状态触发拦截
  const wasConversationActiveOnMount = useRef<boolean | null>(null);
  const shouldBlockNavigation = useRef(false);

  // 在首次获取到 isConversationActive 值时记录
  useEffect(() => {
    if (wasConversationActiveOnMount.current === null) {
      wasConversationActiveOnMount.current = isConversationActive;
      // 如果初始就是 active，不阻止导航（可能是历史消息状态）
      shouldBlockNavigation.current = false;
    } else if (isConversationActive && !wasConversationActiveOnMount.current) {
      // 如果会话从非活跃变为活跃，说明是本次会话中发送的消息
      shouldBlockNavigation.current = true;
    } else if (!isConversationActive) {
      // 会话结束，重置状态
      shouldBlockNavigation.current = false;
      wasConversationActiveOnMount.current = false;
    }
  }, [isConversationActive]);

  useNavigationGuard({
    condition: () => shouldBlockNavigation.current,
    // 只有通用型智能体在会话活跃时才启用导航拦截，会话型智能体不需要
    enabled:
      isConversationActive && effectiveAgent?.type === AgentTypeEnum.TaskAgent,
    title: '任务执行中',
    message: '离开后，执行成功的任务会收到提示消息',
    discardText: '确定离开',
  });

  // 聊天会话框是否禁用，不能发送消息
  const wholeDisabled = useMemo(() => {
    // 变量参数为空，不发送消息
    if (requiredNameList?.length > 0) {
      // 未填写必填参数，禁用发送按钮
      if (!variableParams) {
        return true;
      }
      const isSameName = arraysContainSameItems(
        requiredNameList,
        Object.keys(variableParams),
      );
      return !isSameName;
    }
    return false;
  }, [requiredNameList, variableParams]);

  // 角色信息（名称、头像）
  const roleInfo: RoleInfo = useMemo(() => {
    const agent = conversationInfo?.agent;
    return {
      assistant: {
        name: agent?.name as string,
        avatar: agent?.icon as string,
      },
      system: {
        name: agent?.name as string,
        avatar: agent?.icon as string,
      },
    };
  }, [conversationInfo]);

  // 打开扩展页面
  const handleOpenPreview = (agent: any) => {
    // 判断是否默认展示页面首页
    if (agent && agent?.expandPageArea && agent?.pageHomeIndex) {
      // 自动触发预览
      showPagePreview({
        name: '页面预览',
        uri: process.env.BASE_URL + agent?.pageHomeIndex,
        params: {},
        executeId: '',
      });
    } else {
      showPagePreview(null);
    }
  };

  useEffect(() => {
    // 初始化智能体详情信息（优先使用状态中的详情，否则等待 conversationInfo.agent 快照）
    const targetAgent = defaultAgentDetail || conversationInfo?.agent;
    if (targetAgent) {
      setAgentDetail(targetAgent);
      handleOpenPreview(targetAgent);
    }
  }, [agentId, defaultAgentDetail, conversationInfo?.agent]);

  // 使用滚动检测 Hook
  useConversationScrollDetection(
    messageViewRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    setShowScrollBtn,
  );

  // 到顶自动加载更多的侦测 Hook (提前 10px 触发，防止用户觉得过早)
  const { ref: loadMoreRef, inView: loadMoreInView } = useIntersectionObserver({
    rootMargin: '10px 0px 0px 0px',
    threshold: 0,
  });

  // 监听进入视口事件，自动触发加载更多
  // 使用 useRef 记录上一次的 inView 状态，严格保证只有在【刚进入视口】的那一瞬间才触发请求
  // 避免消息列表刚加载完时，由于 IntersectionObserver 的异步性导致 inView 还没变 false 就被 React 重渲染再次触发
  const prevLoadMoreInViewRef = useRef(false);
  useEffect(() => {
    const isEntering = loadMoreInView && !prevLoadMoreInViewRef.current;
    prevLoadMoreInViewRef.current = loadMoreInView;

    if (
      isEntering &&
      isMoreMessage &&
      !loadingMore &&
      messageList?.length > 0 &&
      id
    ) {
      handleLoadMoreMessage(id);
    }
  }, [
    loadMoreInView,
    isMoreMessage,
    loadingMore,
    messageList?.length,
    id,
    handleLoadMoreMessage,
  ]);

  // 异步查询会话加载状态
  const [loadingAsync, setLoadingAsync] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      setIsLoadingConversation(false);
      // 切换会话时，重置自动滚动标志，确保新会话能够自动滚动到底部
      allowAutoScrollRef.current = true;

      const asyncFun = async () => {
        // 同步查询会话, 此处必须先同步查询会话信息，因为成功后会设置消息列表，如果是异步查询，会导致发送消息时，清空消息列表的bug
        // const { data } = await runAsync(id);
        let data = null;
        try {
          setLoadingAsync(true);
          const { data: _data } = await runAsync(id);
          data = _data;
        } finally {
          setLoadingAsync(false);
        }
        // 会话消息列表
        const list = data?.messageList || [];
        // 自动预览文件
        handleAutoPreviewLastFile(list, id);

        const len = list?.length || 0;
        // 会话消息列表为空或者只有一条消息并且此消息时开场白时，可以发送消息
        const isCanMessage =
          !len ||
          (len === 1 && list[0].messageType === MessageTypeEnum.ASSISTANT);
        // 如果message或者附件不为空,可以发送消息，但刷新页面时，不重新发送消息
        if (isCanMessage && (message || files?.length > 0)) {
          const effectiveSandboxId = getEffectiveSandboxId(data);

          onMessageSend(
            id,
            message,
            files,
            infos,
            firstVariableParams,
            effectiveSandboxId,
            false,
            true,
            data,
          );
        }
      };
      asyncFun();

      // 获取当前智能体的历史记录
      runHistoryItem({
        agentId,
        limit: 20,
      });
    }
  }, [id, message, files, infos, firstVariableParams]);

  useEffect(() => {
    addBaseTarget();
  }, []);

  useEffect(() => {
    if (messageSourceType === 'new_chat') {
      // 新建会话时，初始化选中的组件列表
      initSelectedComponentList(manualComponents);
    } else {
      // 非新建会话时，使用外面传过来的组件列表
      setSelectedComponentList(infos || []);
    }
  }, [infos, messageSourceType, manualComponents]);

  // 监听会话更新事件，更新会话记录
  const handleConversationUpdate = (data: {
    conversationId: string;
    message: MessageInfo;
  }) => {
    const { conversationId, message } = data;
    if (Number(id) === Number(conversationId)) {
      setMessageList((list: MessageInfo[]) => [...list, message]);
      // 当用户手动滚动时，暂停自动滚动
      if (allowAutoScrollRef.current) {
        // 滚动到底部
        messageViewScrollToBottom();
      }
    }
  };

  // 监听会话状态更新事件
  const listenConversationStatusUpdate = (data: { conversationId: string }) => {
    const { conversationId } = data;
    // 如果会话ID和当前会话ID相同，并且会话状态为已完成，则显示成功提示
    if (conversationId === conversationInfo?.id?.toString()) {
      // 重新查询会话信息
      runAsync(id);
      // 重新查询会话记录
      runHistory({
        agentId: null,
        limit: 20,
      });

      // 取消监听会话状态更新事件
      eventBus.off(EVENT_TYPE.ChatFinished, listenConversationStatusUpdate);
    }
  };

  useEffect(() => {
    if (conversationInfo?.taskStatus === TaskStatus.EXECUTING) {
      // 监听会话状态更新事件
      eventBus.on(EVENT_TYPE.ChatFinished, listenConversationStatusUpdate);
    }

    return () => {
      eventBus.off(EVENT_TYPE.ChatFinished, listenConversationStatusUpdate);
    };
  }, [conversationInfo?.taskStatus]);

  useEffect(() => {
    // 切换会话时立即隐藏预览，防止旧数据重新打开导致闪烁
    hidePagePreview();

    // 重置 clearLoading：此时 cleanup 已执行 resetInit() 清空了 conversationInfo，
    // conversationInfo 会无缝接管加载显示，不会出现 AgentChatEmpty 闪现
    setClearLoading(false);

    // 监听新消息事件
    eventBus.on(EVENT_TYPE.RefreshChatMessage, handleConversationUpdate);
    // 订阅文件列表刷新事件
    eventBus.on(EVENT_TYPE.RefreshFileList, () => handleRefreshFileList(id));

    return () => {
      eventBus.off(EVENT_TYPE.RefreshChatMessage, handleConversationUpdate);
      // 组件卸载时取消订阅
      eventBus.off(EVENT_TYPE.RefreshFileList, () => handleRefreshFileList(id));

      // 组件卸载时重置全局会话状态，防止污染其他页面
      resetInit();
      setSelectedComponentList([]);
      hidePagePreview(); // 组件卸载时主动隐藏预览，避免用户下一次进入时预览还在！
    };
  }, [id]);

  // 清空会话记录并创建新会话
  const handleClear = async () => {
    setClearLoading(true);
    handleClearSideEffect();
    setIsMoreMessage(false);
    setMessageList([]);
    clearFilePanelInfo();
    form.resetFields();
    setVariableParams(null);
    setSelectedComputerId(''); // 显式重置选中电脑ID
    setIsSelectionLocked(false); // 显式解除锁定
    setHasUserSentMessage(false); // 重置发送状态
    setIsLoadingOtherInterface(true);

    try {
      const res = await apiAgentConversationCreate({
        agentId,
        devMode: false,
      });

      if (res.code === SUCCESS_CODE && res.data) {
        // 注意：这里不重置 clearLoading，让它在 useEffect([id]) 中重置
        // 避免 setClearLoading(false) 与 history.replace 之间的渲染间隙导致 AgentChatEmpty 闪现
        setIsLoadingOtherInterface(false);
        const { id: newConversationId, agentId: newAgentId } = res.data;

        let url = `/home/chat/${newConversationId}/${newAgentId}`;
        if (effectiveAgent?.type === AgentTypeEnum.TaskAgent) {
          url += '?hideMenu=true';
        }
        history.replace(url, {
          message: '',
          files: [],
          infos,
          // defaultAgentDetail: effectiveAgent || defaultAgentDetail,
          firstVariableParams: null,
          selectedComputerId: null, // 显式清除 location.state 中的 selectedComputerId
        });
      } else {
        throw new Error(res.message || '创建会话失败');
      }
    } catch (error: any) {
      message.error(error.message || '清空并创建会话失败');
      setClearLoading(false);
      setIsLoadingOtherInterface(false);
    }
  };

  // 消息发送
  const handleMessageSend = (
    messageInfo: string,
    files: UploadFileInfo[] = [],
  ) => {
    // 变量参数为空，不发送消息
    if (wholeDisabled) {
      form.validateFields(); // 触发表单验证以显示error
      // message.warning('请填写必填参数'); // This line was removed as per the edit hint
      return;
    }

    // 标记用户已发送消息
    setHasUserSentMessage(true);

    isSendMessageRef.current = true;
    const effectiveSandboxId = getEffectiveSandboxId();

    onMessageSend(
      id,
      messageInfo,
      files,
      selectedComponentList,
      variableParams,
      effectiveSandboxId,
    );
  };

  // 修改 handleScrollBottom 函数，添加自动滚动控制
  const onScrollBottom = () => {
    allowAutoScrollRef.current = true;
    // 滚动到底部
    messageViewScrollToBottom();
    setShowScrollBtn(false);
  };

  // 计算最终选中的沙盒ID
  const finalSelectedId = useMemo(() => {
    return getEffectiveSandboxId();
  }, [getEffectiveSandboxId]);

  // 互斥面板控制器：管理 PagePreview、AgentSidebar、ShowArea 的互斥展示
  useExclusivePanels({
    pagePreviewData,
    hidePagePreview,
    isSidebarVisible,
    sidebarRef,
    showType,
    setShowType,
  });

  // 消息事件代理（处理会话输出中的点击事件）
  useMessageEventDelegate({
    containerRef: messageViewRef,
    eventBindConfig: conversationInfo?.agent?.eventBindConfig,
  });

  /**
   * 切换文件树「预览」视图
   *
   * 需求：
   * 1. 当 isFileTreeVisible 为 false 时：
   *    - 点击「预览」按钮，打开文件树并展示预览视图。
   * 2. 当 isFileTreeVisible 为 true 时：
   *    - 当前为 preview 时，再次点击「预览」按钮，关闭文件树视图。
   *    - 当前为 desktop 时，点击「预览」按钮，保持文件树显示，仅切换到预览视图。
   */
  const handleFileTreeVisible = () => {
    if (!isFileTreeVisible) {
      // 文件树当前未显示：关闭 AgentSidebar，打开预览视图
      sidebarRef.current?.close();
      openPreviewView(id);
      return;
    }

    // 文件树已显示
    if (viewMode === 'preview') {
      // 当前就是预览视图：再次点击关闭视图
      closePreviewView();
    } else {
      // 当前是其他模式（例如 desktop）：切换为预览视图但保持文件树显示
      openPreviewView(id);
    }
  };

  /**
   * 切换「智能体电脑」视图∂∂∂∂
   *
   * 需求：
   * 1. 当 isFileTreeVisible 为 false 时：
   *    - 点击「智能体电脑」按钮，打开文件树并展示 desktop 视图。
   * 2. 当 isFileTreeVisible 为 true 时：
   *    - 当前为 desktop 时，再次点击按钮，关闭视图。
   *    - 当前为 preview 时，点击按钮，保持文件树显示，仅切换到 desktop 视图。
   */
  const handleOpenDesktopView = () => {
    if (!isFileTreeVisible) {
      // 文件树当前未显示：关闭 AgentSidebar，打开智能体电脑视图
      sidebarRef.current?.close();
      openDesktopView(id);
      return;
    }

    // 文件树已显示
    if (viewMode === 'desktop') {
      // 当前就是智能体电脑视图：再次点击关闭视图
      closePreviewView();
    } else {
      // 当前是其他模式（例如 preview）：切换为智能体电脑视图但保持文件树显示
      openDesktopView(id);
    }
  };

  // 新建文件（空内容）、文件夹
  const handleCreateFileNode = async (
    fileNode: FileNode,
    newName: string,
  ): Promise<boolean> => {
    if (!id) {
      messageAntd.error('会话ID不存在，无法新建文件');
      return false;
    }

    const trimmedName = newName.trim();
    if (!trimmedName) {
      return false;
    }

    // 计算新文件的完整路径：父路径 + 新文件名
    const parentPath = fileNode.parentPath || '';
    const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;

    const newFile: VncDesktopUpdateFileInfo = {
      name: newPath,
      binary: false,
      // 文件大小是否超过限制
      sizeExceeded: false,
      // 文件内容
      contents: '',
      // 重命名之前的文件名
      renameFrom: '',
      // 操作类型
      operation: 'create',
      // 是否为目录
      isDir: fileNode.type === 'folder',
    };

    const updatedFilesList: VncDesktopUpdateFileInfo[] = [newFile];

    const newSkillInfo: IUpdateStaticFileParams = {
      cId: id,
      files: updatedFilesList,
    };

    const { code } = await apiUpdateStaticFile(newSkillInfo);
    if (code === SUCCESS_CODE && id) {
      // 新建成功后，重新查询文件树列表，因为更新了文件名或文件夹名称，需要刷新文件树
      await handleRefreshFileList(id);
    }

    return code === SUCCESS_CODE;
  };

  // 删除文件
  const handleDeleteFile = async (fileNode: FileNode): Promise<boolean> => {
    return new Promise((resolve) => {
      modalConfirm(
        '你确定要删除此文件吗?',
        fileNode.name,
        async () => {
          try {
            // 更新文件列表
            let updatedFilesList: VncDesktopUpdateFileInfo[] = [];
            if (fileNode.type === 'folder') {
              updatedFilesList = [
                {
                  contents: '',
                  name: fileNode.id,
                  operation: 'delete', // 操作类型
                  isDir: true,
                },
              ];
            } else {
              // 找到要删除的文件
              const currentFile = fileTreeData?.find(
                (item: StaticFileInfo) => item.fileId === fileNode.id,
              );
              if (!currentFile) {
                messageAntd.error('文件不存在，无法删除');
                resolve(false);
                return;
              }

              // 更新文件操作
              currentFile.operation = 'delete';
              // 删除时，设置文件内容为空，避免上传内容导致删除文件时长太久
              currentFile.contents = '';
              // 更新文件列表
              updatedFilesList = [currentFile] as VncDesktopUpdateFileInfo[];
            }

            // 更新技能信息
            const newSkillInfo: IUpdateStaticFileParams = {
              cId: id,
              files: updatedFilesList,
            };
            const { code } = await apiUpdateStaticFile(newSkillInfo);
            if (code === SUCCESS_CODE) {
              // 重新查询文件树列表，因为更新了文件名或文件夹名称，需要刷新文件树
              handleRefreshFileList(id);
              messageAntd.success('删除成功');
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (error) {
            console.error('删除文件失败:', error);
            resolve(false);
          }
        },
        () => {
          // 用户取消删除
          resolve(false);
        },
      );
    });
  };

  // 确认重命名文件
  const handleConfirmRenameFile = async (
    fileNode: FileNode,
    newName: string,
  ) => {
    // 更新原始文件列表中的文件名（用于提交更新）
    const updatedFilesList = updateFilesListName(
      fileTreeData || [],
      fileNode,
      newName,
    );

    // 更新技能信息，用于提交更新
    const newSkillInfo: IUpdateStaticFileParams = {
      cId: id,
      files: updatedFilesList as VncDesktopUpdateFileInfo[],
    };

    // 使用文件全量更新逻辑
    const { code } = await apiUpdateStaticFile(newSkillInfo);
    if (code === SUCCESS_CODE) {
      // 重新查询文件树列表，因为更新了文件名或文件夹名称，需要刷新文件树
      await handleRefreshFileList(id);
    }
    return code === SUCCESS_CODE;
  };

  // 保存文件
  const handleSaveFiles = async (
    data: {
      fileId: string;
      fileContent: string;
      originalFileContent: string;
    }[],
  ) => {
    // 更新文件列表(只更新修改过的文件)
    const updatedFilesList = updateFilesListContent(
      fileTreeData || [],
      data,
      'modify',
    );

    // 更新技能信息，用于提交更新
    const newSkillInfo: IUpdateStaticFileParams = {
      cId: id,
      files: updatedFilesList as VncDesktopUpdateFileInfo[],
    };

    // 使用文件全量更新逻辑
    const { code } = await apiUpdateStaticFile(newSkillInfo);
    return code === SUCCESS_CODE;
  };

  /**
   * 处理上传多个文件回调
   * @param files 文件列表
   * @param filePaths 文件路径列表
   * @returns Promise<void>
   */
  const handleUploadMultipleFiles = async (
    files: File[],
    filePaths: string[],
  ) => {
    if (!id) {
      messageAntd.error('会话ID不存在，无法上传文件');
      return;
    }

    try {
      // 直接调用上传接口，使用文件名作为路径
      const { code } = await apiUploadFiles({
        files,
        cId: id,
        filePaths,
      });

      if (code === SUCCESS_CODE) {
        messageAntd.success('上传成功');
        // 刷新项目详情
        await handleRefreshFileList(id);
      }
    } catch (error) {
      console.error('上传失败', error);
    }
  };

  // 导出项目
  const handleExportProject = async () => {
    // 检查项目ID是否有效
    if (!id) {
      messageAntd.warning('会话ID不存在或无效，无法导出');
      return;
    }

    try {
      const result = await apiDownloadAllFiles(id);
      // 判断是否成功
      if (!result.success) {
        // 导出失败，显示错误信息
        const errorMessage = result.error?.message || '导出失败';
        messageAntd.warning(errorMessage);
        return;
      }

      const filename = `chat-${id}.zip`;
      // 导出整个项目压缩包
      exportWholeProjectZip(result, filename);
      messageAntd.success('导出成功！');
    } catch (error) {
      console.error('导出项目失败:', error);
    }
  };

  // 左侧内容
  const LeftContent = () => {
    return (
      <div className={cx('flex-1', 'flex', 'flex-col', styles['main-content'])}>
        {/* 页面顶部: 标题区域 */}
        <header className={cx(styles['title-box'])}>
          <div className={cx(styles['title-container'])}>
            <DropdownChangeName
              conversationInfo={conversationInfo}
              setConversationInfo={(value) => {
                setConversationInfo(value);
              }}
            />
            <div className={cx('flex', 'items-center', 'gap-4')}>
              {/* 这里放可以展开 AgentSidebar 的控制按钮 在AgentSidebar 展示的时候隐藏 反之显示 */}
              {/* 当文件树显示时，也显示这个按钮，用于关闭文件树并打开 AgentSidebar */}
              {!isSidebarVisible && !isMobile && (
                <TooltipIcon
                  title="查看智能体详情"
                  className={cx(styles['icon-box'])}
                  icon={
                    <SvgIcon
                      name="icons-nav-sidebar"
                      style={{ fontSize: 16 }}
                    />
                  }
                  onClick={() => {
                    hidePagePreview();
                    // 先关闭文件树
                    closePreviewView();
                    // 然后打开 AgentSidebar
                    // 使用 setTimeout 确保状态更新完成后再打开，避免状态冲突
                    setTimeout(() => {
                      sidebarRef.current?.open();
                    }, 100);
                  }}
                />
              )}

              {/*打开预览页面*/}
              {!!effectiveAgent?.expandPageArea &&
                !!effectiveAgent?.pageHomeIndex &&
                !pagePreviewData && (
                  <TooltipIcon
                    title="打开预览页面"
                    className={cx(styles['icon-box'])}
                    icon={
                      <SvgIcon
                        name="icons-nav-ecosystem"
                        style={{ fontSize: 16 }}
                      />
                    }
                    onClick={() => {
                      sidebarRef.current?.close();
                      closePreviewView(); // 关闭文件树
                      handleOpenPreview(effectiveAgent);
                    }}
                  />
                )}

              {/* 通用智能体, 有有效消息时，文件预览/智能体电脑切换按钮 */}
              {isShowFilePanel && (
                <>
                  {/* 文件预览视图 */}
                  <TooltipIcon
                    title={
                      isFileTreeVisible && viewMode === 'preview'
                        ? '关闭文件预览'
                        : '打开文件预览'
                    }
                    className={cx(styles['icon-box'], {
                      [styles['active']]:
                        isFileTreeVisible && viewMode === 'preview',
                    })}
                    icon={
                      <SvgIcon
                        name="icons-common-file_preview"
                        style={{ fontSize: 16 }}
                      />
                    }
                    onClick={handleFileTreeVisible}
                  />

                  {/* 智能体电脑视图 */}
                  <ConditionRender
                    condition={
                      conversationInfo?.agent.hideDesktop === HideDesktopEnum.No
                    }
                  >
                    <TooltipIcon
                      title={
                        isFileTreeVisible && viewMode === 'desktop'
                          ? '关闭智能体电脑'
                          : '打开智能体电脑'
                      }
                      className={cx(styles['icon-box'], {
                        [styles['active']]:
                          isFileTreeVisible && viewMode === 'desktop',
                      })}
                      icon={
                        <SvgIcon
                          name="icons-nav-computer-star"
                          style={{ fontSize: 16 }}
                        />
                      }
                      onClick={handleOpenDesktopView}
                    />
                  </ConditionRender>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 页面主体: 内容区域 */}
        <div className={cx(styles['main-content-box'])}>
          {/* 聊天内容区域 */}
          <div
            className={cx(styles['chat-section'], {
              [styles['file-tree-visible']]: isFileTreeVisible,
            })}
          >
            <div
              className={cx(styles['chat-wrapper-content'])}
              ref={messageViewRef}
            >
              <div className={cx(styles['chat-wrapper'], 'flex-1')}>
                {/* 新对话设置 */}
                <NewConversationSet
                  className="mb-16"
                  form={form}
                  variables={variables}
                  userFillVariables={firstVariableParams}
                  // 是否已填写表单
                  isFilled={!!variableParams}
                  disabled={!!firstVariableParams || isSendMessageRef.current}
                />
                {/* 自动加载更多的触发探测元素 */}
                {isMoreMessage &&
                  (messageList?.length || 0) >= MESSAGE_PAGE_SIZE && (
                    <div
                      ref={loadMoreRef}
                      className={cx(styles['load-more-container'])}
                    >
                      {loadingMore ? (
                        <span>
                          <LoadingOutlined style={{ marginRight: 8 }} />
                          正在加载历史会话
                        </span>
                      ) : null}
                    </div>
                  )}
                {messageList?.length > 0 ? (
                  <>
                    {messageList?.map((item: MessageInfo) => (
                      <ChatView
                        // 后端接口返回的消息列表id存在相同的情况，所以需要使用id和index来唯一标识
                        key={`${item.id}-${item?.index}`}
                        messageInfo={item}
                        roleInfo={roleInfo}
                        contentClassName={styles['chat-inner']}
                        mode={'home'}
                        conversationId={id}
                        showStatusDesc={
                          effectiveAgent?.type !== AgentTypeEnum.TaskAgent
                        }
                      />
                    ))}
                    {/*会话建议*/}
                    <RecommendList
                      itemClassName={styles['suggest-item']}
                      loading={loadingSuggest}
                      chatSuggestList={chatSuggestList}
                      onClick={handleMessageSend}
                    />
                    {/* 任务执行中容器 */}
                    {conversationInfo?.taskStatus === TaskStatus.EXECUTING && (
                      <div
                        className={cx(
                          styles['task-executing-container'],
                          'flex',
                          'items-center',
                        )}
                      >
                        <LoadingOutlined />
                        <span>智能体正在执行，请稍等</span>
                      </div>
                    )}
                  </>
                ) : !message ? (
                  // Chat记录为空
                  <AgentChatEmpty
                    className={cx({ 'h-full': !variables?.length })}
                    icon={effectiveAgent?.icon}
                    name={effectiveAgent?.name || ''}
                    extra={
                      <RecommendList
                        className="mt-16"
                        itemClassName={cx(styles['suggest-item'])}
                        chatSuggestList={chatSuggestList}
                        onClick={handleMessageSend}
                      />
                    }
                  />
                ) : null}
              </div>
            </div>

            {/* 会话状态显示 - 有消息时就显示 */}
            {messageList?.length > 0 &&
              conversationInfo &&
              effectiveAgent?.type === AgentTypeEnum.TaskAgent && (
                <ConversationStatus
                  messageList={messageList}
                  className={cx(styles['conversation-status-bar'])}
                />
              )}

            {/* 聊天输入框 */}
            <ChatInputHome
              key={`agent-details-${agentId}`}
              className={cx(styles['chat-input-container'])}
              onEnter={handleMessageSend}
              visible={showScrollBtn}
              wholeDisabled={wholeDisabled}
              clearLoading={clearLoading}
              onClear={handleClear}
              manualComponents={manualComponents}
              selectedComponentList={selectedComponentList}
              onSelectComponent={handleSelectComponent}
              onScrollBottom={onScrollBottom}
              showAnnouncement={true}
              isTaskAgentActive={
                effectiveAgent?.type === AgentTypeEnum.TaskAgent
              }
              selectedComputerId={finalSelectedId}
              onComputerSelect={setSelectedComputerId}
              agentId={agentId}
              agentSandboxId={
                conversationInfo?.agent?.sandboxId ||
                finalSelectedId ||
                selectedComputerId ||
                conversationInfo?.sandboxServerId
              }
              // 计算蒙层可见性与文案
              hasPermission={effectiveAgent?.hasPermission}
              maskText="您无该智能体权限"
              fixedSelection={
                !!conversationInfo?.agent?.sandboxId ||
                !!conversationInfo?.sandboxServerId ||
                isSelectionLocked ||
                hasUserSentMessage
              }
              isPersonalComputer={!!conversationInfo?.agent?.sandboxId}
            />
          </div>

          {/* 通用型(TaskAgent)智能体专用文件树区域 */}
          {effectiveAgent?.type === AgentTypeEnum.TaskAgent &&
            isFileTreeVisible && (
              <div
                className={cx(
                  styles['file-tree-sidebar'],
                  'flex',
                  'w-full',
                  'overflow-hide',
                )}
              >
                <FileTreeView
                  className={cx(styles['file-tree-container'])}
                  taskAgentSelectedFileId={taskAgentSelectedFileId}
                  taskAgentSelectTrigger={taskAgentSelectTrigger}
                  originalFiles={fileTreeData}
                  fileTreeDataLoading={fileTreeDataLoading}
                  targetId={id?.toString() || ''}
                  viewMode={viewMode}
                  readOnly={false}
                  // 导出项目
                  onExportProject={handleExportProject}
                  // 上传文件
                  onUploadFiles={handleUploadMultipleFiles}
                  // 重命名文件
                  onRenameFile={handleConfirmRenameFile}
                  // 新建文件、文件夹
                  onCreateFileNode={handleCreateFileNode}
                  // 删除文件
                  onDeleteFile={handleDeleteFile}
                  // 保存文件
                  onSaveFiles={handleSaveFiles}
                  // 用户选择的智能体电脑ID
                  agentSandboxId={finalSelectedId}
                  // 用户选择的智能体电脑名称
                  agentSandboxName={''}
                  // 重启容器
                  onRestartServer={() => restartVncPod(id)}
                  // 重启智能体
                  onRestartAgent={() => restartAgent(id)}
                  // 关闭整个面板
                  onClose={closePreviewView}
                  // 文件树是否固定（用户点击后固定）
                  isFileTreePinned={isFileTreePinned}
                  // 文件树固定状态变化回调
                  onFileTreePinnedChange={setIsFileTreePinned}
                  isCanDeleteSkillFile={true}
                  // 刷新文件树回调
                  onRefreshFileTree={() => handleRefreshFileList(id)}
                  // VNC 空闲检测配置（仅通用型智能体启用）
                  idleDetection={{
                    enabled: effectiveAgent?.type === AgentTypeEnum.TaskAgent,
                    onIdleTimeout: () => openPreviewView(id),
                  }}
                  // 是否隐藏远程桌面
                  hideDesktop={effectiveAgent?.hideDesktop}
                  // 是否动态主题
                  isDynamicTheme={true}
                  // 静态资源文件基础路径
                  staticFileBasePath={`/api/computer/static/${id}`}
                />
              </div>
            )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    // 设置最小宽度-扩展页面/文件树
    if (pagePreviewData || isFileTreeVisible) {
      document.documentElement.style.minWidth = '1660px';
    } else {
      // 设置最小宽度-调试详情
      if (isSidebarVisible) {
        document.documentElement.style.minWidth = '1540px';
      } else {
        document.documentElement.style.minWidth = '1200px';
      }
    }
    return () => {
      document.documentElement.style.minWidth = '1200px';
    };
  }, [pagePreviewData, isFileTreeVisible, isSidebarVisible]);

  return clearLoading ||
    loadingConversation ||
    loadingAsync ||
    !conversationInfo ? (
    <div
      className={cx(
        'flex',
        'items-center',
        'content-center',
        'flex-1',
        'h-full',
        'w-full',
      )}
    >
      <LoadingOutlined />
    </div>
  ) : (
    <div className={cx('flex', 'h-full')}>
      {/* 智能体聊天和预览页面 */}
      <div
        style={{
          flex: pagePreviewData || isFileTreeVisible ? '9 1' : '4 1',
          minWidth: pagePreviewData || isFileTreeVisible ? '900px' : '430px',
        }}
      >
        <ResizableSplit
          resetTrigger={
            pagePreviewData || isFileTreeVisible ? 'visible' : 'hidden'
          }
          minLeftWidth={430}
          defaultLeftWidth={
            effectiveAgent?.type === AgentTypeEnum.TaskAgent ? 33 : 50
          }
          // 当文件树显示时，左侧占满flex-1, 文件树占flex-2
          left={effectiveAgent?.hideChatArea ? null : LeftContent()}
          right={
            effectiveAgent?.type !== AgentTypeEnum.TaskAgent
              ? // 会话型
                pagePreviewData && (
                  <>
                    <PagePreviewIframe
                      pagePreviewData={pagePreviewData}
                      showHeader={true}
                      onClose={hidePagePreview}
                      showCloseButton={!effectiveAgent?.hideChatArea}
                      titleClassName={cx(styles['title-style'])}
                      // 复制模板按钮相关 props
                      showCopyButton={showCopyButton}
                      allowCopy={
                        effectiveAgent?.allowCopy === AllowCopyEnum.Yes
                      }
                      onCopyClick={() => setOpenCopyModal(true)}
                      copyButtonText="复制模板"
                      copyButtonClassName={styles['copy-btn']}
                    />
                    {/* 复制模板弹窗 */}
                    {showCopyButton &&
                      effectiveAgent &&
                      pagePreviewData?.uri && (
                        <CopyToSpaceComponent
                          spaceId={effectiveAgent!.spaceId}
                          mode={AgentComponentTypeEnum.Page}
                          componentId={parsePageAppProjectId(
                            pagePreviewData?.uri,
                          )}
                          title={''}
                          open={openCopyModal}
                          isTemplate={true}
                          onSuccess={(_: any, targetSpaceId: number) => {
                            setOpenCopyModal(false);
                            // 跳转
                            jumpToPageDevelop(targetSpaceId);
                          }}
                          onCancel={() => setOpenCopyModal(false)}
                        />
                      )}
                  </>
                )
              : null
          }
        />
      </div>
      {/* AgentSidebar - 只在文件树隐藏时显示 */}
      {!isFileTreeVisible && (
        <AgentSidebar
          ref={sidebarRef}
          className={cx(
            styles[isSidebarVisible ? 'agent-sidebar-w' : 'agent-sidebar'],
          )}
          agentId={agentId}
          loading={loadingConversation}
          agentDetail={effectiveAgent}
          onToggleCollectSuccess={handleToggleCollectSuccess}
          onVisibleChange={setIsSidebarVisible}
        />
      )}
      {/*展示台区域*/}
      <ShowArea />
    </div>
  );
};

export default Chat;
