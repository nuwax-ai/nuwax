/**
 * clearStoragePreservingUserPrefs 单测
 * theme.constants 传递依赖 i18nRuntime→umi（vitest 不可 import），统一 mock 为词表 key 直通。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));

import { I18N_STORAGE_KEYS } from '@/constants/i18n.constants';
import { STORAGE_KEYS } from '@/constants/theme.constants';
import { clearStoragePreservingUserPrefs } from './authStorageCleanup';

describe('clearStoragePreservingUserPrefs', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.USER_THEME_CONFIG, '{"keep":1}');
    localStorage.setItem(STORAGE_KEYS.GLOBAL_SETTINGS, '{"keep":2}');
    localStorage.setItem(STORAGE_KEYS.HAS_USER_SWITCH_THEME, '1');
    localStorage.setItem(I18N_STORAGE_KEYS.ACTIVE_LANG, 'en-US');
    localStorage.setItem(I18N_STORAGE_KEYS.USER_SET, '2');
    localStorage.setItem('ACCESS_TOKEN', 'token');
    localStorage.setItem('SPACE_ID', '752');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('清空业务键，主题三键 + 语言两键原值保留', () => {
    clearStoragePreservingUserPrefs();

    expect(localStorage.getItem('ACCESS_TOKEN')).toBeNull();
    expect(localStorage.getItem('SPACE_ID')).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG)).toBe(
      '{"keep":1}',
    );
    expect(localStorage.getItem(STORAGE_KEYS.GLOBAL_SETTINGS)).toBe(
      '{"keep":2}',
    );
    expect(localStorage.getItem(STORAGE_KEYS.HAS_USER_SWITCH_THEME)).toBe('1');
    expect(localStorage.getItem(I18N_STORAGE_KEYS.ACTIVE_LANG)).toBe('en-US');
    expect(localStorage.getItem(I18N_STORAGE_KEYS.USER_SET)).toBe('2');
  });

  it('保留键本就不存在时不被凭空恢复', () => {
    localStorage.removeItem(STORAGE_KEYS.GLOBAL_SETTINGS);
    localStorage.removeItem(I18N_STORAGE_KEYS.USER_SET);

    clearStoragePreservingUserPrefs();

    expect(localStorage.getItem(STORAGE_KEYS.GLOBAL_SETTINGS)).toBeNull();
    expect(localStorage.getItem(I18N_STORAGE_KEYS.USER_SET)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG)).toBe(
      '{"keep":1}',
    );
  });
});
