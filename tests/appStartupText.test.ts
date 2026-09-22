import { startupText } from '@/components/business-component/AppStartup/startupText';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('启动文案只依赖本地词典', () => {
  beforeEach(() => localStorage.clear());

  it('无显式语言标记时保留产品默认中文', () => {
    localStorage.setItem('umi_locale', 'en-US');
    expect(startupText('PC.Components.AppStartup.loading')).toBe(
      '正在加载应用',
    );
  });

  it.each([
    ['en-US', 'Loading the app'],
    ['zh-TW', '正在載入應用程式'],
    ['zh-HK', '正在載入應用程式'],
    ['ja-JP', 'アプリを読み込んでいます'],
  ])('显式 %s 在运行时初始化前也有文案', (lang, expected) => {
    localStorage.setItem('umi_locale_user_set', '2');
    localStorage.setItem('umi_locale', lang);
    expect(startupText('PC.Components.AppStartup.loading')).toBe(expected);
  });

  it('存储不可用仍可展示默认反馈', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('Storage unavailable');
      });
    expect(startupText('PC.Components.AppStartup.loading')).toBe(
      '正在加载应用',
    );
    getItem.mockRestore();
  });
});
