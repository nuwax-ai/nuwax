import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import { cancelAgentTask, cancelAiChatAgentTask } from '@/services/appDev';

import SvgIcon from '@/components/base/SvgIcon';
import { MESSAGE_PAGE_SIZE } from '@/constants/common.constants';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import DataResourceList from '@/pages/AppDev/components/FileTreePanel/DataResourceList';
import type {
  AppDevChatMessage,
  Attachment,
  DataSourceSelection,
  DocumentAttachment,
  FileNode,
  ImageAttachment,
} from '@/types/interfaces/appDev';
import { UploadFileInfo } from '@/types/interfaces/common';
import { DataResource } from '@/types/interfaces/dataResource';
import {
  convertDataSourceSelectionToAttachment,
  generateAttachmentId,
} from '@/utils/chatUtils';
import { adjustScrollPositionAfterDOMUpdate } from '@/utils/scrollUtils';
import { DownOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Card, message, Spin, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModel } from 'umi';
import DesignViewer, { type DesignViewerRef } from '../DesignViewer';
import AppDevMarkdownCMDWrapper from './components/AppDevMarkdownCMDWrapper';
import ChatAreaTabs from './components/ChatAreaTabs';
import ChatInputHome, { MentionItem } from './components/ChatInputHome';
import MessageAttachment from './components/MessageAttachment';
import ReactScrollToBottomContainer, {
  ReactScrollToBottomContainerRef,
} from './components/ReactScrollToBottomContainer';
import styles from './index.less';

const { Text } = Typography;

interface ChatAreaProps {
  chat: any;
  projectId: string;
  selectedDataSources?: DataResource[];
  onUpdateDataSources: (dataSources: DataResource[]) => void;
  fileContentState: any;
  isSupportDesignMode: boolean;
  modelSelector: any;
  isComparing?: boolean;
  onUserManualSendMessage?: () => void;
  onUserCancelAgentTask?: () => void;
  files?: FileNode[];
  designViewerRef?: React.RefObject<DesignViewerRef>;
  onDeleteDataResource?: (resourceId: number) => Promise<void>;
  onAddDataResource?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  projectId,
  selectedDataSources = [],
  onUpdateDataSources,
  fileContentState,
  isSupportDesignMode,
  modelSelector,
  isComparing = false, // Default false
  onUserManualSendMessage,
  onUserCancelAgentTask,
  files = [],
  designViewerRef,
  onDeleteDataResource,
  onAddDataResource,
}) => {
  // 权限检查
  const { hasPermissionByMenuCode } = useModel('menuModel');

  // 聊天Tab
  const [activeTab, setActiveTab] = useState<'chat' | 'data' | 'design'>(
    'chat',
  );

  const autoErrorRetryCount = useModel('autoErrorHandling').autoRetryCount;

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

  // 思考过程展开状态
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(
    new Set(),
  );

  // 到顶自动加载更多的侦测 Hook (提前 10px 触发)
  const { ref: loadMoreRef, inView: loadMoreInView } = useIntersectionObserver({
    rootMargin: '10px 0px 0px 0px',
    threshold: 0,
  });

  const handleLoadMoreHistory = useCallback(async () => {
    // 1. 先记录当前内容的滚动位置与高度
    const scrollContainer = scrollContainerRef.current?.getScrollContainer();
    if (!scrollContainer) {
      return;
    }

    const scrollPosition = scrollContainer.scrollTop;
    const scrollHeight = scrollContainer.scrollHeight;

    // 2. 加载历史会话
    await chat.loadHistorySessions(chat.currentPageRef.current + 1, true);

    // 3. 启用全站通用的 ResizeObserver 持续锚定补偿，来抵抗内部 markdown 多次渲染导致的抖动
    adjustScrollPositionAfterDOMUpdate(
      scrollContainer,
      scrollPosition,
      scrollHeight,
    );
  }, [chat]);

  // 监听进入视口事件，单次触发请求 (Edge-Triggered)
  const prevLoadMoreInViewRef = useRef(false);
  useEffect(() => {
    const isEntering = loadMoreInView && !prevLoadMoreInViewRef.current;
    prevLoadMoreInViewRef.current = loadMoreInView;

    if (
      isEntering &&
      chat.hasMoreHistoryRef.current &&
      !chat.isLoadingMoreHistoryRef.current
    ) {
      handleLoadMoreHistory();
    }
  }, [
    loadMoreInView,
    chat.hasMoreHistoryRef.current,
    chat.isLoadingMoreHistoryRef.current,
    handleLoadMoreHistory,
  ]);

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

      // 如果Ai Chat会话ID存在，并且会话ID不存在，则取消Ai Chat Agent任务
      if (aiChatSessionId && !sessionId) {
        await cancelAiChatAgentTask(projectId, aiChatSessionId);
      }
      // 取消Agent任务
      const response = await cancelAgentTask(projectId);

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
      // message.error('取消 Agent 任务失败');
      // 即使 API 调用失败，也调用原有的取消功能
      chat.cancelChat();
    } finally {
      setIsStoppingTask(false);
    }
  }, [chat, projectId, isStoppingTask]);

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
      selectedMentions?: MentionItem[],
      requestId?: string,
    ) => {
      // 权限检查
      if (!hasPermissionByMenuCode('page_app_dev', 'page_app_ai_chat')) {
        message.error('您没有权限使用AI聊天功能');
        return;
      }

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

        // 2. @提及的文件/目录(如果有)
        selectedMentions?.forEach((mention) => {
          if (mention.type === 'file' || mention.type === 'folder') {
            const fileData = mention.data as FileNode;
            attachments.push({
              type: 'Text', // 使用 Text 类型，与后端保持一致
              content: {
                id: generateAttachmentId('file'),
                filename: fileData.name,
                source: {
                  source_type: 'FilePath',
                  data: {
                    path: fileData.path,
                  },
                },
              },
            } as unknown as Attachment);
          }
          // if (mention.type === 'datasource') {
          //   const dataSourceData = mention.data as DataResource;
          //   attachments.push({
          //     type: 'DataSource',
          //     content: {
          //       id: dataSourceData.id,
          //     },
          //   } as unknown as Attachment);
          // }
        });
        // if (fileContentState?.selectedFile) {
        //   attachments.push({
        //     type: 'Text',
        //     content: {
        //       id: generateAttachmentId('file'),
        //       filename: fileContentState.selectedFile,
        //       source: {
        //         source_type: 'FilePath',
        //         data: {
        //           path: fileContentState.selectedFile, // 包含路径与文件名及后缀
        //         },
        //       },
        //     },
        //   });
        // }

        // 发送消息(传递附件和 @ 提及的项)
        chat.sendMessage(
          attachments,
          aiChatAttachments,
          aiChatPrototypeImages,
          requestId,
          selectedMentions, // 传递 @ 提及的项（包含通过 @ 选择的数据源）
        );

        // 只有手动发送（requestId 不存在）时才调用 onUserManualSendMessage
        // 自动发送时会有 requestId，不应该重置状态
        if (!requestId) {
          onUserManualSendMessage?.();
          // 如果当前在数据Tab，发送消息后自动切换回聊天Tab
          if (activeTab === 'data') {
            setActiveTab('chat');
          }
        }
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
    (message: AppDevChatMessage, isLastMessage: boolean) => {
      const isUser = message.role === 'USER';
      const isAssistant = message.role === 'ASSISTANT';

      // 判断是否为历史消息（有会话信息）
      const isHistoryMessage = !!(
        message.conversationTopic && message.conversationCreated
      );

      // 在历史会话渲染场景中，完全忽略所有状态
      const isStreaming = !isHistoryMessage && message.isStreaming; // 只有非历史消息才显示流式传输状态
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
            {isStreaming && isLastMessage && (
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
   * @param conversationTopic 会话主题
   * @param conversationCreated 会话创建时间
   * @param id 消息ID 用于唯一标识key会话分隔符
   */
  const renderConversationDivider = useCallback(
    (
      conversationTopic: string,
      conversationCreated: string,
      id: string,
      // sessionId: string, // 暂时未使用，保留以备将来使用
    ) => {
      return (
        <div key={`divider-${id}`} className={styles.conversationDivider}>
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

    const len = messages?.length;

    messages.forEach((message: AppDevChatMessage, index: number) => {
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
            message.id,
          ),
        );
        currentSessionId = message.sessionId;
      }

      // 是否是最后一条消息
      const isLastMessage = index === len - 1;

      // 渲染消息
      renderedMessages.push(renderChatMessage(message, isLastMessage));
    });

    return renderedMessages;
  }, [chat.chatMessages, renderChatMessage, renderConversationDivider]);

  // 添加到聊天输入框
  const handleAddToChat = (content: string) => {
    chat.setChatInput((prev: string) => prev + content);
  };

  return (
    <Card className={styles.chatCard} variant="outlined">
      <ChatAreaTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSupportDesignMode={isSupportDesignMode}
      />

      {/* 内容区域 */}
      <div className={'flex-1 flex flex-col relative overflow-hide'}>
        {/* 数据 Tab */}
        {activeTab === 'data' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <div className={styles.dataSourceContainer}>
              <div className={styles.dataSourceHeader}>
                <span className={styles.dataSourceTitle}>数据资源</span>
                <Tooltip title="添加数据资源">
                  <Button
                    type="text"
                    className={styles.addButton}
                    icon={
                      <SvgIcon
                        name="icons-common-plus"
                        style={{ fontSize: 16 }}
                      />
                    }
                    onClick={onAddDataResource}
                    disabled={chat.isChatLoading || isComparing}
                  />
                </Tooltip>
              </div>
              <div className={styles.dataSourceContent}>
                <DataResourceList
                  resources={selectedDataSources}
                  projectId={Number(projectId)}
                  onDelete={onDeleteDataResource}
                />
              </div>
            </div>
          </div>
        )}

        {/* 设计模式区域 */}
        {activeTab === 'design' && isSupportDesignMode && (
          <DesignViewer ref={designViewerRef} onAddToChat={handleAddToChat} />
        )}

        {/* 聊天消息区域 - 使用 display:none 保持状态 */}
        <div
          style={{
            display: activeTab === 'chat' ? 'flex' : 'none',
            flexDirection: 'column',
            height: '100%',
          }}
        >
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
              {/* 自动加载更多的触发探测元素 */}
              {chat.hasMoreHistoryRef.current &&
                !chat.isLoadingMoreHistoryRef.current &&
                (chat.chatMessages?.length || 0) >= MESSAGE_PAGE_SIZE && (
                  <div
                    ref={loadMoreRef}
                    className={styles.loadMoreHistoryButton}
                    style={{
                      textAlign: 'center',
                      padding: '16px 0',
                      color: '#999',
                    }}
                  >
                    <span>
                      <LoadingOutlined style={{ marginRight: 8 }} />
                      正在加载历史会话
                    </span>
                  </div>
                )}
              {chat.isLoadingMoreHistoryRef.current && <Spin size="small" />}
              {chat.isLoadingHistory ? (
                <AppDevEmptyState
                  type="loading"
                  title="正在加载历史会话"
                  description="请稍候..."
                />
              ) : !chat.chatMessages || chat.chatMessages.length === 0 ? (
                <AppDevEmptyState
                  type="conversation-empty"
                  title="开始新对话"
                  description="向 AI 助手提问，开始你的项目开发"
                />
              ) : (
                chatMessagesList
              )}
            </div>
          </ReactScrollToBottomContainer>
        </div>
      </div>

      {/* 聊天输入区域 */}
      <div
        className={styles.chatInputContainer}
        style={{
          display:
            activeTab === 'chat' || activeTab === 'data' ? 'block' : 'none',
        }}
      >
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
          // fileContentState={fileContentState}
          // onSetSelectedFile={onSetSelectedFile}
          // 数据源列表
          dataSourceList={selectedDataSources}
          onToggleSelectDataSource={handleToggleSelectDataSource}
          // 是否正在停止任务
          isStoppingTask={isStoppingTask}
          // 是否正在发送消息
          isSendingMessage={isSendingMessage}
          // 取消任务
          handleCancelAgentTask={handleCancelAgentTask}
          // 项目ID，用于区分不同项目的最近使用记录
          projectId={projectId}
          // 发送消息
          onEnter={handleSendMessage}
          // 文件树数据
          files={files}
        />
      </div>

      {/* 数据资源添加模态框 - 已移除，使用 onAddDataResource 回调父组件处理 */}
      {/* <PageEditModal ... /> */}
    </Card>
  );
};

export default ChatArea;
