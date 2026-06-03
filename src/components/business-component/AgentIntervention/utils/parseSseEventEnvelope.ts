import type { ConversationChatResponse } from '@/types/interfaces/conversationInfo';

interface SseEventEnvelope {
  messageType?: string;
  message_type?: string;
  subType?: string;
  sub_type?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Extracts the event envelope from an SSE response.
 * The backend sends events in different shapes:
 *   - { eventType, data: { messageType, subType, data: {...} } }
 *   - { eventType, messageType, subType, data: {...} }
 *   - { eventType, message_type, sub_type, data: {...} }
 * This normalizes access to a single envelope object.
 */
export function parseSseEventEnvelope(
  res: ConversationChatResponse,
): SseEventEnvelope {
  const nested = res.data as SseEventEnvelope | undefined;
  if (
    nested &&
    typeof nested === 'object' &&
    (nested.messageType ||
      nested.message_type ||
      nested.subType ||
      nested.sub_type)
  ) {
    return nested;
  }
  return res as unknown as SseEventEnvelope;
}

/**
 * Extracts the inner event data from the envelope.
 */
export function extractEventData(
  envelope: SseEventEnvelope,
  fallback: ConversationChatResponse,
): Record<string, unknown> {
  const inner = envelope.data;
  if (inner && typeof inner === 'object') {
    return inner as Record<string, unknown>;
  }
  const fallbackData = fallback.data;
  if (fallbackData && typeof fallbackData === 'object') {
    return fallbackData as Record<string, unknown>;
  }
  return fallback as unknown as Record<string, unknown>;
}
