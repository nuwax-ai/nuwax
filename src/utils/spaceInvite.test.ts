import { describe, expect, it } from 'vitest';
import {
  getSpaceInviteQrPath,
  getSpaceInviteStatus,
  shouldKeepSpaceInviteOnWeb,
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

  it.each([
    ['/invite/space/abc', '', true],
    ['/login', '?redirect=%2Finvite%2Fspace%2Fabc', true],
    ['/verify-code', '?redirect=%2Finvite%2Fspace%2Fabc', true],
    ['/set-password', '?redirect=%2Finvite%2Fspace%2Fabc', true],
    [
      '/login',
      '?redirect=https%3A%2F%2Fevil.example%2Finvite%2Fspace%2Fabc',
      false,
    ],
    ['/login', '?redirect=%2F%2Fevil.example%2Finvite%2Fspace%2Fabc', false],
    ['/login', '', false],
    ['/space/1/team', '', false],
    ['/invite/space', '', false],
  ])('仅邀请及其登录步骤留在统一 Web：%s %s', (path, search, expected) => {
    expect(
      shouldKeepSpaceInviteOnWeb(path, search, 'https://agent.nuwax.com'),
    ).toBe(expected);
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
