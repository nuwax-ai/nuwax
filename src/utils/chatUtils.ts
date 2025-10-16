/**
 * 聊天相关工具函数
 */

import { MessageModeEnum } from '@/types/enums/agent';
import type { AppDevChatMessage } from '@/types/interfaces/appDev';

/**
 * 检测是否为文件操作
 * @param messageData SSE消息数据
 * @returns 是否为文件操作
 */
export const isFileOperation = (messageData: any): boolean => {
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
    // kind === 'execute' || // 执行命令操作（注释掉，避免过度触发）
    command.includes('rm ') || // 删除文件命令
    command.includes('mv ') || // 移动/重命名文件命令
    command.includes('cp ') || // 复制文件命令
    command.includes('mkdir ') || // 创建目录命令
    command.includes('touch ') || // 创建文件命令
    command.includes('echo ') || // 写入文件命令
    // command.includes('cat ') || // 读取文件命令（注释掉，避免过度触发）
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
};

/**
 * 生成唯一的请求ID
 * @returns 请求ID
 */
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * 生成唯一的消息ID
 * @param role 消息角色
 * @param requestId 请求ID
 * @returns 消息ID
 */
export const generateMessageId = (role: string, requestId?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  return requestId
    ? `${role}_${requestId}_${timestamp}_${random}`
    : `${role}_${timestamp}_${random}`;
};

/**
 * 生成唯一的附件ID
 * @param type 附件类型
 * @returns 附件ID
 */
export const generateAttachmentId = (type: string): string => {
  return `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * 创建用户消息
 * @param text 消息文本
 * @param requestId 请求ID
 * @returns 用户消息对象
 */
export const createUserMessage = (
  text: string,
  requestId: string,
): AppDevChatMessage => {
  return {
    id: generateMessageId('user', requestId),
    role: 'USER',
    type: MessageModeEnum.CHAT,
    text,
    time: new Date().toISOString(),
    status: null,
    requestId,
    timestamp: new Date(),
  };
};

/**
 * 创建助手消息
 * @param requestId 请求ID
 * @param sessionId 会话ID
 * @returns 助手消息对象
 */
export const createAssistantMessage = (
  requestId: string,
  sessionId: string,
): AppDevChatMessage => {
  return {
    id: generateMessageId('assistant', requestId),
    role: 'ASSISTANT',
    type: MessageModeEnum.CHAT,
    text: '',
    think: '',
    time: new Date().toISOString(),
    status: null,
    requestId,
    sessionId,
    isStreaming: true,
    timestamp: new Date(),
  };
};

/**
 * 更新聊天消息
 * @param messages 当前消息列表
 * @param requestId 请求ID
 * @param role 消息角色
 * @param updates 更新内容
 * @returns 更新后的消息列表
 */
export const updateChatMessage = (
  messages: AppDevChatMessage[],
  requestId: string,
  role: string,
  updates: Partial<AppDevChatMessage>,
): AppDevChatMessage[] => {
  const index = messages.findIndex(
    (msg) => msg.requestId === requestId && msg.role === role,
  );

  if (index >= 0) {
    const updated = [...messages];
    updated[index] = { ...updated[index], ...updates };
    return updated;
  }

  return messages;
};

/**
 * 标记流式消息为完成状态
 * @param messages 当前消息列表
 * @param requestId 请求ID
 * @returns 更新后的消息列表
 */
export const markStreamingMessageComplete = (
  messages: AppDevChatMessage[],
  requestId: string,
): AppDevChatMessage[] => {
  return updateChatMessage(messages, requestId, 'ASSISTANT', {
    isStreaming: false,
  });
};

/**
 * 标记流式消息为错误状态
 * @param messages 当前消息列表
 * @param requestId 请求ID
 * @param errorMessage 错误消息
 * @returns 更新后的消息列表
 */
export const markStreamingMessageError = (
  messages: AppDevChatMessage[],
  requestId: string,
  errorMessage: string,
): AppDevChatMessage[] => {
  return updateChatMessage(messages, requestId, 'ASSISTANT', {
    isStreaming: false,
    text:
      (messages.find(
        (msg) => msg.requestId === requestId && msg.role === 'ASSISTANT',
      )?.text || '') +
      '\n\n[已出错] ' +
      errorMessage,
  });
};

/**
 * 标记流式消息为取消状态
 * @param messages 当前消息列表
 * @param requestId 请求ID
 * @returns 更新后的消息列表
 */
export const markStreamingMessageCancelled = (
  messages: AppDevChatMessage[],
  requestId: string,
): AppDevChatMessage[] => {
  return updateChatMessage(messages, requestId, 'ASSISTANT', {
    isStreaming: false,
    text:
      (messages.find(
        (msg) => msg.requestId === requestId && msg.role === 'ASSISTANT',
      )?.text || '') + '\n\n[已取消]',
  });
};

/**
 * 追加文本到流式消息
 * @param messages 当前消息列表
 * @param requestId 请求ID
 * @param chunkText 追加的文本
 * @param isFinal 是否为最终消息
 * @returns 更新后的消息列表
 */
export const appendTextToStreamingMessage = (
  messages: AppDevChatMessage[],
  requestId: string,
  chunkText: string,
  isFinal: boolean = false,
): AppDevChatMessage[] => {
  const index = messages.findIndex(
    (msg) => msg.requestId === requestId && msg.role === 'ASSISTANT',
  );

  if (index >= 0) {
    const updated = [...messages];
    const beforeText = updated[index].text || '';
    updated[index] = {
      ...updated[index],
      text: beforeText ? beforeText + '\n\n' + chunkText : chunkText,
      isStreaming: !isFinal,
    };
    return updated;
  }

  return messages;
};

/**
 * 生成会话主题
 * @param messages 消息列表
 * @returns 会话主题
 */
export const generateConversationTopic = (
  messages: AppDevChatMessage[],
): string => {
  const firstUserMessage = messages.find((msg) => msg.role === 'USER');
  return firstUserMessage ? firstUserMessage.text.substring(0, 50) : '新会话';
};

/**
 * 序列化聊天消息
 * @param messages 消息列表
 * @returns 序列化后的JSON字符串
 */
export const serializeChatMessages = (
  messages: AppDevChatMessage[],
): string => {
  return JSON.stringify(messages);
};

/**
 * 解析聊天消息
 * @param content 序列化的消息内容
 * @returns 解析后的消息列表
 */
export const parseChatMessages = (content: string): AppDevChatMessage[] => {
  try {
    return JSON.parse(content) as AppDevChatMessage[];
  } catch (error) {
    console.error('解析聊天消息失败:', error);
    return [];
  }
};

/**
 * 为历史消息添加会话信息
 * @param messages 消息列表
 * @param conversationInfo 会话信息
 * @returns 添加会话信息后的消息列表
 */
export const addSessionInfoToMessages = (
  messages: AppDevChatMessage[],
  conversationInfo: {
    sessionId: string;
    topic: string;
    created: string;
  },
): AppDevChatMessage[] => {
  return messages.map((msg, index) => ({
    ...msg,
    id: `${msg.id}_${conversationInfo.created}_${index}`,
    sessionId: conversationInfo.sessionId,
    conversationTopic: conversationInfo.topic,
    conversationCreated: conversationInfo.created,
  }));
};

/**
 * 按时间戳排序消息
 * @param messages 消息列表
 * @returns 排序后的消息列表
 */
export const sortMessagesByTimestamp = (
  messages: AppDevChatMessage[],
): AppDevChatMessage[] => {
  return messages.sort((a, b) => {
    const timeA = new Date(a.timestamp || a.time).getTime();
    const timeB = new Date(b.timestamp || b.time).getTime();
    return timeA - timeB;
  });
};

/**
 * 检查消息ID是否重复
 * @param messages 消息列表
 * @returns 重复的ID列表
 */
export const findDuplicateMessageIds = (
  messages: AppDevChatMessage[],
): string[] => {
  return messages
    .filter(
      (msg, index, arr) => arr.findIndex((m) => m.id === msg.id) !== index,
    )
    .map((msg) => msg.id);
};

/**
 * 统计消息按会话分组
 * @param messages 消息列表
 * @returns 按会话分组的统计信息
 */
export const getMessageStatsByConversation = (
  messages: AppDevChatMessage[],
): Record<string, number> => {
  return messages.reduce((acc, msg) => {
    const key = msg.conversationTopic || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * 验证请求ID是否匹配
 * @param messageRequestId 消息中的请求ID
 * @param activeRequestId 当前活跃的请求ID
 * @returns 是否匹配
 */
export const isRequestIdMatch = (
  messageRequestId: string,
  activeRequestId: string,
): boolean => {
  return messageRequestId === activeRequestId;
};

/**
 * 生成SSE连接URL
 * @param sessionId 会话ID
 * @returns SSE连接URL
 */
export const generateSSEUrl = (sessionId: string): string => {
  return `${process.env.BASE_URL}/api/custom-page/ai-session-sse?session_id=${sessionId}`;
};

/**
 * 获取认证头信息
 * @returns 认证头对象
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('ACCESS_TOKEN') ?? '';
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json, text/plain, */* ',
  };
};
