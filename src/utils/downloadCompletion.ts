import { nuwaClawHost } from './nuwaClawBridge';

/** undefined 表示浏览器降级；false 表示用户取消，不能再次触发下载。 */
export async function saveWithDesktopHost(url: string, filename: string): Promise<boolean | undefined> {
  if (nuwaClawHost.host.getProduct() !== 'nuwax') return undefined;
  const result = await nuwaClawHost.native.saveImage(url, filename);
  if (result.success) return true;
  if (result.error) throw new Error(result.error);
  return false;
}
