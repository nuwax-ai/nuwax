/**
 * clearStoragePreservingThemePrefs 单测
 * i18nRuntime 传递依赖 umi（vitest 不可 import），统一 mock 为词表 key 直通。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));

import { STORAGE_KEYS } from '@/constants/theme.constants';
import { clearStoragePreservingThemePrefs } from './authStorageCleanup';

describe('clearStoragePreservingThemePrefs', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.USER_THEME_CONFIG, '{"keep":1}');
    localStorage.setItem(STORAGE_KEYS.GLOBAL_SETTINGS, '{"keep":2}');
    localStorage.setItem(STORAGE_KEYS.HAS_USER_SWITCH_THEME, '1');
    localStorage.setItem('ACCESS_TOKEN', 'token');
    localStorage.setItem('SPACE_ID', '752');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('清空业务键，主题偏好三键原值保留', () => {
    clearStoragePreservingThemePrefs();

    expect(localStorage.getItem('ACCESS_TOKEN')).toBeNull();
    expect(localStorage.getItem('SPACE_ID')).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG)).toBe(
      '{"keep":1}',
    );
    expect(localStorage.getItem(STORAGE_KEYS.GLOBAL_SETTINGS)).toBe(
      '{"keep":2}',
    );
    expect(localStorage.getItem(STORAGE_KEYS.HAS_USER_SWITCH_THEME)).toBe('1');
  });

  it('主题键本就不存在时不被凭空恢复', () => {
    localStorage.removeItem(STORAGE_KEYS.GLOBAL_SETTINGS);

    clearStoragePreservingThemePrefs();

    expect(localStorage.getItem(STORAGE_KEYS.GLOBAL_SETTINGS)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG)).toBe(
      '{"keep":1}',
    );
  });
});
