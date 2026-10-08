import {
  AuthIdpTypeEnum,
  AuthIdpWechatModeEnum,
  type AuthIdpLoginItem,
} from '@/types/interfaces/authIdp';
import { describe, expect, it } from 'vitest';
import {
  buildIdentityBindUrl,
  buildIdpAuthorizeUrl,
  filterIdpByUa,
  resolveIdpRedirect,
  shouldAutoRedirect,
} from './authIdp';

const items: AuthIdpLoginItem[] = [
  { id: 1, type: AuthIdpTypeEnum.Cas, name: 'CAS' },
  { id: 2, type: AuthIdpTypeEnum.OAuth2, name: '飞书' },
  {
    id: 3,
    type: AuthIdpTypeEnum.Wechat,
    name: '微信扫码',
    wechatMode: AuthIdpWechatModeEnum.QrCode,
  },
  {
    id: 4,
    type: AuthIdpTypeEnum.Wechat,
    name: '公众号',
    wechatMode: AuthIdpWechatModeEnum.OA,
  },
];

const CHROME_UA =
  'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/126 Safari/537.36';
const WECHAT_MOBILE_UA =
  'Mozilla/5.0 (iPhone) AppleWebKit/605 MicroMessenger/8.0.50 NetType/WIFI';
// PC 版微信内置浏览器同样带 MicroMessenger，不能按桌面 UA 排除
const WECHAT_PC_UA =
  'Mozilla/5.0 (Windows NT 10.0) Chrome/81 MicroMessenger/7.0.20 WindowsWechat';

describe('filterIdpByUa', () => {
  it('普通浏览器只保留网站扫码，非微信类型不受影响', () => {
    expect(filterIdpByUa(items, CHROME_UA).map((i) => i.id)).toEqual([1, 2, 3]);
  });

  it('微信内（手机与 PC 版）只保留公众号授权', () => {
    expect(filterIdpByUa(items, WECHAT_MOBILE_UA).map((i) => i.id)).toEqual([
      1, 2, 4,
    ]);
    expect(filterIdpByUa(items, WECHAT_PC_UA).map((i) => i.id)).toEqual([
      1, 2, 4,
    ]);
  });
});

describe('resolveIdpRedirect', () => {
  it.each([
    '/space/1/agent?id=2',
    '/space/93/app-project-detail/9302?tab=setting#oauth-scope',
    '/home?setting=account-bind&redirect=%2Fspace%2F93#identity',
    '/workspace/%E9%A1%B9%E7%9B%AE?name=%E8%AE%A1%E5%88%92&path=%5Cfile#details',
  ])('正常深链接/查询参数/hash 保持原样：%s', (path) => {
    expect(resolveIdpRedirect(path)).toBe(path);
    expect(resolveIdpRedirect('-1', path)).toBe(path);
  });

  it('数字偏移或空值：取暂存路径，没有则回首页', () => {
    expect(resolveIdpRedirect('-1', '/workspace?tab=a')).toBe(
      '/workspace?tab=a',
    );
    expect(resolveIdpRedirect(null, '/home')).toBe('/home');
    expect(resolveIdpRedirect('-1', null)).toBe('/');
    expect(resolveIdpRedirect('')).toBe('/');
  });

  it('外部地址与协议相对地址一律回首页（防开放重定向）', () => {
    expect(resolveIdpRedirect('https://evil.com/x')).toBe('/');
    expect(resolveIdpRedirect('//evil.com/x')).toBe('/');
    expect(resolveIdpRedirect('-1', '//evil.com')).toBe('/');
    expect(resolveIdpRedirect('javascript:alert(1)')).toBe('/');
  });

  it.each([
    '/\\evil.test/',
    '/\\/evil.test/',
    '/\t/evil.test/',
    '/\n/evil.test/',
    '/\r/evil.test/',
    '/\t\n/evil.test/',
  ])('浏览器可将 %j 解析为跨域地址，参数和暂存路径都必须拒绝', (path) => {
    const origin = 'https://app.example.test';
    expect(new URL(path, origin).origin).not.toBe(origin);
    expect(resolveIdpRedirect(path, '/safe-fallback')).toBe('/');
    expect(resolveIdpRedirect('-1', path)).toBe('/');
    expect(resolveIdpRedirect(undefined, path)).toBe('/');
  });

  it.each([
    '/space/93\\agent',
    '/space/93\u0000agent',
    '/space/93\u001fagent',
    '/space/93\u007fagent',
  ])('原始反斜杠/控制字符不作为安全业务路径：%j', (path) => {
    expect(resolveIdpRedirect(path)).toBe('/');
    expect(resolveIdpRedirect('-1', path)).toBe('/');
  });
});

describe('授权与绑定地址', () => {
  it('带上业务域并编码 redirect', () => {
    expect(buildIdpAuthorizeUrl('https://a.com', 3, '/space/1?x=1&y=2')).toBe(
      'https://a.com/api/auth/idp/authorize?provider=3&redirect=%2Fspace%2F1%3Fx%3D1%26y%3D2',
    );
    expect(buildIdentityBindUrl('', 5, '/home?setting=account-bind')).toBe(
      '/api/user/identity/bind/5?redirect=%2Fhome%3Fsetting%3Daccount-bind',
    );
  });
});

describe('shouldAutoRedirect', () => {
  const base = { autoRedirectIdpId: 3, search: '', isDesktop: false };

  it('配置了自动跳转且无逃生参数时跳转', () => {
    expect(shouldAutoRedirect(base)).toBe(true);
    expect(shouldAutoRedirect({ ...base, search: '?redirect=%2Fhome' })).toBe(
      true,
    );
  });

  it('未配置、?local、带 idpError 或桌面回跳标记均不跳', () => {
    expect(shouldAutoRedirect({ ...base, autoRedirectIdpId: null })).toBe(
      false,
    );
    expect(shouldAutoRedirect({ ...base, search: '?local=1' })).toBe(false);
    expect(shouldAutoRedirect({ ...base, search: '?local' })).toBe(false);
    expect(
      shouldAutoRedirect({ ...base, search: '?idpError=%E5%A4%B1%E8%B4%A5' }),
    ).toBe(false);
    expect(shouldAutoRedirect({ ...base, search: '?desktopIdpReturn=1' })).toBe(
      false,
    );
    expect(shouldAutoRedirect({ ...base, isDesktop: true })).toBe(true);
  });
});
