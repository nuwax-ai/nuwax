import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import RecommendList from '@/components/RecommendList';
import { MESSAGE_PAGE_SIZE } from '@/constants/common.constants';
import { EVENT_TYPE } from '@/constants/event.constants';
import useConversation from '@/hooks/useConversation';
import { useConversationScrollDetection } from '@/hooks/useConversationScrollDetection';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import useMessageEventDelegate from '@/hooks/useMessageEventDelegate';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import ConversationStatus from '@/pages/Chat/components/ConversationStatus';
import { dict } from '@/services/i18nRuntime';
import { ExpandPageAreaEnum, TaskStatus } from '@/types/enums/agent';
import { AgentTypeEnum, EditAgentShowType } from '@/types/enums/space';
import { AgentConfigInfo } from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import {
  MessageInfo,
  RoleInfo,
  SendMessageParams,
} from '@/types/interfaces/conversationInfo';
import eventBus from '@/utils/eventBus';
import { LoadingOutlined } from '@ant-design/icons';
import { message } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModel } from 'umi';
import ConversationAgentHeader from '../ConversationAgentHeader';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * Props 类型定义
 */
export interface AgentConversationChatPanelProps {
  /** 当前智能体 ID */
  agentId: number;
  /** 智能体完整配置信息（包含名称、图标、类型、开发会话 ID 等） */
  agentConfigInfo?: AgentConfigInfo;
  /** 自定义容器类名 */
  className?: string;
  /** 设置智能体配置信息的方法（新建会话时用于同步 devConversationId） */
  onAgentConfigInfo: (info: AgentConfigInfo) => void;
  /** 沙箱电脑 ID 变更回调（通知父组件更新终端连接地址） */
  onChangeSelectedComputerId?: (id: string) => void;
  /** 打开编辑智能体基础信息弹窗 */
  onEditAgent?: () => void;
  /** 文件树侧边栏是否可见（由父组件 ConversationAgent 管理） */
  isFileTreeSidebarVisible?: boolean;
  /** 切换文件树侧边栏显隐 */
  onToggleFileTreeSidebar?: () => void;
}

/**
 * AgentConversationChatPanel — 智能体对话面板
 *
 * ## 组件职责
 * 封装完整的聊天交互体验，包括：
 * 1. 消息列表展示（流式消息、历史消息、加载状态）
 * 2. 聊天输入与发送（含文件上传、沙箱选择）
 * 3. 会话管理（新建会话、加载历史会话、滚动加载更多消息）
 * 4. 实时消息订阅（通过 EventBus 监听 RefreshChatMessage/ChatFinished 事件）
 * 5. 文件预览面板切换（Header 按钮触发）
 *
 * ## 布局结构
 * ┌──────────────────────────────────┐
 * │  ConversationAgentHeader          │  ← 顶部导航（编辑/文件树/面板切换）
 * ├──────────────────────────────────┤
 * │                                  │
 * │  ChatView (消息列表)              │  ← 滚动容器，支持无限加载
 * │    - 加载更多指示器               │
 * │    - 消息列表                     │
 * │    - 推荐问题列表                 │
 * │    - 任务执行中提示               │
 * │                                  │
 * ├──────────────────────────────────┤
 * │  ConversationStatus (状态栏)      │  ← 仅 TaskAgent 类型显示
 * ├──────────────────────────────────┤
 * │  ChatInputHome (输入框)           │  ← 底部输入区域
 * └──────────────────────────────────┘
 *
 * ## 数据流
 * - agentConfigInfo.devConversationId → 查询会话消息 → messageList
 * - 用户输入 → handleMessageSend → onMessageSend (model) → SSE 流式响应
 * - EventBus RefreshChatMessage → handleConversationUpdate → 追加新消息
 * - EventBus ChatFinished → 重新查询会话（更新任务状态）
 *
 * ## 来源
 * 从 EditAgent PreviewAndDebug / Chat 页面提取的公共组件，供 ConversationAgent 等页面复用
 */
const AgentConversationChatPanel: React.FC<AgentConversationChatPanelProps> = ({
  className,
  agentId,
  agentConfigInfo,
  onAgentConfigInfo,
  onChangeSelectedComputerId,
  onEditAgent,
  isFileTreeSidebarVisible,
  onToggleFileTreeSidebar,
}) => {
  // ==================== Refs ====================
  /**
   * 开发会话 ID 引用（ref 而非 state，避免闭包捕获旧值）
   * 在事件回调（handleConversationUpdate、handleClear 等）中使用，
   * 确保始终能拿到最新的 devConversationId
   */
  const devConversationIdRef = useRef<number>(0);

  // ==================== 本地状态 ====================
  /** 当前选中的沙箱电脑 ID（用户手动选择时更新，传递给终端和文件预览） */
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');
  /** 用户是否已发送过消息（用于控制沙箱选择器的固定状态，防止发送后切换） */
  const [hasUserSentMessage, setHasUserSentMessage] = useState<boolean>(false);
  /** 鼠标是否悬停在聊天区域（控制滚动到底部按钮的显隐） */
  const [isHoveringChat, setIsHoveringChat] = useState<boolean>(false);

  // ==================== 全局状态模型 ====================
  /**
   * conversationAgent model：聊天核心状态管理
   *
   * 消息相关：messageList、setMessageList、chatSuggestList、onMessageSend
   * 会话相关：conversationInfo、runQueryConversation、loadingConversation
   * 滚动控制：messageViewRef、messageViewScrollToBottom、allowAutoScrollRef、scrollTimeoutRef、showScrollBtn
   * 文件预览：openPreviewView、closePreviewView、isFileTreeVisible
   * 分页加载：isMoreMessage、loadingMore、handleLoadMoreMessage
   */
  const {
    conversationInfo,
    messageList,
    setMessageList,
    chatSuggestList,
    loadingConversation,
    runQueryConversation,
    isLoadingConversation,
    setIsLoadingConversation,
    loadingSuggest,
    onMessageSend,
    messageViewRef,
    messageViewScrollToBottom,
    allowAutoScrollRef,
    scrollTimeoutRef,
    handleClearSideEffect,
    showScrollBtn,
    setShowScrollBtn,
    manualComponents,
    showType,
    setShowType,
    resetInit,
    setFinalResult,
    setIsLoadingOtherInterface,
    clearFilePanelInfo,
    openPreviewView,
    closePreviewView,
    isFileTreeVisible,
    isMoreMessage,
    setIsMoreMessage,
    loadingMore,
    handleLoadMoreMessage,
  } = useModel('conversationAgent');

  /**
   * chat model：页面级预览数据
   * - pagePreviewData：当前预览页面数据
   * - hidePagePreview / showPagePreview：控制页面预览显隐
   */
  const { pagePreviewData, hidePagePreview, showPagePreview } =
    useModel('chat');

  // ==================== Hooks ====================
  /** 会话创建 Hook（新建会话时调用） */
  const { runAsyncConversationCreate } = useConversation();
  /**
   * 已选组件管理 Hook
   * - selectedComponentList：当前已选中的工具/组件列表（发送消息时附带）
   * - handleSelectComponent：选择/取消选择组件
   * - initSelectedComponentList：从 manualComponents 初始化选中列表
   */
  const {
    selectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  // ==================== 副作用 (Effects) ====================

  /**
   * 角色信息（assistant / system 的名称和头像）
   * 从 agentConfigInfo 中提取，传递给 ChatView 用于消息气泡的显示
   */
  const roleInfo: RoleInfo = useMemo(() => {
    return {
      assistant: {
        name: agentConfigInfo?.name as string,
        avatar: agentConfigInfo?.icon as string,
      },
      system: {
        name: agentConfigInfo?.name as string,
        avatar: agentConfigInfo?.icon as string,
      },
    };
  }, [agentConfigInfo]);

  /**
   * 滚动检测 Hook
   * 检测用户是否手动滚动离开底部，用于控制"滚动到底部"按钮的显隐
   * 以及是否自动滚动到最新消息
   */
  useConversationScrollDetection(
    messageViewRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    setShowScrollBtn,
  );

  /**
   * 加载更多消息的交叉观察器
   * 当加载更多指示器进入视口时，自动触发历史消息加载
   * rootMargin: '10px 0px 0px 0px' 提前 10px 触发
   */
  const { ref: loadMoreRef, inView: loadMoreInView } = useIntersectionObserver({
    rootMargin: '10px 0px 0px 0px',
    threshold: 0,
  });

  /**
   * 加载更多触发逻辑
   * 使用 prevLoadMoreInViewRef 检测"从不可见变为可见"的进入事件，
   * 避免持续在视口内时重复触发加载
   */
  const prevLoadMoreInViewRef = useRef(false);
  useEffect(() => {
    const isEntering = loadMoreInView && !prevLoadMoreInViewRef.current;
    prevLoadMoreInViewRef.current = loadMoreInView;

    if (
      isEntering &&
      isMoreMessage &&
      !loadingMore &&
      messageList?.length > 0 &&
      devConversationIdRef.current
    ) {
      handleLoadMoreMessage(devConversationIdRef.current);
    }
  }, [
    loadMoreInView,
    isMoreMessage,
    loadingMore,
    messageList?.length,
    handleLoadMoreMessage,
  ]);

  /** manualComponents 变化时，同步初始化已选组件列表 */
  useEffect(() => {
    initSelectedComponentList(manualComponents);
  }, [manualComponents]);

  /**
   * 智能体配置变化时加载会话
   * - 更新 devConversationIdRef
   * - 重置加载状态并查询会话消息
   * - 仅在 devConversationId 变化时触发（非完整 agentConfigInfo 对象）
   */
  useEffect(() => {
    if (agentConfigInfo) {
      const { devConversationId } = agentConfigInfo;
      devConversationIdRef.current = devConversationId;
      setIsLoadingConversation(false);
      runQueryConversation(devConversationId);
    }
  }, [agentConfigInfo?.devConversationId]);

  // ==================== 事件处理函数 ====================

  /**
   * 处理实时消息推送（通过 EventBus 接收）
   * - 仅处理当前开发会话的消息（通过 conversationId 过滤）
   * - 将新消息追加到消息列表末尾
   * - 若允许自动滚动（用户未手动滚动离开），则滚动到底部
   */
  const handleConversationUpdate = (data: {
    conversationId: string;
    message: MessageInfo;
  }) => {
    const { conversationId, message: newMessage } = data;
    if (devConversationIdRef.current === Number(conversationId)) {
      setMessageList((list: MessageInfo[]) => [...list, newMessage]);
      if (allowAutoScrollRef.current) {
        messageViewScrollToBottom();
      }
    }
  };

  /**
   * 订阅实时消息事件
   * - 挂载时：监听 RefreshChatMessage 事件（SSE 推送的新消息）
   * - 卸载时：取消监听 + 重置初始化状态
   */
  useEffect(() => {
    eventBus.on(EVENT_TYPE.RefreshChatMessage, handleConversationUpdate);

    return () => {
      eventBus.off(EVENT_TYPE.RefreshChatMessage, handleConversationUpdate);
      resetInit();
    };
  }, []);

  /**
   * 监听会话完成事件
   * 当任务执行完成（ChatFinished）时，重新查询会话以获取最终状态
   * 监听一次后立即取消（避免重复触发）
   */
  const listenConversationStatusUpdate = (data: { conversationId: string }) => {
    const { conversationId } = data;
    if (conversationId === conversationInfo?.id?.toString()) {
      runQueryConversation(conversationId);
      eventBus.off(EVENT_TYPE.ChatFinished, listenConversationStatusUpdate);
    }
  };

  /**
   * 任务执行中时注册完成事件监听
   * 仅当 taskStatus 为 EXECUTING 时监听 ChatFinished，
   * 任务完成后自动取消监听
   */
  useEffect(() => {
    if (conversationInfo?.taskStatus === TaskStatus.EXECUTING) {
      eventBus.on(EVENT_TYPE.ChatFinished, listenConversationStatusUpdate);
    }

    return () => {
      eventBus.off(EVENT_TYPE.ChatFinished, listenConversationStatusUpdate);
    };
  }, [conversationInfo?.taskStatus]);

  /**
   * 清空会话并创建新会话
   *
   * 处理流程：
   * 1. 重置表单、清空消息列表、清除副作用
   * 2. 调用 API 创建新的开发会话
   * 3. 根据新会话的 expandPageArea 配置决定是否显示页面预览
   * 4. 更新 devConversationIdRef 和 agentConfigInfo 中的 devConversationId
   * 5. 查询新会话的消息
   */
  const handleClear = useCallback(async () => {
    // 重置本地状态
    setFinalResult(null);
    handleClearSideEffect();
    setIsMoreMessage(false);
    clearFilePanelInfo();
    setMessageList([]);
    setIsLoadingConversation(false);
    setHasUserSentMessage(false);

    try {
      setIsLoadingOtherInterface(true);
      // 创建新的开发会话
      const { success, data } = await runAsyncConversationCreate({
        agentId,
        devMode: true,
      });

      if (success) {
        // 根据页面区域配置决定是否显示预览
        const agent = data?.agent || {};
        const expandPageArea = agent.expandPageArea;
        const pageHomeIndex = agent.pageHomeIndex;
        if (expandPageArea === ExpandPageAreaEnum.No) {
          hidePagePreview();
        } else {
          showPagePreview({
            uri: pageHomeIndex,
            params: {},
          });
        }

        // 更新开发会话 ID
        const id = data?.id;
        devConversationIdRef.current = id;
        if (agentConfigInfo) {
          const _agentConfigInfo = cloneDeep(
            agentConfigInfo,
          ) as AgentConfigInfo;
          _agentConfigInfo.devConversationId = id;
          onAgentConfigInfo(_agentConfigInfo);
        }
        // 查询新会话的消息（通常为空或仅包含开场白）
        await runQueryConversation(id);
      }
    } finally {
      setIsLoadingOtherInterface(false);
    }
  }, [agentId, agentConfigInfo]);

  /**
   * 发送消息
   *
   * 处理流程：
   * 1. 校验 devConversationId 是否存在
   * 2. 标记用户已发送消息（用于控制沙箱选择器固定状态）
   * 3. 构造发送参数（含沙箱 ID、已选组件等）
   * 4. 调用 model 的 onMessageSend 发起 SSE 请求
   *
   * 沙箱 ID 优先级：sandboxServerId > agent.sandboxId > 用户手动选择
   */
  const handleMessageSend = (
    messageInfo: string,
    files?: UploadFileInfo[],
    skillIds?: number[],
  ) => {
    const id = devConversationIdRef.current;
    if (!id) {
      return;
    }

    setHasUserSentMessage(true);

    // 确定最终使用的沙箱 ID
    const effectiveSandboxId = String(
      conversationInfo?.sandboxServerId ??
        conversationInfo?.agent?.sandboxId ??
        selectedComputerId,
    );

    const sendParams: SendMessageParams = {
      id,
      messageInfo,
      files,
      infos: selectedComponentList,
      sandboxId: effectiveSandboxId,
      debug: true, // 开发模式
      isSync: false, // 异步（流式响应）
      skillIds, // 技能 ID 列表
    };

    onMessageSend(sendParams);
  };

  /**
   * 打开/关闭文件预览面板
   *
   * 逻辑优先级：
   * 1. 若有 onToggleFileTreeSidebar 回调（父组件 ConversationAgent 提供）→ 直接调用
   * 2. 否则走独立逻辑：
   *    - 文件树不可见时 → 打开预览
   *    - 文件树可见且为 preview 模式 → 关闭预览
   *    - 文件树可见且为其他模式 → 切换到 preview 模式
   */
  const handleOpenPreviewPanel = () => {
    // 优先使用父组件提供的切换方法
    if (onToggleFileTreeSidebar) {
      onToggleFileTreeSidebar();
      return;
    }

    const convId = devConversationIdRef.current;
    if (!convId) {
      message.warning(
        dict('PC.Pages.PreviewAndDebug.convIdNotFoundFilePreview'),
      );
      return;
    }

    // 隐藏页面预览（避免与文件预览冲突）
    showPagePreview(null);

    if (!isFileTreeVisible) {
      openPreviewView(convId);
      return;
    }

    closePreviewView();
  };

  /**
   * 滚动到底部按钮点击处理
   * 恢复自动滚动 → 滚动到底部 → 隐藏按钮
   */
  const onScrollBottom = () => {
    allowAutoScrollRef.current = true;
    messageViewScrollToBottom();
    setShowScrollBtn(false);
  };

  /**
   * 消息事件委托 Hook
   * 将消息中的交互事件（如按钮点击、链接跳转）委托给配置的事件处理器
   */
  useMessageEventDelegate({
    containerRef: messageViewRef,
    eventBindConfig: conversationInfo?.agent?.eventBindConfig,
  });

  /**
   * 页面预览数据变化时关闭调试详情面板
   * 避免预览和调试详情同时显示造成布局冲突
   */
  useEffect(() => {
    if (pagePreviewData && showType === EditAgentShowType.Debug_Details) {
      setShowType(EditAgentShowType.Hide);
    }
  }, [pagePreviewData, showType, setShowType]);

  /**
   * 文件面板是否显示（仅 TaskAgent 类型）
   * 显示条件：
   * - 智能体类型为 TaskAgent
   * - 消息列表不为空
   * - 若只有一条消息，该消息必须有 id（排除纯开场白）
   */
  const isShowFilePanel = useMemo(() => {
    if (agentConfigInfo?.type !== AgentTypeEnum.TaskAgent) {
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
  }, [agentConfigInfo?.type, messageList]);

  // ==================== 主渲染 ====================
  return (
    <div className={cx(styles.container, className, 'flex', 'h-full')}>
      {/* 顶部导航栏：智能体名称/图标、编辑按钮、文件树切换 */}
      <ConversationAgentHeader
        agentConfigInfo={agentConfigInfo}
        onEditAgent={onEditAgent}
        showFilePanel={isShowFilePanel}
        isFileTreeSidebarVisible={isFileTreeSidebarVisible}
        onToggleFileTreeSidebar={onToggleFileTreeSidebar}
        isFileTreeVisible={isFileTreeVisible}
        onOpenPreviewPanel={handleOpenPreviewPanel}
      />

      {/* 主内容区域：消息列表 + 状态栏 + 输入框 */}
      <div
        className={cx(
          styles['main-content'],
          'flex-1',
          'flex',
          'flex-col',
          'overflow-hide',
        )}
      >
        {/* 消息滚动容器 */}
        <div
          className={cx(styles['chat-wrapper'], 'scroll-container', 'flex-1')}
          ref={messageViewRef}
          onMouseEnter={() => setIsHoveringChat(true)}
          onMouseLeave={() => setIsHoveringChat(false)}
        >
          {loadingConversation ? (
            // 会话加载中状态
            <div
              className={cx('flex', 'items-center', 'content-center', 'h-full')}
            >
              <LoadingOutlined className={cx(styles.loading)} />
            </div>
          ) : messageList?.length > 0 ? (
            <>
              {/* 加载更多指示器（滚动到顶部时自动触发加载历史消息） */}
              {isMoreMessage &&
                (messageList?.length || 0) >= MESSAGE_PAGE_SIZE && (
                  <div
                    ref={loadMoreRef}
                    className={cx(styles['load-more-container'])}
                  >
                    {loadingMore ? (
                      <span>
                        <LoadingOutlined style={{ marginRight: 8 }} />
                        {dict('PC.Pages.Chat.loadingHistoryConversation')}
                      </span>
                    ) : null}
                  </div>
                )}

              {/* 消息列表：每条消息渲染为 ChatView 组件 */}
              {messageList?.map((item: MessageInfo) => (
                <ChatView
                  key={`${item.id}-${item?.index}`}
                  messageInfo={item}
                  roleInfo={roleInfo}
                  mode="chat"
                  showStatusDesc={
                    // TaskAgent 类型不显示状态描述（由 ConversationStatus 组件统一管理）
                    agentConfigInfo?.type !== AgentTypeEnum.TaskAgent
                  }
                />
              ))}

              {/* 推荐问题列表（AI 建议的后续问题） */}
              <RecommendList
                loading={loadingSuggest}
                chatSuggestList={chatSuggestList}
                onClick={handleMessageSend}
              />

              {/* 任务执行中提示（仅 TaskAgent 类型在任务执行时显示） */}
              {conversationInfo?.taskStatus === TaskStatus.EXECUTING && (
                <div
                  className={cx(
                    styles['task-executing-container'],
                    'flex',
                    'items-center',
                  )}
                >
                  <LoadingOutlined />
                  <span>{dict('PC.Pages.Chat.agentExecutingWait')}</span>
                </div>
              )}
            </>
          ) : (
            // 空状态：无消息时显示智能体信息 + 开场白 + 引导问题
            isLoadingConversation && (
              <AgentChatEmpty
                className="h-full"
                icon={agentConfigInfo?.icon}
                name={agentConfigInfo?.name as string}
                extra={
                  <div className="flex flex-col items-center content-center">
                    <div className={cx(styles['opening-chat-msg'])}>
                      {agentConfigInfo?.openingChatMsg}
                    </div>
                    <RecommendList
                      className="mt-16"
                      chatSuggestList={agentConfigInfo?.guidQuestionDtos || []}
                      onClick={handleMessageSend}
                    />
                  </div>
                }
              />
            )
          )}
        </div>

        {/* 任务状态栏（仅 TaskAgent 类型 + 有消息时显示，展示当前任务进度） */}
        {messageList?.length > 0 &&
          conversationInfo &&
          agentConfigInfo?.type === AgentTypeEnum.TaskAgent && (
            <ConversationStatus
              messageList={messageList}
              className={cx(styles['conversation-status-bar'])}
            />
          )}

        {/* 底部输入框区域
            - 支持文本输入、文件上传、@提及工具
            - 沙箱电脑选择（TaskAgent 类型）
            - 清空会话、滚动到底部按钮
            - 权限控制（无权限时显示遮罩） */}
        <ChatInputHome
          key={`agent-conversation-chat-${agentId}`}
          clearDisabled={!messageList?.length}
          onEnter={handleMessageSend}
          onClear={handleClear}
          visible={showScrollBtn && isHoveringChat}
          manualComponents={manualComponents}
          selectedComponentList={selectedComponentList}
          onSelectComponent={handleSelectComponent}
          onScrollBottom={onScrollBottom}
          isTaskAgentActive={agentConfigInfo?.type === AgentTypeEnum.TaskAgent}
          selectedComputerId={selectedComputerId}
          onComputerSelect={(id) => {
            setSelectedComputerId(id);
            onChangeSelectedComputerId?.(id);
          }}
          agentId={agentId}
          agentSandboxId={conversationInfo?.agent?.sandboxId}
          hasPermission={conversationInfo?.agent?.hasPermission}
          maskText={
            conversationInfo?.agent?.hasPermission
              ? ''
              : dict('PC.Components.ChatInputHome.noAgentPermission')
          }
          fixedSelection={
            // 沙箱选择器固定条件：已有 agent 沙箱 / 有服务器沙箱 / 用户已发送消息
            !!conversationInfo?.agent?.sandboxId ||
            !!conversationInfo?.sandboxServerId ||
            hasUserSentMessage
          }
          isPersonalComputer={!!conversationInfo?.agent?.sandboxId}
          enableMention={false}
          placeholder={dict(
            'PC.Components.ChatInputHomeMentionEditor.placeholderWithoutMention',
          )}
        />
      </div>
    </div>
  );
};

export default AgentConversationChatPanel;
