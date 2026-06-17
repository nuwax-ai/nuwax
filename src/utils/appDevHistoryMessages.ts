/**
 * AppDev 历史会话列表 → 聊天消息列表的解析与组装（与 Hook / SSE 解耦）。
 * 列表接口的 content 由后端写入；此处负责解析并注入会话维度字段（topic、created 等）。
 */

import type {
  AppDevChatMessage,
  ConversationRecord,
} from '@/types/interfaces/appDev';
import {
  addSessionInfoToMessages,
  parseChatMessages,
  parseConversationHistoryContent,
} from '@/utils/chatUtils';

/**
 * 历史解析所需列表行字段（与 ConversationRecord 一致，避免与真实接口漂移）
 */
export type AppDevConversationListRecord = Pick<
  ConversationRecord,
  | 'content'
  | 'topic'
  | 'created'
  | 'role'
  | 'id'
  | 'sessionId'
  | 'conversationId'
>;

/**
 * 从列表行解析 sessionId 字符串（与 loadHistory 注入 addSessionInfoToMessages 一致）
 */
export const getAppDevListRecordSessionKey = (
  record: Pick<AppDevConversationListRecord, 'sessionId' | 'conversationId'>,
): string => {
  if (typeof record.sessionId === 'string' && record.sessionId) {
    return record.sessionId;
  }
  return String(record.conversationId ?? record.sessionId ?? '');
};

/**
 * 单条会话记录 → 已带 conversationTopic / conversationCreated 等会话信息的 AppDevChatMessage[]
 *
 * 解析顺序：
 * 1. 新结构化 content（对象：USER / ASSISTANT+events）
 * 2. 解析结果为空时回退旧版 JSON 数组（历史存量数据）
 */
export const parseAppDevHistoryMessagesFromListRecord = (
  record: AppDevConversationListRecord,
): AppDevChatMessage[] => {
  const fromStructured = parseConversationHistoryContent(
    record.content,
    record.role,
    record.created,
    record.id,
  );
  const messages =
    fromStructured.length > 0
      ? fromStructured
      : parseChatMessages(record.content);

  return addSessionInfoToMessages(messages, {
    sessionId: getAppDevListRecordSessionKey(record),
    topic: record.topic,
    created: record.created,
  });
};
