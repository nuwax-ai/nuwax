/**
 * AppDev 聊天相关 Hook
 */

import { cancelAgentTask, sendChatMessage } from '@/services/appDev';
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
}

export const useAppDevChat = ({ projectId }: UseAppDevChatProps) => {
  // 使用 AppDev SSE 连接 model
  const appDevSseModel = useModel('appDevSseConnection');

  const [chatMessages, setChatMessages] = useState<AppDevChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
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
            id: `assistant_${requestId}_${Date.now()}`,
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
          console.log('🏁 [SSE] prompt_end 收到，requestId:', requestId);

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
    [setIsChatLoading, setChatMessages],
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
      id: `user_${Date.now()}`,
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

  return {
    // 状态
    chatMessages,
    chatInput,
    isChatLoading,
    currentSessionId,
    isPageVisible,

    // 方法
    setChatInput,
    sendChat,
    cancelChat,
    cleanupAppDevSSE,
    updateLastActivity,
    stopKeepAliveTimer,
  };
};
