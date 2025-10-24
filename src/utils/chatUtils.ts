/**
 * 聊天相关工具函数
 */

import { MessageModeEnum } from '@/types/enums/agent';
import type {
  AppDevChatMessage,
  Attachment,
  DataSourceAttachment,
  DataSourceSelection,
  FileStreamAttachment,
} from '@/types/interfaces/appDev';

/**
 * 检测是否为依赖操作（安装、删除、升级依赖）
 * @param messageData SSE消息数据
 * @returns 是否为依赖操作
 */
export const isDependencyOperation = (messageData: any): boolean => {
  const dependencyRelatedTools = [
    'install_package',
    'uninstall_package',
    'update_package',
    'add_dependency',
    'remove_dependency',
    'update_dependency',
  ];

  // 检查工具名称、命令、类型或描述是否包含依赖操作
  const toolName = messageData.toolName || '';
  const command = messageData.rawInput?.command || '';
  const description = messageData.rawInput?.description || '';
  const kind = messageData.kind || '';
  const title = messageData.title || '';

  // 检查是否包含 package.json 相关的字段
  const filePath = messageData.rawInput?.file_path || '';
  const hasPackageJsonContent =
    messageData.rawInput?.new_string?.includes('package.json') ||
    messageData.rawInput?.old_string?.includes('package.json');

  // 检查 content 数组中是否包含 package.json 编辑信息
  const content = messageData.content || [];
  const hasPackageJsonEditContent = content.some(
    (item: any) =>
      item.type === 'diff' && item.path && item.path.includes('package.json'),
  );

  // 检查是否包含依赖相关的字段
  const hasDependencyFields =
    messageData.rawInput?.dependencies ||
    messageData.rawInput?.devDependencies ||
    messageData.rawInput?.peerDependencies ||
    messageData.rawInput?.package_name ||
    messageData.rawInput?.package_version;

  return (
    dependencyRelatedTools.some((tool) => toolName.includes(tool)) ||
    kind === 'install' || // 安装操作
    kind === 'uninstall' || // 卸载操作
    kind === 'update' || // 更新操作
    command.includes('npm install') || // npm 安装命令
    command.includes('npm uninstall') || // npm 卸载命令
    command.includes('npm update') || // npm 更新命令
    command.includes('yarn add') || // yarn 添加命令
    command.includes('yarn remove') || // yarn 移除命令
    command.includes('yarn upgrade') || // yarn 升级命令
    command.includes('pnpm add') || // pnpm 添加命令
    command.includes('pnpm remove') || // pnpm 移除命令
    command.includes('pnpm update') || // pnpm 更新命令
    command.includes('pip install') || // pip 安装命令
    command.includes('pip uninstall') || // pip 卸载命令
    command.includes('pip install --upgrade') || // pip 升级命令
    command.includes('package.json') || // 直接操作 package.json
    filePath.includes('package.json') || // 文件路径包含 package.json
    hasPackageJsonContent || // 内容包含 package.json
    hasPackageJsonEditContent || // 编辑内容包含 package.json
    hasDependencyFields || // 包含依赖相关字段
    title.toLowerCase().includes('dependency') || // 标题包含依赖
    title.toLowerCase().includes('package') || // 标题包含包
    title.toLowerCase().includes('install') || // 标题包含安装
    title.toLowerCase().includes('uninstall') || // 标题包含卸载
    title.toLowerCase().includes('update') || // 标题包含更新
    description.toLowerCase().includes('dependency') || // 描述包含依赖
    description.toLowerCase().includes('package') || // 描述包含包
    description.toLowerCase().includes('install') || // 描述包含安装
    description.toLowerCase().includes('uninstall') || // 描述包含卸载
    description.toLowerCase().includes('update') // 描述包含更新
  );
};

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

  // 检查是否包含文件路径相关的字段（新增）
  const filePath = messageData.rawInput?.file_path || '';
  const hasFileContent =
    messageData.rawInput?.new_string || messageData.rawInput?.old_string;

  // 检查 content 数组中是否包含文件编辑信息（新增）
  const content = messageData.content || [];
  const hasFileEditContent = content.some(
    (item: any) => item.type === 'diff' && item.path,
  );

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

    description.includes('删除') ||
    description.includes('创建') ||
    description.includes('移动') ||
    description.includes('重命名') ||
    description.includes('编辑') ||
    description.includes('写入') ||
    // 新增：检查文件路径和内容相关字段
    (filePath && hasFileContent) || // 包含文件路径且有文件内容修改
    hasFileEditContent || // content 数组中包含文件编辑信息
    // 检查标题中是否包含文件路径（如 "Edit /path/to/file"）
    (title.includes('Edit ') && title.includes('/')) ||
    (title.includes('Write ') && title.includes('/')) ||
    (title.includes('Create ') && title.includes('/')) ||
    (title.includes('Delete ') && title.includes('/'))
  );
};

/**
 * 检测是否为文件操作或依赖操作
 * @param messageData SSE消息数据
 * @returns 是否为文件操作或依赖操作
 */
export const isFileOrDependencyOperation = (messageData: any): boolean => {
  return isFileOperation(messageData) || isDependencyOperation(messageData);
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
 * 将 DataSourceSelection 转换为 DataSourceAttachment
 * @param dataSource 数据源选择对象
 * @returns 数据源附件对象
 */
export const convertDataSourceSelectionToAttachment = (
  dataSource: DataSourceSelection,
): DataSourceAttachment => {
  return {
    id: `datasource-${dataSource.dataSourceId}-${dataSource.type}`,
    dataSourceId: dataSource.dataSourceId,
    type: dataSource.type,
    name: dataSource.name,
  };
};

/**
 * 创建用户消息
 * @param text 消息文本
 * @param requestId 请求ID
 * @param attachments 消息附件（可选）
 * @param dataSources 数据源列表（可选）
 * @returns 用户消息对象
 */
export const createUserMessage = (
  text: string,
  requestId: string,
  attachments?: Attachment[],
  attachmentPrototypeImages?: FileStreamAttachment[],
  dataSources?: DataSourceSelection[],
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
    attachments, // 传统附件（图片、文件等）
    dataSources, // 直接使用 selectedDataSources
    attachmentPrototypeImages, // 原型图片附件列表
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

    // 检查是否包含 Plan 或 ToolCall 标记
    const hasPlanOrToolCallMarkers =
      chunkText.includes('<appdev-plan') ||
      chunkText.includes('<appdev-toolcall');

    // 如果包含标记，直接替换而不是追加，避免重复渲染
    if (hasPlanOrToolCallMarkers) {
      updated[index] = {
        ...updated[index],
        text: chunkText, // 直接使用新的完整文本
        isStreaming: !isFinal,
      };
    } else {
      // 普通文本追加
      updated[index] = {
        ...updated[index],
        text: beforeText ? beforeText + chunkText : chunkText, // 移除多余的换行
        isStreaming: !isFinal,
      };
    }

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
 * 生成AI-CHAT SSE连接URL
 * @returns AI-CHAT SSE连接URL
 */
export const generateAIChatSSEUrl = (): string => {
  return `${process.env.BASE_URL}/api/custom-page/ai-chat-flux`;
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
