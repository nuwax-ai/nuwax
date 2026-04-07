import SvgIcon from '@/components/base/SvgIcon';
import ChatUploadFile from '@/components/ChatUploadFile';
import ConditionRender from '@/components/ConditionRender';
import PermissionMask from '@/components/PermissionMask';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { t } from '@/services/i18nRuntime';
import { DefaultSelectedEnum, TaskStatus } from '@/types/enums/agent';
import { UploadFileStatus } from '@/types/enums/common';
import type { ChatInputProps, UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { handleUploadFileList } from '@/utils/upload';
import {
  ArrowDownOutlined,
  DesktopOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { message, Tooltip, Upload, UploadProps } from 'antd';
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
import AtMentionIcon from './AtMentionIcon';
import ComputerTypeSelector from './ComputerTypeSelector';
import styles from './index.less';
import ManualComponentItem from './ManualComponentItem';
import MentionEditor from './MentionEditor';
import type { MentionEditorHandle, MentionItem } from './MentionPopup/types';
import ModelSelector from './ModelSelector';

const cx = classNames.bind(styles);

/**
 * 聊天输入组件
 */
const ChatInputHome: React.FC<ChatInputProps> = ({
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
  /** 智能体类型 */
  agentType,
}) => {
  // 获取停止会话相关的方法和状态
  const {
    runStopConversation,
    loadingStopConversation,
    getCurrentConversationId,
    getCurrentConversationRequestId,
    isConversationActive,
    disabledConversationActive,
    messageList,
    loadingConversation,
    isLoadingOtherInterface,
    conversationInfo,
  } = useModel('conversationInfo');

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

  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  useEffect(() => {
    setFiles(
      uploadFiles.filter(
        (item) => item.status === UploadFileStatus.done && item.url && item.key,
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

  // enter事件 - 确认发送消息
  const confirmSendMessage = (value: string) => {
    // 如果输入框内容不为空 或者 附件文件列表不为空
    if (!!value.trim() || !!files?.length) {
      onEnter(value, files, skillIds, selectedModelId);
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
    //如果是输出过程中 或者 中止会话过程中 不能触发enter事件
    if (isConversationActive || isStoppingConversation) {
      return;
    }

    // 确认发送消息
    confirmSendMessage(messageInfo);
  };

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
   * 处理粘贴事件，支持粘贴图片上传
   * 支持从剪贴板粘贴图片（Ctrl+V 或 Cmd+V）
   * 支持多张图片同时粘贴
   */
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLDivElement>) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData || !clipboardData.items) {
        return;
      }

      // 提取所有图片文件
      const imageFiles: File[] = [];
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        // 检查是否为图片类型
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      // 如果有图片文件，则阻止默认粘贴行为并上传
      if (imageFiles.length > 0) {
        e.preventDefault();

        // 为每个图片文件创建唯一的 uid
        const newUploadFiles: any[] = imageFiles.map((file, index) => {
          const uid = uuidv4();
          return {
            uid,
            name:
              file.name ||
              t(
                'PC.Components.ChatInputHome.pastedImageFileName',
                Date.now(),
                index + 1,
              ),
            size: file.size,
            type: file.type,
            status: UploadFileStatus.uploading,
            percent: 0,
            originFileObj: file,
          };
        });

        // 先更新 UI 显示上传中状态
        setUploadFiles((prev) => [
          ...prev,
          ...handleUploadFileList(newUploadFiles),
        ]);

        // 手动上传每个文件
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
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

            // 更新上传结果
            setUploadFiles((prev) =>
              prev.map((item) =>
                item.uid === uploadFile.uid
                  ? {
                      ...item,
                      status: UploadFileStatus.done,
                      percent: 100,
                      url: result.data?.url || '',
                      key: result.data?.key || '',
                      name: result.data?.fileName || item.name,
                      response: result,
                    }
                  : item,
              ),
            );
          } catch (error) {
            console.error('Image upload failed:', error);
            message.error(
              t(
                'PC.Components.ChatInputHome.uploadFailedWithName',
                uploadFile.name,
              ),
            );

            // 更新为失败状态
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
      }
    },
    [wholeDisabled, token],
  );

  const handleClear = () => {
    if (clearDisabled || wholeDisabled) {
      return;
    }
    disabledConversationActive();
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
    // 获取当前会话ID
    const conversationId = getCurrentConversationId();

    // 修复：即使 requestId 为空也应该调用停止接口
    // 因为在会话刚开始时，requestId 可能还未设置，但会话已经在进行中
    if (onTempChatStop && requestId) {
      // 临时聊天需要 requestId
      onTempChatStop(requestId);
    } else if (conversationId) {
      // 正常会话只需要 conversationId 即可停止
      runStopConversation(conversationId);
    }
  }, [
    isStoppingConversation,
    getCurrentConversationRequestId,
    getCurrentConversationId,
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
    if (isConversationActive) {
      return t('PC.Components.ChatInputHome.clickStopConversation');
    }
    return t('PC.Components.ChatInputHome.clickSendMessage');
  };

  // 获取停止按钮提示文本
  const getStopButtonTooltip = () => {
    // 如果是任务执行状态
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

    // 普通会话状态
    if (!isConversationActive) {
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
      disabledConversationActive();
      setUploadFiles([]);
    };
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

  return (
    <div className={cx('w-full', 'relative', className)}>
      <div className={cx(styles['chat-container'], 'flex', 'flex-col')}>
        <PermissionMask
          visible={!hasPermission || isSandboxUnavailable}
          text={
            maskText ??
            (!hasPermission
              ? t('PC.Components.ChatInputHome.noAgentPermission')
              : t('PC.Components.ChatInputHome.agentComputerUnavailable'))
          }
        />
        {/*文件列表*/}
        <ConditionRender condition={uploadFiles?.length}>
          <ChatUploadFile files={uploadFiles} onDel={handleDelFile} />
        </ConditionRender>
        {/*输入框 - 使用 MentionEditor 实现 @ 提及功能*/}
        <MentionEditor
          ref={mentionEditorRef}
          className={cx(styles.input)}
          disabled={wholeDisabled}
          value={messageInfo}
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
        />
        <footer className={cx('flex', 'flex-1', styles.footer)}>
          {/* 清空会话记录 */}
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

          {/* @ 提及技能 */}
          <AtMentionIcon
            enableMention={enableMention}
            mentionPlacement={mentionPlacement}
            onSelectMention={handleInsertAtMention}
          />

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
            <Tooltip title={t('PC.Components.ChatInputHome.uploadAttachment')}>
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
          {/*通用型智能体切换按钮*/}
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
          {/* 智能体模型选择器 */}
          {allowOtherModel === DefaultSelectedEnum.Yes && (
            <ModelSelector
              agentId={agentId}
              selectedModelId={selectedModelId}
              onModelSelect={onModelSelect}
              agentType={agentType}
            />
          )}
          <div className={cx('flex')} style={{ gap: 4 }}>
            {/* 智能体电脑模式下显示电脑类型选择器 */}
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
                fixedSelection={
                  fixedSelection ||
                  isConversationActive ||
                  conversationInfo?.taskStatus === TaskStatus.EXECUTING
                }
                unavailable={isSandboxUnavailable}
                autoSelect={autoSelectComputer}
                saveOnSelect={saveComputerOnSelect}
                isPersonalComputer={isPersonalComputer}
                readonly={readonly}
              />
            )}
            {/* 根据会话状态显示发送或停止按钮 */}
            {isConversationActive ||
            conversationInfo?.taskStatus === TaskStatus.EXECUTING ? (
              // 会话进行中，显示停止按钮
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
                    // 当会话进行中且按钮可点击时，使用高亮样式
                    {
                      [styles['stop-box-active']]:
                        // !disabledStop &&
                        // !wholeDisabled &&
                        !isStoppingConversation,
                    },
                    // { [styles.disabled]: disabledStop || wholeDisabled },
                  )}
                >
                  {isStoppingConversation ? (
                    <div className={cx(styles['loading-box'])}>
                      <LoadingOutlined className={cx(styles['loading-icon'])} />
                    </div>
                  ) : (
                    <SvgIcon name="icons-chat-stop" />
                  )}
                </span>
              </Tooltip>
            ) : (
              // 会话未进行中，显示发送按钮
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
      {showAnnouncement && (
        <div className={cx(styles['announcement-box'])}>
          {t('PC.Components.ChatInputHome.generatedByAiNotice')}
        </div>
      )}
      {/* 滚动到底部按钮 */}
      <div className={cx(styles['chat-action'])}>
        <div
          className={cx(styles['to-bottom'], { [styles.visible]: visible })}
          onClick={onScrollBottom}
        >
          <ArrowDownOutlined />
        </div>
      </div>
    </div>
  );
};

export default ChatInputHome;
