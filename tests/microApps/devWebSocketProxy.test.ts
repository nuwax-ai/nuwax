import { describe, expect, it, vi } from 'vitest';
import { devWebSocketProxy } from '../../config/devWebSocketProxy';

describe('开发同源 WebSocket 代理', () => {
  it('自己的页面握手转为固定业务 Origin，Cookie 仍由原代理转发', () => {
    const setHeader = vi.fn();
    const proxy = devWebSocketProxy('https://testagent.xspaceagi.com');
    proxy.onProxyReqWs(
      { setHeader },
      {
        headers: {
          host: 'localhost:3001',
          origin: 'http://localhost:3001',
          cookie: 'ticket=test-session',
        },
      },
    );
    expect(proxy.ws).toBe(true);
    expect(setHeader).toHaveBeenCalledOnce();
    expect(setHeader).toHaveBeenCalledWith(
      'Origin',
      'https://testagent.xspaceagi.com',
    );
  });

  it.each([
    undefined,
    'https://foreign.example',
    'http://localhost:3002',
    'null',
    'http://localhost:3001/path',
    'http://user@localhost:3001',
  ])('其它或非法 Origin %s 不伪装成业务来源', (origin) => {
    const setHeader = vi.fn();
    devWebSocketProxy('https://testagent.xspaceagi.com').onProxyReqWs(
      { setHeader },
      { headers: { host: 'localhost:3001', origin } },
    );
    expect(setHeader).not.toHaveBeenCalled();
  });
});
