import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';
import { resolveConversationRoute } from './conversationRoute';

const buildConversation = (
  overrides: Partial<ConversationInfo>,
): ConversationInfo =>
  ({
    id: 5,
    agentId: 2,
    ...overrides,
  } as ConversationInfo);

describe('项目会话点击路由分流（resolveConversationRoute）', () => {
  it('Agent 开发会话跳智能体开发页', () => {
    expect(
      resolveConversationRoute(
        buildConversation({
          devTargetType: 'Agent',
          devTargetId: '9',
          devSpaceId: 3,
        }),
      ),
    ).toBe('/space/3/agent-dev?agentId=9&conversationId=5');
  });

  it('PageApp 开发会话跳网页应用 IDE', () => {
    expect(
      resolveConversationRoute(
        buildConversation({
          devTargetType: 'PageApp',
          devTargetId: '9',
          devSpaceId: 3,
        }),
      ),
    ).toBe('/space/3/app-dev/9');
  });

  it('UserApp 开发会话跳全栈 IDE 并携带会话 id', () => {
    expect(
      resolveConversationRoute(
        buildConversation({
          devTargetType: 'UserApp',
          devTargetId: '9',
          devSpaceId: 3,
        }),
      ),
    ).toBe('/space/3/app-pro?appId=9&conversationId=5');
  });

  it('常规项目会话（无 devTarget 系列字段）跳 home/chat 详情', () => {
    expect(resolveConversationRoute(buildConversation({}))).toBe(
      '/home/chat/5/2',
    );
  });

  it('devTargetType 命中但 devSpaceId 缺失时回退默认路由', () => {
    expect(
      resolveConversationRoute(
        buildConversation({ devTargetType: 'UserApp', devTargetId: '9' }),
      ),
    ).toBe('/home/chat/5/2');
  });
});
