import { describe, expect, it } from 'vitest';
import { resolveUserAppPreviewNavigateUrl } from './previewNavigateUrl';

describe('resolveUserAppPreviewNavigateUrl', () => {
  const base = '/api/userapp/proxy/app/dev/12/';

  it('空输入回到代理根路径', () => {
    expect(resolveUserAppPreviewNavigateUrl('', base)).toBe(
      '/api/userapp/proxy/app/dev/12',
    );
  });

  it('相对路径拼到代理根路径后', () => {
    expect(resolveUserAppPreviewNavigateUrl('/333', base)).toBe(
      '/api/userapp/proxy/app/dev/12/333',
    );
    expect(resolveUserAppPreviewNavigateUrl('about', base)).toBe(
      '/api/userapp/proxy/app/dev/12/about',
    );
  });

  it('完整 URL 原样返回', () => {
    expect(
      resolveUserAppPreviewNavigateUrl('https://example.com/app', base),
    ).toBe('https://example.com/app');
  });

  it('已是代理地址时不重复拼接', () => {
    const current = '/api/userapp/proxy/app/dev/12/home';
    expect(resolveUserAppPreviewNavigateUrl(current, base)).toBe(current);
  });
});
