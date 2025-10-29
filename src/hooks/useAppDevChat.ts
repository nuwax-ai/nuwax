/**
 * AppDev 聊天相关 Hook
 */

import {
  listConversations,
  saveConversation,
  stopAgentService,
} from '@/services/appDev';
import type {
  AppDevChatMessage,
  Attachment,
  FileStreamAttachment,
  UnifiedSessionMessage,
} from '@/types/interfaces/appDev';
import { debounce } from '@/utils/appDevUtils';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { message, Modal } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';

import { AGENT_SERVICE_RUNNING } from '@/constants/codes.constants';
import {
  insertPlanBlock,
  insertToolCallBlock,
  insertToolCallUpdateBlock,
} from '@/pages/AppDev/utils/markdownProcess';
import type { DataSourceSelection } from '@/types/interfaces/appDev';
import { DataResource } from '@/types/interfaces/dataResource';
import {
  addSessionInfoToMessages,
  appendTextToStreamingMessage,
  createAssistantMessage,
  createUserMessage,
  generateAIChatSSEUrl,
  generateConversationTopic,
  generateRequestId,
  generateSSEUrl,
  getAuthHeaders,
  isFileOrDependencyOperation, // 新增：导入文件或依赖操作检测函数

  // isRequestIdMatch,
  markStreamingMessageCancelled,
  markStreamingMessageComplete,
  markStreamingMessageError,
  parseChatMessages,
  serializeChatMessages,
  sortMessagesByTimestamp,
} from '@/utils/chatUtils';

interface UseAppDevChatProps {
  projectId: string;
  selectedModelId?: number | null; // 新增：选中的模型ID
  multiModelId?: number | null; // 新增：多模态模型ID（视觉模型ID）
  onRefreshFileTree?: (preserveState?: boolean, forceRefresh?: boolean) => void; // 新增：文件树刷新回调
  selectedDataResources?: DataResource[]; // 新增：选中的数据源列表
  onClearDataSourceSelections?: () => void; // 新增：清除数据源选择回调
  onRefreshVersionList?: () => void; // 新增：刷新版本列表回调
  onClearUploadedImages?: () => void; // 新增：清除上传图片回调
  onRestartDevServer?: () => Promise<void>; // 新增：重启开发服务器回调
  hasPermission?: boolean; // 新增：是否有权限访问项目
}

export const useAppDevChat = ({
  projectId,
  selectedModelId, // 新增
  multiModelId, // 新增：多模态模型ID（视觉模型ID）
  onRefreshFileTree,
  selectedDataResources = [],
  onClearDataSourceSelections,
  onRefreshVersionList, // 新增：刷新版本列表回调
  onClearUploadedImages, // 新增：清除上传图片回调
  onRestartDevServer, // 新增
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasPermission = true, // 新增：是否有权限访问项目
}: UseAppDevChatProps) => {
  // 使用 AppDev SSE 连接 model
  const appDevSseModel = useModel('appDevSseConnection');

  const [aiChatSessionId, setAiChatSessionId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<AppDevChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // 新增：历史会话加载状态

  const abortConnectionRef = useRef<AbortController | null>(null);
  const aIChatAbortConnectionRef = useRef<AbortController>();

  // 用于存储超时定时器的 ref
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 记录用户主动发送的消息数量（不包括历史消息）- 已注释，暂时不使用
  // const userSentMessageCountRef = useRef(0);

  // 存储文件操作和依赖操作相关的 toolCallId
  const fileOperationToolCallIdsRef = useRef<Set<string>>(new Set());

  // 添加防抖的文件树刷新函数
  const debouncedRefreshFileTree = useCallback(
    debounce(() => {
      if (onRefreshFileTree) {
        // 调用时传递参数，强制刷新但保持状态
        onRefreshFileTree(true, true); // preserveState=true, forceRefresh=true
      }
    }, 500), // 500ms 防抖
    [onRefreshFileTree],
  );

  const handleSaveConversation = useCallback(
    (
      chatMessages: AppDevChatMessage[],
      sessionId: string,
      projectId: string,
    ) => {
      const topic = generateConversationTopic(chatMessages);
      const content = serializeChatMessages(chatMessages);

      // 保存会话
      saveConversation({
        projectId,
        sessionId,
        content,
        topic,
      }).then(() => {
        // 新增：刷新文件树内容
        if (onRefreshFileTree) {
          debouncedRefreshFileTree();
        }
      });
    },
    [saveConversation, debouncedRefreshFileTree],
  );

  /**
   * 处理SSE消息 - 基于 request_id 过滤处理
   */
  const handleSSEMessage = useCallback(
    (message: UnifiedSessionMessage, activeRequestId: string) => {
      // 只处理匹配当前request_id的消息
      // const messageRequestId = message.data?.request_id;

      // if (!isRequestIdMatch(messageRequestId, activeRequestId)) {
      //   return;
      // }

      switch (message.messageType) {
        case 'sessionPromptStart': {
          break;
        }

        case 'agentSessionUpdate': {
          if (message.subType === 'agent_message_chunk') {
            const chunkText = message.data?.text || '';
            const isFinal = message.data?.is_final;

            setChatMessages((prev) =>
              appendTextToStreamingMessage(
                prev,
                activeRequestId,
                chunkText,
                isFinal,
              ),
            );
          }

          if (message.subType === 'plan') {
            setChatMessages((prev) =>
              prev.map((msg) => {
                if (
                  msg.requestId === activeRequestId &&
                  msg.role === 'ASSISTANT'
                ) {
                  return {
                    ...msg,
                    text: insertPlanBlock(msg.text || '', {
                      planId: message.data.planId || 'default-plan',
                      entries: message.data.entries || [],
                    }),
                  };
                }
                return msg;
              }),
            );
          }
          if (message.subType === 'tool_call') {
            setChatMessages((prev) =>
              prev.map((msg) => {
                if (
                  msg.requestId === activeRequestId &&
                  msg.role === 'ASSISTANT'
                ) {
                  return {
                    ...msg,
                    text: insertToolCallBlock(
                      msg.text || '',
                      message.data.toolCallId,
                      {
                        toolCallId: message.data.toolCallId,
                        title: message.data.title || '工具调用',
                        kind: message.data.kind || 'execute',
                        status: message.data.status,
                        content: message.data.content,
                        locations: message.data.locations,
                        rawInput: message.data.rawInput,
                        timestamp: message.timestamp,
                      },
                    ),
                  };
                }
                return msg;
              }),
            );
            // 检测是否为文件操作或依赖操作，如果是则记录 toolCallId
            if (
              isFileOrDependencyOperation(message.data) &&
              message.data.toolCallId
            ) {
              fileOperationToolCallIdsRef.current.add(message.data.toolCallId);
            }
          }
          if (message.subType === 'tool_call_update') {
            setChatMessages((prev) =>
              prev.map((msg) => {
                if (
                  msg.requestId === activeRequestId &&
                  msg.role === 'ASSISTANT'
                ) {
                  return {
                    ...msg,
                    text: insertToolCallUpdateBlock(
                      msg.text || '',
                      message.data.toolCallId,
                      {
                        toolCallId: message.data.toolCallId,
                        title: message.data.title || '工具调用更新',
                        kind: message.data.kind || 'execute',
                        status: message.data.status,
                        content: message.data.content,
                        locations: message.data.locations,
                        rawInput: message.data.rawInput,
                        timestamp: message.timestamp,
                      },
                    ),
                  };
                }
                return msg;
              }),
            );
            // 检查对应的 toolCallId 是否为文件操作或依赖操作
            if (
              message.data.toolCallId &&
              fileOperationToolCallIdsRef.current.has(message.data.toolCallId)
            ) {
              debouncedRefreshFileTree();
            }
          }
          break;
        }

        case 'sessionPromptEnd': {
          // 标记消息完成
          setChatMessages((prev) => {
            const updated = markStreamingMessageComplete(prev, activeRequestId);

            // 保存会话
            const userMessage = updated.find(
              (m) => m.requestId === activeRequestId && m.role === 'USER',
            );
            const assistantMessage = updated.find(
              (m) => m.requestId === activeRequestId && m.role === 'ASSISTANT',
            );

            if (userMessage && assistantMessage) {
              handleSaveConversation(
                [userMessage, assistantMessage],
                message.sessionId,
                projectId,
              );
            }

            return updated;
          });

          // 会话结束时执行一次文件树刷新
          debouncedRefreshFileTree();

          // 新增：如果有文件操作或依赖操作，触发重启开发服务器
          if (
            fileOperationToolCallIdsRef.current.size > 0 &&
            onRestartDevServer
          ) {
            console.log(
              '🔄 [AppDev] 检测到文件操作或依赖操作，触发重启开发服务器',
            );
            onRestartDevServer(); // 不等待，异步执行
          }

          // 清理文件操作和依赖操作 toolCallId 记录
          fileOperationToolCallIdsRef.current.clear();

          setIsChatLoading(false);

          // 延迟关闭SSE连接，确保消息处理完成
          abortConnectionRef.current?.abort?.();
          break;
        }

        case 'heartbeat':
          // 仅用于保活,不做任何处理
          break;

        default:
        // 未处理的事件类型
      }
    },
    [
      projectId,
      handleSaveConversation,
      appDevSseModel,
      debouncedRefreshFileTree,
    ],
  );

  /**
   * 初始化 AppDev SSE 连接
   */
  const initializeAppDevSSEConnection = useCallback(
    async (sessionId: string, requestId: string) => {
      const sseUrl = generateSSEUrl(sessionId);
      const headers = getAuthHeaders();

      // 连接到SSE
      abortConnectionRef.current = new AbortController();

      // // 创建ASSISTANT占位消息
      // const assistantMessage = createAssistantMessage(requestId, sessionId);
      // setChatMessages((prev) => [...prev, assistantMessage]);

      await createSSEConnection({
        url: sseUrl,
        method: 'GET',
        abortController: abortConnectionRef.current,
        headers,
        onMessage: (data: UnifiedSessionMessage) => {
          handleSSEMessage(data, requestId);
        },
        onError: (error: Error) => {
          // message.error('AI助手连接失败');
          //要把 chatMessages 里 ASSISTANT 当前 isSteaming 修改一下 false 并给出错误消息
          setChatMessages((prev) =>
            markStreamingMessageError(prev, requestId, error.message),
          );
          setIsChatLoading(false);

          abortConnectionRef.current?.abort();
          debouncedRefreshFileTree();
        },
        onClose: () => {
          setIsChatLoading(false);
          abortConnectionRef.current?.abort();
          debouncedRefreshFileTree();
        },
      });
    },
    [appDevSseModel, handleSSEMessage],
  );

  /**
   * 显示停止Agent服务的确认对话框
   */
  const showStopAgentServiceModal = useCallback(
    (projectId: string, doNext: () => void) => {
      // 显示确认对话框
      Modal.confirm({
        title: '检测到后台Agent服务正在运行',
        content: '是否停止当前运行的Agent服务？',
        onOk: () => {
          return new Promise((resolve, reject) => {
            stopAgentService(projectId)
              .then((stopResponse) => {
                if (stopResponse.code === '0000') {
                  message.success('Agent服务已停止');
                  doNext();
                  resolve(true);
                } else {
                  message.error(
                    `停止Agent服务失败: ${stopResponse.message || '未知错误'}`,
                  );
                  reject();
                }
              })
              .catch(() => {
                message.error('停止Agent服务失败');
                reject();
              });
          });
        },
        onCancel: () => {
          // 用户取消停止Agent服务，不发送消息，不增加计数
          message.info('已取消发送');
        },
      });
    },
    [],
  );

  /**
   * 初始化 AI-CHAT SSE 连接
   */
  const aIChatSSEConnection = async (params: any, requestId: string) => {
    const sseUrl = generateAIChatSSEUrl();
    const headers = getAuthHeaders();

    setIsChatLoading(true);

    await createSSEConnection({
      url: sseUrl,
      method: 'POST',
      headers,
      abortController: aIChatAbortConnectionRef.current,
      body: params,
      onMessage: (response: UnifiedSessionMessage) => {
        if (response.type === 'session_id') {
          const _aiChatSessionId = response.session_id;
          setAiChatSessionId(_aiChatSessionId);
        }
        if (response.type === 'progress') {
          const chunkText = response?.message ? `${response?.message}\n\n` : '';
          setChatMessages((prev) =>
            appendTextToStreamingMessage(prev, requestId, chunkText, false),
          );
        }

        if (response.type === 'success') {
          // 新增：/ai-chat 接口发送成功后立即刷新版本列表
          if (onRefreshVersionList) {
            onRefreshVersionList();
          }

          // 新增：/ai-chat 接口发送成功后清除上传图片
          if (onClearUploadedImages) {
            onClearUploadedImages();
          }

          // 消息发送成功后清除数据源选择
          if (onClearDataSourceSelections) {
            onClearDataSourceSelections();
          }

          setChatInput('');

          const sessionId = response.data.session_id;

          // 立即建立SSE连接（使用返回的session_id）
          initializeAppDevSSEConnection(sessionId, requestId);
        }

        if (response.type === 'error') {
          aIChatAbortConnectionRef.current?.abort();
          setIsChatLoading(false);
          // 智能体服务运行中的错误状态
          if (response.code === AGENT_SERVICE_RUNNING) {
            showStopAgentServiceModal(projectId, () => {
              // eslint-disable-next-line @typescript-eslint/no-use-before-define
              sendMessageAndConnectSSE(
                params.attachments,
                params.attachment_files,
                params.attachment_prototype_images,
              ); //继续发送消息
            });
          } else {
            message.error(response.message);
          }
        }
      },
      onError: () => {
        // message.error('AI助手连接失败');
        aIChatAbortConnectionRef.current?.abort();
        setIsChatLoading(false);
        setChatMessages((prev) =>
          markStreamingMessageError(prev, requestId, 'AI助手连接失败'),
        );
      },
      onClose: () => {
        aIChatAbortConnectionRef.current?.abort();
      },
    });
  };

  /**
   * 发送消息并建立SSE连接的核心逻辑
   */
  const sendMessageAndConnectSSE = useCallback(
    async (
      attachments?: Attachment[],
      attachmentFiles?: FileStreamAttachment[],
      attachmentPrototypeImages?: FileStreamAttachment[],
    ) => {
      // 生成临时request_id
      const requestId = generateRequestId();
      try {
        // 数据源数据结构提取
        const _selectedDataResources: DataSourceSelection[] =
          selectedDataResources
            .filter((item) => item.isSelected)
            ?.map((resource) => {
              return {
                dataSourceId: Number(resource.id),
                type: resource.type === 'plugin' ? 'plugin' : 'workflow',
                name: resource.name,
              };
            }) || [];

        const aiChatParams = {
          prompt: chatInput,
          project_id: projectId,
          chat_model_id: selectedModelId, // 编码模型ID
          multi_model_id: multiModelId, // 多模态模型ID（视觉模型ID，可选）
          attachments,
          // 附件文件列表
          attachment_files: attachmentFiles,
          // 原型图片附件列表
          attachment_prototype_images: attachmentPrototypeImages,
          data_sources: _selectedDataResources,
        };

        // 添加用户消息（包含附件和数据源）
        const userMessage = createUserMessage(
          chatInput,
          requestId,
          attachments,
          attachmentPrototypeImages,
          _selectedDataResources,
        );

        setChatMessages((prev) => [...prev, userMessage]);

        // 创建ASSISTANT占位消息
        const assistantMessage = createAssistantMessage(requestId, '');
        setChatMessages((prev) => [...prev, assistantMessage]);

        await aIChatSSEConnection(aiChatParams, requestId);
        // 调用发送消息API
        // const response = await sendChatMessage(aiChatParams);

        // if (response.success && response.data) {
        //   // 新增：/ai-chat 接口发送成功后立即刷新版本列表
        //   if (onRefreshVersionList) {
        //     onRefreshVersionList();
        //   }

        //   // 新增：/ai-chat 接口发送成功后清除上传图片
        //   if (onClearUploadedImages) {
        //     onClearUploadedImages();
        //   }

        //   // 消息发送成功后清除数据源选择
        //   if (onClearDataSourceSelections) {
        //     onClearDataSourceSelections();
        //   }

        // // 添加用户消息（包含附件和数据源）
        // const userMessage = createUserMessage(
        //   chatInput,
        //   requestId,
        //   attachments,
        //   _selectedDataResources,
        // );

        // setChatMessages((prev) => [...prev, userMessage]);
        //   setChatInput('');
        //   setIsChatLoading(true);

        //   const sessionId = response.data.session_id;

        //   // 立即建立SSE连接（使用返回的session_id）
        //   await initializeAppDevSSEConnection(sessionId, requestId);
        // }
      } catch (error) {
        if (error && (error as any).code === AGENT_SERVICE_RUNNING) {
          showStopAgentServiceModal(projectId, () => {
            sendMessageAndConnectSSE(); //继续发送消息
          });
        } else {
          setIsChatLoading(false);
        }
      }
    },
    [
      chatInput,
      projectId,
      selectedModelId, // 新增：添加 selectedModelId 依赖
      initializeAppDevSSEConnection,
      showStopAgentServiceModal,
    ],
  );

  /**
   * 发送聊天消息 - 每次消息独立SSE连接
   */
  const sendChat = useCallback(async () => {
    if (!chatInput.trim()) return;

    // 发送消息
    sendMessageAndConnectSSE();
  }, [chatInput, sendMessageAndConnectSSE]);

  /**
   * 发送消息 - 支持附件
   * @param attachments 附件文件列表
   * @param attachmentFiles ai-chat 附件文件列表
   * @param attachmentPrototypeImages ai-chat 原型图片附件列表
   */
  const sendMessage = useCallback(
    async (
      attachments?: Attachment[],
      attachmentFiles?: FileStreamAttachment[],
      attachmentPrototypeImages?: FileStreamAttachment[],
    ) => {
      // 验证：prompt（输入内容）是必填的
      if (!chatInput.trim()) {
        message.warning('请输入消息内容');
        return;
      }

      // 发送消息
      sendMessageAndConnectSSE(
        attachments,
        attachmentFiles,
        attachmentPrototypeImages,
      );
    },
    [chatInput, sendMessageAndConnectSSE],
  );

  /**
   * 取消聊天任务
   */
  const cancelChat = useCallback(async () => {
    if (!projectId) {
      return;
    }
    setIsChatLoading(false);
    // 将正在流式传输的消息标记为取消状态
    setChatMessages((prev) => {
      return prev.map((msg) => {
        if (msg.isStreaming && msg.role === 'ASSISTANT') {
          return (
            markStreamingMessageCancelled(prev, msg.requestId).find(
              (m) => m.id === msg.id,
            ) || msg
          );
        }
        return msg;
      });
    });
    abortConnectionRef.current?.abort();
  }, [projectId, appDevSseModel]);

  /**
   * 清理 AppDev SSE 连接
   */
  const cleanupAppDevSSE = useCallback(() => {
    // appDevSseModel.cleanupAppDev();
  }, [appDevSseModel]);

  /**
   * 加载历史会话消息
   */
  const loadHistorySession = useCallback(
    async (sessionId: string) => {
      try {
        const response = await listConversations({
          projectId,
          sessionId,
        });

        if (response.success && response.data?.length > 0) {
          const conversation = response.data[0];
          const messages = parseChatMessages(conversation.content);

          // 清空当前消息并加载历史消息
          setChatMessages(messages);
        }
      } catch (error) {
        message.error('加载历史会话失败');
      }
    },
    [projectId],
  );

  /**
   * 自动加载所有历史会话的消息
   */
  const loadAllHistorySessions = useCallback(async () => {
    if (!projectId) return;

    setIsLoadingHistory(true);
    try {
      const response = await listConversations({
        projectId,
      });

      if (response.success && response.data?.length > 0) {
        // 按创建时间排序，获取所有会话
        const sortedConversations = response.data.sort(
          (a: any, b: any) =>
            new Date(a.created).getTime() - new Date(b.created).getTime(),
        );

        // 合并所有会话的消息
        const allMessages: AppDevChatMessage[] = [];

        for (const conversation of sortedConversations) {
          try {
            const messages = parseChatMessages(conversation.content);

            // 为每个消息添加会话信息并生成唯一ID
            const messagesWithSessionInfo = addSessionInfoToMessages(messages, {
              sessionId: conversation.sessionId,
              topic: conversation.topic,
              created: conversation.created,
            });

            allMessages.push(...messagesWithSessionInfo);
          } catch (parseError) {}
        }

        // 按时间戳排序所有消息
        const sortedMessages = sortMessagesByTimestamp(allMessages);

        // 加载所有历史消息
        setChatMessages(sortedMessages);
      }
    } catch (error) {
      // 不显示错误提示，因为这是自动加载，用户可能不知道
    } finally {
      setIsLoadingHistory(false);
    }
  }, [projectId]);

  /**
   * 组件初始化时自动加载所有历史会话
   */
  useEffect(() => {
    if (projectId) {
      loadAllHistorySessions();
    }
  }, [projectId]); // 移除 loadAllHistorySessions 依赖，避免无限循环

  /**
   * 组件卸载时清理资源
   */
  useEffect(() => {
    return () => {
      // 清理超时定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      abortConnectionRef.current?.abort();
    };
  }, []);

  return {
    // 状态
    aiChatSessionId,
    chatMessages,
    chatInput,
    isChatLoading,
    isLoadingHistory, // 新增：历史会话加载状态

    // 方法
    setChatInput,
    setChatMessages, // 新增：设置聊天消息的方法
    sendChat,
    sendMessage, // 新增：支持附件的发送消息方法
    cancelChat,
    cleanupAppDevSSE,
    loadHistorySession,
    loadAllHistorySessions, // 新增：自动加载所有历史会话
  };
};
