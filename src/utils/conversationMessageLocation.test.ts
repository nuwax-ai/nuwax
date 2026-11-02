import { describe, expect, it } from 'vitest';
import {
  readConversationMessageLocation,
  withConversationMessageLocation,
  withoutConversationMessageLocation,
} from './conversationMessageLocation';
describe('正文命中的消息定位参数', () => {
  it('保留已有路由参数和消息标识，关闭时仅移除定位参数', () => {
    const target = {
      conversationId: 7,
      messageId: 'id "] #中文',
      messageIndex: 42,
    };
    const path = withConversationMessageLocation(
      '/home/chat/7/9?keep=yes#anchor',
      target,
    );
    const url = new URL(path, 'https://nuwax.invalid');
    expect(readConversationMessageLocation(url.search, '7')).toEqual(target);
    expect(withoutConversationMessageLocation(url.search)).toBe('?keep=yes');
    expect(url.hash).toBe('#anchor');
  });
  it('拒绝跨会话、无效索引和不完整定位', () => {
    expect(
      readConversationMessageLocation(
        '?searchConversationId=7&searchMessageId=m&searchMessageIndex=42',
        8,
      ),
    ).toBeNull();
    expect(
      readConversationMessageLocation(
        '?searchConversationId=7&searchMessageId=m&searchMessageIndex=NaN',
        7,
      ),
    ).toBeNull();
    expect(
      readConversationMessageLocation(
        '?searchConversationId=7&searchMessageIndex=42',
        7,
      ),
    ).toBeNull();
  });
});

it('不截断后端 Long 字符串定位标识', () => {
  const target = {
    conversationId: '9352423779995648',
    messageId: 'long-id',
    messageIndex: '9352423779995649',
  };
  const url = new URL(
    withConversationMessageLocation(
      '/home/chat/' + target.conversationId + '/9',
      target,
    ),
    'https://nuwax.invalid',
  );
  expect(
    readConversationMessageLocation(url.search, target.conversationId),
  ).toEqual(target);
});
