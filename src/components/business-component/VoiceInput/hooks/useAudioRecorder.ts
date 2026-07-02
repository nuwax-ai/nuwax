import { useCallback, useEffect, useRef, useState } from 'react';
import { VOICE_INPUT_DEFAULTS } from '../config';
import { loadRecorderWorklet } from '../loaders/recorderWorklet';
import { encodeWav } from '../utils/wavEncoder';
import {
  computeFrameRms,
  createEmptyWaveLevels,
  normalizeWaveLevel,
  shiftWaveLevels,
} from '../utils/waveLevels';

export type RecorderStatus = 'idle' | 'recording' | 'stopping';

export interface UseAudioRecorder {
  /** 当前状态 */
  status: RecorderStatus;
  /** 已录音时长（秒，整数） */
  durationSec: number;
  /** 实时波形条高度（0~1） */
  waveLevels: number[];
  /** 开始录音（申请权限 + 启动 AudioContext + Worklet） */
  start: () => Promise<void>;
  /** 停止录音并返回 WAV Blob；时长过短抛 RecorderError('too-short') */
  stop: () => Promise<Blob>;
  /** 重置到 idle，释放资源 */
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
 * 通路：getUserMedia -> AudioContext(指定采样率) -> AudioWorklet(recorder-processor)
 *      -> 主线程累加 Float32 帧 -> 停止时合并并 encodeWav -> WAV Blob
 *
 * 采用 AudioWorklet 而非 MediaRecorder，是为了在 Safari 上也能得到
 * 后端可识别的 WAV（Safari 的 MediaRecorder 只产 mp4，后端格式支持不确定）。
 */
export const useAudioRecorder = (): UseAudioRecorder => {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [durationSec, setDurationSec] = useState(0);
  const [waveLevels, setWaveLevels] = useState<number[]>(createEmptyWaveLevels);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const waveLevelsRef = useRef<number[]>(createEmptyWaveLevels());
  const pendingRmsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
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

  /** 释放底层资源 */
  const teardown = useCallback(() => {
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        void audioCtxRef.current.close();
      } catch {
        /* noop */
      }
      audioCtxRef.current = null;
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

    // 1. 申请麦克风权限
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: VOICE_INPUT_DEFAULTS.channelCount,
          sampleRate: VOICE_INPUT_DEFAULTS.sampleRate,
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

    // 2. 创建 AudioContext（兼容 webkit 前缀）
    const AudioCtxCtor: typeof AudioContext | undefined =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxCtor) {
      stream.getTracks().forEach((track) => track.stop());
      throw new RecorderError('not-supported');
    }

    const ctx: AudioContext = new AudioCtxCtor({
      sampleRate: VOICE_INPUT_DEFAULTS.sampleRate,
    });
    sampleRateRef.current = ctx.sampleRate; // 浏览器实际可能调整采样率
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        /* noop */
      }
    }

    // 3. 加载 worklet
    try {
      await loadRecorderWorklet(ctx);
    } catch (e) {
      stream.getTracks().forEach((track) => track.stop());
      try {
        void ctx.close();
      } catch {
        /* noop */
      }
      throw new RecorderError('not-supported', (e as Error)?.message);
    }

    // 4. 建链：source -> recorder-processor -> muteGain -> destination
    //    连到 destination 是为了驱动 worklet 拉取样本；通过静音 GainNode 避免把麦克风声音外放
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

    streamRef.current = stream;
    audioCtxRef.current = ctx;
    sourceRef.current = source;
    nodeRef.current = node;
    startedAtRef.current = Date.now();

    setDurationSec(0);
    setStatus('recording');

    // 5. 计时
    clearTimer();
    timerRef.current = setInterval(() => {
      setDurationSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
  }, [status, clearTimer]);

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

    teardown();
    chunksRef.current = [];

    setStatus('idle');
    setDurationSec(0);

    // 时长过短或无数据视为误触
    if (duration < VOICE_INPUT_DEFAULTS.minDurationSec || totalLength === 0) {
      throw new RecorderError('too-short');
    }

    const wavBuffer = encodeWav(merged, sampleRateRef.current);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }, [status, clearTimer, teardown]);

  const reset = useCallback(() => {
    teardown();
    chunksRef.current = [];
    pendingRmsRef.current = [];
    waveLevelsRef.current = createEmptyWaveLevels();
    setWaveLevels(createEmptyWaveLevels());
    setStatus('idle');
    setDurationSec(0);
  }, [teardown]);

  // 录音中：按帧累积 RMS，rAF 刷新波形（与真实音量同步）
  useEffect(() => {
    if (status !== 'recording') {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = () => {
      const pending = pendingRmsRef.current;
      if (pending.length > 0) {
        const avgRms =
          pending.reduce((sum, value) => sum + value, 0) / pending.length;
        pendingRmsRef.current = [];
        waveLevelsRef.current = shiftWaveLevels(
          waveLevelsRef.current,
          normalizeWaveLevel(avgRms),
        );
        setWaveLevels([...waveLevelsRef.current]);
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

  // 组件卸载时释放
  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  return { status, durationSec, waveLevels, start, stop, reset };
};
