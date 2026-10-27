import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pickLocalWorkspaceDirectory } from './workspaceDirectoryPicker';

const mocks = vi.hoisted(() => ({ getApi: vi.fn() }));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: { localFiles: { getApi: mocks.getApi } },
}));

const capabilities = { apiVersion: 2, available: true, sandboxId: '4418' };
const makeApi = () => ({
  getCapabilities: vi.fn().mockResolvedValue(capabilities),
  pickDirectory: vi
    .fn()
    .mockResolvedValue({ canceled: false, paths: ['/work'] }),
});
let api: ReturnType<typeof makeApi>;
beforeEach(() => {
  api = makeApi();
  mocks.getApi.mockReturnValue(api);
});
const pick = (sandboxId = '4418', controller = new AbortController()) =>
  pickLocalWorkspaceDirectory(sandboxId, controller.signal);

describe('工作目录选择的本机与远端分流', () => {
  it('旧浏览器没有 AbortSignal.throwIfAborted 时仍保留无桥的后端路线', async () => {
    const controller = new AbortController();
    Object.defineProperty(controller.signal, 'throwIfAborted', {
      value: undefined,
    });
    mocks.getApi.mockReturnValue(undefined);
    expect(await pick('4418', controller)).toBeNull();
  });

  it.each([null, undefined, {}])(
    '旧桥能力探测返回 %s 时不打开本机目录',
    async (caps) => {
      api.getCapabilities.mockResolvedValue(caps);
      expect(await pick()).toBeNull();
      expect(api.pickDirectory).not.toHaveBeenCalled();
    },
  );

  it.each([
    '/Users/me/工作目录',
    'C:\\Users\\me\\work',
    '\\\\nas\\share\\work',
  ])('本机直接返回系统选择的绝对路径 %s', async (path) => {
    api.pickDirectory.mockResolvedValue({ canceled: false, paths: [path] });
    expect(await pick()).toEqual({ canceled: false, path });
    expect(api.pickDirectory).toHaveBeenCalledTimes(1);
  });

  it('其他电脑、浏览器、关闭能力和只有旧选择桥时保留后端路线', async () => {
    expect(await pick('999')).toBeNull();
    api.getCapabilities.mockResolvedValue({
      ...capabilities,
      available: false,
    });
    expect(await pick()).toBeNull();
    mocks.getApi.mockReturnValue({ pickDirectory: api.pickDirectory });
    expect(await pick()).toBeNull();
    mocks.getApi.mockReturnValue(undefined);
    expect(await pick()).toBeNull();
    expect(api.pickDirectory).not.toHaveBeenCalled();
  });

  it('能够证明本机身份的 v1 目录桥不依赖会话或写文件能力', async () => {
    api.getCapabilities.mockResolvedValue({ ...capabilities, apiVersion: 1 });
    expect(await pick()).toEqual({ canceled: false, path: '/work' });
  });

  it('本机取消返回取消，失败拒绝，二者均不返回允许后端的 null', async () => {
    api.pickDirectory.mockResolvedValueOnce({ canceled: true, paths: [] });
    expect(await pick()).toEqual({ canceled: true });
    api.pickDirectory.mockRejectedValueOnce(new Error('IPC disconnected'));
    await expect(pick()).rejects.toThrow('IPC disconnected');
    api.pickDirectory.mockResolvedValueOnce({ canceled: false, paths: [] });
    await expect(pick()).rejects.toThrow('no absolute path');
  });

  it('能力探测中关闭或切电脑不会再打开本机选择器', async () => {
    let finish!: (value: typeof capabilities) => void;
    api.getCapabilities.mockReturnValueOnce(
      new Promise((done) => {
        finish = done;
      }),
    );
    const controller = new AbortController();
    const pending = pick('4418', controller);
    controller.abort();
    finish(capabilities);
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(api.pickDirectory).not.toHaveBeenCalled();
  });

  it('原生对话框串行，旧选择结果在关闭后不能作为新请求的结果', async () => {
    let finish!: (value: { canceled: boolean; paths: string[] }) => void;
    api.pickDirectory.mockReturnValueOnce(
      new Promise((done) => {
        finish = done;
      }),
    );
    const controller = new AbortController();
    const first = pick('4418', controller);
    await vi.waitFor(() => expect(api.pickDirectory).toHaveBeenCalledTimes(1));
    controller.abort();
    const second = pick();
    await Promise.resolve();
    expect(api.pickDirectory).toHaveBeenCalledTimes(1);
    finish({ canceled: false, paths: ['/old'] });
    await expect(first).rejects.toMatchObject({ name: 'AbortError' });
    expect(await second).toEqual({ canceled: false, path: '/work' });
    expect(api.pickDirectory).toHaveBeenCalledTimes(2);
  });

  it('对话框期间登出或宿主身份变化后丢弃结果', async () => {
    api.pickDirectory.mockImplementationOnce(async () => {
      api.getCapabilities.mockResolvedValue({
        ...capabilities,
        available: false,
      });
      return { canceled: false, paths: ['/old-account'] };
    });
    await expect(pick()).rejects.toThrow('identity expired');
  });
});
