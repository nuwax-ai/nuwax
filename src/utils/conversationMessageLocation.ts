import type { ConversationMessageLocation } from '@/types/interfaces/conversationSearch';
const keys = [
  'searchConversationId',
  'searchMessageId',
  'searchMessageIndex',
] as const;
export function withConversationMessageLocation(
  path: string,
  target?: ConversationMessageLocation,
): string {
  if (!target) return path;
  const url = new URL(path, 'https://nuwax.invalid');
  url.searchParams.set(keys[0], String(target.conversationId));
  url.searchParams.set(keys[1], target.messageId);
  url.searchParams.set(keys[2], String(target.messageIndex));
  return url.pathname + url.search + url.hash;
}
export function readConversationMessageLocation(
  search: string,
  conversationId?: string | number,
): ConversationMessageLocation | null {
  const params = new URLSearchParams(search);
  // 后端 Long 可用字符串传输，不能先转 Number 丢失索引精度。
  const parseId = (value: string | null): number | string | null => {
    if (
      !value ||
      !/^[1-9]\d{0,18}$/.test(value) ||
      BigInt(value) > 9223372036854775807n
    )
      return null;
    const numeric = Number(value);
    return Number.isSafeInteger(numeric) ? numeric : value;
  };
  const id = parseId(params.get(keys[0]));
  const index = parseId(params.get(keys[2]));
  const messageId = params.get(keys[1]) || '';
  if (
    id === null ||
    index === null ||
    !messageId.trim() ||
    messageId.length > 200 ||
    String(id) !== String(conversationId)
  )
    return null;
  return { conversationId: id, messageId, messageIndex: index };
}
export function withoutConversationMessageLocation(search: string): string {
  const params = new URLSearchParams(search);
  keys.forEach((key) => params.delete(key));
  const value = params.toString();
  return value ? '?' + value : '';
}
