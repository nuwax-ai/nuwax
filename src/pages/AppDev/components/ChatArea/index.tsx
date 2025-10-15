import { PureMarkdownRenderer } from '@/components/MarkdownRenderer';
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
  DownOutlined,
  PictureOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Input,
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
import React, { useCallback, useMemo, useState } from 'react';
import styles from './index.less';
import type { ChatAreaProps } from './types';

const { Text } = Typography;

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
}) => {
  // 展开的思考过程消息
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(
    new Set(),
  );

  // 图片上传状态
  const [uploadedImages, setUploadedImages] = useState<ImageUploadInfo[]>([]);

  /**
   * 提取文件名（不包含路径）
   */
  const getFileName = useCallback((filePath: string) => {
    return filePath.split('/').pop() || filePath;
  }, []);

  /**
   * 中间截断组件 - 保留文件后缀
   */
  const EllipsisMiddle: React.FC<{ suffixCount: number; children: string }> =
    useCallback(({ suffixCount, children }) => {
      const start = children.slice(0, children.length - suffixCount);
      const suffix = children.slice(-suffixCount).trim();
      return (
        <Text style={{ maxWidth: '100%', fontSize: 11 }} ellipsis={{ suffix }}>
          {start}
        </Text>
      );
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
    try {
      // 获取当前会话ID（从最后一条消息中获取）
      const lastMessage = chat.chatMessages[chat.chatMessages.length - 1];
      const sessionId = lastMessage?.sessionId;

      if (!sessionId) {
        message.warning('无法获取当前会话ID');
        return;
      }

      console.log('🛑 [ChatArea] 取消 Agent 任务:', { projectId, sessionId });

      const response = await cancelAgentTask(projectId, sessionId);

      if (response.success) {
        message.success('Agent 任务已取消');
        // 调用原有的取消聊天功能
        chat.cancelChat();
      } else {
        message.error(`取消 Agent 任务失败: ${response.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('取消 Agent 任务失败:', error);
      message.error('取消 Agent 任务失败');
      // 即使 API 调用失败，也调用原有的取消功能
      chat.cancelChat();
    }
  }, [chat, projectId]);

  /**
   * 处理图片上传
   */
  const handleImageUpload = useCallback((file: File) => {
    // 验证是否为图片
    if (!file.type.startsWith('image/')) {
      message.warning('仅支持上传图片文件');
      return false;
    }

    // 验证文件大小 (限制为 5MB)
    if (file.size > 5 * 1024 * 1024) {
      message.warning('图片文件大小不能超过 5MB');
      return false;
    }

    // 读取文件并转换为 Base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;

      // 获取图片尺寸
      const img = new Image();
      img.onload = () => {
        const imageInfo: ImageUploadInfo = {
          uid: generateAttachmentId('img'),
          name: file.name,
          base64Data: base64Data.split(',')[1], // 移除 data:image/xxx;base64, 前缀
          mimeType: file.type,
          preview: base64Data,
          dimensions: { width: img.width, height: img.height },
        };

        setUploadedImages((prev) => [...prev, imageInfo]);
        message.success(`图片 "${file.name}" 上传成功`);
      };
      img.onerror = () => {
        message.error('图片加载失败，请重试');
      };
      img.src = base64Data;
    };
    reader.onerror = () => {
      message.error('文件读取失败，请重试');
    };
    reader.readAsDataURL(file);

    return false; // 阻止默认上传
  }, []);

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
    if (!chat.chatInput.trim() && uploadedImages.length === 0) {
      message.warning('请输入消息或上传图片');
      return;
    }

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

    // 清空图片列表(但不清空文件选择)
    setUploadedImages([]);

    // 清空选中的数据源
    if (onUpdateDataSources) {
      onUpdateDataSources([]);
    }
  }, [
    forceScrollToBottomAndEnable,
    chat,
    uploadedImages,
    fileContentState?.selectedFile,
    onUpdateDataSources,
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

      // 调试信息
      if (isAssistant && !isHistoryMessage) {
        // 调试信息已移除
      }

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
                // USER 消息: 保持纯文本渲染
                message.text
                  ?.split('\n')
                  .map((line: string, index: number) => (
                    <div key={index}>{line}</div>
                  ))
              ) : (
                // ASSISTANT 消息: 使用 PureMarkdownRenderer 流式渲染
                <div className={styles.chatAreaMarkdown}>
                  {/* 调试信息 */}
                  {/* {process.env.NODE_ENV === 'development' && (
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#999',
                        marginBottom: '4px',
                      }}
                    >
                      Debug: {message.text?.length || 0} chars, streaming:{' '}
                      {isStreaming ? 'yes' : 'no'}, typing:{' '}
                      {isHistoryMessage ? 'disabled' : 'enabled'}, autoScroll:{' '}
                      {isAutoScroll ? 'on' : 'off'}
                    </div>
                  )} */}
                  <PureMarkdownRenderer
                    key={message.id}
                    id={message.id}
                    theme="light"
                    disableTyping={isHistoryMessage}
                  >
                    {message.text}
                  </PureMarkdownRenderer>
                </div>
              )}
            </div>

            {/* 流式传输指示器 */}
            {isStreaming && (
              <div className={styles.streamingIndicator}>
                <Spin size="small" />
                <span className={styles.streamingText}>正在输出...</span>
              </div>
            )}

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

    messages.forEach((message) => {
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
            onChange={(value) => setChatMode(value as 'chat' | 'design')}
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
              options={projectInfo.versionList.map((version) => ({
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
        className={styles.chatMessages}
        ref={chatMessagesRef}
        onScroll={handleUserScroll}
      >
        {chat.isLoadingHistory ? (
          <div className={styles.loadingContainer}>
            <Spin size="small" />
            <Text type="secondary" style={{ marginLeft: 8 }}>
              正在加载历史会话...
            </Text>
          </div>
        ) : (
          chatMessagesList
        )}
        {/* 滚动到底部按钮 */}
        {showScrollButton && (
          <div
            className={styles.scrollToBottomButton}
            onClick={handleScrollButtonClick}
          >
            <DownOutlined />
          </div>
        )}

        {/* 调试信息 - 仅在开发环境显示 */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              zIndex: 1000,
            }}
          >
            <div>showScrollButton: {showScrollButton ? 'true' : 'false'}</div>
            <div>isAutoScroll: {isAutoScroll ? 'true' : 'false'}</div>
            <div>messages: {chat.chatMessages.length}</div>
            <button
              type="button"
              onClick={() => {
                // 强制显示滚动按钮进行测试
                setShowScrollButton(true);
              }}
              style={{
                marginTop: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                background: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              测试显示按钮
            </button>
          </div>
        )} */}
      </div>

      {/* 聊天输入区域 */}
      <div className={styles.chatInputContainer}>
        {/* 附件展示区域 */}
        {(uploadedImages.length > 0 || selectedDataSources.length > 0) && (
          <div className={styles.attachmentsArea}>
            {/* 第一行: 图片列表 */}
            {uploadedImages.length > 0 && (
              <div className={styles.attachmentRow}>
                <Text
                  type="secondary"
                  style={{ fontSize: '12px', marginRight: 8 }}
                >
                  图片 ({uploadedImages.length}):
                </Text>
                {uploadedImages.map((img) => (
                  <div key={img.uid} className={styles.imagePreviewItem}>
                    <img src={img.preview} alt={img.name} />
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
              <div className={styles.attachmentRow}>
                <Text
                  type="secondary"
                  style={{ fontSize: '12px', marginRight: 8 }}
                >
                  数据源 ({selectedDataSources.length}):
                </Text>
                {selectedDataSources.map((ds) => (
                  <Tag
                    key={`${ds.dataSourceId}-${ds.type}`}
                    color="green"
                    closable
                    onClose={() => handleRemoveDataSource(ds)}
                    style={{ margin: '0 4px 0 0' }}
                  >
                    {ds.type === 'plugin' ? '插件' : '工作流'} #
                    {ds.dataSourceId}
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
            if (!e.shiftKey && !e.ctrlKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          autoSize={{ minRows: 2, maxRows: 6 }}
          className={styles.textareaInput}
          disabled={chat.isChatLoading}
        />

        {/* 底部操作栏 */}
        <div className={styles.inputFooter}>
          <div className={styles.leftActions}>
            {/* 图片上传 */}
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleImageUpload}
              disabled={chat.isChatLoading}
            >
              <Tooltip title="上传图片">
                <Button
                  type="text"
                  icon={<PictureOutlined />}
                  disabled={chat.isChatLoading}
                />
              </Tooltip>
            </Upload>

            {/* 选中文件显示 */}
            {fileContentState?.selectedFile && (
              <Tooltip title={fileContentState.selectedFile}>
                <div className={styles.selectedFileDisplay}>
                  <EllipsisMiddle suffixCount={8}>
                    {getFileName(fileContentState.selectedFile)}
                  </EllipsisMiddle>
                </div>
              </Tooltip>
            )}
          </div>

          <div className={styles.rightActions}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              deepseek-v3
            </Text>

            {/* 会话进行中仅显示取消按钮 */}
            {chat.isChatLoading ? (
              <Tooltip title="取消AI任务">
                <Button
                  type="text"
                  danger
                  icon={<StopOutlined />}
                  onClick={handleCancelAgentTask}
                />
              </Tooltip>
            ) : (
              <Tooltip title="发送消息">
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={
                    !chat.chatInput.trim() && uploadedImages.length === 0
                  }
                />
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChatArea;
