import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
} from '@/types/enums/agent';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';

const timestamp = (value: unknown): number | undefined => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Date.parse(value)
      : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

/** sub 缓存可能仍属于上一轮；必须在投影及终态副作用之前拦截可证实的旧事件。 */
export function createResumeEventGuard(history: MessageInfo[]) {
  let userIndex = history.length - 1;
  while (userIndex >= 0 && history[userIndex].role !== AssistantRoleEnum.USER)
    userIndex -= 1;
  const userTime = timestamp(history[userIndex]?.time);
  const previousMessages = history.slice(0, Math.max(0, userIndex));
  const previousIds = new Set(
    previousMessages
      .filter((message) => message.id !== null && message.id !== undefined)
      .map((message) => String(message.id)),
  );
  const currentRequests = new Set(
    history
      .slice(Math.max(0, userIndex))
      .map((message) => message.requestId)
      .filter(Boolean),
  );
  const previousRequests = new Set(
    previousMessages
      .map((message) => message.requestId)
      .filter((id) => id && !currentRequests.has(id)),
  );

  return (event: ConversationChatResponse): string | undefined => {
    const isMessage = event.eventType === ConversationEventTypeEnum.MESSAGE;
    // 结束时间早于本轮 USER 是明确的旧轮证据；不按相同正文去重，也不用开始时间猜测归属。
    const eventTime = timestamp(
      isMessage
        ? event.data?.time
        : event.eventType === ConversationEventTypeEnum.FINAL_RESULT
        ? event.data?.endTime
        : event.eventType === ConversationEventTypeEnum.PROCESSING
        ? event.data?.result?.endTime
        : undefined,
    );
    const reason =
      event.requestId && previousRequests.has(event.requestId)
        ? 'previous-request'
        : isMessage &&
          event.data?.id !== null &&
          event.data?.id !== undefined &&
          previousIds.has(String(event.data.id))
        ? 'previous-message'
        : userTime !== undefined &&
          eventTime !== undefined &&
          eventTime < userTime
        ? 'before-current-user'
        : undefined;
    if (reason && event.requestId) previousRequests.add(event.requestId);
    return reason;
  };
}
