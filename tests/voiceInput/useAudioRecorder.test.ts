import { useAudioRecorder } from '@/components/business-component/VoiceInput/hooks/useAudioRecorder';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const recorderContextMocks = vi.hoisted(() => ({
  ensureWorkletReady: vi.fn(),
}));

vi.mock(
  '@/components/business-component/VoiceInput/loaders/recorderContext',
  () => ({
    ensureWorkletReady: recorderContextMocks.ensureWorkletReady,
  }),
);

describe('useAudioRecorder', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('权限等待期间卸载后会停止迟到的麦克风流', async () => {
    let resolveStream!: (stream: MediaStream) => void;
    const getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>((resolve) => {
          resolveStream = resolve;
        }),
    );
    const stopTrack = vi.fn();
    const stream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    recorderContextMocks.ensureWorkletReady.mockResolvedValue(
      {} as AudioContext,
    );

    const { result, unmount } = renderHook(() => useAudioRecorder());
    let startPromise!: Promise<void>;
    act(() => {
      startPromise = result.current.start();
    });

    expect(getUserMedia).toHaveBeenCalledOnce();
    unmount();

    const rejection = expect(startPromise).rejects.toMatchObject({
      kind: 'aborted',
    });
    resolveStream(stream);
    await rejection;

    expect(stopTrack).toHaveBeenCalled();
  });

  it('PCM 稳定产出前保持连接态且不启动录制计时', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-02T10:00:00Z'));

    const stopTrack = vi.fn();
    const stream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });

    const source = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const gain = {
      gain: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const ctx = {
      sampleRate: 16000,
      destination: {},
      createMediaStreamSource: vi.fn(() => source),
      createGain: vi.fn(() => gain),
    } as unknown as AudioContext;
    recorderContextMocks.ensureWorkletReady.mockResolvedValue(ctx);

    const node = {
      port: {
        onmessage: null as ((event: MessageEvent<Float32Array>) => void) | null,
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    vi.stubGlobal(
      'AudioWorkletNode',
      vi.fn(function AudioWorkletNodeMock() {
        return node;
      }),
    );

    const { result, unmount } = renderHook(() => useAudioRecorder());
    let startPromise!: Promise<void>;
    act(() => {
      startPromise = result.current.start();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    const statusBeforeFirstFrame = result.current.status;
    const durationBeforeFirstFrame = result.current.durationSec;

    act(() => {
      node.port.onmessage?.({
        data: new Float32Array(128),
      } as MessageEvent<Float32Array>);
    });
    await act(async () => {
      await Promise.resolve();
    });
    const statusAfterFirstFrame = result.current.status;

    act(() => {
      node.port.onmessage?.({
        data: new Float32Array(8000),
      } as MessageEvent<Float32Array>);
    });
    await act(async () => {
      await startPromise;
    });

    expect(statusBeforeFirstFrame).toBe('connecting');
    expect(durationBeforeFirstFrame).toBe(0);
    expect(statusAfterFirstFrame).toBe('connecting');
    expect(result.current.status).toBe('recording');
    expect(result.current.durationSec).toBe(0);
    expect(result.current.waveLevels).toHaveLength(1);

    unmount();
  });
});
