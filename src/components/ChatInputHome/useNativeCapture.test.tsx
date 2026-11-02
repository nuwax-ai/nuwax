import type {
  CaptureBridge,
  CaptureResult,
} from '@/types/interfaces/hostBridge';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNativeCapture } from './useNativeCapture';

vi.mock('@/services/i18nRuntime', () => ({ t: (key: string) => key }));
const errorMessage = vi.hoisted(() => vi.fn());
vi.mock('antd', () => ({ message: { error: errorMessage } }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const success: CaptureResult = {
  success: true,
  resultId: 'shot',
  mime: 'image/png',
  bytes: 4,
  width: 1,
  height: 1,
  qualityUsed: 'lossless',
  hdrToneMapped: false,
};

let listener: Parameters<NonNullable<CaptureBridge['onShortcut']>>[0];
let bridge: CaptureBridge;
let focused: boolean;
const onFiles = vi
  .fn<(files: File[]) => Promise<void>>()
  .mockResolvedValue(undefined);
const off = vi.fn();

function mount() {
  return renderHook(
    ({ scope, disabled }) =>
      useNativeCapture({
        editorRef: { current: { hasFocus: () => focused } },
        scope,
        disabled,
        onFiles,
      }),
    { initialProps: { scope: 'chat:A', disabled: false } },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  focused = true;
  bridge = {
    onShortcut: vi.fn((value) => {
      listener = value;
      return off;
    }),
    interactive: vi.fn(async () => success),
    screenshot: vi.fn(async () => success),
    record: vi.fn(async () => success),
    readChunk: vi.fn(async () => new Uint8Array([137, 80, 78, 71]).buffer),
    copy: vi.fn(async () => ({ success: true, kind: 'image' })),
    release: vi.fn(async () => {}),
  } as unknown as CaptureBridge;
  window.NuwaClawBridge = { capture: bridge };
});
afterEach(() => {
  cleanup();
  delete window.NuwaClawBridge;
  vi.restoreAllMocks();
});

describe('Agent 客户端截图草稿', () => {
  it('只有聚焦且可编辑的输入框认领；确认后复制并带入一次附件', async () => {
    const { rerender } = mount();
    focused = false;
    expect(listener.canHandle()).toBe(false);
    focused = true;
    rerender({ scope: 'chat:A', disabled: true });
    expect(listener.canHandle()).toBe(false);
    rerender({ scope: 'chat:A', disabled: false });
    expect(listener.canHandle()).toBe(true);
    listener.run('screenshot');
    listener.run('screenshot');
    await waitFor(() => expect(onFiles).toHaveBeenCalledTimes(1));
    const [file] = onFiles.mock.calls[0][0];
    expect(file).toMatchObject({ type: 'image/png', size: 4 });
    expect(file.name).toMatch(/\.png$/);
    expect(bridge.interactive).toHaveBeenCalledTimes(1);
    expect(bridge.copy).toHaveBeenCalledWith('shot');
    await waitFor(() => expect(bridge.release).toHaveBeenCalledWith('shot'));
  });

  it.each(['canceled', 'permission-denied'] as const)(
    '%s 不创建附件或重复报错',
    async (code) => {
      vi.mocked(bridge.interactive!).mockResolvedValue({
        success: false,
        code,
      });
      mount();
      listener.canHandle();
      listener.run('screenshot');
      await act(async () => {});
      expect(onFiles).not.toHaveBeenCalled();
      expect(errorMessage).not.toHaveBeenCalled();
      expect(bridge.release).not.toHaveBeenCalled();
    },
  );

  it('A 切 B 再切回 A，迟到截图仍不回填，保留复制结果并释放句柄', async () => {
    const pending = deferred<CaptureResult>();
    vi.mocked(bridge.interactive!).mockReturnValue(pending.promise);
    const { rerender } = mount();
    listener.canHandle();
    listener.run('screenshot');
    rerender({ scope: 'chat:B', disabled: false });
    rerender({ scope: 'chat:A', disabled: false });
    pending.resolve(success);
    await waitFor(() => expect(bridge.release).toHaveBeenCalledWith('shot'));
    expect(bridge.copy).toHaveBeenCalledWith('shot');
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('认领后、正式执行前切换会话，不启动截图', async () => {
    const { rerender } = mount();
    expect(listener.canHandle()).toBe(true);
    rerender({ scope: 'chat:B', disabled: false });
    listener.run('screenshot');
    await act(async () => {});
    expect(bridge.interactive).not.toHaveBeenCalled();
  });

  it('读块期间失去编辑权限后恢复，也不回填迟到结果', async () => {
    const pending = deferred<ArrayBuffer>();
    vi.mocked(bridge.readChunk).mockReturnValue(pending.promise);
    const { rerender } = mount();
    listener.canHandle();
    listener.run('screenshot');
    await waitFor(() => expect(bridge.readChunk).toHaveBeenCalled());
    rerender({ scope: 'chat:A', disabled: true });
    rerender({ scope: 'chat:A', disabled: false });
    pending.resolve(new ArrayBuffer(4));
    await waitFor(() => expect(bridge.release).toHaveBeenCalledWith('shot'));
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('卸载退订；截图仍能复制，但迟到结果不会触发上传', async () => {
    const pending = deferred<CaptureResult>();
    vi.mocked(bridge.interactive!).mockReturnValue(pending.promise);
    const { unmount } = mount();
    listener.canHandle();
    listener.run('screenshot');
    unmount();
    pending.resolve(success);
    await waitFor(() => expect(bridge.release).toHaveBeenCalledWith('shot'));
    expect(off).toHaveBeenCalledOnce();
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('读块不完整时提示失败并释放，不生成损坏附件', async () => {
    vi.mocked(bridge.readChunk).mockResolvedValue(new ArrayBuffer(3));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mount();
    listener.canHandle();
    listener.run('screenshot');
    await waitFor(() => expect(bridge.release).toHaveBeenCalledWith('shot'));
    expect(onFiles).not.toHaveBeenCalled();
    expect(errorMessage).toHaveBeenCalledOnce();
  });

  it('复制失败仍可带入有效截图；无桥的普通浏览器不订阅', async () => {
    vi.mocked(bridge.copy!).mockRejectedValue(new Error('clipboard busy'));
    const { unmount } = mount();
    listener.canHandle();
    listener.run('screenshot');
    await waitFor(() => expect(onFiles).toHaveBeenCalledOnce());
    unmount();
    delete window.NuwaClawBridge;
    mount();
    expect(bridge.onShortcut).toHaveBeenCalledOnce();
  });
});
