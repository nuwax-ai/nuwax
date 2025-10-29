import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import ReactScrollToBottomContainer, {
  ReactScrollToBottomContainerRef,
} from '@/pages/AppDev/components/ChatArea/components/ReactScrollToBottomContainer';
import { cancelAgentTask, cancelAiChatAgentTask } from '@/services/appDev';
import type {
  AppDevChatMessage,
  Attachment,
  DataSourceSelection,
  DocumentAttachment,
  ImageAttachment,
} from '@/types/interfaces/appDev';
import { UploadFileInfo } from '@/types/interfaces/common';
import { DataResource } from '@/types/interfaces/dataResource';
import {
  convertDataSourceSelectionToAttachment,
  generateAttachmentId,
} from '@/utils/chatUtils';
import {
  DownOutlined,
  LoadingOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { Card, message, Spin, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import AppDevMarkdownCMDWrapper from './components/AppDevMarkdownCMDWrapper';
import ChatInputHome from './components/ChatInputHome';
import MessageAttachment from './components/MessageAttachment';
import styles from './index.less';

const { Text } = Typography;

interface ChatAreaProps {
  // chatMode: 'chat' | 'code';
  // setChatMode: (mode: 'chat' | 'code') => void;
  chat: any;
  // projectInfo: any;
  projectId: string;
  // onVersionSelect: (version: any) => void;
  selectedDataSources?: DataResource[];
  onUpdateDataSources: (dataSources: DataResource[]) => void;
  fileContentState: any;
  onSetSelectedFile: (fileId: string) => void;
  modelSelector: any;
  // onClearUploadedImages?: (callback: () => void) => void;
  onRefreshVersionList?: () => void; // 新增：刷新版本列表回调
  // 自动处理异常相关props
  // autoHandleError?: boolean;
  // onAutoHandleErrorChange?: (enabled: boolean) => void;
  /** 自动错误处理重试次数 */
  autoErrorRetryCount?: number;
  /** 用户手动发送消息回调 */
  onUserManualSendMessage?: () => void;
  /** 用户取消Agent任务回调 */
  onUserCancelAgentTask?: () => void;
}

/**
 * 聊天会话区域组件
 * 包含聊天模式切换、消息显示和输入区域
 */
const ChatArea: React.FC<ChatAreaProps> = ({
  // chatMode, // eslint-disable-line @typescript-eslint/no-unused-vars
  // setChatMode, // eslint-disable-line @typescript-eslint/no-unused-vars
  chat,
  // projectInfo, // 暂时注释掉，后续可能需要
  projectId,
  // onVersionSelect, // 暂时注释掉，后续可能需要
  selectedDataSources = [],
  onUpdateDataSources,
  fileContentState,
  onSetSelectedFile,
  modelSelector,
  // onClearUploadedImages,
  // onRefreshVersionList, // eslint-disable-line @typescript-eslint/no-unused-vars
  // autoHandleError = true, // 暂时注释掉，后续可能需要
  // onAutoHandleErrorChange, // 暂时注释掉，后续可能需要
  autoErrorRetryCount = 0,
  onUserManualSendMessage,
  onUserCancelAgentTask,
}) => {
  // 展开的思考过程消息
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(
    new Set(),
  );

  // 停止按钮 loading 状态
  const [isStoppingTask, setIsStoppingTask] = useState(false);

  // 发送按钮 loading 状态
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // 暴露图片清空方法给父组件
  // useEffect(() => {
  //   if (onClearUploadedImages) {
  //     onClearUploadedImages(() => {
  //       setUploadedImages([]);
  //     });
  //   }
  // }, [onClearUploadedImages]);

  // 滚动容器引用
  const scrollContainerRef = useRef<ReactScrollToBottomContainerRef>(null);

  // 滚动状态管理
  const [showScrollButton, setShowScrollButton] = useState(false);

  /**
   * 滚动按钮点击处理
   */
  const handleScrollButtonClick = useCallback(() => {
    scrollContainerRef.current?.handleScrollButtonClick();
  }, []);

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

    //关闭自动错误处理
    onUserCancelAgentTask?.();

    try {
      // 获取当前Ai Chat会话ID
      const aiChatSessionId = chat.aiChatSessionId;
      // 获取当前会话ID（从最后一条消息中获取）  cancelAiChatAgentTask
      const lastMessage = chat.chatMessages[chat.chatMessages.length - 1];
      const sessionId = lastMessage?.sessionId;

      // console.log('aiChatSessionId', aiChatSessionId, sessionId);
      let response;
      // 如果Ai Chat会话ID存在，并且会话ID不存在，则取消Ai Chat Agent任务
      if (aiChatSessionId && !sessionId) {
        response = await cancelAiChatAgentTask(projectId, aiChatSessionId);
      } else if (sessionId) {
        // 如果会话ID存在，则取消Agent任务
        response = await cancelAgentTask(projectId, sessionId);
      }

      if (response && response.success) {
        message.success('Agent 任务已取消');
        // 调用原有的取消聊天功能
        chat.cancelChat();
      } else {
        message.error(
          `取消 Agent 任务失败: ${response?.message || '未知错误'}`,
        );
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
  // const processImageFile = useCallback(
  //   (file: File): Promise<ImageUploadInfo> => {
  //     return new Promise((resolve, reject) => {
  //       // 验证是否为图片
  //       if (!file.type.startsWith('image/')) {
  //         reject(new Error('仅支持上传图片文件'));
  //         return;
  //       }

  //       // 验证文件大小 (限制为 5MB)
  //       if (file.size > 5 * 1024 * 1024) {
  //         reject(new Error('图片文件大小不能超过 5MB'));
  //         return;
  //       }

  //       // 读取文件并转换为 Base64
  //       const reader = new FileReader();
  //       reader.onload = (e) => {
  //         const base64Data = e.target?.result as string;

  //         // 获取图片尺寸
  //         const img = new window.Image();
  //         img.onload = () => {
  //           const imageInfo: ImageUploadInfo = {
  //             uid: generateAttachmentId('img'),
  //             name: file.name,
  //             base64Data: base64Data.split(',')[1], // 移除 data:image/xxx;base64, 前缀
  //             mimeType: file.type,
  //             preview: base64Data,
  //             dimensions: { width: img.width, height: img.height },
  //           };
  //           resolve(imageInfo);
  //         };
  //         img.onerror = () => {
  //           reject(new Error('图片加载失败，请重试'));
  //         };
  //         img.src = base64Data;
  //       };
  //       reader.onerror = () => {
  //         reject(new Error('文件读取失败，请重试'));
  //       };
  //       reader.readAsDataURL(file);
  //     });
  //   },
  //   [],
  // );

  /**
   * 处理图片上传（支持多选）
   */
  // const handleImageUpload = useCallback(
  //   async (file: File | File[]) => {
  //     const files = Array.isArray(file) ? file : [file];

  //     if (files.length === 0) {
  //       return false;
  //     }

  //     // 检查总数量限制（最多10张图片）
  //     const currentCount = uploadedImages.length;
  //     if (currentCount + files.length > 10) {
  //       message.warning(`最多只能上传10张图片，当前已有${currentCount}张`);
  //       return false;
  //     }

  //     try {
  //       // 显示加载提示
  //       const loadingMessage =
  //         files.length === 1
  //           ? `正在上传图片 "${files[0].name}"...`
  //           : `正在上传 ${files.length} 张图片...`;
  //       const hideLoading = message.loading(loadingMessage, 0);

  //       // 处理所有文件
  //       const imagePromises = files.map(processImageFile);
  //       const imageInfos = await Promise.all(imagePromises);

  //       // 批量添加到状态
  //       setUploadedImages((prev) => [...prev, ...imageInfos]);

  //       // 隐藏加载提示并显示成功消息
  //       hideLoading();
  //       if (files.length === 1) {
  //         message.success(`图片 "${files[0].name}" 上传成功`);
  //       } else {
  //         message.success(`成功上传 ${files.length} 张图片`);
  //       }
  //     } catch (error) {
  //       message.error(error instanceof Error ? error.message : '图片上传失败');
  //     }

  //     return false; // 阻止默认上传
  //   },
  //   [processImageFile, uploadedImages.length],
  // );

  /**
   * 删除图片
   */
  // const handleDeleteImage = useCallback((uid: string) => {
  //   setUploadedImages((prev) => prev.filter((img) => img.uid !== uid));
  // }, []);

  /**
   * 切换单个数据源选择状态
   */
  const handleToggleSelectDataSource = useCallback(
    (dataSource: DataResource) => {
      const newDataSources = selectedDataSources.map((ds) => {
        if (ds.id === dataSource.id) {
          return {
            ...ds,
            isSelected: !ds.isSelected,
          };
        }
        return ds;
      });

      onUpdateDataSources(newDataSources);
    },
    [selectedDataSources],
  );

  /**
   * 处理自动处理异常开关变化
   */
  // const handleAutoHandleErrorChange = useCallback(
  //   (checked: boolean) => {
  //     onAutoHandleErrorChange?.(checked);
  //   },
  //   [onAutoHandleErrorChange],
  // );

  /**
   * 发送消息前的处理 - 支持附件
   */
  const handleSendMessage = useCallback(
    (
      attachmentFiles?: UploadFileInfo[],
      prototypeImages?: UploadFileInfo[],
    ) => {
      // // 验证：prompt（输入内容）是必填的
      // if (!chat.chatInput.trim()) {
      //   message.warning('请输入消息内容');
      //   return;
      // }

      // 防止重复发送
      // if (isSendingMessage || chat.isChatLoading) {
      //   return;
      // }

      setIsSendingMessage(true);

      try {
        // ai-chat 附件文件
        const aiChatAttachments = attachmentFiles?.map(
          (file: UploadFileInfo) => {
            return {
              url: file.url,
              mimeType: file.type,
              fileName: file.name,
              fileKey: file.uid,
            };
          },
        );

        // ai-chat 原型图片附件
        const aiChatPrototypeImages = prototypeImages?.map(
          (file: UploadFileInfo) => {
            return {
              url: file.url,
              mimeType: file.type,
              fileName: file.name,
              fileKey: file.uid,
            };
          },
        );

        const attachments: Attachment[] = [];

        // 1. 添加图片附件
        attachmentFiles?.forEach((file: UploadFileInfo) => {
          const baseContent = {
            id: file.uid,
            filename: file.name,
            mime_type: file.type,
            source: {
              source_type: 'Url',
              data: {
                url: file.url,
                mime_type: file.type,
              },
            },
          } as ImageAttachment | DocumentAttachment;
          if (file.type?.startsWith('image')) {
            attachments.push({
              type: 'Image',
              content: {
                dimensions: {
                  width: file.width || 0,
                  height: file.height || 0,
                },
                ...baseContent,
              },
            });
          } else {
            attachments.push({
              type: 'Document',
              content: {
                size: file.size,
                ...baseContent,
              },
            });
          }
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

        // 发送消息(传递附件)
        chat.sendMessage(attachments, aiChatAttachments, aiChatPrototypeImages);

        onUserManualSendMessage?.();
        // 发送消息后强制滚动到底部并开启自动滚动
        setTimeout(() => {
          scrollContainerRef.current?.handleScrollButtonClick();
        }, 1000);

        // 清空选中的数据源
        if (onUpdateDataSources) {
          const _selectedDataSources: DataResource[] = selectedDataSources.map(
            (ds) => {
              return {
                ...ds,
                isSelected: false,
              };
            },
          );
          onUpdateDataSources(_selectedDataSources);
        }
      } catch (error) {
        message.error('发送消息失败');
      } finally {
        // 延迟重置发送状态，给用户反馈
        setTimeout(() => {
          setIsSendingMessage(false);
        }, 500);
      }
    },
    [chat, fileContentState?.selectedFile],
  );

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

      // 组合附件和数据源 - 只在用户消息中显示
      let allAttachments: Attachment[] = [];
      let dataSourceAttachments: DataSourceSelection[] = [];

      if (isUser) {
        // 传统附件（图片、文件等）
        allAttachments = [...(message.attachments || [])];
        // 数据源附件
        dataSourceAttachments = message.dataSources || [];
        // 原型图片附件
        allAttachments.unshift(
          ...(message.attachmentPrototypeImages?.map((item) => {
            return {
              type: 'Image',
              content: {
                id: item.fileKey,
                filename: item.fileName,
                mime_type: item.mimeType,
                source: {
                  source_type: 'Url',
                  data: {
                    url: item.url,
                    mime_type: item.mimeType,
                  },
                },
              } as ImageAttachment,
            } as Attachment;
          }) || []),
        );
      } else {
        allAttachments = message.attachments || [];
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
                // USER 消息: 渲染文本和附件
                <div>
                  {/* 文本内容 */}
                  {message.text
                    ?.split('\n')
                    .map((line: string, index: number) => (
                      <div key={index}>{line}</div>
                    ))}

                  {/* 附件渲染 - 包含传统附件和数据源附件 */}
                  {(allAttachments.length > 0 ||
                    dataSourceAttachments.length > 0) && (
                    <div className={styles.messageAttachments}>
                      {/* 渲染传统附件（图片、文件等） */}
                      {allAttachments.map((attachment) => (
                        <MessageAttachment
                          key={attachment.content.id}
                          attachment={attachment.content}
                          type={attachment.type}
                          size={60}
                          showPreview={true}
                        />
                      ))}
                      {/* 渲染数据源附件 */}
                      {dataSourceAttachments.map((dataSource) => (
                        <MessageAttachment
                          key={`${dataSource.dataSourceId}-${dataSource.type}`}
                          attachment={convertDataSourceSelectionToAttachment(
                            dataSource,
                          )}
                          type="DataSource"
                          size={60}
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

  // 计算进度百分比（自动处理次数 / 3，最大100%）
  // const progressPercent = useMemo(() => {
  //   return Math.min((autoErrorRetryCount / 3) * 100, 100);
  // }, [autoErrorRetryCount]);

  return (
    <Card className={styles.chatCard} variant="outlined">
      {/* 聊天模式切换 */}
      {/* <div className={styles.chatModeContainer}>
        <div className={styles.chatModeSwitcher}> */}
      {/* <div className={styles.chatModeSegmented}> */}
      {/* <Segmented
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
          /> */}
      {/* </div> */}
      {/* </div>
      </div> */}

      {/* 聊天消息区域 */}
      <ReactScrollToBottomContainer
        ref={scrollContainerRef}
        messages={chat.chatMessages}
        isStreaming={chat.isChatLoading}
        enableAutoScroll={true}
        className={styles.chatMessagesWrapper}
        style={{ height: '100%', minHeight: 0 }}
        onScrollPositionChange={(isAtBottom) => {
          setShowScrollButton(!isAtBottom);
        }}
      >
        <div className={styles.chatMessages}>
          {chat.isLoadingHistory ? (
            <AppDevEmptyState
              type="loading"
              icon={<LoadingOutlined />}
              title="正在加载历史会话"
              description="请稍候..."
            />
          ) : !chat.chatMessages || chat.chatMessages.length === 0 ? (
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
      </ReactScrollToBottomContainer>
      {/* 聊天输入区域 */}
      <div className={styles.chatInputContainer}>
        <div
          className={`${styles.scrollToBottomButton} ${
            showScrollButton ? styles.visible : ''
          }`}
          onClick={handleScrollButtonClick}
        >
          <DownOutlined />
        </div>
        {/* 自动错误处理进度条 目前有 透传问题先关闭了*/}
        {autoErrorRetryCount > 0 && chat.isChatLoading && (
          <Tooltip title={`(${autoErrorRetryCount}/3) 尝试自动修复中...`}>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressBarItem} ${
                    autoErrorRetryCount >= 1 ? styles.active : ''
                  }`}
                />
                <div
                  className={`${styles.progressBarItem} ${
                    autoErrorRetryCount >= 2 ? styles.active : ''
                  }`}
                />
                <div
                  className={`${styles.progressBarItem} ${
                    autoErrorRetryCount >= 3 ? styles.active : ''
                  }`}
                />
              </div>
            </div>
          </Tooltip>
        )}
        {/* 聊天输入框 */}
        <ChatInputHome
          chat={chat}
          modelSelector={modelSelector}
          // 文件列表
          fileContentState={fileContentState}
          onSetSelectedFile={onSetSelectedFile}
          // 数据源列表
          dataSourceList={selectedDataSources}
          onToggleSelectDataSource={handleToggleSelectDataSource}
          // 是否正在停止任务
          isStoppingTask={isStoppingTask}
          // 是否正在发送消息
          isSendingMessage={isSendingMessage}
          // 取消任务
          handleCancelAgentTask={handleCancelAgentTask}
          // 发送消息
          onEnter={handleSendMessage}
        />
      </div>
    </Card>
  );
};

export default ChatArea;
