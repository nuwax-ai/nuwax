import { VOICE_INPUT_DEFAULTS } from '../config';

/** 波形条最低可视高度比例（0~1） */
const MIN_LEVEL = 0.1;

/**
 * 由 PCM 帧计算 RMS 音量
 */
export const computeFrameRms = (frame: Float32Array): number => {
  if (!frame.length) {
    return 0;
  }
  let sum = 0;
  for (let i = 0; i < frame.length; i++) {
    const sample = frame[i];
    sum += sample * sample;
  }
  return Math.sqrt(sum / frame.length);
};

/**
 * 将 RMS 映射为波形条高度比例（0~1）
 * 人声 RMS 通常较小，适当增益后更易分辨
 */
export const normalizeWaveLevel = (rms: number): number => {
  const boosted = rms * 5;
  return Math.min(1, Math.max(MIN_LEVEL, boosted));
};

/** 初始化波形条高度数组 */
export const createEmptyWaveLevels = (
  count = VOICE_INPUT_DEFAULTS.waveBarCount,
): number[] => Array.from({ length: count }, () => MIN_LEVEL);

/** 新音量样本入队：左侧滑出、右侧进入 */
export const shiftWaveLevels = (
  levels: number[],
  nextLevel: number,
): number[] => [...levels.slice(1), nextLevel];
