/**
 * 语言决策纯函数单测（plans/20260911-i18n-default-lang-en-fix-plan.md）
 * 覆盖：进入语种解析的标记版本语义 + 账号侧 en-us 旧默认残留防护。
 */
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_I18N_LANG,
  I18N_LANG_USER_SET_MARKER,
} from '@/constants/i18n.constants';
import {
  isUserSetExplicit,
  normalizeLang,
  resolveEntryLang,
  shouldSyncAccountLang,
} from './i18nLangPolicy';

describe('normalizeLang', () => {
  it('空值回落产品默认（简体中文）', () => {
    expect(normalizeLang(null)).toBe(DEFAULT_I18N_LANG);
    expect(normalizeLang(undefined)).toBe(DEFAULT_I18N_LANG);
    expect(normalizeLang('')).toBe(DEFAULT_I18N_LANG);
  });

  it('统一小写', () => {
    expect(normalizeLang('en-US')).toBe('en-us');
    expect(normalizeLang('ZH-CN')).toBe('zh-cn');
  });
});

describe('isUserSetExplicit', () => {
  it('只认当前标记版本', () => {
    expect(isUserSetExplicit(I18N_LANG_USER_SET_MARKER)).toBe(true);
    expect(isUserSetExplicit('2')).toBe(true);
  });

  it('旧标记 1（历史脏同步写入）与无标记均视为未设置', () => {
    expect(isUserSetExplicit('1')).toBe(false);
    expect(isUserSetExplicit(null)).toBe(false);
  });
});

describe('resolveEntryLang', () => {
  it('无标记：忽略缓存残留，归位默认', () => {
    expect(resolveEntryLang(null, 'en-US', DEFAULT_I18N_LANG)).toBe(
      DEFAULT_I18N_LANG,
    );
  });

  it('旧标记 1：视为未设置，归位默认（存量浏览器一次性自愈）', () => {
    expect(resolveEntryLang('1', 'en-US', DEFAULT_I18N_LANG)).toBe(
      DEFAULT_I18N_LANG,
    );
  });

  it('显式标记且缓存非空：尊重缓存（含归一化）', () => {
    expect(resolveEntryLang('2', 'en-US', DEFAULT_I18N_LANG)).toBe('en-us');
    expect(resolveEntryLang('2', 'zh-TW', DEFAULT_I18N_LANG)).toBe('zh-tw');
  });

  it('显式标记但缓存为空：默认', () => {
    expect(resolveEntryLang('2', null, DEFAULT_I18N_LANG)).toBe(
      DEFAULT_I18N_LANG,
    );
  });
});

describe('shouldSyncAccountLang', () => {
  it('账号 lang 为空：不同步', () => {
    expect(shouldSyncAccountLang(null, null)).toBe(false);
    expect(shouldSyncAccountLang(undefined, '2')).toBe(false);
    expect(shouldSyncAccountLang('', '2')).toBe(false);
  });

  it('en-us 且无显式标记（含旧标记 1）：旧默认残留，忽略', () => {
    expect(shouldSyncAccountLang('en-US', null)).toBe(false);
    expect(shouldSyncAccountLang('en-us', null)).toBe(false);
    expect(shouldSyncAccountLang('en-us', '1')).toBe(false);
  });

  it('en-us 且有显式标记：真实选择，同步', () => {
    expect(shouldSyncAccountLang('en-US', '2')).toBe(true);
  });

  it('非 en-us 语种不可能是旧默认：照常同步', () => {
    expect(shouldSyncAccountLang('ja-JP', null)).toBe(true);
    expect(shouldSyncAccountLang('zh-TW', null)).toBe(true);
    expect(shouldSyncAccountLang('zh-CN', null)).toBe(true);
  });
});
