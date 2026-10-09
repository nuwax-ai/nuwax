import { describe, expect, it } from 'vitest';
import {
  buildAppProRedirectPrefix,
  buildAppProRoute,
  parseAppProRoute,
  removeAppProConversationFromLocation,
} from './appProRoute';

describe('appProRoute', () => {
  it('buildAppProRoute', () => {
    expect(buildAppProRoute(22, 16, 1561872)).toBe(
      '/space/22/app-pro/16/1561872',
    );
  });

  it('buildAppProRedirectPrefix 供创建后会话 id 拼接', () => {
    expect(`${buildAppProRedirectPrefix(8, 200)}1561872`).toBe(
      '/space/8/app-pro/200/1561872',
    );
  });

  it('parseAppProRoute 解析带会话路由', () => {
    expect(parseAppProRoute('/space/752/app-pro/29/42')).toEqual({
      spaceId: 752,
      appId: 29,
      conversationId: 42,
    });
  });

  it('parseAppProRoute 缺会话段时返回 null', () => {
    expect(parseAppProRoute('/space/752/app-pro/29')).toBeNull();
  });

  it('removeAppProConversationFromLocation 删除会话后回应用详情页', () => {
    expect(
      removeAppProConversationFromLocation(
        '/space/752/app-pro/29/42',
        '?panel=chat',
      ),
    ).toEqual({
      pathname: '/space/752/app-project-detail/29',
      search: '',
    });
  });
});
