/**
 * AppDev 聊天相关 Hook
 */

import {
  listConversations,
  saveConversation,
  stopAgentService,
} from '@/services/appDev';
import {
  AgentSessionUpdateSubType,
  SessionMessageType,
  type AppDevChatMessage,
  type Attachment,
  type FileStreamAttachment,
  type UnifiedSessionMessage,
} from '@/types/interfaces/appDev';
import { debounce } from '@/utils/appDevUtils';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { message, Modal } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';

import {
  AGENT_SERVICE_RUNNING,
  SUCCESS_CODE,
} from '@/constants/codes.constants';
import {
  insertPlanBlock,
  insertToolCallBlock,
  insertToolCallUpdateBlock,
} from '@/pages/AppDev/utils/markdownProcess';
import { AssistantRoleEnum } from '@/types/enums/agent';
import type { DataSourceSelection, FileNode } from '@/types/interfaces/appDev';
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

/**
 * @ 提及的项类型（与 ChatInputHome 保持一致）
 */
type MentionItem =
  | { type: 'file'; data: FileNode }
  | { type: 'folder'; data: FileNode }
  | { type: 'datasource'; data: DataResource };

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
}: UseAppDevChatProps) => {
  // 使用 AppDev SSE 连接 model
  const appDevSseModel = useModel('appDevSseConnection');

  const [aiChatSessionId, setAiChatSessionId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<AppDevChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false); // 新增：历史会话加载状态

  /**
   * 滚动加载更多历史会话相关状态
   */
  const currentPageRef = useRef<number>(1); // 新增：当前页码的 ref，用于立即获取最新值
  const [totalHistoryCount, setTotalHistoryCount] = useState<number>(0); // 新增：历史记录总数
  const hasMoreHistoryRef = useRef<boolean>(false); // 是否还有更多历史记录，初始为false
  const isLoadingMoreHistoryRef = useRef<boolean>(false); // 滚动加载更多历史会话状态，初始为false

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
        case SessionMessageType.SESSION_PROMPT_START: {
          break;
        }

        case SessionMessageType.AGENT_SESSION_UPDATE: {
          const { subType, data } = message;
          if (subType === AgentSessionUpdateSubType.AGENT_MESSAGE_CHUNK) {
            const chunkText = data?.content?.text || data?.text || '';
            const isFinal = data?.is_final;
            // 如果 chunkText 不为空，则追加到消息列表，如果 isFinal 为 true，则标记消息完成
            if (chunkText) {
              setChatMessages((prev) =>
                appendTextToStreamingMessage(
                  prev,
                  activeRequestId,
                  chunkText,
                  isFinal,
                ),
              );
            }
          }

          if (subType === AgentSessionUpdateSubType.PLAN) {
            setChatMessages((prev) =>
              prev.map((msg) => {
                if (
                  msg.requestId === activeRequestId &&
                  msg.role === AssistantRoleEnum.ASSISTANT
                ) {
                  return {
                    ...msg,
                    text: insertPlanBlock(msg.text || '', {
                      planId: data.planId || 'default-plan',
                      entries: data.entries || [],
                    }),
                  };
                }
                return msg;
              }),
            );
          }
          if (subType === AgentSessionUpdateSubType.TOOL_CALL) {
            setChatMessages((prev) =>
              prev.map((msg) => {
                if (
                  msg.requestId === activeRequestId &&
                  msg.role === AssistantRoleEnum.ASSISTANT
                ) {
                  return {
                    ...msg,
                    text: insertToolCallBlock(msg.text || '', data.toolCallId, {
                      toolCallId: data.toolCallId,
                      title: data.title || '工具调用',
                      kind: data.kind || 'execute',
                      status: data.status,
                      content: data.content,
                      locations: data.locations,
                      rawInput: data.rawInput,
                      timestamp: message.timestamp,
                    }),
                  };
                }
                return msg;
              }),
            );
            // 检测是否为文件操作或依赖操作，如果是则记录 toolCallId
            if (isFileOrDependencyOperation(data) && data.toolCallId) {
              fileOperationToolCallIdsRef.current.add(data.toolCallId);
            }
          }
          if (subType === AgentSessionUpdateSubType.TOOL_CALL_UPDATE) {
            setChatMessages((prev) =>
              prev.map((msg) => {
                if (
                  msg.requestId === activeRequestId &&
                  msg.role === AssistantRoleEnum.ASSISTANT
                ) {
                  return {
                    ...msg,
                    text: insertToolCallUpdateBlock(
                      msg.text || '',
                      data.toolCallId,
                      {
                        toolCallId: data.toolCallId,
                        title: data.title || '工具调用更新',
                        kind: data.kind || 'execute',
                        status: data.status,
                        content: data.content,
                        locations: data.locations,
                        rawInput: data.rawInput,
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
              data.toolCallId &&
              fileOperationToolCallIdsRef.current.has(data.toolCallId)
            ) {
              debouncedRefreshFileTree();
            }
          }
          if (subType === AgentSessionUpdateSubType.ERROR) {
            // 错误处理
            const chunkText = data?.message || '';
            const isFinal = true;
            // 如果 chunkText 不为空，则追加到消息列表，如果 isFinal 为 true，则标记消息完成
            if (chunkText) {
              setChatMessages((prev) =>
                appendTextToStreamingMessage(
                  prev,
                  activeRequestId,
                  chunkText,
                  isFinal,
                ),
              );
            }

            // 会话结束时执行一次文件树刷新
            debouncedRefreshFileTree();
            setIsChatLoading(false);
            // 延迟关闭SSE连接，确保消息处理完成
            abortConnectionRef.current?.abort?.();
            //弹窗提示错误消息 强制用户关闭对话框并让用户确认停止Agent服务
            Modal.confirm({
              maskClosable: false,
              title: '错误消息',
              content:
                '服务异常，请停止Agent服务并重新开始对话' +
                (data?.code ? `(${data?.code})` : ''),
              onOk: () => {
                return new Promise((resolve, reject) => {
                  stopAgentService(projectId)
                    .then((stopResponse) => {
                      if (stopResponse.code === '0000') {
                        message.success('Agent服务已停止');
                        resolve(true);
                      } else {
                        message.error(
                          `停止Agent服务失败: ${
                            stopResponse.message || '未知错误'
                          }`,
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
            });
          }
          break;
        }

        case SessionMessageType.SESSION_PROMPT_END: {
          // 标记消息完成
          setChatMessages((prev) => {
            const updated = markStreamingMessageComplete(prev, activeRequestId);

            // 保存会话
            const userMessage = updated.find(
              (m) =>
                m.requestId === activeRequestId &&
                m.role === AssistantRoleEnum.USER,
            );
            const assistantMessage = updated.find(
              (m) =>
                m.requestId === activeRequestId &&
                m.role === AssistantRoleEnum.ASSISTANT,
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
            onRestartDevServer(); // 不等待，异步执行
          }

          // 清理文件操作和依赖操作 toolCallId 记录
          fileOperationToolCallIdsRef.current.clear();

          setIsChatLoading(false);

          // 延迟关闭SSE连接，确保消息处理完成
          abortConnectionRef.current?.abort?.();
          break;
        }

        case SessionMessageType.HEARTBEAT:
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
          setTimeout(() => {
            handleSSEMessage(data, requestId);
          }, 100);
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
          setChatMessages((prev) =>
            markStreamingMessageComplete(prev, requestId),
          );
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
        maskClosable: false,
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
          const chunkText = response?.message ? `${response?.message}` : '';
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
            setChatMessages((prev) =>
              markStreamingMessageError(
                prev,
                requestId,
                '服务异常，请稍后再试',
              ),
            );
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
      requestId: string = generateRequestId(), // 生成临时request_id
      selectedMentions?: MentionItem[], // 新增：@ 提及的项（包含通过 @ 选择的数据源）
    ) => {
      try {
        // 数据源数据结构提取
        // 1. 从 props 传入的 selectedDataResources 中提取
        const propsDataSources: DataSourceSelection[] =
          selectedDataResources
            .filter((item) => item.isSelected)
            ?.map((resource) => {
              return {
                dataSourceId: Number(resource.id),
                type: resource.type === 'plugin' ? 'plugin' : 'workflow',
                name: resource.name,
              };
            }) || [];

        // 2. 从 selectedMentions 中提取数据源（通过 @ 选择的数据源）
        const mentionDataSources: DataSourceSelection[] =
          selectedMentions
            ?.filter((mention) => mention.type === 'datasource')
            ?.map((mention) => {
              const dataSource = mention.data as DataResource;
              return {
                dataSourceId: Number(dataSource.id),
                type: dataSource.type === 'plugin' ? 'plugin' : 'workflow',
                name: dataSource.name,
              };
            }) || [];

        // 3. 合并两个来源的数据源，去重（基于 dataSourceId）
        const dataSourceMap = new Map<number, DataSourceSelection>();
        [...propsDataSources, ...mentionDataSources].forEach((ds) => {
          dataSourceMap.set(ds.dataSourceId, ds);
        });
        const _selectedDataResources: DataSourceSelection[] = Array.from(
          dataSourceMap.values(),
        );

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
   * @param requestId 请求ID
   * @param selectedMentions @ 提及的项（包含通过 @ 选择的数据源）
   */
  const sendMessage = useCallback(
    async (
      attachments?: Attachment[],
      attachmentFiles?: FileStreamAttachment[],
      attachmentPrototypeImages?: FileStreamAttachment[],
      requestId?: string,
      selectedMentions?: MentionItem[], // 新增：@ 提及的项
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
        requestId,
        selectedMentions, // 传递 @ 提及的项
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
    aIChatAbortConnectionRef.current?.abort();
    abortConnectionRef.current?.abort();
    setIsChatLoading(false);
    setChatMessages([]);
    setChatInput('');
    setAiChatSessionId('');
  }, []);

  /**
   * 加载历史会话
   * @param page 要加载的页码，默认为1（第一页）
   * @param isLoadMore 是否为加载更多操作，默认为false
   */
  const loadHistorySessions = async (
    page: number = 1,
    isLoadMore: boolean = false,
  ) => {
    if (!projectId) return;

    // 如果是加载更多操作，检查是否还有更多历史记录和是否正在加载
    if (
      isLoadMore &&
      (isLoadingMoreHistoryRef.current || !hasMoreHistoryRef.current)
    ) {
      return;
    }

    // 设置加载状态
    if (isLoadMore) {
      isLoadingMoreHistoryRef.current = true;
    } else {
      setIsLoadingHistory(true);
    }

    try {
      const { data, code } = await listConversations(projectId, page);

      if (code === SUCCESS_CODE) {
        // 更新分页信息
        currentPageRef.current = page; // 同时更新 ref，确保立即获取最新值
        hasMoreHistoryRef.current = data?.current < data?.pages;
        setTotalHistoryCount(data?.total || 0);

        // 按创建时间排序，获取所有会话
        const sortedConversations = data?.records.sort(
          (a: any, b: any) =>
            new Date(a.created).getTime() - new Date(b.created).getTime(),
        );

        // 合并所有会话的消息
        const newMessages: AppDevChatMessage[] = [];

        for (const conversation of sortedConversations) {
          try {
            const messages = parseChatMessages(conversation.content);

            // 为每个消息添加会话信息并生成唯一ID
            const messagesWithSessionInfo = addSessionInfoToMessages(messages, {
              sessionId: conversation.sessionId,
              topic: conversation.topic,
              created: conversation.created,
            });

            newMessages.push(...messagesWithSessionInfo);
          } catch (parseError) {}
        }

        // 按时间戳排序新消息
        const sortedNewMessages = sortMessagesByTimestamp(newMessages);

        // 更新消息列表
        if (isLoadMore) {
          // 加载更多：将新消息添加到现有消息列表的开头（历史消息在顶部）
          setChatMessages((prevMessages) => {
            return [...sortedNewMessages, ...prevMessages];
          });
        } else {
          // 初始加载：直接设置消息列表
          setChatMessages(sortedNewMessages);
        }
      }
    } catch (error) {
      console.error('加载历史会话失败:', error);
    } finally {
      // 清除加载状态
      if (isLoadMore) {
        isLoadingMoreHistoryRef.current = false;
      } else {
        setIsLoadingHistory(false);
      }
    }
  };

  /**
   * 组件初始化时自动加载所有历史会话
   */
  useEffect(() => {
    if (projectId) {
      loadHistorySessions();
    }
  }, [projectId]);

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
    isLoadingMoreHistoryRef, // 新增：加载更多历史会话状态
    currentPageRef, // 新增：当前页码的 ref，用于立即获取最新值
    hasMoreHistoryRef, // 新增：是否还有更多历史记录
    totalHistoryCount, // 新增：历史记录总数

    // 方法
    setChatInput,
    setChatMessages, // 新增：设置聊天消息的方法
    sendChat,
    sendMessage, // 新增：支持附件的发送消息方法
    cancelChat,
    cleanupAppDevSSE,
    // loadHistorySession,
    loadHistorySessions, // 新增：自动加载所有历史会话
  };
};
