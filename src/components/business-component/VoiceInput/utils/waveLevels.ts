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

/** 噪声地板（dB）：低于视为安静，贴最低高度 */
const NOISE_FLOOR_DB = -50;
/** 响度上限（dB）：达到即满高（AGC 开启后大声说话可触及） */
const CEIL_DB = -12;

/**
 * 将 RMS 映射为波形条高度比例（0~1）
 *
 * 人声经 AGC 后 RMS 多在 0.02~0.2，线性映射会全部挤在低段、看不出起伏；
 * 改按 dB（对数）做感知映射：安静贴地、正常说话过半、大声近满，
 * 与人耳的响度感知一致，波形高低差异明显。
 */
export const normalizeWaveLevel = (rms: number): number => {
  if (rms <= 0) {
    return MIN_LEVEL;
  }
  const db = 20 * Math.log10(rms);
  const ratio = (db - NOISE_FLOOR_DB) / (CEIL_DB - NOISE_FLOOR_DB);
  return Math.min(1, Math.max(MIN_LEVEL, ratio));
};

/** 平滑系数：起音快（新峰值立刻反映）、衰减慢（词尾不瞬间塌回） */
const ATTACK = 0.85;
const RELEASE = 0.4;

/**
 * 相邻两格音量的非对称平滑：上行快、下行慢，更接近语音包络的自然形态
 */
export const smoothWaveLevel = (prev: number, next: number): number =>
  prev + (next - prev) * (next > prev ? ATTACK : RELEASE);

/**
 * 初始波形时间线：为空。
 * 录音开始后波形条随时间从右端逐格生长（安静为最低 stub，说话为高条），
 * 达到最大可见条数后最旧的从左端滚出——即“从右到左按时间线滚动”。
 */
export const createEmptyWaveLevels = (): number[] => [];

/**
 * 时间线右端追加一格平滑后的音量：
 * - 首格无历史时直接落点（不平滑）
 * - 超过最大可见条数时裁掉左端最旧的
 */
export const appendSmoothedWaveLevel = (
  levels: number[],
  nextLevel: number,
  maxCount: number = VOICE_INPUT_DEFAULTS.waveBarCount,
): number[] => {
  const prev = levels.length > 0 ? levels[levels.length - 1] : nextLevel;
  const appended = [...levels, smoothWaveLevel(prev, nextLevel)];
  return appended.length > maxCount
    ? appended.slice(appended.length - maxCount)
    : appended;
};
