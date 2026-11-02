import { readConversationMessageLocation } from '@/utils/conversationMessageLocation';
import { expect, it } from 'vitest';
import { buildSearchConversationRoute } from './conversationRoute';

it.each([
  [undefined, '/home/chat/7/9', null],
  ['Agent', '/space/1/agent-dev', '11'],
  ['PageApp', '/space/1/app-dev/11', null],
])('正文命中保留 %s 原宿主和稳定会话定位', (type, pathname, agentId) => {
  const conv = {
    id: 7,
    agentId: 9,
    devSpaceId: 1,
    devTargetId: 11,
    devTargetType: type,
  } as any;
  const target = { conversationId: 7, messageId: 'm42', messageIndex: 42 };
  const url = new URL(
    buildSearchConversationRoute(conv, target),
    'https://nuwax.invalid',
  );
  expect(url.pathname).toBe(pathname);
  expect(url.searchParams.get('agentId')).toBe(agentId);
  if (type) expect(url.searchParams.get('conversationId')).toBe('7');
  expect(readConversationMessageLocation(url.search, 7)).toEqual(target);
  expect(new URL(buildSearchConversationRoute(conv), url).pathname).toBe(
    pathname,
  );
});
