/**
 * 格式化价格显示
 * @param v 价格数值
 * @param decimals 默认小数位数（当值 >= 0.01 时使用）
 */
export function formatPrice(v: number, decimals = 2): string {
  if (v < 0.01) return v.toFixed(4);
  return v.toFixed(decimals);
}
