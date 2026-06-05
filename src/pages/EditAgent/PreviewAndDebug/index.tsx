import { UnifiedChatSession } from '@/components/business-component';
import { type AgentMode } from '@/components/business-component/AgentIntervention';
import { EVENT_TYPE } from '@/constants/event.constants';
import useConversation from '@/hooks/useConversation';
import { useConversationScrollDetection } from '@/hooks/useConversationScrollDetection';
import useMessageEventDelegate from '@/hooks/useMessageEventDelegate';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { dict } from '@/services/i18nRuntime';
import {
  ExpandPageAreaEnum,
  HideDesktopEnum,
  TaskStatus,
} from '@/types/enums/agent';
import { AgentTypeEnum, EditAgentShowType } from '@/types/enums/space';
import { AgentConfigInfo } from '@/types/interfaces/agent';
import type { PreviewAndDebugHeaderProps } from '@/types/interfaces/agentConfig';
import type { UploadFileInfo } from '@/types/interfaces/common';
import {
  MessageInfo,
  RoleInfo,
  SendMessageParams,
} from '@/types/interfaces/conversationInfo';
import { arraysContainSameItems } from '@/utils/common';
import eventBus from '@/utils/eventBus';
import { Form, message } from 'antd';
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
import styles from './index.less';
import PreviewAndDebugHeader from './PreviewAndDebugHeader';

const cx = classNames.bind(styles);

/**
 * PreviewAndDebug 组件的 Props 接口
 */
interface PreviewAndDebugProps extends PreviewAndDebugHeaderProps {
  /** 设置智能体配置信息的方法 */
  onAgentConfigInfo: (info: AgentConfigInfo) => void;
  onOpenPreview?: () => void;
  onChangeSelectedComputerId?: (id: string) => void;
}

/**
 * 预览与调试组件
 */
const PreviewAndDebug: React.FC<PreviewAndDebugProps> = ({
  agentId,
  agentConfigInfo,
  onAgentConfigInfo,
  onPressDebug,
  onOpenPreview,
  onChangeSelectedComputerId,
}) => {
  const [form] = Form.useForm();
  // 会话ID
  const devConversationIdRef = useRef<number>(0);
  // 变量参数
  const [variableParams, setVariableParams] = useState<Record<
    string,
    string | number
  > | null>(null);
  // 选中的电脑ID（用于通用型智能体模式）
  const [selectedComputerId, setSelectedComputerId] = useState<string>('');
  // 记录用户是否已发送消息（用于锁定电脑选择）
  const [hasUserSentMessage, setHasUserSentMessage] = useState<boolean>(false);

  const {
    conversationInfo,
    messageList,
    setMessageList,
    chatSuggestList,
    loadingConversation,
    runQueryConversation,
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
    variables,
    userFillVariables,
    requiredNameList,
    showType,
    setShowType,
    resetInit,
    setFinalResult,
    setIsLoadingOtherInterface,
    clearFilePanelInfo,
    viewMode,
    openPreviewView,
    openDesktopView,
    closePreviewView,
    isFileTreeVisible,
    // 加载更多消息相关
    isMoreMessage,
    setIsMoreMessage,
    loadingMore,
    handleLoadMoreMessage,
  } = useModel('conversationInfo');

  // 获取 chat model 中的页面预览状态
  const { pagePreviewData, hidePagePreview, showPagePreview } =
    useModel('chat');

  // 创建智能体会话
  const { runAsyncConversationCreate } = useConversation();
  // 会话输入框已选择组件
  const {
    selectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  const values = Form.useWatch([], { form, preserve: true });

  useEffect(() => {
    // 监听form表单值变化
    // 当表单值为空对象且有必填参数时，应该设置 variableParams 为 null
    if (
      values &&
      Object.keys(values).length === 0 &&
      requiredNameList?.length > 0
    ) {
      setVariableParams(null);
      return;
    }
    // 如果没有必填参数，空对象也是有效的
    if (values && Object.keys(values).length === 0) {
      return;
    }
    form
      .validateFields({ validateOnly: true })
      .then(() => setVariableParams(values))
      .catch(() => setVariableParams(null));
  }, [form, values, requiredNameList]);

  useEffect(() => {
    if (!!userFillVariables) {
      setVariableParams(userFillVariables);
    }
  }, [userFillVariables]);

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

  // 使用滚动检测 Hook
  useConversationScrollDetection(
    messageViewRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    setShowScrollBtn,
  );

  useEffect(() => {
    // 初始化选中的组件列表
    initSelectedComponentList(manualComponents);
  }, [manualComponents]);

  useEffect(() => {
    if (agentConfigInfo) {
      const { devConversationId } = agentConfigInfo;
      devConversationIdRef.current = devConversationId;
      setIsLoadingConversation(false);
      // 查询会话
      runQueryConversation(devConversationId);
    }
  }, [agentConfigInfo?.devConversationId]);

  // 监听会话更新事件，更新会话记录
  const handleConversationUpdate = (data: {
    conversationId: string;
    message: MessageInfo;
  }) => {
    const { conversationId, message } = data;
    if (devConversationIdRef.current === Number(conversationId)) {
      setMessageList((list: MessageInfo[]) => [...list, message]);
      // 当用户手动滚动时，暂停自动滚动
      if (allowAutoScrollRef.current) {
        // 滚动到底部
        messageViewScrollToBottom();
      }
    }
  };

  useEffect(() => {
    // 监听新消息事件
    eventBus.on(EVENT_TYPE.RefreshChatMessage, handleConversationUpdate);

    return () => {
      eventBus.off(EVENT_TYPE.RefreshChatMessage, handleConversationUpdate);
      // 组件卸载时重置全局会话状态，防止污染其他页面（如临时会话页面）
      resetInit();
    };
  }, []);

  // 监听会话状态更新事件
  const listenConversationStatusUpdate = (data: { conversationId: string }) => {
    const { conversationId } = data;
    // 如果会话ID和当前会话ID相同，并且会话状态为已完成，则显示成功提示
    if (conversationId === conversationInfo?.id?.toString()) {
      // 重新查询会话信息
      runQueryConversation(conversationId);

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

  // 清空会话记录，实际上是创建新的会话
  const handleClear = useCallback(async () => {
    // 重置对话设置表单数据
    form.resetFields();
    // 清除调试结果
    setFinalResult(null);
    handleClearSideEffect();
    // 重置是否还有更多消息
    setIsMoreMessage(false);
    // 清除文件面板信息, 并关闭文件面板
    clearFilePanelInfo();
    setMessageList([]);
    setIsLoadingConversation(false);
    setHasUserSentMessage(false); // 重置发送状态

    try {
      setIsLoadingOtherInterface(true);
      // 创建智能体会话(智能体编排页面devMode为true)
      const { success, data } = await runAsyncConversationCreate({
        agentId,
        devMode: true,
      });

      if (success) {
        // 点击刷子时,智能体要"重置",默认有打开页面就返回到默认首页,默认没有打开页面,则把页面收起来
        const agent = data?.agent || {};
        const expandPageArea = agent.expandPageArea; // 0: 收起, 1: 展开
        const pageHomeIndex = agent.pageHomeIndex;
        if (expandPageArea === ExpandPageAreaEnum.No) {
          hidePagePreview();
        } else {
          showPagePreview({
            uri: pageHomeIndex,
            params: {},
          });
        }

        const id = data?.id;
        devConversationIdRef.current = id;
        if (agentConfigInfo) {
          // 更新智能体配置信息
          const _agentConfigInfo = cloneDeep(
            agentConfigInfo,
          ) as AgentConfigInfo;
          _agentConfigInfo.devConversationId = id;
          onAgentConfigInfo(_agentConfigInfo);
        }
        // 查询会话
        await runQueryConversation(id);
      }
    } finally {
      setIsLoadingOtherInterface(false);
    }
  }, [agentId, agentConfigInfo, form]);

  // 消息发送
  const handleMessageSend = (
    messageInfo: string,
    files?: UploadFileInfo[],
    skillIds?: number[],
    modelId?: number,
    selectedAgentMode?: AgentMode,
  ) => {
    const id = devConversationIdRef.current;
    if (!id) {
      return;
    }

    // 变量参数为空，不发送消息
    if (wholeDisabled) {
      form.validateFields(); // 触发表单验证以显示error
      message.warning(dict('PC.Pages.PreviewAndDebug.fillRequiredParams'));
      return;
    }
    // 标记用户已发送消息
    setHasUserSentMessage(true);

    const effectiveSandboxId = String(
      conversationInfo?.sandboxServerId ??
        conversationInfo?.agent?.sandboxId ??
        selectedComputerId,
    );

    // 发送消息参数
    const sendParams: SendMessageParams = {
      id,
      messageInfo,
      files,
      infos: selectedComponentList,
      variableParams: variableParams || undefined,
      sandboxId: effectiveSandboxId,
      debug: true,
      // 是否同步会话记录
      isSync: false,
      // 技能ID列表
      skillIds,
      modelId,
      agentMode: selectedAgentMode || 'yolo',
    };
    onMessageSend(sendParams);
  };

  /**
   * 打开 / 切换 文件预览面板
   * 行为与聊天页面保持一致：
   * - 文件树未打开：打开预览视图
   * - 文件树已打开且当前为 preview：再次点击关闭
   * - 文件树已打开且当前为 desktop：切换为 preview
   */
  const handleOpenPreviewPanel = () => {
    const convId = devConversationIdRef.current;
    if (!convId) {
      message.warning(
        dict('PC.Pages.PreviewAndDebug.convIdNotFoundFilePreview'),
      );
      return;
    }

    // 关闭页面预览
    showPagePreview(null);

    if (!isFileTreeVisible) {
      openPreviewView(convId);
      return;
    }

    if (viewMode === 'preview') {
      closePreviewView();
    } else {
      openPreviewView(convId);
    }
  };

  /**
   * 打开 / 切换 智能体电脑面板
   * 行为与聊天页面保持一致：
   * - 文件树未打开：打开智能体电脑视图
   * - 文件树已打开且当前为 desktop：再次点击关闭
   * - 文件树已打开且当前为 preview：切换为 desktop
   */
  const handleOpenDesktopPanel = () => {
    const convId = devConversationIdRef.current;
    if (!convId) {
      message.warning(dict('PC.Pages.PreviewAndDebug.convIdNotFoundDesktop'));
      return;
    }

    if (!isFileTreeVisible) {
      openDesktopView(convId);
      return;
    }

    if (viewMode === 'desktop') {
      closePreviewView();
    } else {
      openDesktopView(convId);
    }
  };

  // 消息事件代理（处理会话输出中的点击事件）
  useMessageEventDelegate({
    containerRef: messageViewRef,
    eventBindConfig: conversationInfo?.agent?.eventBindConfig,
  });

  // 互斥面板逻辑：管理 PagePreview 和 DebugDetails 的互斥展示
  useEffect(() => {
    // 当页面预览打开时，关闭调试面板
    if (pagePreviewData && showType === EditAgentShowType.Debug_Details) {
      setShowType(EditAgentShowType.Hide);
    }
  }, [pagePreviewData, showType, setShowType]);

  /**
   * 是否显示文件面板：
   * 1. 仅通用型智能体 (TaskAgent) 才显示
   * 2. 必须存在消息
   * 3. 如果只有一条消息，则该消息的 id 不能为空（id 为空视为无效消息）
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

  return (
    <div className={cx(styles.container, 'flex', 'h-full')}>
      {/* 主内容区域 */}
      {agentConfigInfo?.hideChatArea ? null : (
        <div
          className={cx('flex', 'flex-col', 'flex-1')}
          style={{ minWidth: 340 }}
        >
          <PreviewAndDebugHeader
            onPressDebug={onPressDebug}
            // 是否显示预览页面图标
            isShowPreview={
              agentConfigInfo?.expandPageArea !== ExpandPageAreaEnum.No
            }
            isPreviewPageActive={!!pagePreviewData && !isFileTreeVisible}
            // 打开预览页面回调方法
            onShowPreview={onOpenPreview}
            // 是否显示智能体电脑
            isShowDesktop={
              agentConfigInfo?.hideDesktop === HideDesktopEnum.No &&
              selectedComputerId === '-1'
            }
            // 是否显示文件面板: 通用型智能体 + 文件树未打开
            showFilePanel={isShowFilePanel}
            // 文件预览 / 智能体电脑切换
            isFileTreeVisible={isFileTreeVisible}
            viewMode={viewMode}
            onOpenPreviewPanel={handleOpenPreviewPanel}
            onOpenDesktopPanel={handleOpenDesktopPanel}
          />
          <div
            className={cx(
              styles['main-content'],
              'flex-1',
              'flex',
              'flex-col',
              'overflow-hide',
            )}
          >
            <UnifiedChatSession
              conversationId={devConversationIdRef.current}
              messageList={messageList}
              roleInfo={roleInfo}
              isLoading={loadingConversation}
              loadingMore={loadingMore}
              isMoreMessage={isMoreMessage}
              isConversationActive={
                conversationInfo?.taskStatus === TaskStatus.EXECUTING
              }
              messageBottomMode="chat"
              loadingSuggest={loadingSuggest}
              chatSuggestList={chatSuggestList}
              agentInfo={{
                id: agentId,
                name: agentConfigInfo?.name,
                icon: agentConfigInfo?.icon,
                type: agentConfigInfo?.type,
                openingChatMsg: agentConfigInfo?.openingChatMsg,
                guidQuestionDtos: agentConfigInfo?.guidQuestionDtos,
                eventBindConfig: agentConfigInfo?.eventBindConfig,
                hasPermission: conversationInfo?.agent?.hasPermission,
                sandboxId: conversationInfo?.agent?.sandboxId,
              }}
              onSendMessage={handleMessageSend}
              onClear={handleClear}
              onLoadMoreMessage={handleLoadMoreMessage}
              selectedModelId={undefined}
              manualComponents={manualComponents}
              selectedComponentList={selectedComponentList}
              onSelectComponent={handleSelectComponent}
              requiredNameList={requiredNameList}
              variableParams={variableParams}
              form={form}
              variables={variables}
              userFillVariables={userFillVariables}
              isVariablesFilled={true}
              clearLoading={false}
              isSelectionLocked={false}
              hasUserSentMessage={hasUserSentMessage}
              selectedComputerId={selectedComputerId}
              onComputerSelect={(id) => {
                setSelectedComputerId(id);
                onChangeSelectedComputerId?.(id);
              }}
              showScrollBtn={showScrollBtn}
              readonly={false}
              enableMention={false}
              placeholder={dict(
                'PC.Components.ChatInputHomeMentionEditor.placeholderWithoutMention',
              )}
              messageViewRef={messageViewRef}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewAndDebug;
