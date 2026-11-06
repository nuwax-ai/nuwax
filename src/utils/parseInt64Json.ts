/**
 * 仅用于含 int64 的统计接口，在 JSON.parse 舍入前保留大整数。
 * 完整匹配字符串和数字 token，避免改写昵称中的数字、转义引号或小数。
 */
export function parseInt64Json(data: unknown): unknown {
  if (typeof data !== 'string') return data;
  const text = data.replace(
    /"(?:\\.|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (token) =>
      /^-?\d{16,}$/.test(token) && !Number.isSafeInteger(Number(token))
        ? `"${token}"`
        : token,
  );
  return JSON.parse(text);
}
