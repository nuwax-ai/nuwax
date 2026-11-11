/** 正整数 int64 ID 保持十进制字符串；已被 JS 舍入的数字不能再用于定位账号。 */
export function positiveInt64Id(value: unknown): string | undefined {
  if (typeof value === 'number' && !Number.isSafeInteger(value))
    return undefined;
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const raw = String(value).trim();
  if (!/^\d+$/.test(raw)) return undefined;
  const id = raw.replace(/^0+/, '');
  if (!id || id.length > 19 || (id.length === 19 && id > '9223372036854775807'))
    return undefined;
  return id;
}
