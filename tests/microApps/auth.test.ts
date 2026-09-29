import {
  clearMicroAppDevSession,
  prepareMicroAppAuthSession,
} from '@/utils/businessAuth';
import { afterEach, describe, expect, it, vi } from 'vitest';

const host = vi.hoisted(() => ({ product: '', sync: vi.fn(async () => true) }));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: {
    host: { getProduct: () => host.product },
    auth: { syncSession: host.sync },
  },
}));

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.removeItem('ACCESS_TOKEN');
  document.cookie = 'ticket=; Path=/; Max-Age=0';
  host.product = '';
  host.sync.mockClear();
});

describe('微应用鉴权桥', () => {
  it('普通开发浏览器在深链挂载前镜像当前 token，并在清理时删除', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    localStorage.setItem('ACCESS_TOKEN', 'current-token');
    expect(await prepareMicroAppAuthSession()).toBe(true);
    expect(document.cookie).toContain('ticket=current-token');
    clearMicroAppDevSession();
    expect(document.cookie).not.toContain('ticket=');
  });

  it('开发 token 丢失时删除旧 ticket，不继续加载旧账号数据', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    document.cookie = 'ticket=stale-token; Path=/';
    localStorage.removeItem('ACCESS_TOKEN');
    expect(await prepareMicroAppAuthSession()).toBe(false);
    expect(document.cookie).not.toContain('ticket=');
  });

  it('构建产物不读取旧 token 或覆盖后端 cookie', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    localStorage.setItem('ACCESS_TOKEN', 'stale-token');
    document.cookie = 'ticket=server-session; Path=/';
    expect(await prepareMicroAppAuthSession()).toBe(true);
    clearMicroAppDevSession();
    expect(document.cookie).toContain('ticket=server-session');
  });

  it('商业客户端即使加载 dev 服务也先等待宿主 cookie 同步', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    host.product = 'nuwax';
    localStorage.setItem('ACCESS_TOKEN', 'stale-token');
    host.sync.mockResolvedValueOnce(false);
    expect(await prepareMicroAppAuthSession()).toBe(false);
    expect(host.sync).toHaveBeenCalledTimes(1);
    expect(document.cookie).not.toContain('ticket=stale-token');
  });
});
