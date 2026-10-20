import { describe, expect, it } from 'vitest';

import { isImeConfirming } from './imeEnter';

describe('isImeConfirming', () => {
  it('组字中（isComposing）的 Enter 不提交', () => {
    expect(isImeConfirming({ nativeEvent: { isComposing: true } })).toBe(true);
  });

  it('部分输入法只给 keyCode 229，也要让开', () => {
    expect(isImeConfirming({ nativeEvent: { isComposing: false }, keyCode: 229 })).toBe(true);
  });

  it('普通 Enter 正常提交', () => {
    expect(isImeConfirming({ nativeEvent: { isComposing: false }, keyCode: 13 })).toBe(false);
  });

  it('缺少原生事件字段时按普通 Enter 处理', () => {
    expect(isImeConfirming({})).toBe(false);
  });
});
