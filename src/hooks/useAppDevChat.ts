/**
 * AppDev 聊天相关 Hook
 */

import {
  cancelAgentTask,
  listConversations,
  saveConversation,
  sendChatMessage,
} from '@/services/appDev';
import { MessageModeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  AppDevChatMessage,
  UnifiedSessionMessage,
} from '@/types/interfaces/appDev';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';

interface UseAppDevChatProps {
  projectId: string;
  onRefreshFileTree?: () => void; // 新增：文件树刷新回调
}

export const useAppDevChat = ({
  projectId,
  onRefreshFileTree,
}: UseAppDevChatProps) => {
  // 使用 AppDev SSE 连接 model
  const appDevSseModel = useModel('appDevSseConnection');

  const [chatMessages, setChatMessages] = useState<AppDevChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false); // 新增：历史会话加载状态
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // 用于存储超时定时器的 ref
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 页面可见性状态
  const [isPageVisible, setIsPageVisible] = useState(true);

  // 最后活动时间
  const lastActivityRef = useRef<number>(Date.now());

  // 重连定时器
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 保活定时器
  const keepAliveTimerRef = useRef<NodeJS.Timeout | null>(null);

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
   * 处理SSE消息 - 基于 request_id 分组处理
   */
  const handleSSEMessage = useCallback(
    (message: UnifiedSessionMessage) => {
      console.log(
        '📨 [SSE] 收到消息:',
        `${message.messageType}.${message.subType}`,
        message.data,
      );

      switch (message.messageType) {
        case 'sessionPromptStart': {
          // 从 data 中提取 request_id
          const requestId = message.data?.request_id;
          if (!requestId) {
            console.warn('⚠️ prompt_start 缺少 request_id');
            return;
          }

          // 创建 ASSISTANT 占位消息
          const assistantMessage: AppDevChatMessage = {
            id: `assistant_${requestId}_${Date.now()}_${Math.random()
              .toString(36)
              .slice(2, 9)}`,
            role: 'ASSISTANT',
            type: MessageModeEnum.CHAT,
            text: '',
            think: '',
            time: new Date().toISOString(),
            status: MessageStatusEnum.Loading,
            requestId: requestId,
            sessionId: message.sessionId,
            isStreaming: true,
            timestamp: new Date(),
          };

          setChatMessages((prev) => [...prev, assistantMessage]);
          setIsChatLoading(true);
          break;
        }

        // case 'agent_thought_chunk': {
        //   const requestId = message.data?.request_id;
        //   const thoughtText =
        //     message.data?.thinking || message.data?.text || '';

        //   setChatMessages((prev) => {
        //     const index = prev.findIndex(
        //       (msg) =>
        //         msg.requestId === requestId &&
        //         msg.role === 'ASSISTANT' &&
        //         msg.isStreaming,
        //     );
        //     if (index >= 0) {
        //       const updated = [...prev];
        //       updated[index] = {
        //         ...updated[index],
        //         think: (updated[index].think || '') + thoughtText,
        //       };
        //       return updated;
        //     } else {
        //       console.warn(
        //         '⚠️ [SSE] agent_thought_chunk 未找到对应的 ASSISTANT 消息，requestId:',
        //         requestId,
        //       );
        //     }
        //     return prev;
        //   });
        //   break;
        // }

        case 'agentSessionUpdate': {
          if (message.subType === 'agent_message_chunk') {
            const requestId = message.data?.request_id;
            const chunkText = message.data?.text || '';
            const isFinal = message.data?.is_final;
            console.log(
              '📝 [SSE] agent_message_chunk 收到，requestId:',
              requestId,
              'isFinal:',
              isFinal,
            );

            setChatMessages((prev) => {
              const index = prev.findIndex(
                (msg) =>
                  msg.requestId === requestId &&
                  msg.role === 'ASSISTANT' &&
                  msg.isStreaming,
              );
              if (index >= 0) {
                const updated = [...prev];
                updated[index] = {
                  ...updated[index],
                  text: (updated[index].text || '') + chunkText,
                  status: isFinal
                    ? MessageStatusEnum.Complete
                    : MessageStatusEnum.Incomplete,
                  isStreaming: !isFinal, // 如果 isFinal 为 true，则停止流式传输
                };
                console.log(
                  '📝 [SSE] 更新 ASSISTANT 消息，isStreaming:',
                  !isFinal,
                );
                return updated;
              } else {
                console.warn(
                  '⚠️ [SSE] agent_message_chunk 未找到对应的 ASSISTANT 消息，requestId:',
                  requestId,
                );
              }
              return prev;
            });
          }
          break;
        }

        case 'sessionPromptEnd': {
          const requestId = message.data?.request_id;
          const sessionId = message.sessionId;
          console.log('🏁 [SSE] prompt_end 收到，requestId:', requestId);
          console.log('🏁 [SSE] 当前会话状态:', {
            sessionId,
            projectId,
            chatMessagesCount: chatMessages.length,
          });

          setChatMessages((prev) => {
            console.log(
              '🔍 [SSE] prompt_end 当前消息列表:',
              prev.map((msg) => ({
                id: msg.id,
                role: msg.role,
                requestId: msg.requestId,
                status: msg.status,
                isStreaming: false,
              })),
            );

            // 查找所有匹配 requestId 的 ASSISTANT 消息（不管 isStreaming 状态）
            const index = prev.findIndex(
              (msg) => msg.requestId === requestId && msg.role === 'ASSISTANT',
            );
            if (index >= 0) {
              console.log(
                '✅ [SSE] 找到对应的 ASSISTANT 消息，标记为完成，索引:',
                index,
              );
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                status: MessageStatusEnum.Complete,
                isStreaming: false,
              };
              console.log('📝 [SSE] 更新后的消息:', updated[index]);
              handleSaveConversation(
                updated.filter((msg) => msg.requestId === requestId), // 只保存当前 requestId 的会话
                sessionId,
                projectId,
              ); // 自动保存会话
              return updated;
            } else {
              console.warn(
                '⚠️ [SSE] 未找到对应的 ASSISTANT 消息，requestId:',
                requestId,
                '当前所有消息的 requestId:',
                prev.map((msg) => ({
                  role: msg.role,
                  requestId: msg.requestId,
                })),
              );
            }
            return prev;
          });

          // 无论是否找到对应消息，都要结束 loading 状态
          console.log('🔄 [SSE] 设置 isChatLoading = false');
          setIsChatLoading(false);

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
    [setIsChatLoading, setChatMessages, handleSaveConversation],
  );

  /**
   * 更新最后活动时间
   */
  const updateLastActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  /**
   * 初始化 AppDev SSE 连接
   */
  const initializeAppDevSSEConnection = useCallback(
    async (sessionId: string) => {
      console.log('🔧 [Chat] 初始化 AppDev SSE 连接，sessionId:', sessionId);

      await appDevSseModel.initializeAppDevSSEConnection({
        baseUrl: 'http://localhost:3000',
        sessionId,
        onMessage: handleSSEMessage,
        onError: (error: Event) => {
          console.error('❌ [Chat] AppDev SSE 连接错误:', error);
          message.error('AI助手连接失败');
        },
        onOpen: () => {
          console.log('🔌 [Chat] AppDev SSE 连接已建立');
        },
        onClose: () => {
          console.log('🔌 [Chat] AppDev SSE 连接已关闭');
        },
      });
    },
    [appDevSseModel, handleSSEMessage],
  );

  /**
   * 检查是否需要重连 SSE
   */
  const checkAndReconnectSSE = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    // 如果页面可见且超过 15 分钟无活动，或者页面不可见超过 5 分钟
    const shouldReconnect =
      (isPageVisible && timeSinceLastActivity > 15 * 60 * 1000) || // 15分钟
      (!isPageVisible && timeSinceLastActivity > 5 * 60 * 1000); // 5分钟

    if (shouldReconnect && currentSessionId) {
      console.log('🔄 [Chat] 检测到需要重连 SSE，原因:', {
        isPageVisible,
        timeSinceLastActivity: Math.round(timeSinceLastActivity / 1000 / 60),
        minutes: '分钟',
      });

      // 先断开现有连接
      appDevSseModel.disconnectAppDevSSE();

      // 延迟重连
      setTimeout(async () => {
        try {
          await initializeAppDevSSEConnection(currentSessionId);
          updateLastActivity();
          console.log('✅ [Chat] SSE 重连成功');
        } catch (error) {
          console.error('❌ [Chat] SSE 重连失败:', error);
        }
      }, 1000);
    }
  }, [
    isPageVisible,
    currentSessionId,
    appDevSseModel,
    initializeAppDevSSEConnection,
    updateLastActivity,
  ]);

  /**
   * 启动保活定时器
   */
  const startKeepAliveTimer = useCallback(() => {
    // 清除现有定时器
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
    }

    // 每 5 分钟检查一次
    keepAliveTimerRef.current = setInterval(() => {
      checkAndReconnectSSE();
    }, 5 * 60 * 1000);

    console.log('⏰ [Chat] 保活定时器已启动，每 5 分钟检查一次');
  }, [checkAndReconnectSSE]);

  /**
   * 停止保活定时器
   */
  const stopKeepAliveTimer = useCallback(() => {
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
      console.log('⏹️ [Chat] 保活定时器已停止');
    }
  }, []);

  /**
   * 页面可见性变化处理
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);

      console.log('👁️ [Chat] 页面可见性变化:', isVisible ? '可见' : '隐藏');

      if (isVisible) {
        // 页面变为可见时，更新活动时间并检查连接
        updateLastActivity();
        checkAndReconnectSSE();
      }
    };

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 监听页面焦点变化
    const handleFocus = () => {
      setIsPageVisible(true);
      updateLastActivity();
      checkAndReconnectSSE();
    };

    const handleBlur = () => {
      setIsPageVisible(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [updateLastActivity, checkAndReconnectSSE]);

  /**
   * 组件卸载时清理资源
   */
  useEffect(() => {
    return () => {
      // 清理所有定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      stopKeepAliveTimer();

      // 断开 SSE 连接
      appDevSseModel.cleanupAppDev();

      console.log('🧹 [Chat] 组件卸载，已清理所有资源');
    };
  }, [appDevSseModel, stopKeepAliveTimer]);

  /**
   * 发送聊天消息 - SSE 长连接模式
   */
  const sendChat = useCallback(async () => {
    if (!chatInput.trim()) return;

    // 更新活动时间
    updateLastActivity();

    // 1. 生成唯一 request_id
    const requestId = `req_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    // 2. 添加用户消息
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
    console.log('🚀 [Chat] 设置 isChatLoading = true，requestId:', requestId);
    setIsChatLoading(true);
    try {
      // 3. 调用 API (传递 request_id)
      const response = await sendChatMessage({
        prompt: chatInput,
        project_id: projectId,
        session_id: currentSessionId || undefined,
        request_id: requestId, // 关键: 传递 request_id
      });

      if (response.success && response.data) {
        const serverSessionId = response.data.session_id;

        // 4. 首次发送时建立 SSE 连接
        if (!currentSessionId) {
          setCurrentSessionId(serverSessionId);
          await initializeAppDevSSEConnection(serverSessionId);
          // 启动保活定时器
          startKeepAliveTimer();
        }
        // 后续发送复用已有 SSE 连接,不需要重新建立
      } else {
        throw new Error(response.message || '发送消息失败');
      }
    } catch (error) {
      console.error('AI聊天失败:', error);
      message.error(
        `AI聊天失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
      console.log(
        '❌ [Chat] 错误处理：设置 isChatLoading = false，requestId:',
        requestId,
      );
      setIsChatLoading(false);
      // 清除超时定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // 标记 ASSISTANT 消息为错误状态
      setChatMessages((prev) => {
        const index = prev.findIndex(
          (msg) => msg.requestId === requestId && msg.role === 'ASSISTANT',
        );
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            status: MessageStatusEnum.Error,
            isStreaming: false,
          };
          return updated;
        }
        return prev;
      });
    }
  }, [
    chatInput,
    currentSessionId,
    projectId,
    initializeAppDevSSEConnection,
    updateLastActivity,
    startKeepAliveTimer,
  ]);

  /**
   * 取消聊天任务
   */
  const cancelChat = useCallback(async () => {
    if (!currentSessionId || !projectId) {
      return;
    }

    try {
      console.log('🛑 [Chat] 取消AI聊天任务');

      // 更新活动时间
      updateLastActivity();

      await cancelAgentTask(projectId, currentSessionId);

      // 断开 AppDev SSE 连接
      appDevSseModel.disconnectAppDevSSE();

      setIsChatLoading(false);

      // 将正在流式传输的消息标记为取消状态
      setChatMessages((prev) => {
        return prev.map((msg) => {
          if (msg.isStreaming && msg.role === 'ASSISTANT') {
            return {
              ...msg,
              status: MessageStatusEnum.Error,
              isStreaming: false,
              text: msg.text + '\n\n[已取消]',
            };
          }
          return msg;
        });
      });

      message.success('已取消AI任务');
    } catch (error) {
      console.error('取消AI任务失败:', error);
      message.error('取消AI任务失败');
    }
  }, [currentSessionId, projectId, appDevSseModel, updateLastActivity]);

  /**
   * 清理 AppDev SSE 连接
   */
  const cleanupAppDevSSE = useCallback(() => {
    console.log('🧹 [Chat] 清理 AppDev SSE 连接');
    appDevSseModel.cleanupAppDev();
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
          setCurrentSessionId(sessionId);

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
        let latestSessionId: string | null = null;

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

            // 记录最新的会话ID
            if (!latestSessionId) {
              latestSessionId = conversation.sessionId;
            }
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
        setCurrentSessionId(latestSessionId);

        console.log('✅ [Chat] 已自动加载所有历史会话:', {
          totalConversations: sortedConversations.length,
          totalMessages: allMessages.length,
          latestSessionId,
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
  }, [projectId, loadAllHistorySessions]);

  return {
    // 状态
    chatMessages,
    chatInput,
    isChatLoading,
    isLoadingHistory, // 新增：历史会话加载状态
    currentSessionId,
    isPageVisible,

    // 方法
    setChatInput,
    setChatMessages, // 新增：设置聊天消息的方法
    sendChat,
    cancelChat,
    cleanupAppDevSSE,
    updateLastActivity,
    loadHistorySession,
    stopKeepAliveTimer,
    loadAllHistorySessions, // 新增：自动加载所有历史会话
  };
};
