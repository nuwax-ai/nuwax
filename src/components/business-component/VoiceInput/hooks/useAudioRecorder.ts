import { useCallback, useEffect, useRef, useState } from 'react';
import { VOICE_INPUT_DEFAULTS } from '../config';
import { ensureWorkletReady } from '../loaders/recorderContext';
import { downsamplePcm } from '../utils/resample';
import { encodeWav } from '../utils/wavEncoder';
import {
  appendSmoothedWaveLevel,
  computeFrameRms,
  createEmptyWaveLevels,
  normalizeWaveLevel,
} from '../utils/waveLevels';

export type RecorderStatus = 'idle' | 'connecting' | 'recording' | 'stopping';

export interface UseAudioRecorder {
  /** 当前状态 */
  status: RecorderStatus;
  /** 已录音时长（秒，整数） */
  durationSec: number;
  /** 实时波形条高度（0~1） */
  waveLevels: number[];
  /** 开始录音（连接中 → 申请权限 + 复用单例 AudioContext/Worklet → 录音） */
  start: () => Promise<void>;
  /** 停止录音并返回 WAV Blob；时长过短抛 RecorderError('too-short') */
  stop: () => Promise<Blob>;
  /** 重置到 idle，释放本次录音资源（不断开共享 ctx） */
  reset: () => void;
}

/** 录音错误类型，便于 UI 层映射国际化文案 */
export class RecorderError extends Error {
  kind:
    | 'permission-denied'
    | 'not-supported'
    | 'too-short'
    | 'aborted'
    | 'unknown';

  constructor(kind: RecorderError['kind'], message?: string) {
    super(message || kind);
    this.name = 'RecorderError';
    this.kind = kind;
  }
}

/**
 * 麦克风录音 Hook
 *
 * 通路：getUserMedia -> 共享 AudioContext(指定采样率) -> AudioWorklet(recorder-processor)
 *      -> 主线程累加 Float32 帧 -> 停止时合并并 encodeWav -> WAV Blob
 *
 * 性能：AudioContext 与 worklet 模块走 loaders/recorderContext 的会话级单例，
 * 跨录音复用，避免每次点击都重建 ctx 与重新 fetch/compile worklet（这是点击->录音
 * 延迟的最大块）。麦克风仍按需采集，停止即释放。
 *
 * 采用 AudioWorklet 而非 MediaRecorder，是为了在 Safari 上也能得到后端可识别的 WAV。
 */
export const useAudioRecorder = (): UseAudioRecorder => {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [durationSec, setDurationSec] = useState(0);
  const [waveLevels, setWaveLevels] = useState<number[]>(createEmptyWaveLevels);

  const waveLevelsRef = useRef<number[]>(createEmptyWaveLevels());
  const pendingRmsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastShiftAtRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const muteGainRef = useRef<GainNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef<number>(VOICE_INPUT_DEFAULTS.sampleRate);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * 释放本次录音的资源：断开节点、停麦克风。
   * 不关闭共享 AudioContext、不清 worklet 缓存——它们由单例跨录音复用。
   */
  const releaseRecordingResources = useCallback(() => {
    clearTimer();
    if (nodeRef.current) {
      try {
        nodeRef.current.port.onmessage = null;
        nodeRef.current.disconnect();
      } catch {
        /* noop */
      }
      nodeRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        /* noop */
      }
      sourceRef.current = null;
    }
    if (muteGainRef.current) {
      try {
        muteGainRef.current.disconnect();
      } catch {
        /* noop */
      }
      muteGainRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [clearTimer]);

  const start = useCallback(async () => {
    if (status !== 'idle') {
      return;
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      throw new RecorderError('not-supported');
    }

    // 入口即给“连接中”反馈，避免点击后 1-2s 看似无响应
    setStatus('connecting');

    try {
      // 1. AudioContext/Worklet 就绪与麦克风申请并行：预热未命中（如页面刚加载
      //    即点击）时两段耗时不再叠加，最大限度缩短“点击 -> 开录”的丢字窗口
      const ctxPromise = ensureWorkletReady();
      // 预挂 handler：若下方 getUserMedia 先失败抛出，此 promise 不产生 unhandledrejection
      ctxPromise.catch(() => {});

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: VOICE_INPUT_DEFAULTS.channelCount,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
      } catch (e) {
        const name = (e as DOMException)?.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          throw new RecorderError('permission-denied');
        }
        if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          throw new RecorderError('not-supported');
        }
        if (name === 'AbortError') {
          throw new RecorderError('aborted');
        }
        throw new RecorderError('unknown', (e as Error)?.message);
      }
      streamRef.current = stream;

      // 2. 等待共享 AudioContext + worklet 就绪（通常已被预热，近乎瞬时）
      let ctx: AudioContext;
      try {
        ctx = await ctxPromise;
      } catch (e) {
        throw new RecorderError(
          'not-supported',
          e instanceof Error ? e.message : undefined,
        );
      }
      sampleRateRef.current = ctx.sampleRate; // 浏览器实际可能调整采样率

      // 3. 建链：source -> recorder-processor -> muteGain -> destination
      //    连到 destination 以驱动 worklet 拉取样本；静音 GainNode 避免把麦克风外放
      const source = ctx.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(ctx, 'recorder-processor');
      const muteGain = ctx.createGain();
      muteGain.gain.value = 0;

      chunksRef.current = [];
      pendingRmsRef.current = [];
      waveLevelsRef.current = createEmptyWaveLevels();
      setWaveLevels(createEmptyWaveLevels());
      node.port.onmessage = (event: MessageEvent) => {
        const frame = event.data as Float32Array | undefined;
        if (frame && frame.length) {
          chunksRef.current.push(frame);
          pendingRmsRef.current.push(computeFrameRms(frame));
        }
      };

      source.connect(node);
      node.connect(muteGain);
      muteGain.connect(ctx.destination);

      sourceRef.current = source;
      nodeRef.current = node;
      muteGainRef.current = muteGain;
      startedAtRef.current = Date.now();

      setDurationSec(0);
      setStatus('recording');

      // 4. 计时
      clearTimer();
      timerRef.current = setInterval(() => {
        setDurationSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 1000);
    } catch (e) {
      // 任何失败都回退到 idle，并释放本次部分资源（共享 ctx 保留）
      releaseRecordingResources();
      setStatus('idle');
      throw e;
    }
  }, [status, clearTimer, releaseRecordingResources]);

  const stop = useCallback(async (): Promise<Blob> => {
    if (status !== 'recording') {
      throw new RecorderError('unknown', 'recorder is not recording');
    }

    setStatus('stopping');
    clearTimer();

    const duration = (Date.now() - startedAtRef.current) / 1000;

    // 合并所有帧
    const chunks = chunksRef.current;
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }

    releaseRecordingResources();
    chunksRef.current = [];

    setStatus('idle');
    setDurationSec(0);

    // 时长过短或无数据视为误触
    if (duration < VOICE_INPUT_DEFAULTS.minDurationSec || totalLength === 0) {
      throw new RecorderError('too-short');
    }

    // 共享 ctx 可能回退到设备默认采样率（如 48kHz）：统一下采样到目标采样率，
    // 保证上传体积与 16kHz 预期一致（maxDurationSec 的 10MB 预算按 16kHz 计算）
    const targetRate = VOICE_INPUT_DEFAULTS.sampleRate;
    const actualRate = sampleRateRef.current;
    const pcm =
      actualRate > targetRate
        ? downsamplePcm(merged, actualRate, targetRate)
        : merged;
    const wavBuffer = encodeWav(pcm, Math.min(actualRate, targetRate));
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }, [status, clearTimer, releaseRecordingResources]);

  const reset = useCallback(() => {
    releaseRecordingResources();
    chunksRef.current = [];
    pendingRmsRef.current = [];
    waveLevelsRef.current = createEmptyWaveLevels();
    setWaveLevels(createEmptyWaveLevels());
    setStatus('idle');
    setDurationSec(0);
  }, [releaseRecordingResources]);

  // 录音中：按帧累积 RMS，按固定节奏向时间线右端追加一格音量；
  // 挤满可见长度后最旧的从左端滚出（从右到左的时间线滚动）。
  // 固定间隔（而非每帧刷新）让滚动节奏肉眼可辨，同时把重渲染频率降到 ~12次/秒
  useEffect(() => {
    if (status !== 'recording') {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    lastShiftAtRef.current = 0;
    const tick = () => {
      const now = Date.now();
      if (
        now - lastShiftAtRef.current >=
        VOICE_INPUT_DEFAULTS.waveShiftIntervalMs
      ) {
        const pending = pendingRmsRef.current;
        if (pending.length > 0) {
          // 间隔内所有帧的平均 RMS 作为这一格的真实音量
          const avgRms =
            pending.reduce((sum, value) => sum + value, 0) / pending.length;
          pendingRmsRef.current = [];
          waveLevelsRef.current = appendSmoothedWaveLevel(
            waveLevelsRef.current,
            normalizeWaveLevel(avgRms),
          );
          setWaveLevels(waveLevelsRef.current);
          lastShiftAtRef.current = now;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [status]);

  // 组件卸载：仅释放活动录音资源（共享 ctx 保留给会话复用）
  useEffect(() => {
    return () => {
      releaseRecordingResources();
    };
  }, [releaseRecordingResources]);

  return { status, durationSec, waveLevels, start, stop, reset };
};
