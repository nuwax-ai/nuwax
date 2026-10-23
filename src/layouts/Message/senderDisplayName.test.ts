import { describe, expect, it } from 'vitest';

import {
  buildContactDisplayNameMap,
  resolveNotifySenderName,
} from './senderDisplayName';

describe('通知中心发送者取名（NW-094）', () => {
  it('通讯录 displayName（备注优先）覆盖 user 开头账号名', () => {
    const map = buildContactDisplayNameMap([
      { userId: 11, displayName: '产品大佬' },
      { userId: 12, displayName: '   ' },
      { userId: 13, displayName: null },
    ]);
    expect(resolveNotifySenderName(
      { userId: 11, userName: 'user823', nickName: '' },
      map,
    )).toBe('产品大佬');
    // 空白/缺失 displayName 不入映射，回退昵称
    expect(resolveNotifySenderName(
      { userId: 12, userName: 'user824', nickName: '小明' },
      map,
    )).toBe('小明');
    expect(resolveNotifySenderName(
      { userId: 13, userName: 'user825', nickName: null },
      map,
    )).toBe('user825');
  });

  it('通讯录不可用（映射空/未传）时逐字回退 nickName || userName', () => {
    expect(
      resolveNotifySenderName({ userId: 11, userName: 'user823', nickName: '小明' }, undefined),
    ).toBe('小明');
    expect(
      resolveNotifySenderName({ userId: 11, userName: 'user823', nickName: '' }, new Map()),
    ).toBe('user823');
    expect(resolveNotifySenderName(null, new Map())).toBe('');
  });

  it('userId 类型差异（number/string）按字符串归一匹配', () => {
    const map = buildContactDisplayNameMap([{ userId: '11', displayName: '备注A' }]);
    expect(
      resolveNotifySenderName({ userId: 11, userName: 'user823', nickName: '昵称' }, map),
    ).toBe('备注A');
  });
});
