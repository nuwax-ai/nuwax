import SvgIcon from '@/components/base/SvgIcon';
import type { AgentMode } from '@/components/business-component/AgentIntervention';
import PaymentSubscriptionModal from '@/components/business-component/PaymentSubscriptionModal';
import AtMentionIcon from '@/components/ChatInputHome/AtMentionIcon';
import ComputerTypeSelector from '@/components/ChatInputHome/ComputerTypeSelector';
import styles from '@/components/ChatInputHome/index.less';
import ManualComponentItem from '@/components/ChatInputHome/ManualComponentItem';
import MentionEditor from '@/components/ChatInputHome/MentionEditor';
import type {
  MentionEditorHandle,
  MentionItem,
} from '@/components/ChatInputHome/MentionPopup/types';
import ModelSelector from '@/components/ChatInputHome/ModelSelector';
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
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
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
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';

const cx = classNames.bind(styles);

const AGENT_MODE_LABEL: Record<AgentMode, string> = {
  yolo: 'YOLO',
  ask: 'Ask',
};

/**
 * ChatInputHomeIndependent 组件的 Props 类型
 * 将原 ChatInputHome 中 useModel('conversationInfo') 的数据改为外部传入，
 * 实现组件独立性，避免与 model 强关联。
 */
export interface ChatInputHomeIndependentProps {
  // ===== 原 ChatInputHome 的受控属性 =====
  className?: React.CSSProperties;
  wholeDisabled?: boolean;
  clearDisabled?: boolean;
  clearLoading?: boolean;
  visible?: boolean;
  isClearInput?: boolean;
  onScrollBottom?: () => void;
  onClear?: () => void;
  onEnter: (
    message: string,
    files: UploadFileInfo[],
    skillIds?: number[],
    modelId?: number,
    agentMode?: AgentMode,
  ) => void;
  enableMention?: boolean;
  mentionPlacement?: 'auto' | 'up' | 'down';
  showAnnouncement?: boolean;
  onTempChatStop?: (requestId: string) => void;
  loadingStopTempConversation?: boolean;
  showTaskAgentToggle?: boolean;
  isTaskAgentActive?: boolean;
  onToggleTaskAgent?: () => void;
  selectedComputerId?: string;
  onComputerSelect?: (id: string) => void;
  agentId?: number;
  agentSandboxId?: string | number;
  fixedSelection?: boolean;
  hasPermission?: boolean;
  isSandboxUnavailable?: boolean;
  readonly?: boolean;
  maskText?: string;
  autoSelectComputer?: boolean;
  saveComputerOnSelect?: boolean;
  isPersonalComputer?: boolean;
  allowOtherModel?: DefaultSelectedEnum;
  selectedModelId?: number;
  onModelSelect?: (modelId: number) => void;
  agentType?: string;
  agentMode?: AgentMode;
  onAgentModeChange?: (mode: AgentMode) => void;
  showAgentModeSelector?: boolean;
  placeholder?: string;
  defaultMentions?: MentionItem[];
  tabsSlot?: React.ReactNode;
  usageScenarios?: any[];
  manualComponents?: any[];
  selectedComponentList?: any[];
  onSelectComponent?: (infos: any) => void;
  prefix?: React.ReactNode;

  // ===== 原 useModel('conversationInfo') 数据，改为从外部传入 =====
  /** 停止会话的异步函数 */
  runStopConversation?: (id: string) => Promise<any>;
  /** 停止会话接口的加载状态 */
  loadingStopConversation?: boolean;
  /** 获取当前会话 ID */
  getCurrentConversationId?: () => number | null;
  /** 获取当前会话请求 ID */
  getCurrentConversationRequestId?: () => string;
  /** 会话是否正在活跃（SSE 流式交互中） */
  isConversationActive?: boolean;
  /** 强制将会话设置为非活跃状态 */
  disabledConversationActive?: () => void;
  /** 当前消息列表 */
  messageList?: MessageInfo[];
  /** 会话消息加载中状态 */
  loadingConversation?: boolean;
  /** 其它接口加载中状态（用于禁用发送按钮） */
  isLoadingOtherInterface?: boolean;
  /** 当前会话详情 */
  conversationInfo?: ConversationInfo | null;
}

/**
 * 独立版聊天输入组件
 * 与原 ChatInputHome 功能完全一致，但 conversationInfo model 数据全部从外部 props 传入，
 * 实现与 model 的解耦，便于在不同上下文（如 conversationAgent model）中复用。
 */
const ChatInputHomeIndependent: React.FC<ChatInputHomeIndependentProps> = ({
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
  mentionPlacement = 'auto',
  placeholder,
  defaultMentions,
  allowOtherModel,
  selectedModelId,
  onModelSelect,
  agentType,
  tabsSlot,
  prefix,
  agentMode = 'yolo',
  onAgentModeChange,
  showAgentModeSelector = false,
  usageScenarios,

  // 原 useModel('conversationInfo') 数据
  runStopConversation,
  loadingStopConversation = false,
  getCurrentConversationId,
  getCurrentConversationRequestId,
  isConversationActive = false,
  disabledConversationActive,
  messageList = [],
  loadingConversation = false,
  isLoadingOtherInterface = false,
  conversationInfo,
}) => {
  // 获取租户配置信息
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const isEnableSubscription = tenantConfigInfo?.enableSubscription !== 0;

  const {
    createSubscriptionOrder,
    querySkillSubscriptionPlans,
    loadingTargetPricing,
    targetSubscriptionPlans,
    mySubscriptionInfo,
    loadingMySubscription,
  } = useSubscription();

  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFileInfo[]>([]);
  const [files, setFiles] = useState<UploadFileInfo[]>([]);
  const [messageInfo, setMessageInfo] = useState<string>('');
  const [skillIds, setSkillIds] = useState<number[]>([]);
  const [isStoppingConversation, setIsStoppingConversation] =
    useState<boolean>(false);
  const mentionEditorRef = useRef<MentionEditorHandle>(null);
  const [isHoveringBtn, setIsHoveringBtn] = useState<boolean>(false);
  const [delayedVisible, setDelayedVisible] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dragCounterRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    if (visible || isHoveringBtn) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setDelayedVisible(true);
    } else {
      timerRef.current = setTimeout(() => {
        setDelayedVisible(false);
      }, 300);
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
        (item) => item.status === UploadFileStatus.done && item.url && item.key,
      ),
    );
  }, [uploadFiles]);

  const disabledSend = useMemo(() => {
    return !messageInfo && !files?.length;
  }, [messageInfo, files]);

  /**
   * 会话活跃态：上层传入的流式/任务信号 + messageList 末条 Loading 兜底
   * 与 ChatInputHome 的 streamActive 逻辑对齐，避免上层漏传时停止按钮不显示
   */
  const isSessionActive = useMemo(
    () =>
      isConversationActive ||
      isSessionStreamBusy(messageList) ||
      conversationInfo?.taskStatus === TaskStatus.EXECUTING,
    [isConversationActive, messageList, conversationInfo?.taskStatus],
  );

  useEffect(() => {
    if (!isSessionActive) {
      setIsStoppingConversation(false);
    }
  }, [isSessionActive]);

  const confirmSendMessage = (value: string) => {
    if (!!value.trim() || !!files?.length) {
      onEnter(value, files, skillIds, selectedModelId, agentMode);
      if (isClearInput) {
        setUploadFiles([]);
        setMessageInfo('');
        setSkillIds([]);
        mentionEditorRef.current?.clear();
      }
    }
  };

  const handleSendMessage = () => {
    if (
      disabledSend ||
      wholeDisabled ||
      loadingConversation ||
      isLoadingOtherInterface
    ) {
      return;
    }
    confirmSendMessage(messageInfo);
  };

  const handlePressEnter = () => {
    // 中止会话过程中不能触发 enter；会话活跃时不拦截，由外层队列逻辑入队
    if (isStoppingConversation) {
      return;
    }
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

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }, []);

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
    disabledConversationActive?.();
    onClear?.();
  };

  const handleStopConversation = useCallback(async () => {
    if (isStoppingConversation) {
      return;
    }
    setIsStoppingConversation(true);

    const requestId = getCurrentConversationRequestId?.() ?? '';
    const conversationId = getCurrentConversationId?.() ?? null;

    if (onTempChatStop && requestId) {
      onTempChatStop(requestId);
    } else if (conversationId && runStopConversation) {
      runStopConversation(conversationId.toString());
    }
  }, [
    isStoppingConversation,
    getCurrentConversationRequestId,
    getCurrentConversationId,
    runStopConversation,
    onTempChatStop,
  ]);

  const getButtonTooltip = () => {
    if (wholeDisabled) {
      return t('PC.Components.ChatInputHome.conversationDisabled');
    }
    if (disabledSend) {
      return t('PC.Components.ChatInputHome.enterQuestion');
    }
    if (isSessionActive) {
      return t('PC.Components.ChatInputHome.clickStopConversation');
    }
    return t('PC.Components.ChatInputHome.clickSendMessage');
  };

  const getStopButtonTooltip = () => {
    if (conversationInfo?.taskStatus === TaskStatus.EXECUTING) {
      if (
        isStoppingConversation ||
        loadingStopConversation ||
        loadingStopTempConversation
      ) {
        return t('PC.Components.ChatInputHome.stoppingTask');
      }
      return t('PC.Components.ChatInputHome.clickStopAgentTask');
    }

    if (!isSessionActive) {
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

  useEffect(() => {
    return () => {
      disabledConversationActive?.();
      setUploadFiles([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 本输入框所属会话 id，用于过滤队列编辑回填（避免主聊天 / 预览 Tab 串扰）
  const ownConversationId =
    getCurrentConversationId?.() ?? conversationInfo?.id ?? null;
  const ownConversationIdRef = useRef(ownConversationId);
  ownConversationIdRef.current = ownConversationId;

  // 监听队列消息编辑回填（含 skillIds / modelId / agentMode 快照）
  useEffect(() => {
    const handleEditMessage = ({
      text,
      files: editFiles,
      skillIds: editSkillIds,
      modelId: editModelId,
      selectedAgentMode: editAgentMode,
      conversationId: targetConversationId,
    }: {
      text: string;
      files?: UploadFileInfo[];
      skillIds?: number[];
      modelId?: number;
      selectedAgentMode?: AgentMode;
      conversationId?: number | string;
    }) => {
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
      if (editSkillIds?.length) {
        setSkillIds(editSkillIds);
      }
      if (editModelId !== undefined) {
        onModelSelect?.(editModelId);
      }
      if (editAgentMode !== undefined) {
        onAgentModeChange?.(editAgentMode);
      }
    };
    eventBus.on(EVENT_NAMES.QUEUE_EDIT_MESSAGE, handleEditMessage);
    return () =>
      eventBus.off(EVENT_NAMES.QUEUE_EDIT_MESSAGE, handleEditMessage);
  }, [onModelSelect, onAgentModeChange]);

  const handleInsertAtMention = useCallback(
    (item: MentionItem) => {
      mentionEditorRef.current?.handleAtIconMentionSelect(item);
    },
    [mentionEditorRef],
  );

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

        {tabsSlot && (
          <div className={cx(styles['tabs-wrapper'])}>{tabsSlot}</div>
        )}

        <div className={cx(styles['input-wrapper'])}>
          <ConditionRender condition={uploadFiles?.length}>
            <ChatUploadFile files={uploadFiles} onDel={handleDelFile} />
          </ConditionRender>
          <MentionEditor
            ref={mentionEditorRef}
            className={cx(styles.input)}
            disabled={wholeDisabled}
            value={messageInfo}
            onChange={setMessageInfo}
            onSkillIdsChange={setSkillIds}
            enableMention={enableMention}
            mentionPlacement={mentionPlacement}
            onPressEnter={handlePressEnter}
            onPaste={handlePaste}
            placeholder={placeholder}
            defaultMentions={defaultMentions}
            enableSubscription={isEnableSubscription}
            onUnsubscribedSkillSelect={handleUnsubscribedSkillSelect}
            usageScenarios={usageScenarios}
          />
          <footer className={cx('flex', 'flex-1', styles.footer)}>
            {!!messageList?.filter((item: MessageInfo) => item.id)?.length && (
              <ConditionRender condition={!!onClear}>
                <Tooltip title={t('PC.Components.ChatInputHome.clearRecord')}>
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

            <AtMentionIcon
              enableMention={enableMention}
              mentionPlacement={mentionPlacement}
              enableSubscription={isEnableSubscription}
              onSelectMention={handleInsertAtMention}
              usageScenarios={usageScenarios}
              disabled={wholeDisabled}
            />

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
            {showAgentModeSelector && (
              <Dropdown
                menu={{
                  selectedKeys: [agentMode],
                  items: (['yolo', 'ask'] as AgentMode[]).map((mode) => ({
                    key: mode,
                    label: (
                      <div className={cx(styles['agent-mode-dropdown-item'])}>
                        <span className={cx(styles['item-name'])}>
                          {AGENT_MODE_LABEL[mode]}
                        </span>
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
                disabled={wholeDisabled || isSessionActive}
                overlayClassName="agent-mode-dropdown-overlay"
              >
                <Tooltip title={t('PC.Components.ChatInputHome.agentMode')}>
                  <span className={cx(styles['agent-mode-select'])}>
                    <span
                      className={cx(
                        styles['agent-mode-trigger'],
                        styles[`agent-mode-option-${agentMode}`],
                      )}
                    >
                      <span>{AGENT_MODE_LABEL[agentMode]}</span>
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
            {showTaskAgentToggle && (
              <Tooltip
                title={
                  isTaskAgentActive
                    ? t('PC.Components.ChatInputHome.switchToNormalMode')
                    : t('PC.Components.ChatInputHome.useAgentComputerTask')
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
                    { [styles['task-agent-active']]: isTaskAgentActive },
                  )}
                  onClick={onToggleTaskAgent}
                >
                  <DesktopOutlined style={{ fontSize: '14px' }} />
                </span>
              </Tooltip>
            )}

            <ManualComponentItem
              manualComponents={manualComponents}
              selectedComponentList={selectedComponentList}
              onSelectComponent={onSelectComponent}
            />

            <div className={cx('flex')} style={{ gap: 4 }}>
              {prefix}
              {isTaskAgentActive && !readonly && (
                <ComputerTypeSelector
                  value={
                    agentSandboxId !== undefined && agentSandboxId !== null
                      ? String(agentSandboxId)
                      : conversationInfo?.sandboxServerId !== undefined &&
                        conversationInfo?.sandboxServerId !== null
                      ? String(conversationInfo.sandboxServerId)
                      : selectedComputerId
                  }
                  onChange={(id: string) => onComputerSelect?.(id)}
                  disabled={wholeDisabled}
                  agentId={agentId}
                  fixedSelection={fixedSelection || isSessionActive}
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
              {isSessionActive ? (
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
                        [styles['stop-box-active']]: !isStoppingConversation,
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
                <>
                  <Tooltip title={getButtonTooltip()}>
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
                </>
              )}
            </div>
          </footer>
        </div>
      </div>
      {showAnnouncement && (
        <div className={cx(styles['announcement-box'])}>
          {t('PC.Components.ChatInputHome.generatedByAiNotice')}
        </div>
      )}
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
};

export default ChatInputHomeIndependent;
