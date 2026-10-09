import { I18N_KEY_REGEX } from '@/constants/i18n.constants';
import { EN_US } from '@/locales/i18n/en-US';
import { JA_JP } from '@/locales/i18n/ja-JP';
import { ZH_CN } from '@/locales/i18n/zh-CN';
import { ZH_HK } from '@/locales/i18n/zh-HK';
import { ZH_TW } from '@/locales/i18n/zh-TW';
import { describe, expect, it } from 'vitest';

describe('License 文案符合真实翻译运行时契约', () => {
  it.each([
    ['en-US', EN_US],
    ['ja-JP', JA_JP],
    ['zh-CN', ZH_CN],
    ['zh-HK', ZH_HK],
    ['zh-TW', ZH_TW],
  ] as const)('%s 中的 License 键可被运行时识别且有非空文案', (_lang, map) => {
    const entries = Object.entries(map).filter(([key]) =>
      key.startsWith('PC.Pages.License.'),
    );
    expect(entries.length).toBeGreaterThan(0);
    for (const [key, value] of entries) {
      expect(key, `运行时会直接返回无效键 ${key}`).toMatch(I18N_KEY_REGEX);
      expect(value.trim()).not.toBe('');
    }
    for (const state of ['notInstalled', 'valid', 'expired', 'invalid']) {
      expect(map[`PC.Pages.License.state.${state}`]).toBeTruthy();
    }
    expect(map['PC.Pages.License.error.invalidResponse']).toBeTruthy();
    expect('PC.Components.CommercialLicense.authorizationRequired').toMatch(
      I18N_KEY_REGEX,
    );
    expect(
      map['PC.Components.CommercialLicense.authorizationRequired'],
    ).toBeTruthy();
  });
});
