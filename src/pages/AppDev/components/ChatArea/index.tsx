import SvgIcon from '@/components/base/SvgIcon';
import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import { useChatScroll, useChatScrollEffects } from '@/hooks/useChatScroll';
import { cancelAgentTask } from '@/services/appDev';
import type {
  AppDevChatMessage,
  Attachment,
  ImageUploadInfo,
} from '@/types/interfaces/appDev';
import { generateAttachmentId } from '@/utils/chatUtils';
import {
  CloseCircleOutlined,
  ControlOutlined,
  DownOutlined,
  LoadingOutlined,
  MessageOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Dropdown,
  Image,
  Input,
  Menu,
  message,
  Segmented,
  Select,
  Spin,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AppDevMarkdownCMDWrapper from './components/AppDevMarkdownCMDWrapper';
import MessageAttachment from './components/MessageAttachment';
import styles from './index.less';

const { Text } = Typography;

interface ChatAreaProps {
  chatMode: 'chat' | 'code';
  setChatMode: (mode: 'chat' | 'code') => void;
  chat: any;
  projectInfo: any;
  projectId: string;
  onVersionSelect: (version: any) => void;
  selectedDataSources?: any[];
  onUpdateDataSources: (dataSources: any[]) => void;
  fileContentState: any;
  modelSelector: any;
  onClearUploadedImages?: (callback: () => void) => void;
  onRefreshVersionList?: () => void; // 新增：刷新版本列表回调
}

/**
 * 聊天会话区域组件
 * 包含聊天模式切换、消息显示和输入区域
 */
const ChatArea: React.FC<ChatAreaProps> = ({
  chatMode,
  setChatMode,
  chat,
  projectInfo,
  projectId,
  onVersionSelect,
  selectedDataSources = [],
  onUpdateDataSources,
  fileContentState,
  modelSelector,
  onClearUploadedImages,
  onRefreshVersionList, // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
  // 展开的思考过程消息
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(
    new Set(),
  );

  // 图片上传状态
  const [uploadedImages, setUploadedImages] = useState<ImageUploadInfo[]>([]);

  // 停止按钮 loading 状态
  const [isStoppingTask, setIsStoppingTask] = useState(false);

  // 发送按钮 loading 状态
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // 暴露图片清空方法给父组件
  useEffect(() => {
    if (onClearUploadedImages) {
      onClearUploadedImages(() => {
        setUploadedImages([]);
      });
    }
  }, [onClearUploadedImages]);

  /**
   * 提取文件名（不包含路径）
   */
  const getFileName = useCallback((filePath: string) => {
    return filePath.split('/').pop() || filePath;
  }, []);

  // 使用滚动管理 hook
  const {
    isAutoScroll,
    showScrollButton,
    chatMessagesRef,
    userScrollDisabled,
    scrollToBottom,
    checkScrollPosition,
    handleUserScroll,
    handleScrollButtonClick,
    forceScrollToBottomAndEnable,
  } = useChatScroll();

  /**
   * 切换思考过程展开状态
   */
  const toggleThinkingExpansion = useCallback((messageId: string) => {
    setExpandedThinking((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  /**
   * 取消 Agent 任务
   */
  const handleCancelAgentTask = useCallback(async () => {
    if (isStoppingTask) {
      return; // 防止重复点击
    }

    setIsStoppingTask(true);

    try {
      // 获取当前会话ID（从最后一条消息中获取）
      const lastMessage = chat.chatMessages[chat.chatMessages.length - 1];
      const sessionId = lastMessage?.sessionId;

      if (!sessionId) {
        message.warning('无法获取当前会话ID');
        return;
      }

      const response = await cancelAgentTask(projectId, sessionId);

      if (response.success) {
        message.success('Agent 任务已取消');
        // 调用原有的取消聊天功能
        chat.cancelChat();
      } else {
        message.error(`取消 Agent 任务失败: ${response.message || '未知错误'}`);
      }
    } catch (error) {
      message.error('取消 Agent 任务失败');
      // 即使 API 调用失败，也调用原有的取消功能
      chat.cancelChat();
    } finally {
      setIsStoppingTask(false);
    }
  }, [chat, projectId, isStoppingTask]);

  /**
   * 处理单个图片文件
   */
  const processImageFile = useCallback(
    (file: File): Promise<ImageUploadInfo> => {
      return new Promise((resolve, reject) => {
        // 验证是否为图片
        if (!file.type.startsWith('image/')) {
          reject(new Error('仅支持上传图片文件'));
          return;
        }

        // 验证文件大小 (限制为 5MB)
        if (file.size > 5 * 1024 * 1024) {
          reject(new Error('图片文件大小不能超过 5MB'));
          return;
        }

        // 读取文件并转换为 Base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = e.target?.result as string;

          // 获取图片尺寸
          const img = new window.Image();
          img.onload = () => {
            const imageInfo: ImageUploadInfo = {
              uid: generateAttachmentId('img'),
              name: file.name,
              base64Data: base64Data.split(',')[1], // 移除 data:image/xxx;base64, 前缀
              mimeType: file.type,
              preview: base64Data,
              dimensions: { width: img.width, height: img.height },
            };
            resolve(imageInfo);
          };
          img.onerror = () => {
            reject(new Error('图片加载失败，请重试'));
          };
          img.src = base64Data;
        };
        reader.onerror = () => {
          reject(new Error('文件读取失败，请重试'));
        };
        reader.readAsDataURL(file);
      });
    },
    [],
  );

  /**
   * 处理图片上传（支持多选）
   */
  const handleImageUpload = useCallback(
    async (file: File | File[]) => {
      const files = Array.isArray(file) ? file : [file];

      if (files.length === 0) {
        return false;
      }

      // 检查总数量限制（最多10张图片）
      const currentCount = uploadedImages.length;
      if (currentCount + files.length > 10) {
        message.warning(`最多只能上传10张图片，当前已有${currentCount}张`);
        return false;
      }

      try {
        // 显示加载提示
        const loadingMessage =
          files.length === 1
            ? `正在上传图片 "${files[0].name}"...`
            : `正在上传 ${files.length} 张图片...`;
        const hideLoading = message.loading(loadingMessage, 0);

        // 处理所有文件
        const imagePromises = files.map(processImageFile);
        const imageInfos = await Promise.all(imagePromises);

        // 批量添加到状态
        setUploadedImages((prev) => [...prev, ...imageInfos]);

        // 隐藏加载提示并显示成功消息
        hideLoading();
        if (files.length === 1) {
          message.success(`图片 "${files[0].name}" 上传成功`);
        } else {
          message.success(`成功上传 ${files.length} 张图片`);
        }
      } catch (error) {
        message.error(error instanceof Error ? error.message : '图片上传失败');
      }

      return false; // 阻止默认上传
    },
    [processImageFile, uploadedImages.length],
  );

  /**
   * 删除图片
   */
  const handleDeleteImage = useCallback((uid: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.uid !== uid));
  }, []);

  /**
   * 移除单个数据源
   */
  const handleRemoveDataSource = useCallback(
    (dataSource: any) => {
      if (!onUpdateDataSources) {
        message.warning('数据源删除功能需要父组件支持');
        return;
      }

      const newDataSources = selectedDataSources.filter(
        (ds) =>
          !(
            ds.dataSourceId === dataSource.dataSourceId &&
            ds.type === dataSource.type
          ),
      );

      onUpdateDataSources(newDataSources);
      message.success('数据源已移除');
    },
    [selectedDataSources, onUpdateDataSources],
  );

  /**
   * 发送消息前的处理 - 支持附件
   */
  const handleSendMessage = useCallback(() => {
    // 验证：prompt（输入内容）是必填的
    if (!chat.chatInput.trim()) {
      message.warning('请输入消息内容');
      return;
    }

    // 防止重复发送
    if (isSendingMessage || chat.isChatLoading) {
      return;
    }

    setIsSendingMessage(true);

    try {
      // 构建附件列表
      const attachments: Attachment[] = [];

      // 1. 添加图片附件
      uploadedImages.forEach((img) => {
        attachments.push({
          type: 'Image',
          content: {
            id: img.uid,
            filename: img.name,
            mime_type: img.mimeType,
            dimensions: img.dimensions,
            source: {
              source_type: 'Base64',
              data: {
                data: img.base64Data,
                mime_type: img.mimeType,
              },
            },
          },
        });
      });

      // 2. 添加文件树选中的文件(如果有)
      if (fileContentState?.selectedFile) {
        attachments.push({
          type: 'Text',
          content: {
            id: generateAttachmentId('file'),
            filename: fileContentState.selectedFile,
            source: {
              source_type: 'FilePath',
              data: {
                path: fileContentState.selectedFile, // 包含路径与文件名及后缀
              },
            },
          },
        });
      }

      // 发送消息后强制滚动到底部并开启自动滚动
      forceScrollToBottomAndEnable();

      // 发送消息(传递附件)
      chat.sendMessage(attachments);

      // 清空选中的数据源
      if (onUpdateDataSources) {
        onUpdateDataSources([]);
      }
    } catch (error) {
      message.error('发送消息失败');
    } finally {
      // 延迟重置发送状态，给用户反馈
      setTimeout(() => {
        setIsSendingMessage(false);
      }, 500);
    }
  }, [
    forceScrollToBottomAndEnable,
    chat,
    uploadedImages,
    fileContentState?.selectedFile,
    onUpdateDataSources,
    isSendingMessage,
  ]);

  /**
   * 渲染聊天消息 - 按 role 区分渲染
   */
  const renderChatMessage = useCallback(
    (message: AppDevChatMessage) => {
      const isUser = message.role === 'USER';
      const isAssistant = message.role === 'ASSISTANT';

      // 判断是否为历史消息（有会话信息）
      const isHistoryMessage = !!(
        message.conversationTopic && message.conversationCreated
      );

      // 在历史会话渲染场景中，完全忽略所有状态
      const isStreaming = !isHistoryMessage && message.isStreaming === true; // 只有非历史消息才显示流式传输状态
      const isLoading = false; // 历史消息永远不显示加载状态
      const isError = false; // 历史消息永远不显示错误状态
      const hasThinking = message.think && message.think.trim() !== '';
      const isThinkingExpanded = expandedThinking.has(message.id);

      return (
        <div
          key={message.id}
          className={`${styles.messageWrapper} ${
            isUser ? styles.user : styles.assistant
          }`}
        >
          <div className={styles.messageBubble}>
            {/* 消息内容 */}
            <div className={styles.messageContent}>
              {isUser ? (
                // USER 消息: 渲染文本和附件
                <div>
                  {/* 文本内容 */}
                  {message.text
                    ?.split('\n')
                    .map((line: string, index: number) => (
                      <div key={index}>{line}</div>
                    ))}

                  {/* 附件渲染 */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className={styles.messageAttachments}>
                      {message.attachments.map((attachment) => (
                        <MessageAttachment
                          key={attachment.content.id}
                          attachment={attachment.content}
                          type={attachment.type}
                          size={80}
                          showPreview={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // ASSISTANT 消息: 使用 MarkdownCMD 流式渲染
                <AppDevMarkdownCMDWrapper
                  key={message.id}
                  message={message}
                  isHistoryMessage={isHistoryMessage}
                />
              )}
            </div>

            {/* 加载状态 */}
            {isLoading && !isStreaming && (
              <div className={styles.loadingIndicator}>
                <Spin size="small" />
                <span>正在思考...</span>
              </div>
            )}

            {/* 错误状态 */}
            {isError && (
              <div className={styles.errorIndicator}>
                <span>❌ 消息发送失败</span>
              </div>
            )}

            {/* 思考过程区域 */}
            {hasThinking && isAssistant && (
              <div className={styles.thinkingArea}>
                <div
                  className={styles.thinkingHeader}
                  onClick={() => toggleThinkingExpansion(message.id)}
                >
                  <span className={styles.thinkingTitle}>💭 AI 思考过程</span>
                  <span className={styles.expandIcon}>
                    {isThinkingExpanded ? '▼' : '▶'}
                  </span>
                </div>
                {isThinkingExpanded && (
                  <div className={styles.thinkingContent}>
                    {message.think
                      ?.split('\n')
                      .map((line: string, index: number) => (
                        <div key={index} className={styles.thinkingLine}>
                          {line}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* 流式传输指示器 - 放在最下面 */}
            {isStreaming && (
              <div className={styles.streamingIndicator}>
                <Spin size="small" />
                {/* <span className={styles.streamingText}>正在输出...</span> */}
              </div>
            )}
          </div>
        </div>
      );
    },
    [expandedThinking, toggleThinkingExpansion],
  );

  /**
   * 聊天消息列表（memo化）
   */
  /**
   * 渲染会话分隔符
   */
  const renderConversationDivider = useCallback(
    (
      conversationTopic: string,
      conversationCreated: string,
      // sessionId: string, // 暂时未使用，保留以备将来使用
    ) => {
      return (
        <div
          key={`divider-${conversationCreated}`}
          className={styles.conversationDivider}
        >
          <div className={styles.dividerLine} />
          <div className={styles.dividerContent}>
            <Text type="secondary" className={styles.conversationTopic}>
              {conversationTopic}
            </Text>
            <Text type="secondary" className={styles.conversationTime}>
              {dayjs(conversationCreated).format('YYYY-MM-DD HH:mm')}
            </Text>
          </div>
          <div className={styles.dividerLine} />
        </div>
      );
    },
    [],
  );

  const chatMessagesList = useMemo(() => {
    const messages = chat.chatMessages;
    const renderedMessages: React.ReactNode[] = [];
    let currentSessionId: string | null = null;

    messages.forEach((message: AppDevChatMessage) => {
      // 检查是否需要添加会话分隔符
      if (
        message.conversationTopic &&
        message.sessionId &&
        message.sessionId !== currentSessionId
      ) {
        renderedMessages.push(
          renderConversationDivider(
            message.conversationTopic,
            message.conversationCreated || message.time,
          ),
        );
        currentSessionId = message.sessionId;
      }

      // 渲染消息
      renderedMessages.push(renderChatMessage(message));
    });

    return renderedMessages;
  }, [chat.chatMessages, renderChatMessage, renderConversationDivider]);

  // 使用滚动效果 hook
  useChatScrollEffects(
    chat.chatMessages,
    chat.isLoadingHistory,
    scrollToBottom,
    isAutoScroll,
    checkScrollPosition,
    userScrollDisabled,
  );

  const labelRender = useCallback((props: any) => {
    return <span>v{props.value.replace('v', '')}</span>;
  }, []);

  return (
    <Card className={styles.chatCard} bordered={false}>
      {/* 聊天模式切换 */}
      <div className={styles.chatModeContainer}>
        <div className={styles.chatModeSwitcher}>
          <Segmented
            value={chatMode}
            onChange={(value) => setChatMode(value as 'chat' | 'code')}
            options={[
              { label: 'Chat', value: 'chat' },
              {
                label: 'Design',
                value: 'design',
                disabled: true,
                title: '暂未开放',
              },
            ]}
            className={styles.chatModeSegmented}
          />
          <div className={styles.versionSelectorWrapper}>
            <Select
              value={
                projectInfo.projectInfoState.projectInfo?.codeVersion
                  ? `v${projectInfo.projectInfoState.projectInfo.codeVersion}`
                  : undefined
              }
              size="small"
              className={styles.versionSelector}
              options={projectInfo.versionList.map((version: any) => ({
                label: `v${version.version}`,
                value: version.version,
                action: version.action,
              }))}
              labelRender={labelRender}
              popupMatchSelectWidth={150}
              optionRender={(option) => {
                return (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>v{option.data.value}</span>
                    <Tag
                      color={projectInfo.getActionColor(option.data.action)}
                      style={{ marginLeft: 8, fontSize: '10px' }}
                    >
                      {projectInfo.getActionText(option.data.action)}
                    </Tag>
                  </div>
                );
              }}
              suffixIcon={<DownOutlined />}
              onChange={(value) => {
                onVersionSelect(parseInt(value));
              }}
              placeholder="选择版本"
              disabled={projectInfo.versionList.length === 0}
            />
          </div>

          {/* 历史会话选择器 */}
          {/* <div className={styles.conversationSelectorWrapper}>
            <ConversationSelector
              projectId={projectId}
              currentSessionId={chat.currentSessionId}
              onSessionChange={loadHistorySession}
              setChatMessages={chat.setChatMessages}
            />
          </div> */}
        </div>
      </div>

      {/* 聊天消息区域 */}
      <div
        className={`${styles.chatMessages}`}
        ref={chatMessagesRef}
        onScroll={handleUserScroll}
      >
        {chat.isLoadingHistory ? (
          <AppDevEmptyState
            type="loading"
            icon={<LoadingOutlined />}
            title="正在加载历史会话"
            description="请稍候..."
          />
        ) : !chat.messages || chat.messages.length === 0 ? (
          <AppDevEmptyState
            type="empty"
            icon={<MessageOutlined />}
            title="开始新对话"
            description="向 AI 助手提问，开始您的项目开发"
          />
        ) : (
          chatMessagesList
        )}
      </div>
      {/* 聊天输入区域 */}
      <div className={styles.chatInputContainer}>
        {showScrollButton && (
          <div
            className={styles.scrollToBottomButton}
            onClick={handleScrollButtonClick}
          >
            <DownOutlined />
          </div>
        )}
        {/* 附件展示区域 */}
        {(uploadedImages.length > 0 || selectedDataSources.length > 0) && (
          <div className={styles.attachmentsArea}>
            {/* 第一行: 图片列表 */}
            {uploadedImages.length > 0 && (
              <div className={styles.attachmentRow}>
                {uploadedImages.map((img) => (
                  <div key={img.uid} className={styles.imagePreviewItem}>
                    <Image
                      src={img.preview}
                      alt={img.name}
                      width={36}
                      height={36}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                      preview={{
                        mask: false, // 禁用默认的预览遮罩
                      }}
                    />
                    <CloseCircleOutlined
                      className={styles.deleteIcon}
                      onClick={() => handleDeleteImage(img.uid)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 第二行: 数据源 */}
            {selectedDataSources.length > 0 && (
              <div className={styles.attachmentRow} style={{ padding: 0 }}>
                {/* <Text
                  type="secondary"
                  style={{ fontSize: '12px', marginRight: 8 }}
                >
                  数据源 ({selectedDataSources.length}):
                </Text> */}
                {selectedDataSources.map((ds) => (
                  <Tag
                    key={`${ds.dataSourceId}-${ds.type}`}
                    color="green"
                    closable
                    onClose={() => handleRemoveDataSource(ds)}
                    style={{ margin: '0 4px 0 0' }}
                  >
                    {ds.name}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TextArea 输入框 */}
        <Input.TextArea
          placeholder="向AI助手提问..."
          value={chat.chatInput}
          onChange={(e) => chat.setChatInput(e.target.value)}
          onPressEnter={(e) => {
            if (!e.ctrlKey) {
              if (chat.isChatLoading) {
                //当前还在输出 不能提交
                return message.info('执行中 不能发送');
              }
              handleSendMessage();
            }
          }}
          autoSize={{ minRows: 2, maxRows: 6 }}
          className={styles.textareaInput}
        />

        {/* 底部操作栏 */}
        <div className={styles.inputFooter}>
          <div className={styles.leftActions}>
            {/* 选中文件显示 */}
            {fileContentState?.selectedFile && (
              <Tooltip title={fileContentState.selectedFile}>
                <div
                  className={`text-ellipsis ${styles.selectedFileDisplay}`}
                  style={{ maxWidth: '150px' }}
                >
                  {getFileName(fileContentState.selectedFile)}
                </div>
              </Tooltip>
            )}
          </div>
          <div className={styles.rightActions}>
            {/* 图片上传 */}
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleImageUpload}
              disabled={chat.isChatLoading}
              multiple={true}
              maxCount={10}
            >
              <Tooltip title="上传图片">
                <Button
                  type="text"
                  icon={<PictureOutlined />}
                  disabled={chat.isChatLoading}
                />
              </Tooltip>
            </Upload>
            {/* 模型选择器 - 图标占位形式 */}
            <Dropdown
              overlay={
                <Menu
                  selectedKeys={
                    modelSelector?.selectedModelId
                      ? [modelSelector.selectedModelId.toString()]
                      : []
                  }
                  onClick={({ key }) => modelSelector?.selectModel(Number(key))}
                  style={{ maxHeight: 200, overflowY: 'auto' }}
                >
                  {modelSelector?.models?.map((model: any) => (
                    <Menu.Item
                      key={model.id.toString()}
                      disabled={chat.isChatLoading}
                    >
                      {model.name}
                    </Menu.Item>
                  ))}
                </Menu>
              }
              trigger={['click']}
              disabled={chat.isChatLoading || modelSelector?.isLoadingModels}
              placement="topLeft"
            >
              <Tooltip
                title={`当前模型: ${
                  modelSelector?.models?.find(
                    (m: any) => m.id === modelSelector?.selectedModelId,
                  )?.name || '未选择'
                }`}
              >
                <Button
                  type="text"
                  icon={<ControlOutlined />}
                  disabled={
                    chat.isChatLoading || modelSelector?.isLoadingModels
                  }
                  loading={modelSelector?.isLoadingModels}
                  className={styles.modelSelectorButton}
                />
              </Tooltip>
            </Dropdown>

            {/* 会话进行中仅显示取消按钮 */}
            {chat.isChatLoading ? (
              <Tooltip title={isStoppingTask ? '正在停止...' : '取消AI任务'}>
                <span
                  onClick={handleCancelAgentTask}
                  className={`${styles.box} ${styles['send-box']} ${
                    styles['stop-box']
                  } ${!isStoppingTask ? styles['stop-box-active'] : ''} ${
                    isStoppingTask ? styles.disabled : ''
                  }`}
                >
                  {isStoppingTask ? (
                    <div className={styles['loading-box']}>
                      <LoadingOutlined className={styles['loading-icon']} />
                    </div>
                  ) : (
                    <SvgIcon name="icons-chat-stop" />
                  )}
                </span>
              </Tooltip>
            ) : (
              <Tooltip title={isSendingMessage ? '正在发送...' : '发送消息'}>
                <span
                  onClick={handleSendMessage}
                  className={`${styles.box} ${styles['send-box']} ${
                    !chat.chatInput.trim() || isSendingMessage
                      ? styles.disabled
                      : ''
                  }`}
                >
                  {isSendingMessage ? (
                    <div className={styles['loading-box']}>
                      <LoadingOutlined className={styles['loading-icon']} />
                    </div>
                  ) : (
                    <SvgIcon name="icons-chat-send" />
                  )}
                </span>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChatArea;
