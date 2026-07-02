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

describe('useAudioRecorder 异步清理', () => {
  afterEach(() => {
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
});
