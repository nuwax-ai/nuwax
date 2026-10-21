/**
 * 输入法组字确认键判断（NW-148）。
 *
 * <p>中文/日文等输入法在选词上屏时也会产生一次 Enter。重命名、确认类输入框如果
 * 直接把它当提交，会出现「拼音还没上屏就保存了」：弹窗关闭、名字被截成半截拼音。
 * 组字中的 Enter 在主流浏览器表现为 {@code nativeEvent.isComposing}，部分输入法
 * 只给 {@code keyCode === 229}，两个都认。
 */
export function isImeConfirming(event: {
  nativeEvent?: { isComposing?: boolean };
  keyCode?: number;
}): boolean {
  return event.nativeEvent?.isComposing === true || event.keyCode === 229;
}
