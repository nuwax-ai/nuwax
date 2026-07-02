import { useCallback, useEffect, useRef, useState } from 'react';
import { VOICE_INPUT_DEFAULTS } from '../config';
import {
  createEmptyWaveLevels,
  normalizeWaveLevel,
  shiftWaveLevels,
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

    // 演示态：用伪随机音量驱动波形，便于预览动效
    waveTimerRef.current = setInterval(() => {
      const t = Date.now() / 180;
      const pseudoRms =
        0.06 + Math.abs(Math.sin(t)) * 0.12 + Math.random() * 0.04;
      setWaveLevels((prev) =>
        shiftWaveLevels(prev, normalizeWaveLevel(pseudoRms)),
      );
    }, 80);
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
