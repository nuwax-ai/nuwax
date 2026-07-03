import { useCallback, useEffect, useRef, useState } from 'react';
import { VOICE_INPUT_DEFAULTS } from '../config';
import {
  appendSmoothedWaveLevel,
  createEmptyWaveLevels,
  normalizeWaveLevel,
} from '../utils/waveLevels';
import type { UseAudioRecorder } from './useAudioRecorder';
import { RecorderError } from './useAudioRecorder';

/**
 * 模拟录音 Hook（仅用于演示页预览交互，不访问麦克风）
 *
 * 与 useAudioRecorder 保持相同状态机，便于 VoiceButton 复用同一套 UI。
 */
export const useMockAudioRecorder = (): UseAudioRecorder => {
  const [status, setStatus] = useState<UseAudioRecorder['status']>('idle');
  const [durationSec, setDurationSec] = useState(0);
  const [waveLevels, setWaveLevels] = useState<number[]>(createEmptyWaveLevels);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (waveTimerRef.current) {
      clearInterval(waveTimerRef.current);
      waveTimerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setWaveLevels(createEmptyWaveLevels());
    setStatus('idle');
    setDurationSec(0);
  }, [clearTimer]);

  const start = useCallback(async () => {
    if (status !== 'idle') {
      return;
    }
    startedAtRef.current = Date.now();
    setDurationSec(0);
    setWaveLevels(createEmptyWaveLevels());
    setStatus('recording');
    clearTimer();
    timerRef.current = setInterval(() => {
      setDurationSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);

    // 演示态：用伪随机音量驱动波形时间线，便于预览动效。
    // 伪 RMS 覆盖 ~0.004-0.15（约 -48dB~-16dB），配合 dB 感知映射呈现明显高低起伏
    waveTimerRef.current = setInterval(() => {
      const t = Date.now() / 180;
      const pseudoRms =
        0.004 + Math.abs(Math.sin(t)) * 0.1 + Math.random() * 0.05;
      setWaveLevels((prev) =>
        appendSmoothedWaveLevel(prev, normalizeWaveLevel(pseudoRms)),
      );
    }, VOICE_INPUT_DEFAULTS.waveShiftIntervalMs);
  }, [status, clearTimer]);

  const stop = useCallback(async (): Promise<Blob> => {
    if (status !== 'recording') {
      throw new RecorderError('unknown', 'recorder is not recording');
    }

    setStatus('stopping');
    clearTimer();

    const duration = (Date.now() - startedAtRef.current) / 1000;
    setStatus('idle');
    setDurationSec(0);
    setWaveLevels(createEmptyWaveLevels());

    if (duration < VOICE_INPUT_DEFAULTS.minDurationSec) {
      throw new RecorderError('too-short');
    }

    return new Blob(['mock-audio'], { type: 'audio/wav' });
  }, [status, clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return { status, durationSec, waveLevels, start, stop, reset };
};

/** 模拟 STT 转写延迟（毫秒） */
export const MOCK_STT_DELAY_MS = 800;
