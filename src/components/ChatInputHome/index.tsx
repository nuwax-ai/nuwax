import SvgIcon from '@/components/base/SvgIcon';
import type { AgentMode } from '@/components/business-component/AgentIntervention';
import PaymentSubscriptionModal from '@/components/business-component/PaymentSubscriptionModal';
import {
  ChatInputVoiceFooter,
  mergeVoiceTranscript,
} from '@/components/business-component/VoiceInput';
import ChatUploadFile from '@/components/ChatUploadFile';
import ConditionRender from '@/components/ConditionRender';
import PermissionMask from '@/components/PermissionMask';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { isSessionStreamBusy } from '@/hooks/useExecutingTaskStatusPoll';
import useSubscription from '@/hooks/useSubscription';
import { t } from '@/services/i18nRuntime';
import { DefaultSelectedEnum, TaskStatus } from '@/types/enums/agent';
import { UploadFileStatus } from '@/types/enums/common';
import type { ChatInputProps, UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { handleUploadFileList } from '@/utils/upload';
import {
  ArrowDownOutlined,
  CheckOutlined,
  DesktopOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Dropdown, message, Tooltip, Upload, UploadProps } from 'antd';
import classNames from 'classnames';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import AtMentionIcon from './AtMentionIcon';
import ComputerTypeSelector from './ComputerTypeSelector';
import styles from './index.less';
import ManualComponentItem from './ManualComponentItem';
import MentionEditor from './MentionEditor';
import type { MentionEditorHandle, MentionItem } from './MentionPopup/types';
import ModelSelector from './ModelSelector';
import SpaceSelector from './SpaceSelector';

const cx = classNames.bind(styles);

const VoiceFooter = ChatInputVoiceFooter;

const AGENT_MODE_OPTIONS: AgentMode[] = ['yolo', 'ask'];

const AGENT_MODE_I18N: Record<AgentMode, { label: string; desc: string }> = {
  yolo: {
    label: 'PC.Components.ChatInputHome.agentModeAuto',
    desc: 'PC.Components.ChatInputHome.agentModeAutoDesc',
  },
  ask: {
    label: 'PC.Components.ChatInputHome.agentModeApproval',
    desc: 'PC.Components.ChatInputHome.agentModeApprovalDesc',
  },
};

export interface ChatInputHomeRef {
  focus: () => void;
  clear: () => void;
}

/**
 * 聊天输入组件
 */
const ChatInputHome = forwardRef<ChatInputHomeRef, ChatInputProps>(
  (
    {
      className,
      wholeDisabled = false,
      clearDisabled = false,
      clearLoading = false,
      onEnter,
      visible,
      selectedComponentList,
      onSelectComponent,
      onClear,
      isClearInput = true,
      manualComponents,
      onScrollBottom,
      showAnnouncement = false,
      onTempChatStop,
      loadingStopTempConversation,
      showTaskAgentToggle = false,
      isTaskAgentActive = false,
      onToggleTaskAgent,
      selectedComputerId,
      onComputerSelect,
      agentId,
      agentSandboxId,
      fixedSelection,
      hasPermission = true,
      isSandboxUnavailable = false,
      maskText,
      autoSelectComputer,
      saveComputerOnSelect,
      isPersonalComputer,
      readonly,
      enableMention = true,
      // @ 提及弹窗展示方向：auto | up | down，默认 auto
      mentionPlacement = 'auto',
      /** 占位符文本 */
      placeholder,
      /** 默认提及项列表（需同时传入 value 文本） */
      defaultMentions,
      /** 是否允许选择自有模型 */
      allowOtherModel,
      /** 当前选中的模型 ID */
      selectedModelId,
      /** 模型改变时的回调 */
      onModelSelect,
      showSpaceSelector = false,
      selectedSpaceId,
      onSpaceSelect,
      /** 智能体类型 */
      agentType,
      tabsSlot,
      selectedTag,
      onClearSelectedTag,
      prefix,
      agentMode = 'yolo',
      onAgentModeChange,
      showAgentModeSelector = false,
      usageScenarios,
      streamActiveOverride,
      taskExecutingOverride,
      stopConversationIdOverride,
      onStopConversationOverride,
      loadingStopConversationOverride,
      onDisabledStreamActiveOverride,
    },
    ref,
  ) => {
    // 获取停止会话相关的方法和状态
    const {
      runStopConversation,
      loadingStopConversation: modelLoadingStopConversation,
      getCurrentConversationId,
      getCurrentConversationRequestId,
      isConversationActive: modelStreamActive,
      disabledConversationActive,
      messageList,
      loadingConversation,
      isLoadingOtherInterface,
      conversationInfo,
    } = useModel('conversationInfo');

    /** 使用独立会话 model（如预览 Tab），勿改动全局 conversationInfo 活跃状态 */
    const isIsolatedSessionSource = streamActiveOverride !== undefined;

    const resetStreamActive = useCallback(() => {
      if (isIsolatedSessionSource) {
        onDisabledStreamActiveOverride?.();
        return;
      }
      disabledConversationActive();
    }, [
      isIsolatedSessionSource,
      onDisabledStreamActiveOverride,
      disabledConversationActive,
    ]);

    const isConversationActive = streamActiveOverride ?? modelStreamActive;
    const loadingStopConversation =
      loadingStopConversationOverride ?? modelLoadingStopConversation;
    const effectiveTaskExecuting =
      taskExecutingOverride ??
      conversationInfo?.taskStatus === TaskStatus.EXECUTING;

    // 获取租户配置信息
    const { tenantConfigInfo } = useModel('tenantConfigInfo');
    // 是否启用订阅
    const isEnableSubscription = tenantConfigInfo?.enableSubscription !== 0;

    const {
      createSubscriptionOrder,
      querySkillSubscriptionPlans,
      loadingTargetPricing,
      targetSubscriptionPlans,
      mySubscriptionInfo,
      loadingMySubscription,
    } = useSubscription();

    // 是否打开订阅弹窗
    const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false);

    // 文档
    const [uploadFiles, setUploadFiles] = useState<UploadFileInfo[]>([]);
    const [files, setFiles] = useState<UploadFileInfo[]>([]);
    const [messageInfo, setMessageInfo] = useState<string>('');
    // 已选中的技能 ID 列表
    const [skillIds, setSkillIds] = useState<number[]>([]);
    // 停止操作是否正在进行中
    const [isStoppingConversation, setIsStoppingConversation] =
      useState<boolean>(false);
    // @ 提及编辑器引用
    const mentionEditorRef = useRef<MentionEditorHandle>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        mentionEditorRef.current?.focus?.();
      },
      clear: () => {
        mentionEditorRef.current?.clear?.();
      },
    }));
    const selectedTagRef = useRef<HTMLDivElement>(null);
    const [selectedTagWidth, setSelectedTagWidth] = useState<number>(0);
    // 滚动按钮自身的悬停状态
    const [isHoveringBtn, setIsHoveringBtn] = useState<boolean>(false);
    // 延迟显示的可见性状态，用于处理移出延时
    const [delayedVisible, setDelayedVisible] = useState<boolean>(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    // 拖拽进入计数，避免 dragenter/dragleave 嵌套元素导致遮罩闪烁
    const dragCounterRef = useRef<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const selectedTagOffset = selectedTag?.label ? selectedTagWidth + 8 : 0;

    useLayoutEffect(() => {
      if (!selectedTag?.label || !selectedTagRef.current) {
        setSelectedTagWidth(0);
        return;
      }

      const selectedTagElement = selectedTagRef.current;
      const updateSelectedTagWidth = () => {
        setSelectedTagWidth(selectedTagElement.offsetWidth);
      };

      updateSelectedTagWidth();

      if (typeof ResizeObserver === 'undefined') {
        const frameId = window.requestAnimationFrame(updateSelectedTagWidth);
        return () => window.cancelAnimationFrame(frameId);
      }

      const resizeObserver = new ResizeObserver(updateSelectedTagWidth);
      resizeObserver.observe(selectedTagElement);

      return () => resizeObserver.disconnect();
    }, [selectedTag?.label]);

    // 处理可见性延迟逻辑
    useEffect(() => {
      if (visible || isHoveringBtn) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setDelayedVisible(true);
      } else {
        // 当外部不可见且按钮未悬停时，增加延时消失，防止闪烁
        timerRef.current = setTimeout(() => {
          setDelayedVisible(false);
        }, 300); // 300ms 延时
      }

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, [visible, isHoveringBtn]);

    const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

    useEffect(() => {
      setFiles(
        uploadFiles.filter(
          (item) =>
            item.status === UploadFileStatus.done && item.url && item.key,
        ),
      );
    }, [uploadFiles]);

    // 监听会话状态变化，当会话结束时重置停止状态
    useEffect(() => {
      if (!isConversationActive) {
        setIsStoppingConversation(false);
      }
    }, [isConversationActive]);

    // 发送按钮disabled
    const disabledSend = useMemo(() => {
      return !messageInfo && !files?.length;
    }, [messageInfo, files]);

    /**
     * 会话是否活跃（与停止钮 / 队列入队一致）：
     * model 流式信号 + messageList 兜底 + 后台 taskStatus
     */
    const streamActive = useMemo(
      () => isConversationActive || isSessionStreamBusy(messageList),
      [isConversationActive, messageList],
    );
    const isActiveConversation = streamActive || effectiveTaskExecuting;

    /** 按钮区活跃态（延迟回落）：吸收 model / taskStatus 短暂抖动，避免停止钮与发送钮来回闪 */
    const BUTTON_SLOT_RELEASE_MS = 800;
    const [buttonSlotActive, setButtonSlotActive] = useState(false);
    useEffect(() => {
      if (isActiveConversation) {
        setButtonSlotActive(true);
        return;
      }
      const timer = window.setTimeout(
        () => setButtonSlotActive(false),
        BUTTON_SLOT_RELEASE_MS,
      );
      return () => window.clearTimeout(timer);
    }, [isActiveConversation]);

    // 单按钮模式：活跃且输入框为空时显示「停止」，否则显示「发送」（活跃时点击即加入队列）
    const showStopButton = buttonSlotActive && disabledSend;

    // enter事件 - 确认发送消息
    const confirmSendMessage = (value: string) => {
      // 如果输入框内容不为空 或者 附件文件列表不为空
      if (!!value.trim() || !!files?.length) {
        onEnter(value, files, skillIds, selectedModelId, agentMode);
        // 如果需要清空输入框
        if (isClearInput) {
          // 清空附件文件列表
          setUploadFiles([]);
          // 清空输入框
          setMessageInfo('');
          // 清空已选中的技能 ID 列表
          setSkillIds([]);
          // 清空@提及编辑器
          mentionEditorRef.current?.clear();
        }
      }
    };

    // 点击发送事件
    const handleSendMessage = () => {
      if (
        disabledSend ||
        wholeDisabled ||
        loadingConversation ||
        isLoadingOtherInterface
      ) {
        return;
      }

      // 确认发送消息
      confirmSendMessage(messageInfo);
    };

    /**
     * 处理回车发送消息
     * 支持 contenteditable div 的回车事件
     */
    const handlePressEnter = () => {
      // 中止会话过程中不能触发 enter 事件
      // 会话活跃时不拦截：消息经 onEnter 流转到外层队列拦截逻辑入队
      if (isStoppingConversation) {
        return;
      }

      // 确认发送消息
      confirmSendMessage(messageInfo);
    };

    const applyServerUploadResult = useCallback(
      (fileInfo: UploadFileInfo, result: any): UploadFileInfo => {
        const data = result.data || {};
        return {
          ...fileInfo,
          status: UploadFileStatus.done,
          percent: 100,
          url: data?.url || '',
          key: data?.key || '',
          name: data?.fileName || fileInfo.name,
          type: data?.mimeType || fileInfo.type,
          response: result,
        };
      },
      [],
    );

    const handleChange: UploadProps['onChange'] = (info) => {
      const { fileList } = info;
      setUploadFiles(handleUploadFileList(fileList));
    };

    const handleDelFile = (uid: string) => {
      setUploadFiles((uploadFiles) =>
        uploadFiles.filter((item) => item.uid !== uid),
      );
    };

    /**
     * 从剪贴板中提取所有文件（支持图片、文档等多种类型）
     * 支持从剪贴板粘贴图片（Ctrl+V 或 Cmd+V）
     * 支持多张图片同时粘贴
     *  */
    const extractClipboardFiles = useCallback(
      (clipboardData: DataTransfer | null): File[] => {
        if (!clipboardData?.items) {
          return [];
        }

        const files: File[] = [];
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
              files.push(file);
            }
          }
        }
        return files;
      },
      [],
    );

    /**
     * 为待上传文件生成默认文件名
     */
    const getDefaultFileName = useCallback((file: File, index: number) => {
      if (file.type.startsWith('image/')) {
        return t(
          'PC.Components.ChatInputHome.pastedImageFileName',
          Date.now(),
          index + 1,
        );
      }
      return t(
        'PC.Components.ChatInputHome.pastedFileName',
        Date.now(),
        index + 1,
      );
    }, []);

    /**
     * 批量上传文件（粘贴、拖拽共用）
     */
    const uploadFilesToServer = useCallback(
      async (filesToUpload: File[]) => {
        if (wholeDisabled || !filesToUpload.length) {
          return;
        }

        const newUploadFiles: UploadFileInfo[] = filesToUpload.map(
          (file, index) => ({
            uid: uuidv4(),
            name: file.name || getDefaultFileName(file, index),
            size: file.size,
            type: file.type,
            url: '',
            status: UploadFileStatus.uploading,
            percent: 0,
            originFileObj: file,
          }),
        );

        setUploadFiles((prev) => [
          ...prev,
          ...handleUploadFileList(newUploadFiles),
        ]);

        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          const uploadFile = newUploadFiles[i];

          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'tmp');

            const response = await fetch(UPLOAD_FILE_ACTION, {
              method: 'POST',
              headers: {
                Authorization: token ? `Bearer ${token}` : '',
              },
              body: formData,
            });

            const result = await response.json();

            if (result.code === SUCCESS_CODE && result.data) {
              setUploadFiles((prev) =>
                prev.map((item) =>
                  item.uid === uploadFile.uid
                    ? applyServerUploadResult(item, result)
                    : item,
                ),
              );
            } else {
              throw new Error(result.message || 'Upload failed');
            }
          } catch (error) {
            console.error('File upload failed:', error);
            message.error(
              t(
                'PC.Components.ChatInputHome.uploadFailedWithName',
                uploadFile.name,
              ),
            );

            setUploadFiles((prev) =>
              prev.map((item) =>
                item.uid === uploadFile.uid
                  ? {
                      ...item,
                      status: UploadFileStatus.error,
                      percent: 0,
                    }
                  : item,
              ),
            );
          }
        }
      },
      [applyServerUploadResult, getDefaultFileName, token, wholeDisabled],
    );

    /**
     * 处理粘贴事件，支持粘贴多种文件上传
     */
    const handlePaste = useCallback(
      async (e: React.ClipboardEvent<HTMLDivElement>) => {
        if (wholeDisabled) {
          return;
        }

        const pastedFiles = extractClipboardFiles(e.clipboardData);
        if (!pastedFiles.length) {
          return;
        }

        e.preventDefault();
        await uploadFilesToServer(pastedFiles);
      },
      [extractClipboardFiles, uploadFilesToServer, wholeDisabled],
    );

    /**
     * 处理拖拽进入，显示上传提示遮罩
     */
    const handleDragEnter = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (wholeDisabled || !e.dataTransfer.types.includes('Files')) {
          return;
        }
        dragCounterRef.current += 1;
        setIsDragging(true);
      },
      [wholeDisabled],
    );

    /**
     * 处理拖拽离开，隐藏上传提示遮罩
     */
    const handleDragLeave = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current -= 1;
        if (dragCounterRef.current <= 0) {
          dragCounterRef.current = 0;
          setIsDragging(false);
        }
      },
      [],
    );

    /**
     * 处理拖拽悬停，允许放置文件
     */
    const handleDragOver = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (wholeDisabled) {
          return;
        }
        e.dataTransfer.dropEffect = 'copy';
      },
      [wholeDisabled],
    );

    /**
     * 处理文件拖放上传
     */
    const handleDrop = useCallback(
      async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current = 0;
        setIsDragging(false);

        if (wholeDisabled) {
          return;
        }

        const droppedFiles = Array.from(e.dataTransfer.files || []);
        if (droppedFiles.length) {
          await uploadFilesToServer(droppedFiles);
        }
      },
      [uploadFilesToServer, wholeDisabled],
    );

    const handleClear = () => {
      if (clearDisabled || wholeDisabled) {
        return;
      }
      resetStreamActive();
      onClear?.();
    };

    // 停止会话功能 - 直接集成到组件内部
    const handleStopConversation = useCallback(async () => {
      // 防止重复点击
      if (isStoppingConversation) {
        return;
      }
      // 设置停止操作状态
      setIsStoppingConversation(true);

      // 获取当前会话请求ID
      const requestId = getCurrentConversationRequestId();
      const conversationId =
        stopConversationIdOverride ?? getCurrentConversationId();

      // 修复：即使 requestId 为空也应该调用停止接口
      // 因为在会话刚开始时，requestId 可能还未设置，但会话已经在进行中
      if (onTempChatStop && requestId) {
        // 临时聊天需要 requestId
        onTempChatStop(requestId);
      } else if (onStopConversationOverride && conversationId) {
        onStopConversationOverride(conversationId);
      } else if (conversationId) {
        // 正常会话只需要 conversationId 即可停止
        runStopConversation(conversationId);
      }
    }, [
      isStoppingConversation,
      getCurrentConversationRequestId,
      getCurrentConversationId,
      stopConversationIdOverride,
      onStopConversationOverride,
      runStopConversation,
      onTempChatStop,
    ]);

    // 获取按钮提示文本
    const getButtonTooltip = () => {
      if (wholeDisabled) {
        return t('PC.Components.ChatInputHome.conversationDisabled');
      }
      if (disabledSend) {
        return t('PC.Components.ChatInputHome.enterQuestion');
      }
      if (streamActive) {
        return t('PC.Components.ChatInputHome.clickStopConversation');
      }
      return t('PC.Components.ChatInputHome.clickSendMessage');
    };

    // 获取停止按钮提示文本
    const getStopButtonTooltip = () => {
      // 如果是任务执行状态
      if (effectiveTaskExecuting) {
        if (
          isStoppingConversation ||
          loadingStopConversation ||
          loadingStopTempConversation
        ) {
          return t('PC.Components.ChatInputHome.stoppingTask');
        }
        return t('PC.Components.ChatInputHome.clickStopAgentTask');
      }

      // 普通会话状态
      if (!streamActive) {
        return t('PC.Components.ChatInputHome.noActiveConversation');
      }
      if (
        isStoppingConversation ||
        loadingStopConversation ||
        loadingStopTempConversation
      ) {
        return t('PC.Components.ChatInputHome.stoppingConversation');
      }
      return t('PC.Components.ChatInputHome.clickStopConversation');
    };

    // 卸载时清理活跃态与附件：用 ref 读取最新值、依赖置空，确保仅在真正卸载时执行一次。
    // （disabledConversationActive 每次 render 都是新引用，放进依赖会令 cleanup 每次渲染都跑、误清空用户已选附件）
    const isIsolatedSessionSourceRef = useRef(isIsolatedSessionSource);
    isIsolatedSessionSourceRef.current = isIsolatedSessionSource;
    const disabledConversationActiveRef = useRef(disabledConversationActive);
    disabledConversationActiveRef.current = disabledConversationActive;

    useEffect(() => {
      return () => {
        if (!isIsolatedSessionSourceRef.current) {
          disabledConversationActiveRef.current();
        }
        setUploadFiles([]);
      };
    }, []);

    // 本输入框所属会话 id（隔离源用 override，否则取 model），用于过滤队列编辑回填事件
    const ownConversationId =
      stopConversationIdOverride ?? conversationInfo?.id;
    const ownConversationIdRef = useRef(ownConversationId);
    ownConversationIdRef.current = ownConversationId;

    // 监听队列消息编辑回填事件
    useEffect(() => {
      const handleEditMessage = ({
        text,
        files: editFiles,
        conversationId: targetConversationId,
      }: {
        text: string;
        files?: UploadFileInfo[];
        conversationId?: number | string;
      }) => {
        // 仅回填到目标会话对应的输入框，避免多实例（主聊天 / 预览 Tab）串扰；
        // 事件未带 conversationId 时按旧行为不过滤（单输入框场景）
        if (
          targetConversationId !== undefined &&
          targetConversationId !== null &&
          String(targetConversationId) !== String(ownConversationIdRef.current)
        ) {
          return;
        }
        setMessageInfo((prev) => (prev ? `${prev}\n${text}` : text));
        if (editFiles?.length) {
          setUploadFiles((prev) => [...prev, ...editFiles]);
        }
      };
      eventBus.on(EVENT_NAMES.QUEUE_EDIT_MESSAGE, handleEditMessage);
      return () =>
        eventBus.off(EVENT_NAMES.QUEUE_EDIT_MESSAGE, handleEditMessage);
    }, []);

    /**
     * 将底部 @ 图标选择的提及项插入到 MentionEditor
     */
    const handleInsertAtMention = useCallback(
      (item: MentionItem) => {
        mentionEditorRef.current?.handleAtIconMentionSelect(item);
      },
      [mentionEditorRef],
    );

    /**
     * 选中未订阅的付费技能时，打开订阅弹窗并拉取套餐列表
     */
    const handleUnsubscribedSkillSelect = useCallback(
      (item: MentionItem) => {
        if (!isEnableSubscription || !item.paymentRequired || item.subscribed) {
          return;
        }
        querySkillSubscriptionPlans(item.targetId);
        setOpenPaymentModal(true);
      },
      [isEnableSubscription, querySkillSubscriptionPlans],
    );

    return (
      <div className={cx('w-full', 'relative', className)}>
        <div
          className={cx(styles['chat-container'], 'flex', 'flex-col', {
            [styles['drag-over']]: isDragging,
            [styles['has-tabs']]: !!tabsSlot,
          })}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <ConditionRender condition={isDragging}>
            <div className={cx(styles['drag-overlay'])}>
              {t('PC.Components.ChatInputHome.dropFilesHint')}
            </div>
          </ConditionRender>
          <PermissionMask
            visible={!hasPermission || isSandboxUnavailable}
            text={
              maskText ??
              (!hasPermission
                ? t('PC.Components.ChatInputHome.noAgentPermission')
                : t('PC.Components.ChatInputHome.agentComputerUnavailable'))
            }
          />

          {/* Tab 头部插槽 */}
          {tabsSlot && (
            <div className={cx(styles['tabs-wrapper'])}>{tabsSlot}</div>
          )}

          {/* 输入核心包裹区域 */}
          <div className={cx(styles['input-wrapper'])}>
            {/*文件列表*/}
            <ConditionRender condition={uploadFiles?.length}>
              <ChatUploadFile files={uploadFiles} onDel={handleDelFile} />
            </ConditionRender>
            {/*输入框 - 使用 MentionEditor 实现 @ 提及功能*/}
            <div className={cx(styles['input-line'])}>
              <ConditionRender condition={!!selectedTag?.label}>
                <div
                  ref={selectedTagRef}
                  className={cx(styles['selected-tag'])}
                >
                  <span className={cx(styles['tag-label'])}>
                    {selectedTag?.label}
                  </span>
                  <button
                    type="button"
                    className={cx(styles['tag-close'])}
                    aria-label="Clear selected tag"
                    onClick={onClearSelectedTag}
                  />
                </div>
              </ConditionRender>
              <MentionEditor
                ref={mentionEditorRef}
                className={cx(styles.input)}
                disabled={wholeDisabled}
                value={messageInfo}
                inlinePrefixWidth={selectedTagOffset}
                onChange={setMessageInfo}
                onSkillIdsChange={setSkillIds}
                // 是否启用 @ 提及功能，默认启用
                enableMention={enableMention}
                // @ 弹窗展示方向：auto | up | down
                mentionPlacement={mentionPlacement}
                // 回车事件处理
                onPressEnter={handlePressEnter}
                // 粘贴事件处理
                onPaste={handlePaste}
                placeholder={placeholder}
                // 默认提及项列表
                defaultMentions={defaultMentions}
                enableSubscription={isEnableSubscription}
                onUnsubscribedSkillSelect={handleUnsubscribedSkillSelect}
                usageScenarios={usageScenarios}
              />
            </div>
            <VoiceFooter.Provider
              disabled={
                wholeDisabled ||
                isActiveConversation ||
                loadingConversation ||
                isLoadingOtherInterface ||
                isStoppingConversation
              }
              onFill={(text) =>
                setMessageInfo((prev) => mergeVoiceTranscript(prev, text))
              }
              onSend={(text) =>
                confirmSendMessage(mergeVoiceTranscript(messageInfo, text))
              }
            >
              {(isVoiceActive) => (
                <footer
                  className={cx('flex', 'flex-1', styles.footer, {
                    [styles['footer-voice-active']]: isVoiceActive,
                  })}
                >
                  {/* 清空会话记录 */}
                  {!!messageList?.filter((item: MessageInfo) => item.id)
                    ?.length && (
                    <ConditionRender condition={!!onClear}>
                      <Tooltip
                        title={t('PC.Components.ChatInputHome.clearRecord')}
                      >
                        <span
                          className={cx(
                            styles.clear,
                            'flex',
                            'items-center',
                            'content-center',
                            'cursor-pointer',
                            styles.box,
                            styles['plus-box'],
                            {
                              [styles.disabled]:
                                clearDisabled || wholeDisabled || clearLoading,
                            },
                          )}
                          onClick={handleClear}
                        >
                          {clearLoading ? (
                            <LoadingOutlined />
                          ) : (
                            <SvgIcon
                              name="icons-chat-clear"
                              style={{ fontSize: '14px' }}
                              className={cx(styles['svg-icon'])}
                            />
                          )}
                        </span>
                      </Tooltip>
                    </ConditionRender>
                  )}

                  <VoiceFooter.HideWhenActive>
                    <AtMentionIcon
                      enableMention={enableMention}
                      mentionPlacement={mentionPlacement}
                      enableSubscription={isEnableSubscription}
                      onSelectMention={handleInsertAtMention}
                      usageScenarios={usageScenarios}
                      disabled={wholeDisabled}
                    />
                  </VoiceFooter.HideWhenActive>

                  {/*上传按钮*/}
                  <Upload
                    action={UPLOAD_FILE_ACTION}
                    disabled={wholeDisabled}
                    onChange={handleChange}
                    multiple={true}
                    fileList={uploadFiles}
                    headers={{
                      Authorization: token ? `Bearer ${token}` : '',
                    }}
                    data={{
                      type: 'tmp',
                    }}
                    showUploadList={false}
                  >
                    <Tooltip
                      title={t('PC.Components.ChatInputHome.uploadAttachment')}
                    >
                      <span
                        className={cx(
                          'flex',
                          'items-center',
                          'content-center',
                          'cursor-pointer',
                          styles.box,
                          styles['plus-box'],
                          { [styles['upload-box-disabled']]: wholeDisabled },
                        )}
                      >
                        <SvgIcon
                          name="icons-chat-add"
                          style={{ fontSize: '14px' }}
                          className={cx(styles['svg-icon'])}
                        />
                      </span>
                    </Tooltip>
                  </Upload>
                  <VoiceFooter.HideWhenActive>
                    {showAgentModeSelector && (
                      <Dropdown
                        menu={{
                          selectedKeys: [agentMode],
                          items: AGENT_MODE_OPTIONS.map((mode) => ({
                            key: mode,
                            label: (
                              <div
                                className={cx(
                                  styles['agent-mode-dropdown-item'],
                                )}
                              >
                                <div className={cx(styles['item-content'])}>
                                  <span className={cx(styles['item-name'])}>
                                    {t(AGENT_MODE_I18N[mode].label)}
                                  </span>
                                  <span className={cx(styles['item-desc'])}>
                                    {t(AGENT_MODE_I18N[mode].desc)}
                                  </span>
                                </div>
                                {agentMode === mode && (
                                  <CheckOutlined
                                    className={cx(styles['agent-mode-check'])}
                                  />
                                )}
                              </div>
                            ),
                            onClick: () => onAgentModeChange?.(mode),
                          })),
                        }}
                        trigger={['click']}
                        placement="topLeft"
                        disabled={wholeDisabled || streamActive}
                        overlayClassName="agent-mode-dropdown-overlay"
                        // 让菜单渲染到 body，避免被父容器 overflow: hidden 裁剪
                      >
                        <Tooltip
                          title={t('PC.Components.ChatInputHome.agentMode')}
                        >
                          <span className={cx(styles['agent-mode-select'])}>
                            <span
                              className={cx(
                                styles['agent-mode-trigger'],
                                styles[`agent-mode-option-${agentMode}`],
                              )}
                            >
                              <span>{t(AGENT_MODE_I18N[agentMode].label)}</span>
                              <SvgIcon
                                name="icons-common-caret_down"
                                style={{ fontSize: '14px' }}
                                className={cx(styles['agent-mode-arrow'])}
                              />
                            </span>
                          </span>
                        </Tooltip>
                      </Dropdown>
                    )}
                  </VoiceFooter.HideWhenActive>
                  <VoiceFooter.HideWhenActive>
                    {showTaskAgentToggle && (
                      <Tooltip
                        title={
                          isTaskAgentActive
                            ? t(
                                'PC.Components.ChatInputHome.switchToNormalMode',
                              )
                            : t(
                                'PC.Components.ChatInputHome.useAgentComputerTask',
                              )
                        }
                      >
                        <span
                          className={cx(
                            'flex',
                            'items-center',
                            'content-center',
                            'cursor-pointer',
                            styles.box,
                            styles['plus-box'],
                            styles['task-agent-box'],
                            {
                              [styles['task-agent-active']]: isTaskAgentActive,
                            },
                          )}
                          onClick={onToggleTaskAgent}
                        >
                          <DesktopOutlined style={{ fontSize: '14px' }} />
                        </span>
                      </Tooltip>
                    )}
                  </VoiceFooter.HideWhenActive>

                  <VoiceFooter.HideWhenActive>
                    <ManualComponentItem
                      manualComponents={manualComponents}
                      selectedComponentList={selectedComponentList}
                      onSelectComponent={onSelectComponent}
                    />
                  </VoiceFooter.HideWhenActive>

                  <VoiceFooter.Expand />

                  <VoiceFooter.Right
                    defaultActions={
                      showStopButton ? (
                        <Tooltip title={getStopButtonTooltip()}>
                          <span
                            onClick={handleStopConversation}
                            className={cx(
                              'flex',
                              'items-center',
                              'content-center',
                              'cursor-pointer',
                              styles.box,
                              styles['send-box'],
                              styles['stop-box'],
                              {
                                [styles['stop-box-active']]:
                                  !isStoppingConversation,
                              },
                            )}
                          >
                            {isStoppingConversation ? (
                              <div className={cx(styles['loading-box'])}>
                                <LoadingOutlined
                                  className={cx(styles['loading-icon'])}
                                />
                              </div>
                            ) : (
                              <SvgIcon name="icons-chat-stop" />
                            )}
                          </span>
                        </Tooltip>
                      ) : (
                        <Tooltip
                          title={
                            buttonSlotActive
                              ? '加入发送队列'
                              : getButtonTooltip()
                          }
                        >
                          <span
                            onClick={handleSendMessage}
                            className={cx(
                              'flex',
                              'items-center',
                              'content-center',
                              'cursor-pointer',
                              styles.box,
                              styles['send-box'],
                              {
                                [styles['send-box-queue']]: buttonSlotActive,
                                [styles.disabled]:
                                  disabledSend ||
                                  wholeDisabled ||
                                  loadingConversation ||
                                  isLoadingOtherInterface,
                              },
                            )}
                          >
                            <SvgIcon
                              name="icons-chat-send"
                              style={{ fontSize: '14px' }}
                            />
                          </span>
                        </Tooltip>
                      )
                    }
                  >
                    {prefix}
                    {isTaskAgentActive && !readonly && (
                      <ComputerTypeSelector
                        value={
                          agentSandboxId !== undefined &&
                          agentSandboxId !== null
                            ? String(agentSandboxId)
                            : conversationInfo?.sandboxServerId !== undefined &&
                              conversationInfo?.sandboxServerId !== null
                            ? String(conversationInfo.sandboxServerId)
                            : selectedComputerId
                        }
                        onChange={(id: string) => onComputerSelect?.(id)}
                        disabled={wholeDisabled}
                        agentId={agentId}
                        fixedSelection={
                          fixedSelection ||
                          streamActive ||
                          effectiveTaskExecuting
                        }
                        unavailable={isSandboxUnavailable}
                        autoSelect={autoSelectComputer}
                        saveOnSelect={saveComputerOnSelect}
                        isPersonalComputer={isPersonalComputer}
                        readonly={readonly}
                      />
                    )}
                    {allowOtherModel === DefaultSelectedEnum.Yes && (
                      <ModelSelector
                        agentId={agentId}
                        selectedModelId={selectedModelId}
                        onModelSelect={onModelSelect}
                        agentType={agentType}
                      />
                    )}
                    {showSpaceSelector && (
                      <SpaceSelector
                        selectedSpaceId={selectedSpaceId}
                        onSpaceSelect={onSpaceSelect}
                      />
                    )}
                  </VoiceFooter.Right>
                </footer>
              )}
            </VoiceFooter.Provider>
          </div>
        </div>
        {showAnnouncement && (
          <div className={cx(styles['announcement-box'])}>
            {t('PC.Components.ChatInputHome.generatedByAiNotice')}
          </div>
        )}
        {/* 滚动到底部按钮 */}
        <div className={cx(styles['chat-action'])}>
          <div
            className={cx(styles['to-bottom'], {
              [styles.visible]: delayedVisible,
            })}
            onClick={() => {
              setIsHoveringBtn(false);
              setDelayedVisible(false);
              onScrollBottom?.();
            }}
            onMouseEnter={() => setIsHoveringBtn(true)}
            onMouseLeave={() => setIsHoveringBtn(false)}
          >
            <ArrowDownOutlined />
          </div>
        </div>

        {/* 技能订阅弹窗 */}
        <ConditionRender condition={isEnableSubscription}>
          <PaymentSubscriptionModal
            open={openPaymentModal}
            targetType="Skill"
            loading={loadingTargetPricing || loadingMySubscription}
            plans={targetSubscriptionPlans}
            currentSubscribedInfo={
              mySubscriptionInfo?.currentSubscription ?? null
            }
            onClose={() => setOpenPaymentModal(false)}
            onSubscribe={createSubscriptionOrder}
          />
        </ConditionRender>
      </div>
    );
  },
);

export default ChatInputHome;
