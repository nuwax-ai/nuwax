/**
 * 默认名用户首登昵称/头像引导 —— 判定与跳过策略单测（纯函数层）。
 * 覆盖：默认名形态判定、空昵称判定、触发组合判定、昵称校验
 * （非空去空格 / 50 字上限兜底）、会话级跳过标记（按用户隔离）。
 */
import {
  getSkipStorageKey,
  isBlankNickname,
  isDefaultUserName,
  isOnboardingSkippedThisSession,
  markOnboardingDoneThisSession,
  NICKNAME_MAX_LENGTH,
  shouldShowNicknameOnboarding,
  validateNickname,
} from '@/components/business-component/NicknameOnboardingGuide/policy';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('默认名形态判定 isDefaultUserName', () => {
  it('user+数字（含大小写、首尾空格）视为默认名', () => {
    expect(isDefaultUserName('user1024')).toBe(true);
    expect(isDefaultUserName('User1024')).toBe(true);
    expect(isDefaultUserName(' user1024 ')).toBe(true);
    expect(isDefaultUserName('user0')).toBe(true);
  });

  it('自定义名、残缺形态、空值不是默认名', () => {
    expect(isDefaultUserName('zhangsan')).toBe(false);
    expect(isDefaultUserName('user')).toBe(false);
    expect(isDefaultUserName('user1024a')).toBe(false);
    expect(isDefaultUserName('user_1024')).toBe(false);
    expect(isDefaultUserName('user 1024')).toBe(false);
    expect(isDefaultUserName('1024')).toBe(false);
    expect(isDefaultUserName('')).toBe(false);
    expect(isDefaultUserName(null)).toBe(false);
    expect(isDefaultUserName(undefined)).toBe(false);
  });
});

describe('空昵称判定 isBlankNickname', () => {
  it('null/undefined/空串/纯空白视为未设置', () => {
    expect(isBlankNickname(null)).toBe(true);
    expect(isBlankNickname(undefined)).toBe(true);
    expect(isBlankNickname('')).toBe(true);
    expect(isBlankNickname('   ')).toBe(true);
  });

  it('有实质内容（含 trim 后）不算空', () => {
    expect(isBlankNickname('小明')).toBe(false);
    expect(isBlankNickname(' 小明 ')).toBe(false);
  });
});

describe('触发判定 shouldShowNicknameOnboarding', () => {
  it('默认名 + 空昵称才触发', () => {
    expect(
      shouldShowNicknameOnboarding({ userName: 'user9', nickName: '' }),
    ).toBe(true);
    expect(
      shouldShowNicknameOnboarding({ userName: 'user9', nickName: '   ' }),
    ).toBe(true);
    expect(
      shouldShowNicknameOnboarding({ userName: 'user9', nickName: '小明' }),
    ).toBe(false);
    expect(
      shouldShowNicknameOnboarding({ userName: 'zhangsan', nickName: '' }),
    ).toBe(false);
  });

  it('用户信息未加载（null/undefined）不触发', () => {
    expect(shouldShowNicknameOnboarding(null)).toBe(false);
    expect(shouldShowNicknameOnboarding(undefined)).toBe(false);
  });
});

describe('昵称校验 validateNickname', () => {
  it('空与纯空白 → required', () => {
    expect(validateNickname('')).toBe('required');
    expect(validateNickname('   ')).toBe('required');
    expect(validateNickname(null)).toBe('required');
  });

  it('trim 后 1~50 字合法', () => {
    expect(validateNickname('小明')).toBe(null);
    expect(validateNickname('  小明  ')).toBe(null);
    expect(validateNickname('a'.repeat(NICKNAME_MAX_LENGTH))).toBe(null);
  });

  it('trim 后超过 50 字 → tooLong（兜底绕过输入框截断的场景）', () => {
    expect(validateNickname('a'.repeat(NICKNAME_MAX_LENGTH + 1))).toBe(
      'tooLong',
    );
    // 前置空白不计入长度
    expect(validateNickname(`   ${'a'.repeat(NICKNAME_MAX_LENGTH)}`)).toBe(
      null,
    );
  });
});

describe('会话级跳过标记（sessionStorage，按用户隔离）', () => {
  afterEach(() => {
    // 先还原被 stub 的存储再清数据，避免 clear 打到抛错代理
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it('标记后本会话可查，键按 userId 隔离', () => {
    expect(isOnboardingSkippedThisSession(9)).toBe(false);
    markOnboardingDoneThisSession(9);
    expect(isOnboardingSkippedThisSession(9)).toBe(true);
    // 其他用户不受影响
    expect(isOnboardingSkippedThisSession(10)).toBe(false);
    expect(getSkipStorageKey(9)).toBe('NICKNAME_ONBOARDING_SKIPPED_9');
  });

  it('无 userId 时使用 anonymous 兜底键，不互相污染', () => {
    markOnboardingDoneThisSession(undefined);
    expect(isOnboardingSkippedThisSession(undefined)).toBe(true);
    expect(isOnboardingSkippedThisSession(9)).toBe(false);
    expect(getSkipStorageKey()).toBe('NICKNAME_ONBOARDING_SKIPPED_anonymous');
  });

  it('存储不可用（隐私模式等）时降级不抛错', () => {
    vi.stubGlobal(
      'sessionStorage',
      new Proxy(
        {},
        {
          get() {
            throw new Error('storage denied');
          },
        },
      ) as unknown as Storage,
    );
    expect(isOnboardingSkippedThisSession(9)).toBe(false);
    expect(() => markOnboardingDoneThisSession(9)).not.toThrow();
  });
});
