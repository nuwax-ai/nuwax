/**
 * AppDev 聊天相关 Hook
 */

import { ACCESS_TOKEN } from '@/constants/home.constants';
import {
  listConversations,
  saveConversation,
  sendChatMessage,
  stopAgentService,
} from '@/services/appDev';
import { MessageModeEnum } from '@/types/enums/agent';
import type {
  AppDevChatMessage,
  Attachment,
  UnifiedSessionMessage,
} from '@/types/interfaces/appDev';
import { debounce } from '@/utils/appDevUtils';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { message, Modal } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';

import { AGENT_SERVICE_RUNNING } from '@/constants/codes.constants';
import type { DataSourceSelection } from '@/types/interfaces/appDev';

interface UseAppDevChatProps {
  projectId: string;
  selectedModelId?: number | null; // 新增：选中的模型ID
  onRefreshFileTree?: (preserveState?: boolean, forceRefresh?: boolean) => void; // 新增：文件树刷新回调
  selectedDataSources?: DataSourceSelection[]; // 新增：选中的数据源列表
  onClearDataSourceSelections?: () => void; // 新增：清除数据源选择回调
  onRefreshVersionList?: () => void; // 新增：刷新版本列表回调
  onClearUploadedImages?: () => void; // 新增：清除上传图片回调
}

export const useAppDevChat = ({
  projectId,
  selectedModelId, // 新增
  onRefreshFileTree,
  selectedDataSources = [],
  onClearDataSourceSelections,
  onRefreshVersionList, // 新增：刷新版本列表回调
  onClearUploadedImages, // 新增：清除上传图片回调
}: UseAppDevChatProps) => {
  // 使用 AppDev SSE 连接 model
  const appDevSseModel = useModel('appDevSseConnection');

  const [chatMessages, setChatMessages] = useState<AppDevChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // 新增：历史会话加载状态

  const abortConnectionRef = useRef<AbortController | null>(null);

  // 用于存储超时定时器的 ref
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 记录用户主动发送的消息数量（不包括历史消息）- 已注释，暂时不使用
  // const userSentMessageCountRef = useRef(0);

  // 存储文件操作相关的 toolCallId
  const fileOperationToolCallIdsRef = useRef<Set<string>>(new Set());

  // 添加防抖的文件树刷新函数
  const debouncedRefreshFileTree = useCallback(
    debounce(() => {
      if (onRefreshFileTree) {
        console.log('🔄 [Chat] 触发文件树刷新(保持状态，强制刷新)');
        // 调用时传递参数，强制刷新但保持状态
        onRefreshFileTree(true, true); // preserveState=true, forceRefresh=true
      }
    }, 500), // 500ms 防抖
    [onRefreshFileTree],
  );

  /**
   * 检测是否为文件操作
   * @param messageData SSE消息数据
   * @returns 是否为文件操作
   */
  const isFileOperation = useCallback((messageData: any): boolean => {
    const fileRelatedTools = [
      'write_file',
      'edit_file',
      'delete_file',
      'create_directory',
    ];

    // 检查工具名称、命令、类型或描述是否包含文件操作
    const toolName = messageData.toolName || '';
    const command = messageData.rawInput?.command || '';
    const description = messageData.rawInput?.description || '';
    const kind = messageData.kind || '';
    const title = messageData.title || '';

    return (
      fileRelatedTools.some((tool) => toolName.includes(tool)) ||
      kind === 'edit' || // 文件编辑操作
      kind === 'write' || // 文件写入操作
      // kind === 'execute' || // 执行命令操作
      command.includes('rm ') || // 删除文件命令
      command.includes('mv ') || // 移动/重命名文件命令
      command.includes('cp ') || // 复制文件命令
      command.includes('mkdir ') || // 创建目录命令
      command.includes('touch ') || // 创建文件命令
      command.includes('echo ') || // 写入文件命令
      // command.includes('cat ') || // 读取文件命令
      title.includes('Edit ') || // 编辑文件标题
      title.includes('Write ') || // 写入文件标题
      title.includes('Create ') || // 创建文件标题
      title.includes('Delete ') || // 删除文件标题
      description.includes('删除') ||
      description.includes('创建') ||
      description.includes('移动') ||
      description.includes('重命名') ||
      description.includes('编辑') ||
      description.includes('写入')
    );
  }, []);

  const handleSaveConversation = useCallback(
    (
      chatMessages: AppDevChatMessage[],
      sessionId: string,
      projectId: string,
    ) => {
      const firstUserMessage = chatMessages.find((msg) => msg.role === 'USER');
      const topic = firstUserMessage
        ? firstUserMessage.text.substring(0, 50)
        : '新会话';

      // 序列化会话内容
      const content = JSON.stringify(chatMessages);

      // 保存会话
      console.log('🔄 [Chat] 开始保存会话，参数:', {
        projectId,
        sessionId,
        topic,
        contentLength: content.length,
      });

      saveConversation({
        projectId,
        sessionId,
        content,
        topic,
      }).then((saveResult) => {
        console.log('✅ [Chat] 会话已自动保存，响应:', saveResult);

        // 新增：刷新文件树内容
        if (onRefreshFileTree) {
          console.log('🔄 [Chat] 触发文件树刷新');
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
      console.log(
        '📨 [SSE] 收到消息:',
        `${message.messageType}.${message.subType}`,
        message.data,
      );

      // 只处理匹配当前request_id的消息
      const messageRequestId = message.data?.request_id;

      if (messageRequestId !== activeRequestId) {
        console.warn('收到不匹配的request_id消息，忽略:', {
          expected: activeRequestId,
          received: messageRequestId,
        });
        return;
      }

      switch (message.messageType) {
        case 'sessionPromptStart': {
          break;
        }

        case 'agentSessionUpdate': {
          if (message.subType === 'agent_message_chunk') {
            const chunkText = message.data?.text || '';
            const isFinal = message.data?.is_final;

            setChatMessages((prev) => {
              const index = prev.findIndex(
                (msg) =>
                  msg.requestId === activeRequestId && msg.role === 'ASSISTANT',
              );
              if (index >= 0) {
                const updated = [...prev];
                const beforeText = updated[index].text || '';
                updated[index] = {
                  ...updated[index],
                  text: beforeText
                    ? beforeText + '\n\n' + chunkText
                    : chunkText,
                  isStreaming: !isFinal,
                };
                return updated;
              }
              return prev;
            });
          }

          if (message.subType === 'plan') {
            console.log('🔄 [SSE] 收到 plan 消息:', message.data);
            // plan 消息不立即刷新，等待 prompt_end
          }
          if (message.subType === 'tool_call') {
            console.log(
              '🔄 [SSE] 收到 tool_call 消息:',
              message.data.toolCallId,
            );
            // 检测是否为文件操作，如果是则记录 toolCallId
            if (isFileOperation(message.data) && message.data.toolCallId) {
              fileOperationToolCallIdsRef.current.add(message.data.toolCallId);
              console.log(
                '📝 [SSE] 记录文件操作 toolCallId:',
                message.data.toolCallId,
              );
            }
          }
          if (message.subType === 'tool_call_update') {
            console.log(
              '🔄 [SSE] 收到 tool_call_update 消息:',
              message.data.toolCallId,
            );
            // 检查对应的 toolCallId 是否为文件操作
            if (
              message.data.toolCallId &&
              fileOperationToolCallIdsRef.current.has(message.data.toolCallId)
            ) {
              console.log('🔄 [SSE] 检测到文件操作完成，触发文件树刷新:', {
                toolCallId: message.data.toolCallId,
                status: message.data.status,
              });
              debouncedRefreshFileTree();
            }
          }
          break;
        }

        case 'sessionPromptEnd': {
          console.log('🏁 [SSE] 收到 sessionPromptEnd，准备关闭SSE连接');

          // 标记消息完成
          setChatMessages((prev) => {
            const index = prev.findIndex(
              (msg) =>
                msg.requestId === activeRequestId && msg.role === 'ASSISTANT',
            );
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                isStreaming: false,
              };

              // 保存会话
              const userMessage = prev.find(
                (m) => m.requestId === activeRequestId && m.role === 'USER',
              );
              if (userMessage) {
                handleSaveConversation(
                  [userMessage, updated[index]],
                  message.sessionId,
                  projectId,
                );
              }

              return updated;
            }
            return prev;
          });

          // 会话结束时执行一次文件树刷新
          debouncedRefreshFileTree();

          // 清理文件操作 toolCallId 记录
          fileOperationToolCallIdsRef.current.clear();

          setIsChatLoading(false);

          // 延迟关闭SSE连接，确保消息处理完成
          console.log('🔌 [SSE] 延迟关闭SSE连接');
          abortConnectionRef.current?.abort?.();
          break;
        }

        case 'heartbeat':
          // 仅用于保活,不做任何处理
          console.log('💓 [SSE] Heartbeat');
          break;

        default:
          console.log(
            '📭 [SSE] 未处理的事件类型:',
            `${message.messageType}.${message.subType}`,
          );
      }
    },
    [
      projectId,
      handleSaveConversation,
      appDevSseModel,
      debouncedRefreshFileTree,
      isFileOperation,
    ],
  );

  /**
   * 初始化 AppDev SSE 连接
   */
  const initializeAppDevSSEConnection = useCallback(
    async (sessionId: string, requestId: string) => {
      console.log(
        '🔧 [Chat] 初始化 AppDev SSE 连接，sessionId:',
        sessionId,
        'requestId:',
        requestId,
      );
      console.log('🔌 [Chat] AppDev SSE 连接已建立');
      const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
      const sseUrl = `${process.env.BASE_URL}/api/custom-page/ai-session-sse?session_id=${sessionId}`;
      console.log(`🔌 [AppDev SSE Model] 连接到: ${sseUrl}`);
      abortConnectionRef.current = new AbortController();
      // 创建ASSISTANT占位消息
      const assistantMessage: AppDevChatMessage = {
        id: `assistant_${requestId}_${Date.now()}`,
        role: 'ASSISTANT',
        type: MessageModeEnum.CHAT,
        text: '',
        think: '',
        time: new Date().toISOString(),
        status: null,
        requestId: requestId,
        sessionId: sessionId,
        isStreaming: true,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, assistantMessage]);

      await createSSEConnection({
        url: sseUrl,
        method: 'GET',
        abortController: abortConnectionRef.current,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json, text/plain, */* ',
        },
        onOpen: () => {
          console.log('🔌 [Chat] AppDev SSE 连接已建立');
        },
        onMessage: (data: UnifiedSessionMessage) => {
          console.log('📨 [AppDev SSE Model] 收到消息:', data);
          handleSSEMessage(data, requestId);
        },
        onError: (error: Error) => {
          console.error('❌ [Chat] AppDev SSE 连接错误:', error);
          message.error('AI助手连接失败');
          //要把 chatMessages 里 ASSISTANT 当前 isSteaming 修改一下 false 并给出错误消息
          setChatMessages((prev) => {
            return prev.map((msg) => {
              if (msg.isStreaming && msg.role === 'ASSISTANT') {
                return {
                  ...msg,
                  isStreaming: false,
                  text: msg.text + '\n\n[已出错] ' + error.message,
                };
              }
              return msg;
            });
          });
          setIsChatLoading(false);

          abortConnectionRef.current?.abort();
          debouncedRefreshFileTree();
        },
        onClose: () => {
          console.log('🔌 [Chat] AppDev SSE 连接已关闭');
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
   * 发送消息并建立SSE连接的核心逻辑
   */
  const sendMessageAndConnectSSE = useCallback(
    async (attachments?: Attachment[]) => {
      // 生成临时request_id
      const requestId = `req_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 9)}`;
      try {
        // 调用发送消息API
        const response = await sendChatMessage({
          prompt: chatInput,
          project_id: projectId,
          request_id: requestId,
          model_id: selectedModelId ? String(selectedModelId) : undefined, // 新增：传递模型ID
          attachments: attachments || undefined,
          data_sources:
            selectedDataSources.length > 0 ? selectedDataSources : undefined,
        });

        if (response.success && response.data) {
          // 新增：/ai-chat 接口发送成功后立即刷新版本列表
          if (onRefreshVersionList) {
            console.log('🔄 [Chat] /ai-chat 接口发送成功，触发版本列表刷新');
            onRefreshVersionList();
          }

          // 新增：/ai-chat 接口发送成功后清除上传图片
          if (onClearUploadedImages) {
            console.log('🔄 [Chat] /ai-chat 接口发送成功，清除上传图片');
            onClearUploadedImages();
          }

          // 消息发送成功后清除数据源选择
          if (onClearDataSourceSelections) {
            onClearDataSourceSelections();
          }

          // 添加用户消息
          const userMessage: AppDevChatMessage = {
            id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            role: 'USER',
            type: MessageModeEnum.CHAT,
            text: chatInput,
            time: new Date().toISOString(),
            status: null,
            requestId: requestId,
            timestamp: new Date(),
          };

          setChatMessages((prev) => [...prev, userMessage]);
          setChatInput('');
          setIsChatLoading(true);

          const sessionId = response.data.session_id;

          // 立即建立SSE连接（使用返回的session_id）
          await initializeAppDevSSEConnection(sessionId, requestId);
        } else {
          throw new Error(response.message || '发送消息失败');
        }
      } catch (error) {
        console.log('error=========', error);
        if (error && (error as any).code === AGENT_SERVICE_RUNNING) {
          showStopAgentServiceModal(projectId, () => {
            sendMessageAndConnectSSE(); //继续发送消息
          });
        } else {
          console.error('发送消息失败:', error);
          message.error('发送消息失败');
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
   */
  const sendMessage = useCallback(
    async (attachments?: Attachment[]) => {
      // 验证：prompt（输入内容）是必填的
      if (!chatInput.trim()) {
        message.warning('请输入消息内容');
        return;
      }

      // 发送消息
      sendMessageAndConnectSSE(attachments);
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

    try {
      console.log('🛑 [Chat] 取消AI聊天任务');

      setIsChatLoading(false);

      // 将正在流式传输的消息标记为取消状态
      setChatMessages((prev) => {
        return prev.map((msg) => {
          if (msg.isStreaming && msg.role === 'ASSISTANT') {
            return {
              ...msg,
              isStreaming: false,
              text: msg.text + '\n\n[已取消]',
            };
          }
          return msg;
        });
      });
      abortConnectionRef.current?.abort();
      message.success('已取消AI任务');
    } catch (error) {
      console.error('取消AI任务失败:', error);
      message.error('取消AI任务失败');
    }
  }, [projectId, appDevSseModel]);

  /**
   * 清理 AppDev SSE 连接
   */
  const cleanupAppDevSSE = useCallback(() => {
    console.log('🧹 [Chat] 清理 AppDev SSE 连接');
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
          const messages = JSON.parse(
            conversation.content,
          ) as AppDevChatMessage[];

          // 清空当前消息并加载历史消息
          setChatMessages(messages);

          console.log('✅ [Chat] 已加载历史会话:', sessionId);
        }
      } catch (error) {
        console.error('❌ [Chat] 加载历史会话失败:', error);
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
      console.log('🔄 [Chat] 开始自动加载所有历史会话');

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
            const messages = JSON.parse(
              conversation.content,
            ) as AppDevChatMessage[];

            // 为每个消息添加会话信息并生成唯一ID
            const messagesWithSessionInfo = messages.map((msg, index) => ({
              ...msg,
              id: `${msg.id}_${conversation.created}_${index}`, // 使用created时间戳作为key
              sessionId: conversation.sessionId,
              conversationTopic: conversation.topic,
              conversationCreated: conversation.created,
            }));

            allMessages.push(...messagesWithSessionInfo);
          } catch (parseError) {
            console.warn(
              '⚠️ [Chat] 解析会话内容失败:',
              conversation.sessionId,
              parseError,
            );
          }
        }

        // 按时间戳排序所有消息
        allMessages.sort((a, b) => {
          const timeA = new Date(a.timestamp || a.time).getTime();
          const timeB = new Date(b.timestamp || b.time).getTime();
          return timeA - timeB;
        });

        // 加载所有历史消息
        setChatMessages(allMessages);

        console.log('✅ [Chat] 已自动加载所有历史会话:', {
          totalConversations: sortedConversations.length,
          totalMessages: allMessages.length,
          conversations: sortedConversations.map((conv: any) => ({
            sessionId: conv.sessionId,
            topic: conv.topic,
            created: conv.created,
            messageCount: JSON.parse(conv.content).length,
            keyUsed: conv.created, // 显示使用的key
          })),
          messageBreakdown: allMessages.reduce((acc, msg) => {
            const key = msg.conversationTopic || 'unknown';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          allMessageIds: allMessages.map((msg) => msg.id), // 显示所有消息ID（使用created时间戳）
          duplicateIds: allMessages
            .filter(
              (msg, index, arr) =>
                arr.findIndex((m) => m.id === msg.id) !== index,
            )
            .map((msg) => msg.id), // 检查重复ID
          idPattern: '${原始ID}_${created时间戳}_${索引}', // 显示ID生成模式
        });
      } else {
        console.log('ℹ️ [Chat] 暂无历史会话，将创建新会话');
      }
    } catch (error) {
      console.error('❌ [Chat] 自动加载所有历史会话失败:', error);
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
      console.log('🚀 [Chat] 组件初始化，开始自动加载所有历史会话');
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

      console.log('🧹 [Chat] 组件卸载，已清理所有资源');
    };
  }, []);

  return {
    // 状态
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
