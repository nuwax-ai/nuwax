import { describe, expect, it } from 'vitest';
import { buildVncClientUrl } from './vncClientUrl';
describe('shared VNC client documents', () => {
  it('preserves the ordinary conversation desktop URL and readonly mode', () => {
    const url = new URL(
      buildVncClientUrl({
        serviceUrl: 'https://business.example/',
        cId: '123',
        readOnly: true,
      }),
    );
    expect(url.pathname).toBe('/computer/desktop/123/vnc.html');
    expect(url.searchParams.get('view_only')).toBe('true');
    expect(url.searchParams.get('resize')).toBe('scale');
  });
  it('retains an app proxy document without substituting app id for conversation id', () => {
    const url = new URL(
      buildVncClientUrl({
        sourceUrl: '/api/userapp/proxy/vnc/dev/9/?ticket=x',
        cId: '123',
      }),
      'https://business.example',
    );
    expect(url.pathname).toBe('/api/userapp/proxy/vnc/dev/9/');
    expect(url.searchParams.get('ticket')).toBe('x');
    expect(url.searchParams.get('autoconnect')).toBe('true');
    expect(url.searchParams.getAll('reconnect')).toEqual(['true']);
  });
});
