import { getQrLoginEntryRedirect } from '@/utils/qrLoginEntry';
import { describe, expect, it } from 'vitest';

describe('二维码网页入口', () => {
  it('从当前服务进入 M 站确认页，不透传 pollToken、origin 和 redirect', () => {
    const target = new URL(
      getQrLoginEntryRedirect(
        'https://example.com:8443/qrlogin/scene-A?pollToken=secret&origin=https://evil.example&redirect=//evil.example',
      )!,
    );
    expect(target.origin).toBe('https://example.com:8443');
    const query = new URLSearchParams(target.hash.split('?')[1]);
    expect(target.pathname).toBe('/m/');
    expect(query.get('sceneId')).toBe('scene-A');
    expect(query.get('origin')).toBe(target.origin);
    expect(query.has('pollToken')).toBe(false);
    expect(query.has('redirect')).toBe(false);
  });
  it('已在 M 站确认页时保留原地址，让首屏脚本停止通用 PC 回跳而不重载本页', () => {
    const href =
      'https://example.com/m/#/subpackages/pages/qr-login/qr-login?sceneId=a&origin=https%3A%2F%2Fexample.com';
    expect(getQrLoginEntryRedirect(href)).toBe(href);
  });
  it.each(['a%2Fb', 'a%5Cb', '%00', '%ZZ'])(
    '非法单路径场景 %s 进入错误页而不伪造成有效场景',
    (value) => {
      const target = getQrLoginEntryRedirect(
        'https://example.com/qrlogin/' + value,
      )!;
      expect(new URLSearchParams(target.split('?')[1]).get('sceneId')).toBe('');
    },
  );
  it('不接管其它页面、外部协议和带凭据的 URL', () => {
    for (const value of [
      'https://example.com/login',
      'https://example.com/qrlogin/a/b',
      'javascript:alert(1)',
      'https://user:pass@example.com/qrlogin/a',
    ])
      expect(getQrLoginEntryRedirect(value)).toBeNull();
  });
  it('能作为无外部闭包的首屏脚本执行', () => {
    const run = new Function(
      'href',
      `return (${getQrLoginEntryRedirect.toString()})(href);`,
    );
    expect(run('https://example.com/qrlogin/a')).toBe(
      getQrLoginEntryRedirect('https://example.com/qrlogin/a'),
    );
  });
});
