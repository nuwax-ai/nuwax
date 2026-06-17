/**
 * 将字节（Byte）转换为适当的单位（KB, MB, GB, TB）
 * @param bytes 字节数
 * @param decimals 小数点后位数
 * @returns 格式化后的字符串
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  );
}

/**
 * 将字节转换为千字节（KB）
 * @param bytes 字节数
 * @param decimals 小数点后位数
 * @returns 千字节数值
 */
export function bytesToKB(bytes: number, decimals = 2): number {
  return Number.parseFloat((bytes / 1024).toFixed(decimals));
}

/**
 * 将字节转换为兆字节（MB）
 * @param bytes 字节数
 * @param decimals 小数点后位数
 * @returns 兆字节数值
 */
export function bytesToMB(bytes: number, decimals = 2): number {
  return Number.parseFloat((bytes / (1024 * 1024)).toFixed(decimals));
}

/**
 * 将字节转换为千字节（KB）并格式化
 * @param bytes 字节数
 * @param decimals 小数点后位数
 * @returns 格式化后的千字节字符串
 */
export function formatBytesToKB(bytes: number, decimals = 2): string {
  return `${bytesToKB(bytes, decimals)} KB`;
}

/**
 * 将字节转换为兆字节（MB）并格式化
 * @param bytes 字节数
 * @param decimals 小数点后位数
 * @returns 格式化后的兆字节字符串
 */
export function formatBytesToMB(bytes: number, decimals = 2): string {
  return `${bytesToMB(bytes, decimals)} MB`;
}
