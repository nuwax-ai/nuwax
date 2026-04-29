/**
 * 聊天相关工具函数
 */

import {
  insertPlanBlock,
  insertToolCallBlock,
  insertToolCallUpdateBlock,
} from '@/pages/AppDev/utils/markdownProcess';
import { dict } from '@/services/i18nRuntime';
import { MessageModeEnum } from '@/types/enums/agent';
import {
  AgentSessionUpdateSubType,
  SessionMessageType,
  type AppDevChatMessage,
  type Attachment,
  type DataSourceAttachment,
  type DataSourceSelection,
  type FileStreamAttachment,
  type ToolCallInfo,
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
      '\n\n[' +
      dict('PC.Utils.ChatUtils.errorOccurred') +
      '] ' +
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
      )?.text || '') +
      '\n\n[' +
      dict('PC.Utils.ChatUtils.cancelled') +
      ']',
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

    // 如果消息已被标记为非流式（包括取消/完成/错误），忽略后续追加，避免插入到提示尾部
    if (updated[index].isStreaming === false) {
      return messages;
    }

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
 * 追加思考文本到当前流式 ASSISTANT 消息（与 appendTextToStreamingMessage 对称，写入 think）
 * 不修改 isStreaming：流式结束仅由 agent_message_chunk / SESSION_PROMPT_END 等决定，
 * 避免 thought 分片上的 is_final 误把正文后续 chunk 全部丢弃。
 */
export const appendThinkToStreamingMessage = (
  messages: AppDevChatMessage[],
  requestId: string,
  chunkText: string,
): AppDevChatMessage[] => {
  const index = messages.findIndex(
    (msg) => msg.requestId === requestId && msg.role === 'ASSISTANT',
  );

  if (index >= 0) {
    const updated = [...messages];
    if (updated[index].isStreaming === false) {
      return messages;
    }
    const beforeThink = updated[index].think || '';
    updated[index] = {
      ...updated[index],
      think: beforeThink ? beforeThink + chunkText : chunkText,
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
  return firstUserMessage
    ? firstUserMessage.text.substring(0, 50)
    : dict('PC.Utils.ChatUtils.newConversation');
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
 * 解析聊天消息（旧格式：content 为 AppDevChatMessage[] 的 JSON 字符串）
 * @param content 序列化的消息内容
 * @returns 解析后的消息列表；非数组 JSON 一律返回空，避免误把新结构化 content 当数组遍历
 */
export const parseChatMessages = (content: string): AppDevChatMessage[] => {
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as AppDevChatMessage[]) : [];
  } catch (error) {
    return [];
  }
};

/**
 * 从持久化事件流合并为单条 ASSISTANT 历史消息（think / text / tool_call 等与 SSE 渲染一致）
 */
const buildAssistantMessageFromPersistedEvents = (
  events: unknown[],
  fallbackTime: string,
  requestIdSeed: string,
  /** 列表接口返回的会话行 id；内层 events 无 request_id 时用于 requestId / 消息 id 兜底 */
  outerListRecordId?: string | number,
): AppDevChatMessage => {
  let think = '';
  let text = '';
  let sessionFromEvents = '';
  let requestId = `history_${requestIdSeed}`;
  let gotRequestFromSessionEnd = false;
  let lastTimestamp =
    (typeof fallbackTime === 'string' && fallbackTime.trim()) ||
    '1970-01-01T00:00:00.000Z';

  const normalizeTimestamp = (outer: any): string => {
    const candidate =
      (typeof outer?.timestamp === 'string' && outer.timestamp.trim()) ||
      lastTimestamp;
    const d = new Date(candidate);
    return Number.isNaN(d.getTime()) ? lastTimestamp : candidate;
  };

  for (let i = 0; i < events.length; i++) {
    const item = events[i] as any;
    if (!item || typeof item !== 'object') {
      continue;
    }

    // 兼容两种落库形态：{ event, data }（与 SSE 行一致）或扁平 UnifiedSessionMessage
    const envelope = item.data !== undefined ? item.data : item;
    const eventName =
      (typeof item.event === 'string' && item.event) ||
      (typeof envelope?.subType === 'string' && envelope.subType) ||
      '';

    const subType =
      typeof envelope?.subType === 'string' ? envelope.subType : '';
    const data = envelope?.data ?? {};
    const effectiveSub = subType || eventName;

    if (typeof envelope?.sessionId === 'string' && envelope.sessionId) {
      sessionFromEvents = envelope.sessionId;
    }

    lastTimestamp = normalizeTimestamp(envelope);

    if (
      effectiveSub === 'agent_thought_chunk' ||
      eventName === 'agent_thought_chunk'
    ) {
      const chunk = data?.content?.text ?? data?.text ?? '';
      think += chunk;
    } else if (
      effectiveSub === AgentSessionUpdateSubType.AGENT_MESSAGE_CHUNK ||
      eventName === 'agent_message_chunk'
    ) {
      const chunk = data?.content?.text ?? data?.text ?? '';
      text += chunk;
    } else if (
      effectiveSub === AgentSessionUpdateSubType.TOOL_CALL ||
      eventName === 'tool_call'
    ) {
      const toolCallId = data?.toolCallId || data?.tool_call_id;
      if (toolCallId) {
        const toolPayload: ToolCallInfo = {
          toolCallId,
          title: data?.title || dict('PC.Pages.AppDevChat.toolCall'),
          kind: data?.kind || 'execute',
          status: data?.status || 'pending',
          content: data?.content,
          locations: data?.locations,
          rawInput: data?.rawInput,
          timestamp: lastTimestamp,
        };
        text = insertToolCallBlock(text, toolCallId, toolPayload);
      }
    } else if (
      effectiveSub === AgentSessionUpdateSubType.TOOL_CALL_UPDATE ||
      eventName === 'tool_call_update'
    ) {
      const toolCallId = data?.toolCallId || data?.tool_call_id;
      if (toolCallId) {
        const toolPayload: ToolCallInfo = {
          toolCallId,
          title: data?.title || dict('PC.Pages.AppDevChat.toolCallUpdate'),
          kind: data?.kind || 'execute',
          status: data?.status || 'pending',
          content: data?.content,
          locations: data?.locations,
          rawInput: data?.rawInput,
          timestamp: lastTimestamp,
        };
        text = insertToolCallUpdateBlock(text, toolCallId, toolPayload);
      }
    } else if (
      effectiveSub === AgentSessionUpdateSubType.PLAN ||
      eventName === 'plan'
    ) {
      text = insertPlanBlock(text, {
        planId: data?.planId || 'default-plan',
        entries: data?.entries || [],
      });
    } else if (
      effectiveSub === AgentSessionUpdateSubType.ERROR ||
      eventName === 'error'
    ) {
      const errMsg = data?.message || '';
      if (errMsg) {
        text += errMsg;
      }
    } else if (
      envelope?.messageType === SessionMessageType.SESSION_PROMPT_END ||
      effectiveSub === 'end_turn' ||
      eventName === 'session_prompt_end'
    ) {
      const rid = data?.request_id || data?.requestId;
      if (typeof rid === 'string' && rid.trim()) {
        requestId = rid.trim();
        gotRequestFromSessionEnd = true;
      }
    }
  }

  const useOuterId =
    outerListRecordId !== undefined &&
    outerListRecordId !== null &&
    String(outerListRecordId).trim() !== '';

  const effectiveRequestId =
    gotRequestFromSessionEnd && requestId
      ? requestId
      : useOuterId
      ? String(outerListRecordId)
      : requestId;

  const effectiveMessageId = useOuterId
    ? String(outerListRecordId)
    : generateMessageId('assistant', effectiveRequestId);

  return {
    id: effectiveMessageId,
    role: 'ASSISTANT',
    type: MessageModeEnum.CHAT,
    text,
    think,
    time: lastTimestamp,
    status: null,
    requestId: effectiveRequestId,
    sessionId: sessionFromEvents || undefined,
    isStreaming: false,
    timestamp: new Date(lastTimestamp),
  };
};

/**
 * 新 USER 结构化 content -> 单条 AppDevChatMessage
 */
const buildUserMessageFromStructuredContent = (
  obj: Record<string, unknown>,
  fallbackTime: string,
  requestIdSeed: string,
  /** 列表行 id：content 内无 id / requestId 时兜底 */
  outerListRecordId?: string | number,
): AppDevChatMessage => {
  const time =
    (typeof obj.time === 'string' && obj.time.trim()) ||
    (typeof obj.timestamp === 'string' && obj.timestamp.trim()) ||
    (typeof fallbackTime === 'string' && fallbackTime.trim()) ||
    '1970-01-01T00:00:00.000Z';

  const useOuterId =
    outerListRecordId !== undefined &&
    outerListRecordId !== null &&
    String(outerListRecordId).trim() !== '';

  const innerRequestId =
    typeof obj.requestId === 'string' && obj.requestId.trim()
      ? obj.requestId.trim()
      : '';
  const requestId =
    innerRequestId || (useOuterId ? String(outerListRecordId) : requestIdSeed);

  const innerMessageId =
    typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : '';
  const messageId =
    innerMessageId ||
    (useOuterId
      ? String(outerListRecordId)
      : generateMessageId('user', requestId));

  return {
    id: messageId,
    role: 'USER',
    type: MessageModeEnum.CHAT,
    text: typeof obj.text === 'string' ? obj.text : String(obj.text ?? ''),
    think: '',
    time,
    status: null,
    requestId,
    isStreaming: false,
    timestamp: new Date(time),
    attachments: Array.isArray(obj.attachments)
      ? (obj.attachments as Attachment[])
      : [],
    attachmentPrototypeImages: Array.isArray(obj.attachmentPrototypeImages)
      ? (obj.attachmentPrototypeImages as FileStreamAttachment[])
      : [],
    dataSources: Array.isArray(obj.dataSources)
      ? (obj.dataSources as DataSourceSelection[])
      : [],
  };
};

/**
 * 解析单条会话记录的 content（统一入口，与后端落库格式对齐）：
 * - ASSISTANT：{ events: [...] } -> 聚合成单条助手消息（think / text / tool 标记等）
 * - USER：{ text, attachments, ... } -> 单条用户消息
 * - 解析不到上述结构时返回 []，由调用方回退 parseChatMessages（旧版 JSON 数组存量）
 */
export const parseConversationHistoryContent = (
  content: string | undefined | null,
  conversationRole?: string,
  fallbackTime?: string,
  /** page-query 会话列表行的 id；新 content 内无消息级 id 时写入 AppDevChatMessage.id / requestId */
  outerListRecordId?: string | number,
): AppDevChatMessage[] => {
  if (!content || typeof content !== 'string' || !content.trim()) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return [];
  }

  const fbTime =
    (typeof fallbackTime === 'string' && fallbackTime.trim()) ||
    '1970-01-01T00:00:00.000Z';
  const roleUpper = String(conversationRole || '')
    .trim()
    .toUpperCase();

  if (Array.isArray(parsed)) {
    return [];
  }

  if (!parsed || typeof parsed !== 'object') {
    return [];
  }

  const obj = parsed as Record<string, unknown>;
  const events = obj.events;

  if (Array.isArray(events) && events.length > 0) {
    return [
      buildAssistantMessageFromPersistedEvents(
        events,
        fbTime,
        `${fbTime}_${roleUpper || 'ASST'}`,
        outerListRecordId,
      ),
    ];
  }

  const hasUserSignals =
    typeof obj.text === 'string' ||
    Array.isArray(obj.attachments) ||
    Array.isArray(obj.dataSources) ||
    Array.isArray(obj.attachmentPrototypeImages);

  // 会话角色为 ASSISTANT，但 content 为扁平 text/think（无 events）时，按单条助手气泡处理，避免误判为 USER
  if (
    roleUpper === 'ASSISTANT' &&
    hasUserSignals &&
    (!Array.isArray(events) || events.length === 0)
  ) {
    const time =
      (typeof obj.time === 'string' && obj.time.trim()) ||
      (typeof obj.timestamp === 'string' && obj.timestamp.trim()) ||
      fbTime;

    const useOuterId =
      outerListRecordId !== undefined &&
      outerListRecordId !== null &&
      String(outerListRecordId).trim() !== '';

    const innerRequestId =
      typeof obj.requestId === 'string' && obj.requestId.trim()
        ? obj.requestId.trim()
        : '';
    const requestId =
      innerRequestId ||
      (useOuterId ? String(outerListRecordId) : `history_asst_${fbTime}`);

    const innerMessageId =
      typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : '';
    const messageId =
      innerMessageId ||
      (useOuterId
        ? String(outerListRecordId)
        : generateMessageId('assistant', requestId));

    return [
      {
        id: messageId,
        role: 'ASSISTANT',
        type: MessageModeEnum.CHAT,
        text: typeof obj.text === 'string' ? obj.text : String(obj.text ?? ''),
        think:
          typeof obj.think === 'string' ? obj.think : String(obj.think ?? ''),
        time,
        status: null,
        requestId,
        isStreaming: false,
        timestamp: new Date(time),
      },
    ];
  }

  if (hasUserSignals && (!Array.isArray(events) || events.length === 0)) {
    return [
      buildUserMessageFromStructuredContent(
        obj,
        fbTime,
        `history_user_${fbTime}`,
        outerListRecordId,
      ),
    ];
  }

  return [];
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
 * @param projectId 项目ID（后端新要求：ai-session-sse 必须携带 project_id）
 * @returns SSE连接URL
 */
export const generateSSEUrl = (
  sessionId: string,
  projectId?: string,
): string => {
  const queryParams = new URLSearchParams({ session_id: sessionId });
  // 仅在有值时附加 project_id，兼容历史链路并避免传空字符串污染请求参数。
  if (projectId) {
    queryParams.set('project_id', projectId);
  }
  return `${
    process.env.BASE_URL
  }/api/custom-page/ai-session-sse?${queryParams.toString()}`;
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
