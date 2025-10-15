/**
 * AppDev 聊天相关 Hook
 */

import { ACCESS_TOKEN } from '@/constants/home.constants';
import {
  checkAgentStatus,
  listConversations,
  saveConversation,
  sendChatMessage,
  stopAgentService,
} from '@/services/appDev';
import { MessageModeEnum } from '@/types/enums/agent';
import type {
  AppDevChatMessage,
  UnifiedSessionMessage,
} from '@/types/interfaces/appDev';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { message, Modal } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';

import type { DataSourceSelection } from '@/types/interfaces/appDev';

interface UseAppDevChatProps {
  projectId: string;
  onRefreshFileTree?: () => void; // 新增：文件树刷新回调
  selectedDataSources?: DataSourceSelection[]; // 新增：选中的数据源列表
  onClearDataSourceSelections?: () => void; // 新增：清除数据源选择回调
}

export const useAppDevChat = ({
  projectId,
  onRefreshFileTree,
  selectedDataSources = [],
  onClearDataSourceSelections,
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

  // 记录用户主动发送的消息数量（不包括历史消息）
  const userSentMessageCountRef = useRef(0);

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
          onRefreshFileTree();
        }
      });
    },
    [saveConversation, onRefreshFileTree],
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
          console.log('📭 [SSE] 未处理的事件类型:', message.subType);
      }
    },
    [projectId, handleSaveConversation, appDevSseModel],
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
          setIsChatLoading(false);
          abortConnectionRef.current?.abort();
        },
        onClose: () => {
          console.log('🔌 [Chat] AppDev SSE 连接已关闭');
          abortConnectionRef.current?.abort();
        },
      });
    },
    [appDevSseModel, handleSSEMessage],
  );

  /**
   * 发送消息并建立SSE连接的核心逻辑
   */
  const sendMessageAndConnectSSE = useCallback(async () => {
    // 生成临时request_id
    const requestId = `req_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;

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

    try {
      // 调用发送消息API
      const response = await sendChatMessage({
        prompt: chatInput,
        project_id: projectId,
        request_id: requestId,
        data_sources:
          selectedDataSources.length > 0 ? selectedDataSources : undefined,
      });

      if (response.success && response.data) {
        const sessionId = response.data.session_id;

        // 立即建立SSE连接（使用返回的session_id）
        await initializeAppDevSSEConnection(sessionId, requestId);

        // 消息发送成功后清除数据源选择
        if (onClearDataSourceSelections) {
          onClearDataSourceSelections();
        }
      } else {
        throw new Error(response.message || '发送消息失败');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送消息失败');
      setIsChatLoading(false);
    }
  }, [chatInput, projectId, initializeAppDevSSEConnection]);

  /**
   * 发送聊天消息 - 每次消息独立SSE连接
   */
  const sendChat = useCallback(async () => {
    if (!chatInput.trim()) return;

    // 1. 用户主动发送的第一条消息：检查Agent服务状态
    // 注意：这里只统计用户主动发送的消息，不包括历史消息
    if (userSentMessageCountRef.current === 0) {
      try {
        const statusResponse = await checkAgentStatus(projectId);
        console.log('🔍 [Chat] Agent状态检查结果:', statusResponse);
        if (
          statusResponse.data?.is_alive &&
          statusResponse.data?.status === 'Active'
        ) {
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
                      // 增加计数并继续发送消息
                      userSentMessageCountRef.current += 1;
                      sendMessageAndConnectSSE();
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
            onCancel: () => {
              // 用户取消停止Agent服务，不发送消息，不增加计数
              message.info('已取消发送');
            },
          });
          return; // 等待用户确认，不继续执行
        }
      } catch (error) {
        console.error('检查Agent状态失败:', error);
        // 检查失败时仍然允许发送消息，增加计数
      }
      // 检查完成且没有运行中的Agent，或检查失败，增加计数并发送
      userSentMessageCountRef.current += 1;
    } else {
      // 非第一条消息，直接增加计数
      userSentMessageCountRef.current += 1;
    }

    // 发送消息
    await sendMessageAndConnectSSE();
  }, [chatInput, projectId, sendMessageAndConnectSSE]);

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
    cancelChat,
    cleanupAppDevSSE,
    loadHistorySession,
    loadAllHistorySessions, // 新增：自动加载所有历史会话
  };
};
