import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

/** 对固定 main 真源应用正式 patch，验证实际 store，而不是复刻一个测试实现。 */
const adapterDir = path.resolve('micro-frontends/message');
const workspace = path.resolve(adapterDir, '../..');
const sourceRepo = path.join(workspace, 'submodules/nuwax-im');
let fixture: string;
let source: string;
let chat: any;
let runtime: any;
let notifications: any;
const sockets: any[] = [];
const me = vi.fn();
const register = vi.fn();
const unregister = vi.fn();
const originalBridge = (window as any).NuwaClawBridge;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
}

async function settle() {
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
}

beforeAll(async () => {
  mkdirSync(path.join(workspace, '.cache'), { recursive: true });
  fixture = mkdtempSync(path.join(workspace, '.cache/message-store-test-'));
  const archive = execFileSync(
    'git',
    [
      '-C',
      sourceRepo,
      'archive',
      'f7fd703688aba50573621f9ee8e32ecf0ef9f75c',
      'nuwax-im-web/src',
      'nuwax-im-web/vite.config.ts',
      'nuwax-im-web/tsconfig.node.json',
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  execFileSync('tar', ['-x', '-C', fixture], { input: archive });
  // 避免 git apply 误认宿主的 .cache 忽略路径而静默跳过。
  execFileSync('git', ['init', '-q'], { cwd: fixture });
  execFileSync('git', ['apply', path.join(adapterDir, 'adapter.patch')], {
    cwd: fixture,
  });
  cpSync(
    path.join(adapterDir, 'overlay/src/hostRuntime.ts'),
    path.join(fixture, 'nuwax-im-web/src/hostRuntime.ts'),
  );
  source = path.join(fixture, 'nuwax-im-web/src');

  vi.doMock(path.join(source, 'authMode.ts'), () => ({
    isPlatformMode: true,
    PLATFORM_LOGIN_URL: '/login',
  }));
  vi.doMock(path.join(source, 'api/index.ts'), () => ({
    authApi: { me },
    contactApi: { list: vi.fn().mockResolvedValue([]) },
    convApi: { list: vi.fn().mockResolvedValue({ records: [] }) },
    deviceApi: { register, unregister },
    msgApi: {},
    readApi: {},
    stickerApi: {},
    syncApi: { unreadTotal: vi.fn().mockResolvedValue({ total: 0 }) },
  }));
  vi.doMock(path.join(source, 'api/client.ts'), () => ({
    ApiError: class ApiError extends Error {},
    tokenStore: {
      get: vi.fn(() => null),
      userId: vi.fn(() => null),
      userName: vi.fn(() => null),
      set: vi.fn(),
      clear: vi.fn(),
    },
  }));
  vi.doMock(path.join(source, 'ws/ImSocket.ts'), () => ({
    ImSocket: class {
      listeners = {};
      active = false;
      connected = false;
      connect = vi.fn(() => {
        this.active = true;
        this.connected = true;
      });
      disconnect = vi.fn(() => {
        this.active = false;
        this.connected = false;
      });
      sendReadReport = vi.fn();
      sendRecvAck = vi.fn();
      constructor() {
        sockets.push(this);
      }
    },
  }));
  vi.useFakeTimers();
  chat = await import(/* @vite-ignore */ path.join(source, 'store/chat.ts'));
  runtime = await import(
    /* @vite-ignore */ path.join(source, 'hostRuntime.ts')
  );
  notifications = await import(
    /* @vite-ignore */ path.join(source, 'lib/notify.ts')
  );
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  delete (window as any).NuwaClawBridge;
  localStorage.clear();
  register.mockResolvedValue(undefined);
  unregister.mockResolvedValue(undefined);
  me.mockResolvedValue({ userId: '101', userName: '用户一' });
  chat.beginImEmbeddedSession();
  runtime.beginMessageRuntime(document.createElement('div'), {}, true);
});

afterEach(() => {
  chat.disposeImEmbeddedSession();
  notifications.disposeImNotifications();
  runtime.endMessageRuntime();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  localStorage.clear();
  (window as any).NuwaClawBridge = originalBridge;
});

afterAll(() => {
  rmSync(fixture, { recursive: true, force: true });
});

describe('消息 main store 的正式适配生命周期', () => {
  it('原生能力存在时不发 browser Notification、不请求浏览器权限，原开关仍写盘并转发', async () => {
    const forward = vi.fn().mockResolvedValue(undefined);
    (window as any).NuwaClawBridge = {
      im: { setNotificationEnabled: forward },
    };
    const permission = vi.fn().mockResolvedValue('denied');
    vi.stubGlobal('Notification', {
      permission: 'denied',
      requestPermission: permission,
    });
    const create = vi.fn();
    expect(notifications.notifyStateNow()).toBe('granted');
    expect(
      await notifications.requestNotifyPermission({
        secureContext: false,
        hasNotification: false,
        permission: 'denied',
      }),
    ).toBe('granted');
    expect(permission).not.toHaveBeenCalled();
    expect(
      notifications.pushNotify(
        { convId: '7', title: '消息', body: '内容' },
        {
          env: {
            secureContext: true,
            hasNotification: true,
            permission: 'granted',
          },
          enabled: true,
          hidden: true,
          force: true,
          create,
        },
      ),
    ).toBe(false);
    expect(create).not.toHaveBeenCalled();
    notifications.writeNotifyEnabled(false);
    expect(forward).toHaveBeenCalledWith(false);
    expect(localStorage.getItem('nuwax-im.notify')).toBe('0');
    expect(notifications.readNotifyEnabled()).toBe(false);
  });

  it('开关存储失败仍转发原生偏好，卸载后旧开关动作不能再影响壳', () => {
    const forward = vi.fn().mockResolvedValue(undefined);
    (window as any).NuwaClawBridge = {
      im: { setNotificationEnabled: forward },
    };
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => notifications.writeNotifyEnabled(false)).not.toThrow();
    expect(forward).toHaveBeenCalledWith(false);
    runtime.invalidateMessageRequests();
    notifications.writeNotifyEnabled(true);
    expect(forward).toHaveBeenCalledOnce();
  });

  it('卸载后晚到 whoami 不写状态、不注册设备、不建连', async () => {
    const request = deferred<{ userId: string; userName: string }>();
    me.mockReturnValueOnce(request.promise);
    const previous = chat.useChatStore;
    const socket = sockets.at(-1);
    const probe = previous.getState().probePlatformSession();
    expect(previous.getState().authProbe).toBe('probing');
    chat.disposeImEmbeddedSession();
    request.resolve({ userId: '101', userName: '用户一' });
    expect(await probe).toBe(false);
    expect(previous.getState().userId).toBeNull();
    expect(register).not.toHaveBeenCalled();
    expect(socket.connect).not.toHaveBeenCalled();
    expect(socket.listeners).toEqual({});
  });

  it('卸载后晚到设备注册不建连、不占据下一挂载探测', async () => {
    const request = deferred<void>();
    register.mockReturnValueOnce(request.promise);
    const previous = chat.useChatStore;
    const socket = sockets.at(-1);
    const probe = previous.getState().probePlatformSession();
    await settle();
    expect(register).toHaveBeenCalledOnce();
    chat.disposeImEmbeddedSession();
    chat.beginImEmbeddedSession();
    expect(chat.useChatStore).not.toBe(previous);
    expect(await chat.useChatStore.getState().probePlatformSession()).toBe(
      true,
    );
    request.resolve();
    expect(await probe).toBe(false);
    expect(socket.connect).not.toHaveBeenCalled();
    expect(sockets.at(-1).connect).toHaveBeenCalledOnce();
  });

  it('新挂载是独立 store/连接，已释放旧动作无法写进新身份', async () => {
    const previous = chat.useChatStore;
    const previousSocket = sockets.at(-1);
    expect(await previous.getState().probePlatformSession()).toBe(true);
    chat.beginImEmbeddedSession();
    const current = chat.useChatStore;
    expect(current).not.toBe(previous);
    expect(sockets.at(-1)).not.toBe(previousSocket);
    me.mockResolvedValueOnce({ userId: '202', userName: '用户二' });
    expect(await current.getState().probePlatformSession()).toBe(true);
    await previous
      .getState()
      .loginFromSession({ userId: '303', userName: '过期身份' });
    expect(current.getState().userId).toBe('202');
    expect(previousSocket.connect).toHaveBeenCalledOnce();
    expect(previousSocket.disconnect).toHaveBeenCalled();
    expect(unregister).not.toHaveBeenCalled();
  });

  it('隐藏仍保持连接和未读；切回才按真实焦点补报', async () => {
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    expect(await chat.useChatStore.getState().probePlatformSession()).toBe(
      true,
    );
    const socket = sockets.at(-1);
    chat.useChatStore.setState({
      activeConvId: '7',
      convs: [{ convId: '7', unreadCount: 2, readSeq: 0 }],
      unreadTotal: 2,
      messagesByConv: { '7': [{ msgId: '9', convId: '7', seq: 2 }] },
    });
    runtime.updateMessageRuntime({ active: false, path: '/repo/doc/7' });
    chat.useChatStore.getState().reportRead('7');
    vi.advanceTimersByTime(30_000);
    expect(chat.useChatStore.getState().unreadTotal).toBe(2);
    expect(socket.sendReadReport).not.toHaveBeenCalled();
    expect(socket.connected).toBe(true);
    runtime.updateMessageRuntime({ active: true, path: '/instant-message' });
    chat.useChatStore.getState().flushPendingRead();
    expect(chat.useChatStore.getState().unreadTotal).toBe(0);
    vi.advanceTimersByTime(500);
    expect(socket.sendReadReport).toHaveBeenCalledWith('7', 2);
  });

  it('卸载清理心跳、已读窗口、焦点重试、缓存写定时器，保留磁盘数据', async () => {
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    expect(await chat.useChatStore.getState().probePlatformSession()).toBe(
      true,
    );
    const cacheKey = 'nuwax-im.cache.v1.u.101.msgs.preserved';
    localStorage.setItem(cacheKey, 'retained');
    const socket = sockets.at(-1);
    chat.useChatStore.setState({
      activeConvId: '7',
      convs: [{ convId: '7', unreadCount: 2, readSeq: 0 }],
      unreadTotal: 2,
      messagesByConv: { '7': [{ msgId: '9', convId: '7', seq: 2 }] },
    });
    chat.useChatStore.getState().reportRead('7');
    vi.mocked(document.hasFocus).mockReturnValue(false);
    chat.useChatStore.getState().flushPendingRead();
    expect(vi.getTimerCount()).toBeGreaterThan(1);
    chat.disposeImEmbeddedSession();
    // jsdom 将 localStorage 的 storage 事件排为 0ms 任务；这不是应用运行时定时器。
    vi.advanceTimersByTime(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(socket.listeners).toEqual({});
    expect(socket.connected).toBe(false);
    expect(unregister).not.toHaveBeenCalled();
    expect(localStorage.getItem(cacheKey)).toBe('retained');
  });

  it('真卸载关闭桌面通知且释放旧会话点击回调', () => {
    const notification = { onclick: null, close: vi.fn() };
    const openConv = vi.fn();
    expect(
      notifications.pushNotify(
        { convId: '7', title: '新消息', body: '消息内容' },
        {
          env: {
            secureContext: true,
            hasNotification: true,
            permission: 'granted',
          },
          hidden: true,
          unfocused: false,
          enabled: true,
          create: () => notification,
          openConv,
        },
      ),
    ).toBe(true);
    expect(notification.onclick).toBeTypeOf('function');
    notifications.disposeImNotifications();
    expect(notification.onclick).toBeNull();
    expect(notification.close).toHaveBeenCalledOnce();
    expect(openConv).not.toHaveBeenCalled();
  });
});
