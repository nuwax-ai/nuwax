/**
 * 常规项目（NormalProject）会话判定纯函数测试。
 * 覆盖：id 守恒（切换会话竞态窗口）、devTargetType 匹配、devTargetId 数值边界。
 */
import { describe, expect, it } from 'vitest';
import { isNormalProjectConversation } from '../isNormalProjectConversation';

describe('isNormalProjectConversation', () => {
  it('常规项目会话（id 守恒 + NormalProject + 正整数 devTargetId）→ true', () => {
    expect(
      isNormalProjectConversation(
        { id: '42', devTargetType: 'NormalProject', devTargetId: '9' },
        42,
      ),
    ).toBe(true);
  });

  it('conversationInfo 未加载（undefined）→ false（按普通会话连接，不误加 service_type）', () => {
    expect(isNormalProjectConversation(undefined, 42)).toBe(false);
    expect(isNormalProjectConversation({}, 42)).toBe(false);
  });

  it('路由 id 缺省 → false', () => {
    expect(
      isNormalProjectConversation({
        id: '42',
        devTargetType: 'NormalProject',
        devTargetId: '9',
      }),
    ).toBe(false);
  });

  it('conversationInfo 与路由 id 不一致（切换会话竞态窗口）→ false（防新会话 id 配旧会话判定）', () => {
    expect(
      isNormalProjectConversation(
        { id: '42', devTargetType: 'NormalProject', devTargetId: '9' },
        43,
      ),
    ).toBe(false);
  });

  it('devTargetType 非 NormalProject → false', () => {
    for (const type of ['Agent', 'UserApp', 'PageApp', 'Skill', undefined]) {
      expect(
        isNormalProjectConversation(
          { id: '42', devTargetType: type, devTargetId: '9' },
          42,
        ),
      ).toBe(false);
    }
  });

  it('devTargetId 边界：undefined/空串/非数字/0/负数 → false；正数字符串 → true', () => {
    for (const bad of [undefined, '', 'abc', '0', '-7']) {
      expect(
        isNormalProjectConversation(
          { id: '42', devTargetType: 'NormalProject', devTargetId: bad },
          42,
        ),
      ).toBe(false);
    }
    expect(
      isNormalProjectConversation(
        { id: '42', devTargetType: 'NormalProject', devTargetId: '123' },
        42,
      ),
    ).toBe(true);
  });
});
