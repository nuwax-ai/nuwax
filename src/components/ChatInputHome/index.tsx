import SvgIcon from '@/components/base/SvgIcon';
import ChatUploadFile from '@/components/ChatUploadFile';
import ComputerTypeSelector from '@/components/ComputerTypeSelector';
import ConditionRender from '@/components/ConditionRender';
import PermissionMask from '@/components/PermissionMask';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { TaskStatus } from '@/types/enums/agent';
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
import styles from './index.less';
import ManualComponentItem from './ManualComponentItem';
import MentionEditor from './MentionEditor';
import MentionPopup from './MentionPopup';
import type { MentionEditorHandle, MentionItem } from './MentionPopup/types';

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
  enableMention = true,
  // @ 提及弹窗展示方向：auto | up | down，默认 auto
  mentionPlacement = 'auto',
  /** 占位符文本 */
  placeholder,
  /** 默认提及项列表（需同时传入 value 文本） */
  defaultMentions,
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
  // 底部 @ 图标引用（用于定位弹窗）
  const mentionIconRef = useRef<HTMLSpanElement | null>(null);
  // 控制底部 @ 图标 Tooltip 显隐（避免弹窗关闭时 tooltip 又冒出来）
  const [mentionTooltipOpen, setMentionTooltipOpen] = useState<boolean>(false);
  // 标记用户是否已经使用过底部 @ 图标，使用过后不再展示引导 Tooltip
  const [hasUsedMentionIcon, setHasUsedMentionIcon] = useState<boolean>(false);

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
      onEnter(value, files, skillIds);
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
            name: file.name || `粘贴图片-${Date.now()}-${index + 1}.png`,
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
            console.error('图片上传失败:', error);
            message.error(`${uploadFile.name} 上传失败`);

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
      return '会话已禁用';
    }
    if (disabledSend) {
      return '请输入你的问题';
    }
    if (isConversationActive) {
      return '点击停止当前会话';
    }
    return '点击发送消息';
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
        return '正在停止任务...';
      }
      return '点击停止Agent任务';
    }

    // 普通会话状态
    if (!isConversationActive) {
      return '当前无进行中的会话';
    }
    if (
      isStoppingConversation ||
      loadingStopConversation ||
      loadingStopTempConversation
    ) {
      return '正在停止会话...';
    }
    return '点击停止当前会话';
  };

  useEffect(() => {
    return () => {
      disabledConversationActive();
      setUploadFiles([]);
    };
  }, []);

  // ==================== @ 提及功能相关状态和方法 ====================

  /** 是否显示提及弹窗 */
  const [atIconShowMentionPopup, setAtIconShowMentionPopup] =
    useState<boolean>(false);
  /** 弹窗显示位置（向下用 top，向上用 bottom，与 MentionEditor 一致） */
  const [atIconMentionPosition, setAtIconMentionPosition] = useState<{
    top?: number;
    left: number;
    bottom?: number;
  }>({ top: 0, left: 0 });

  /**
   * 处理从弹窗中选择提及项
   * 将选中的提及插入到编辑器中，替换 @ 和搜索文本
   *
   * @param item - 选中的提及项
   */
  const handleAtIconMentionSelect = useCallback((item: MentionItem) => {
    setAtIconShowMentionPopup(false);
    setHasUsedMentionIcon(false);
    mentionEditorRef.current?.handleAtIconMentionSelect(item);
  }, []);

  /**
   * 关闭提及弹窗
   */
  const closeAtIconMentionPopup = useCallback(() => {
    setAtIconShowMentionPopup(false);
    // 同步关闭底部 @ 图标的 Tooltip，避免弹窗关闭时 Tooltip 重新出现
    setMentionTooltipOpen(false);
    setHasUsedMentionIcon(false);
  }, []);

  /**
   * 点击底部 @ 图标：打开 MentionPopup 并将弹窗锚定到图标附近
   */
  const handleMentionIconClick = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      // 关闭 @ 提及功能时，点击只负责光标定位，不触发弹窗
      if (!enableMention) {
        closeAtIconMentionPopup();
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // 点击后立刻关闭 Tooltip
      setMentionTooltipOpen(false);
      // 用户已经主动点击使用过一次，之后不再展示引导 Tooltip
      setHasUsedMentionIcon(true);

      // 以 @ 图标作为锚点，向下用 top 定位，向上用 bottom 定位（与 MentionEditor 一致，高度变化时不闪动）
      const iconEl = mentionIconRef.current;
      if (iconEl) {
        const rect = iconEl.getBoundingClientRect();
        const viewportHeight =
          window.innerHeight || document.documentElement.clientHeight || 0;
        const viewportWidth =
          window.innerWidth || document.documentElement.clientWidth || 0;

        const POPUP_ESTIMATED_HEIGHT = 320;
        const POPUP_WIDTH = 280;
        const margin = 8;

        let finalPlacement: 'up' | 'down';
        if (mentionPlacement === 'auto') {
          const spaceBelow = viewportHeight - rect.bottom;
          finalPlacement = spaceBelow >= POPUP_ESTIMATED_HEIGHT ? 'down' : 'up';
        } else {
          finalPlacement = mentionPlacement;
        }

        const left = Math.min(
          Math.max(4, rect.left),
          viewportWidth - POPUP_WIDTH - margin,
        );

        if (finalPlacement === 'down') {
          let top = rect.bottom + 4;
          const maxTop = viewportHeight - POPUP_ESTIMATED_HEIGHT - 4;
          if (top > maxTop) top = Math.max(4, maxTop);
          setAtIconMentionPosition({ left, top });
        } else {
          const bottomCss = viewportHeight - (rect.top - 4);
          setAtIconMentionPosition({ left, bottom: bottomCss });
        }
      }

      setAtIconShowMentionPopup(true);
    },
    [enableMention, mentionPlacement, closeAtIconMentionPopup],
  );

  /**
   * 点击外部区域关闭弹窗
   */
  useEffect(() => {
    // 如果 @ 提及功能未启用，则不监听点击外部区域关闭弹窗
    if (!enableMention) {
      return;
    }

    /**
     * 点击外部区域关闭弹窗
     */
    const handleClickOutside = (e: MouseEvent) => {
      if (!atIconShowMentionPopup) {
        return;
      }
      const target = e.target as HTMLElement;
      // 点击在弹窗本体内部（含 Tab、列表、空白）不关闭，仅点击弹窗外部才关闭
      if (target.closest('[data-mention-popup]')) {
        return;
      }
      closeAtIconMentionPopup();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [atIconShowMentionPopup, closeAtIconMentionPopup, enableMention]);

  return (
    <div className={cx('w-full', 'relative', className)}>
      <div className={cx(styles['chat-container'], 'flex', 'flex-col')}>
        <PermissionMask
          visible={!hasPermission || isSandboxUnavailable}
          text={
            maskText ??
            (!hasPermission ? '无智能体使用权限' : '会话关联的智能体电脑不可用')
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
          {/* @ 提及技能 */}
          <ConditionRender condition={enableMention}>
            <Tooltip
              title={hasUsedMentionIcon ? '' : '试试 @ 提及技能'}
              open={mentionTooltipOpen && !atIconShowMentionPopup}
              onOpenChange={setMentionTooltipOpen}
            >
              <span
                ref={mentionIconRef}
                className={cx(
                  'flex',
                  'items-center',
                  'content-center',
                  'cursor-pointer',
                  styles.clear,
                  styles.box,
                  styles['plus-box'],
                )}
                onClick={handleMentionIconClick}
              >
                @
              </span>
            </Tooltip>

            {/* @提及技能选择弹窗 */}
            <MentionPopup
              visible={atIconShowMentionPopup}
              position={atIconMentionPosition}
              onSelect={handleAtIconMentionSelect}
              onClose={closeAtIconMentionPopup}
              showSearchInput={true}
            />
          </ConditionRender>

          {/* 清空会话记录 */}
          {!!messageList?.filter((item: MessageInfo) => item.id)?.length && (
            <ConditionRender condition={!!onClear}>
              <Tooltip title="清空会话记录">
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
            <Tooltip title="上传附件">
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
          {/*任务智能体切换按钮*/}
          {showTaskAgentToggle && (
            <Tooltip
              title={
                isTaskAgentActive
                  ? '切换到普通模式'
                  : '使用我的智能体电脑执行任务'
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
          {/*手动选择组件*/}
          <ManualComponentItem
            manualComponents={manualComponents}
            selectedComponentList={selectedComponentList}
            onSelectComponent={onSelectComponent}
          />
          <div className={cx('flex')} style={{ gap: 4 }}>
            {/* 智能体电脑模式下显示电脑类型选择器 */}
            {isTaskAgentActive && (
              <ComputerTypeSelector
                value={
                  agentSandboxId !== undefined && agentSandboxId !== null
                    ? String(agentSandboxId)
                    : conversationInfo?.sandboxServerId !== undefined &&
                      conversationInfo?.sandboxServerId !== null
                    ? String(conversationInfo.sandboxServerId)
                    : selectedComputerId
                }
                onChange={(id) => onComputerSelect?.(id)}
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
          内容由AI生成，请仔细甄别
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
