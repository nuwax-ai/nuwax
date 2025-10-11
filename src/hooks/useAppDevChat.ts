/**
 * AppDev 聊天相关 Hook
 */

import { CHAT_CONSTANTS } from '@/constants/appDevConstants';
import { cancelAgentTask, sendChatMessage } from '@/services/appDev';
import type { UnifiedSessionMessage } from '@/types/interfaces/appDev';
import { message } from 'antd';
import { useCallback, useState } from 'react';
import { useModel } from 'umi';

interface ChatMessage {
  id: string;
  type: 'ai' | 'user' | 'button' | 'section' | 'thinking' | 'tool_call';
  content?: string;
  timestamp?: Date;
  action?: string;
  title?: string;
  items?: string[];
  isExpanded?: boolean;
  details?: string[];
  sessionId?: string;
  isStreaming?: boolean;
}

interface UseAppDevChatProps {
  projectId: string;
}

export const useAppDevChat = ({ projectId }: UseAppDevChatProps) => {
  // 使用 AppDev SSE 连接 model
  const appDevSseModel = useModel('appDevSseConnection');

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    CHAT_CONSTANTS.DEFAULT_MESSAGES,
  );
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  // const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<
  //   string | null
  // >(null);

  /**
   * 处理SSE消息
   */
  const handleSSEMessage = useCallback((message: UnifiedSessionMessage) => {
    console.log('🔍 [Chat] 处理SSE消息:', message);
    console.log('🔍 [Chat] message.subType:', message.subType);
    console.log('🔍 [Chat] message.data:', message.data);

    switch (message.subType) {
      case 'agent_thought_chunk': {
        const thoughtData = message.data as any; // 临时使用 any 类型
        const thinkingMessage: ChatMessage = {
          id: `thinking_${Date.now()}`,
          type: 'thinking',
          content: `思考中: ${
            thoughtData.thinking || thoughtData.text || '正在思考...'
          }`,
          timestamp: new Date(),
          sessionId: message.sessionId,
        };
        setChatMessages((prev) => [...prev, thinkingMessage]);
        break;
      }

      case 'agent_message_chunk': {
        const messageData = message.data as any; // 临时使用 any 类型
        const chunkText = messageData.text || messageData.content?.text || '';

        console.log('📝 [Chat] 收到流式文本块:', chunkText);
        console.log('📝 [Chat] is_final:', messageData.is_final);

        if (messageData.is_final) {
          setIsChatLoading(false);
        }

        setChatMessages((prev) => {
          // 查找当前会话的流式消息
          const existingStreamingIndex = prev.findIndex(
            (msg) => msg.sessionId === message.sessionId && msg.isStreaming,
          );

          if (existingStreamingIndex >= 0) {
            // 更新现有的流式消息，累积文本
            const updated = [...prev];
            const existingMessage = updated[existingStreamingIndex];
            updated[existingStreamingIndex] = {
              ...existingMessage,
              content: (existingMessage.content || '') + chunkText,
              isStreaming: !messageData.is_final,
            };
            console.log(
              '📝 [Chat] 更新流式消息，累积内容:',
              updated[existingStreamingIndex].content,
            );
            return updated;
          } else {
            // 创建新的流式消息
            const messageId = `ai_stream_${message.sessionId}_${Date.now()}`;
            // setCurrentStreamingMessageId(messageId);
            const newMessage: ChatMessage = {
              id: messageId,
              type: 'ai',
              content: chunkText,
              timestamp: new Date(),
              sessionId: message.sessionId,
              isStreaming: !messageData.is_final,
            };
            console.log('📝 [Chat] 创建新流式消息:', newMessage.content);
            return [...prev, newMessage];
          }
        });
        break;
      }

      case 'tool_call': {
        const toolCallData = message.data;
        const toolMessage: ChatMessage = {
          id: `tool_${Date.now()}`,
          type: 'tool_call',
          content: `🔧 正在执行: ${toolCallData.tool_call.name}`,
          timestamp: new Date(),
          sessionId: message.sessionId,
        };
        setChatMessages((prev) => [...prev, toolMessage]);
        break;
      }

      case 'prompt_end':
        setIsChatLoading(false);
        break;
    }
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
   * 发送聊天消息
   */
  const sendChat = useCallback(async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const inputText = chatInput;
    setChatInput('');
    setIsChatLoading(true);
    // setCurrentStreamingMessageId(null); // 清理之前的流式消息ID

    try {
      // 第一次发送消息时不传递 session_id，让服务器生成
      const response = await sendChatMessage({
        prompt: inputText,
        project_id: projectId || undefined,
        session_id: currentSessionId || undefined, // 第一次为 undefined，后续使用返回的 session_id
        request_id: `${
          CHAT_CONSTANTS.REQUEST_ID_PREFIX
        }${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      });

      console.log('📨 [Chat] 完整服务器响应:', response);
      console.log('📨 [Chat] response.success:', response.success);
      console.log('📨 [Chat] response.data:', response.data);
      console.log(
        '📨 [Chat] response.data?.session_id:',
        response.data?.session_id,
      );

      if (response.success && response.data) {
        // 使用服务器返回的 session_id，如果没有则使用客户端生成的
        let serverSessionId = response.data.session_id;

        // 如果服务器没有返回 session_id，使用客户端生成的
        if (!serverSessionId) {
          console.warn('⚠️ [Chat] 服务器没有返回 session_id，使用客户端生成的');
          serverSessionId = `${
            CHAT_CONSTANTS.SESSION_ID_PREFIX
          }${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        }

        console.log('📨 [Chat] 最终使用的 session_id:', serverSessionId);
        console.log('📨 [Chat] response.data 内容:', response.data);

        // 如果是第一次发送消息，保存 session_id
        if (!currentSessionId) {
          console.log('💾 [Chat] 保存新的 session_id:', serverSessionId);
          setCurrentSessionId(serverSessionId);
        }

        // 建立 AppDev SSE 连接
        console.log(
          '🔌 [Chat] 准备建立 AppDev SSE 连接，session_id:',
          serverSessionId,
        );
        await initializeAppDevSSEConnection(serverSessionId);
      } else {
        console.error('❌ [Chat] 请求失败:', response);
        console.error('❌ [Chat] response.success:', response.success);
        console.error('❌ [Chat] response.data:', response.data);
        console.error('❌ [Chat] response.message:', response.message);
        throw new Error(response.message || '发送消息失败');
      }
    } catch (error) {
      console.error('AI聊天失败:', error);
      message.error(
        `AI聊天失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
      setIsChatLoading(false);
    }
  }, [chatInput, currentSessionId, projectId, initializeAppDevSSEConnection]);

  /**
   * 取消聊天任务
   */
  const cancelChat = useCallback(async () => {
    if (!currentSessionId || !projectId) {
      return;
    }

    try {
      console.log('🛑 [Chat] 取消AI聊天任务');
      await cancelAgentTask(projectId, currentSessionId);

      // 断开 AppDev SSE 连接
      appDevSseModel.disconnectAppDevSSE();

      setIsChatLoading(false);
      message.success('已取消AI任务');
    } catch (error) {
      console.error('取消AI任务失败:', error);
      message.error('取消AI任务失败');
    }
  }, [currentSessionId, projectId, appDevSseModel]);

  /**
   * 清理 AppDev SSE 连接
   */
  const cleanupAppDevSSE = useCallback(() => {
    console.log('🧹 [Chat] 清理 AppDev SSE 连接');
    appDevSseModel.cleanupAppDev();
  }, [appDevSseModel]);

  return {
    chatMessages,
    chatInput,
    setChatInput,
    isChatLoading,
    sendChat,
    cancelChat,
    cleanupAppDevSSE,
  };
};
