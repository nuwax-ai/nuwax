/**
 * AppDev 聊天相关 Hook
 */

import { CHAT_CONSTANTS } from '@/constants/appDevConstants';
import { cancelAgentTask, sendChatMessage } from '@/services/appDev';
import type {
  AgentMessageData,
  AgentThoughtData,
  UnifiedSessionMessage,
} from '@/types/interfaces/appDev';
import { createSSEManager, type SSEManager } from '@/utils/sseManager';
import { message } from 'antd';
import { useCallback, useState } from 'react';

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    CHAT_CONSTANTS.DEFAULT_MESSAGES,
  );
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sseManager, setSseManager] = useState<SSEManager | null>(null);

  /**
   * 处理SSE消息
   */
  const handleSSEMessage = useCallback((message: UnifiedSessionMessage) => {
    switch (message.subType) {
      case 'agent_thought_chunk': {
        const thoughtData = message.data as AgentThoughtData;
        const thinkingMessage: ChatMessage = {
          id: `thinking_${Date.now()}`,
          type: 'thinking',
          content: `思考中: ${thoughtData.thinking}`,
          timestamp: new Date(),
          sessionId: message.sessionId,
        };
        setChatMessages((prev) => [...prev, thinkingMessage]);
        break;
      }

      case 'agent_message_chunk': {
        const messageData = message.data as AgentMessageData;
        const aiMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: messageData.content.text,
          timestamp: new Date(),
          sessionId: message.sessionId,
          isStreaming: !messageData.is_final,
        };

        if (messageData.is_final) {
          setIsChatLoading(false);
        }

        setChatMessages((prev) => {
          const existingStreamingIndex = prev.findIndex(
            (msg) => msg.sessionId === message.sessionId && msg.isStreaming,
          );

          if (existingStreamingIndex >= 0) {
            const updated = [...prev];
            updated[existingStreamingIndex] = aiMessage;
            return updated;
          } else {
            return [...prev, aiMessage];
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
   * 初始化SSE连接管理器
   */
  const initializeSSEManager = useCallback(
    (sessionId: string) => {
      console.log('🔧 [SSE] 初始化 SSE 管理器，sessionId:', sessionId);

      if (sseManager) {
        console.log('🔄 [SSE] 销毁现有的 SSE 管理器');
        sseManager.destroy();
      }

      const newSseManager = createSSEManager({
        baseUrl: 'http://localhost:3000', // 使用新的 API 服务器地址
        sessionId,
        onMessage: handleSSEMessage,
        onError: (error) => {
          console.error('❌ [SSE] 连接错误:', error);
          message.error('AI助手连接失败');
        },
        onOpen: () => {
          console.log('🔌 [SSE] 连接已建立');
        },
        onClose: () => {
          console.log('🔌 [SSE] 连接已关闭');
        },
      });

      setSseManager(newSseManager);
      console.log('🚀 [SSE] 开始连接 SSE');
      // connect 现在是异步方法
      newSseManager.connect().catch((error) => {
        console.error('❌ [SSE] 连接失败:', error);
      });

      return newSseManager;
    },
    [sseManager, handleSSEMessage],
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

        // 建立 SSE 连接
        console.log(
          '🔌 [Chat] 准备建立 SSE 连接，session_id:',
          serverSessionId,
        );
        initializeSSEManager(serverSessionId);
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
  }, [chatInput, currentSessionId, projectId, initializeSSEManager]);

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

      if (sseManager) {
        sseManager.destroy();
        setSseManager(null);
      }

      setIsChatLoading(false);
      message.success('已取消AI任务');
    } catch (error) {
      console.error('取消AI任务失败:', error);
      message.error('取消AI任务失败');
    }
  }, [currentSessionId, projectId, sseManager]);

  /**
   * 清理SSE连接
   */
  const cleanup = useCallback(() => {
    if (sseManager) {
      sseManager.destroy();
      setSseManager(null);
    }
  }, [sseManager]);

  return {
    chatMessages,
    chatInput,
    setChatInput,
    isChatLoading,
    sendChat,
    cancelChat,
    cleanup,
  };
};
