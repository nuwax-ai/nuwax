/** 首屏分流与路由兜底共用；保持自包含，供 config 内联到启动脚本。 */
export function getQrLoginEntryRedirect(href: string): string | null {
  try {
    const current = new URL(href);
    if (
      !/^https?:$/.test(current.protocol) ||
      current.username ||
      current.password
    )
      return null;
    const page = '/subpackages/pages/qr-login/qr-login';
    if (
      /^\/m\/?$/.test(current.pathname) &&
      current.hash.split('?')[0] === '#' + page
    )
      return current.href;
    const match = current.pathname.match(/^\/qrlogin\/([^/]+)\/?$/);
    if (!match) return null;
    let sceneId = '';
    try {
      sceneId = decodeURIComponent(match[1]);
    } catch {
      /* 无效场景交给确认页提示，不发鉴权请求。 */
    }
    if (
      sceneId === '.' ||
      sceneId === '..' ||
      !/^[A-Za-z0-9][A-Za-z0-9._~-]{0,255}$/.test(sceneId)
    )
      sceneId = '';
    const query = new URLSearchParams({ sceneId, origin: current.origin });
    // 不透传二维码附带的 origin、pollToken 或跳转地址。
    return current.origin + '/m/#' + page + '?' + query.toString();
  } catch {
    return null;
  }
}
