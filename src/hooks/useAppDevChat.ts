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
      if (sseManager) {
        sseManager.destroy();
      }

      const newSseManager = createSSEManager({
        baseUrl: 'http://localhost:8000',
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
      newSseManager.connect();

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
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = `${
          CHAT_CONSTANTS.SESSION_ID_PREFIX
        }${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        setCurrentSessionId(sessionId);
      }

      const response = await sendChatMessage({
        user_id: CHAT_CONSTANTS.DEFAULT_USER_ID,
        prompt: inputText,
        project_id: projectId || undefined,
        session_id: sessionId,
        request_id: `${
          CHAT_CONSTANTS.REQUEST_ID_PREFIX
        }${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      });

      if (response.success && response.data) {
        initializeSSEManager(response.data.session_id);
      } else {
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
