import { describe, expect, it } from 'vitest';
import { needsProfileSetup } from './profileSetupPrompt';

describe('needsProfileSetup（L2 触发判定，语义对齐 App 端）', () => {
  it('默认形态 user+纯数字 且昵称为空 → true', () => {
    expect(needsProfileSetup({ userName: 'user1792564071', nickName: '' })).toBe(true);
    expect(needsProfileSetup({ userName: 'user123', nickName: null })).toBe(true);
    expect(needsProfileSetup({ userName: 'user1792564071' })).toBe(true);
  });

  it('已设昵称 → false（设置后不再弹）', () => {
    expect(needsProfileSetup({ userName: 'user1792564071', nickName: '东' })).toBe(false);
    expect(needsProfileSetup({ userName: 'user1792564071', nickName: '  东  ' })).toBe(false);
  });

  it('userName 非默认形态 → false', () => {
    expect(needsProfileSetup({ userName: 'luodong', nickName: '' })).toBe(false);
    expect(needsProfileSetup({ userName: 'user', nickName: '' })).toBe(false); // <=4 无数字后缀
    expect(needsProfileSetup({ userName: 'userabc', nickName: '' })).toBe(false);
    expect(needsProfileSetup({ userName: 'xuser123', nickName: '' })).toBe(false);
  });

  it('雪花 id 形态后缀也是纯数字 → 仍按默认形态判 true（宽松位数语义）', () => {
    // App 端口径：后缀只按数字特征判定，不区分位数
    expect(needsProfileSetup({ userName: 'user238109902944337920', nickName: '' })).toBe(true);
  });

  it('字段缺失/空白 → false（宁可不弹）', () => {
    expect(needsProfileSetup({})).toBe(false);
    expect(needsProfileSetup({ userName: '   ', nickName: '  ' })).toBe(false);
  });
});
