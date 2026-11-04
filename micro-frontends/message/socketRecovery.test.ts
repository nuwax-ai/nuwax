import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
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

let fixture: string;
let ImSocket: any;
let socket: any;

class Transport {
  static OPEN = 1;
  static instances: Transport[] = [];
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = 3;
  });
  constructor() {
    Transport.instances.push(this);
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  packet(op: number, body: object = {}) {
    this.onmessage?.({ data: JSON.stringify({ v: 1, op, body }) });
  }
  ack(interval = 5) {
    this.open();
    this.packet(1001, { heartbeatInterval: interval });
  }
}

beforeAll(async () => {
  const workspace = process.cwd();
  const adapter = path.join(workspace, 'micro-frontends/message');
  mkdirSync(path.join(workspace, '.cache'), { recursive: true });
  fixture = mkdtempSync(path.join(workspace, '.cache/message-socket-test-'));
  const { pin } = JSON.parse(
    readFileSync(path.join(adapter, 'adapter.json'), 'utf8'),
  );
  const archive = execFileSync(
    'git',
    ['-C', 'submodules/nuwax-im', 'archive', pin, 'nuwax-im-web'],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  execFileSync('tar', ['-x', '-C', fixture], { input: archive });
  execFileSync('git', ['init', '-q'], { cwd: fixture });
  execFileSync('git', ['apply', path.join(adapter, 'adapter.patch')], {
    cwd: fixture,
  });
  // 只控制传输和时间；执行实际构建输入中的 ImSocket 与协议。
  const source = path.join(fixture, 'nuwax-im-web/src');
  vi.doMock(path.join(source, 'api/json.ts'), () => ({
    parseServerJson: JSON.parse,
  }));
  ({ ImSocket } = await import(
    /* @vite-ignore */ path.join(source, 'ws/ImSocket.ts')
  ));
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(1_000_000);
  vi.spyOn(Math, 'random').mockReturnValue(1);
  vi.stubGlobal('WebSocket', Transport);
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  Transport.instances = [];
  socket = new ImSocket();
});

afterEach(() => {
  socket.disconnect();
  expect(vi.getTimerCount()).toBe(0);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
afterAll(() => rmSync(fixture, { recursive: true, force: true }));

function connect() {
  socket.connect(null);
  const transport = Transport.instances.at(-1)!;
  transport.ack();
  return transport;
}

describe('正式消息适配的连接恢复', () => {
  it.each([false, true])(
    'WS open=%s，10 秒未完成握手后关闭旧连接并重试',
    async (opened) => {
      socket.connect(null);
      const old = Transport.instances[0];
      if (opened) old.open();
      await vi.advanceTimersByTimeAsync(9_999);
      expect(old.close).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(old.close).toHaveBeenCalledOnce();
      expect(socket.state).toBe('reconnecting');
      await vi.advanceTimersByTimeAsync(1_000);
      expect(Transport.instances).toHaveLength(2);
    },
  );

  it('无 PONG、无 close 事件的半开连接也会主动关闭并恢复同步', async () => {
    const old = connect();
    const stalePacket = old.onmessage!;
    const reconnected = vi.fn();
    const received = vi.fn();
    socket.listeners = { onReconnected: reconnected, onMsgRecv: received };
    await vi.advanceTimersByTimeAsync(15_000);
    expect(old.close).toHaveBeenCalledOnce();
    expect(socket.connected).toBe(false);
    await vi.advanceTimersByTimeAsync(1_000);
    const next = Transport.instances[1];
    next.ack();
    stalePacket({
      data: JSON.stringify({ v: 1, op: 3002, body: { msgId: 'old' } }),
    });
    next.packet(3002, { msgId: 'new' });
    expect(reconnected).toHaveBeenCalledOnce();
    expect(received).toHaveBeenCalledOnce();
    expect(received).toHaveBeenLastCalledWith({ msgId: 'new' });
    expect(
      Transport.instances.filter((item) => item.readyState === 1),
    ).toHaveLength(1);
  });

  it('模拟连续 24 小时收到 PONG，保持单连接并继续接收消息', async () => {
    socket.connect(null);
    const healthy = Transport.instances[0];
    healthy.ack(30);
    const received = vi.fn();
    socket.listeners.onMsgRecv = received;
    const count = Transport.instances.length;
    for (let tick = 0; tick < 24 * 60 * 2; tick++) {
      await vi.advanceTimersByTimeAsync(30_000);
      healthy.packet(2001);
    }
    healthy.packet(3002, { msgId: 'after-a-day' });
    expect(socket.connected).toBe(true);
    expect(Transport.instances).toHaveLength(count);
    expect(healthy.close).not.toHaveBeenCalled();
    expect(received).toHaveBeenLastCalledWith({ msgId: 'after-a-day' });
  });

  it('离线数小时不建连接，online 连发只恢复一次，旧 close 不影响新连接', async () => {
    const old = connect();
    const lateClose = old.onclose!;
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    window.dispatchEvent(new Event('offline'));
    await vi.advanceTimersByTimeAsync(3 * 60 * 60_000);
    expect(Transport.instances).toHaveLength(1);
    expect(old.close).toHaveBeenCalledOnce();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(0);
    expect(Transport.instances).toHaveLength(2);
    Transport.instances[1].ack();
    lateClose();
    expect(socket.connected).toBe(true);
    expect(Transport.instances[1].close).not.toHaveBeenCalled();
  });

  it('后台时钟跳过数小时，返回可见页面立即识别旧心跳', async () => {
    const old = connect();
    vi.setSystemTime(Date.now() + 3 * 60 * 60_000);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(old.close).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(Transport.instances).toHaveLength(2);
  });

  it('持续传输失败按指数退避，30 秒封顶，不依赖 close 事件', async () => {
    socket.connect(null);
    for (const delay of [1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000]) {
      const count = Transport.instances.length;
      Transport.instances.at(-1)!.onerror?.();
      await vi.advanceTimersByTimeAsync(delay - 1);
      expect(Transport.instances).toHaveLength(count);
      await vi.advanceTimersByTimeAsync(1);
      expect(Transport.instances).toHaveLength(count + 1);
    }
  });

  it.each(['IM_10503', 'IM_90002'])('临时拒绝 %s 可重试', async (code) => {
    socket.connect(null);
    Transport.instances[0].open();
    Transport.instances[0].packet(1002, { code });
    await vi.advanceTimersByTimeAsync(1_000);
    expect(Transport.instances).toHaveLength(2);
  });

  it.each([false, true])(
    '服务重启无需等待 close，stopReconnect=%s 时遵守服务端指令',
    async (stopReconnect) => {
      const old = connect();
      old.packet(9000, { reason: 'server_restart', stopReconnect });
      await vi.advanceTimersByTimeAsync(1_000);
      expect(Transport.instances).toHaveLength(stopReconnect ? 1 : 2);
      expect(socket.state).toBe(stopReconnect ? 'closed' : 'reconnecting');
    },
  );

  it.each(['auth_expired', 'device_kicked', 'force_logout'])(
    '明确被踢 %s 后网络/可见性事件不能复活旧会话',
    async (reason) => {
      const old = connect();
      old.packet(9000, { reason });
      window.dispatchEvent(new Event('online'));
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(60_000);
      expect(Transport.instances).toHaveLength(1);
      expect(socket.state).toBe('closed');
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it.each(['IM_10401', 'IM_10429'])(
    '认证或配额拒绝 %s 终止重试',
    async (code) => {
      const old = connect();
      old.packet(1002, { code });
      window.dispatchEvent(new Event('online'));
      await vi.advanceTimersByTimeAsync(60_000);
      expect(Transport.instances).toHaveLength(1);
      expect(socket.state).toBe('rejected');
    },
  );

  it('卸载取消重连及所有恢复监听，重挂不保留旧计时器', async () => {
    connect().onerror?.();
    socket.disconnect();
    expect(vi.getTimerCount()).toBe(0);
    window.dispatchEvent(new Event('online'));
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(Transport.instances).toHaveLength(1);
    socket.connect(null);
    Transport.instances[1].ack();
    expect(socket.connected).toBe(true);
    expect(vi.getTimerCount()).toBe(1);
  });
});
