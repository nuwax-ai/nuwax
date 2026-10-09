import type { ClientRequest, IncomingMessage } from 'node:http';

/**
 * 浏览器先同源连接开发服务，代理再以业务域 Origin 完成 Cookie 握手。
 * 只改写当前开发服务自己的页面来源；其它 Origin 仍交给后端校验。
 */
export function devWebSocketProxy(target: string) {
  const upstreamOrigin = new URL(target).origin;
  return {
    target,
    changeOrigin: true,
    ws: true,
    onProxyReqWs(
      proxyReq: Pick<ClientRequest, 'setHeader'>,
      req: Pick<IncomingMessage, 'headers'>,
    ) {
      const origin = req.headers.origin;
      if (!origin) return;
      try {
        const source = new URL(origin);
        if (
          /^https?:$/.test(source.protocol) &&
          source.origin === origin &&
          source.host === req.headers.host
        ) {
          proxyReq.setHeader('Origin', upstreamOrigin);
        }
      } catch {
        // 非法或其它站点来源不改写，不放宽后端的 Cookie Origin 规则。
      }
    },
  };
}
