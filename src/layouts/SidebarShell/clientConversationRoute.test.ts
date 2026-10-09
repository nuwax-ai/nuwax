import { describe, expect, it } from 'vitest';
import { parseClientConversationRoute } from './clientConversationRoute';

describe('商业客户端整页实例路由身份', () => {
  it('普通会话按会话 ID 复用，并保留首条导航状态', () => {
    expect(
      parseClientConversationRoute({
        pathname: '/home/chat/123/45',
        search: '?x=1',
        state: { message: 'hello' },
        navigationAction: 'PUSH',
      }),
    ).toMatchObject({
      key: 'conversation:123',
      kind: 'conversation',
      conversationId: 123,
      params: { id: '123', agentId: '45' },
      navigationAction: 'PUSH',
      state: { message: 'hello' },
    });
  });

  it('全栈 IDE 按项目和会话隔离', () => {
    expect(
      parseClientConversationRoute({
        pathname: '/space/1/app-pro/2/3',
      }),
    ).toMatchObject({
      key: 'ide-workspace:1:2:3',
      params: { spaceId: '1', appId: '2', conversationId: '3' },
    });
  });

  it('Agent 开发页必须有有效会话，普通菜单和创建页不缓存', () => {
    expect(
      parseClientConversationRoute({
        pathname: '/space/1/agent-dev',
        search: '?agentId=2&conversationId=3',
      }),
    ).toMatchObject({
      key: 'agent-workspace:1:2:3',
      params: { spaceId: '1', agentId: '2', conversationId: '3' },
    });
    expect(
      parseClientConversationRoute({
        pathname: '/space/1/agent-dev',
        search: '?agentId=2',
      }),
    ).toBeNull();
    expect(parseClientConversationRoute({ pathname: '/home' })).toBeNull();
    expect(
      parseClientConversationRoute({ pathname: '/home/chat/0/2' }),
    ).toBeNull();
  });
});
