import { describe, expect, it } from 'vitest';
import {
  getSpaceInviteEntryRedirect,
  getSpaceInviteQrPath,
  getSpaceInviteStatus,
} from './spaceInvite';

describe('团队邀请链接', () => {
  it('二维码编码保留完整 UTF-8 链接，并转义 Base64 路径中的保留字符', () => {
    const url =
      'https://testagent.xspaceagi.com/invite/space/abc?name=中文&x=?';
    const segment = getSpaceInviteQrPath(url).slice('/api/qr/'.length);
    expect(segment).not.toContain('/');
    const bytes = Uint8Array.from(
      atob(decodeURIComponent(segment)),
      (character) => character.charCodeAt(0),
    );
    expect(new TextDecoder().decode(bytes)).toBe(url);
  });

  it('手机扫码转到 M 站，邀请码和 query 保持完整；PC 原地址保持 Web', () => {
    const source =
      'https://agent.nuwax.com/invite/space/abc?name=%E4%B8%AD%E6%96%87&code=wrong';
    expect(getSpaceInviteEntryRedirect(source, false)).toBeNull();
    const target = new URL(getSpaceInviteEntryRedirect(source, true)!);
    expect(target.pathname).toBe('/m/');
    expect(target.hash.split('?')[0]).toBe(
      '#/subpackages/pages/space-invite/space-invite',
    );
    const query = new URLSearchParams(target.hash.split('?')[1]);
    expect(query.get('code')).toBe('abc');
    expect(query.get('name')).toBe('中文');
  });

  it.each(['login', 'verify-code', 'set-password'])(
    '旧 Web %s 链路也进入 M 登录并保留邀请',
    (step) => {
      const target = new URL(
        getSpaceInviteEntryRedirect(
          'https://agent.nuwax.com/' +
            step +
            '?redirect=%2Finvite%2Fspace%2Fabc&idpError=denied',
          true,
        )!,
      );
      expect(target.hash.split('?')[0]).toBe('#/subpackages/pages/login/login');
      const query = new URLSearchParams(
        target.hash.substring(target.hash.indexOf('?') + 1),
      );
      expect(query.get('redirect')).toBe(
        '/subpackages/pages/space-invite/space-invite?code=abc',
      );
      expect(query.get('idpError')).toBe('denied');
    },
  );

  it('PC 打开已转换的 M 邀请能回到 Web 对应邀请', () => {
    expect(
      getSpaceInviteEntryRedirect(
        'https://agent.nuwax.com/m/#/subpackages/pages/space-invite/space-invite?code=abc&source=qr',
        false,
      ),
    ).toBe('https://agent.nuwax.com/invite/space/abc?source=qr');
  });

  it.each([
    '/login',
    '/space/1/team',
    '/invite/space',
    '/login?redirect=https%3A%2F%2Fevil.example%2Finvite%2Fspace%2Fabc',
  ])('不接管无效邀请及外域回跳 %s', (path) => {
    expect(
      getSpaceInviteEntryRedirect('https://agent.nuwax.com' + path, true),
    ).toBeNull();
  });

  it('过期时间已到时不能继续显示有效，作废状态优先于过期', () => {
    const expire = new Date(Date.now() - 1).toISOString();
    expect(getSpaceInviteStatus({ status: 'Active', expire })).toBe('Expired');
    expect(getSpaceInviteStatus({ status: 'Disabled', expire })).toBe(
      'Disabled',
    );
    expect(getSpaceInviteStatus({ status: 'Active', expire: null })).toBe(
      'Active',
    );
  });
});
