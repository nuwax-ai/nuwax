import {
  appendSmoothedWaveLevel,
  computeFrameRms,
  createEmptyWaveLevels,
  normalizeWaveLevel,
  smoothWaveLevel,
} from '@/components/business-component/VoiceInput/utils/waveLevels';
import { describe, expect, it } from 'vitest';

describe('computeFrameRms', () => {
  it('空帧返回 0', () => {
    expect(computeFrameRms(new Float32Array(0))).toBe(0);
  });

  it('计算 PCM 帧的 RMS', () => {
    expect(computeFrameRms(new Float32Array([0.5, -0.5]))).toBeCloseTo(0.5, 6);
    expect(computeFrameRms(new Float32Array([1, 1, 1]))).toBeCloseTo(1, 6);
  });
});

describe('normalizeWaveLevel（dB 感知映射）', () => {
  it('静音与非正值贴最低高度', () => {
    expect(normalizeWaveLevel(0)).toBeCloseTo(0.1, 6);
    // -60dB，低于 -50dB 噪声地板
    expect(normalizeWaveLevel(0.001)).toBeCloseTo(0.1, 6);
  });

  it('正常说话音量映射到中段（区分度明显）', () => {
    // rms 0.02 ≈ -34dB -> (50-34)/38 ≈ 0.42
    expect(normalizeWaveLevel(0.02)).toBeGreaterThan(0.35);
    expect(normalizeWaveLevel(0.02)).toBeLessThan(0.5);
    // rms 0.1 ≈ -20dB -> ≈ 0.79
    expect(normalizeWaveLevel(0.1)).toBeGreaterThan(0.7);
  });

  it('大声（≥ -12dB）封顶为 1', () => {
    expect(normalizeWaveLevel(0.3)).toBe(1);
    expect(normalizeWaveLevel(1)).toBe(1);
  });

  it('随音量单调递增', () => {
    const levels = [0.005, 0.01, 0.03, 0.08, 0.2].map(normalizeWaveLevel);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i]).toBeGreaterThan(levels[i - 1]);
    }
  });
});

describe('smoothWaveLevel（非对称平滑）', () => {
  it('上行快：一步覆盖大部分差值', () => {
    const rose = smoothWaveLevel(0.1, 1);
    expect(rose).toBeGreaterThan(0.8);
  });

  it('下行慢：一步只回落部分差值', () => {
    const fell = smoothWaveLevel(1, 0.1);
    expect(fell).toBeGreaterThan(0.5);
    expect(fell).toBeLessThan(1);
  });

  it('上行速度大于下行速度', () => {
    const riseDelta = smoothWaveLevel(0.1, 1) - 0.1;
    const fallDelta = 1 - smoothWaveLevel(1, 0.1);
    expect(riseDelta).toBeGreaterThan(fallDelta);
  });
});

describe('appendSmoothedWaveLevel（右进左滚的时间线）', () => {
  it('首格无历史时直接落点、不平滑', () => {
    expect(appendSmoothedWaveLevel([], 0.8, 4)).toEqual([0.8]);
  });

  it('未达可见上限时向右端追加、长度增长', () => {
    const next = appendSmoothedWaveLevel([0.5], 0.5, 4);
    expect(next).toEqual([0.5, 0.5]);
  });

  it('追加时对相邻格做平滑（上行覆盖大部分差值）', () => {
    const [, second] = appendSmoothedWaveLevel([0.1], 1, 4);
    expect(second).toBeGreaterThan(0.8);
    expect(second).toBeLessThan(1);
  });

  it('超过可见上限时左端最旧的滚出，长度不再增长', () => {
    const full = [0.2, 0.2, 0.2, 0.2];
    const next = appendSmoothedWaveLevel(full, 0.2, 4);
    expect(next.length).toBe(4);
    // 全 0.2 平滑后仍为 0.2，且原首格已滚出
    expect(next).toEqual([0.2, 0.2, 0.2, 0.2]);
  });

  it('不修改入参数组（纯函数）', () => {
    const input = [0.3];
    appendSmoothedWaveLevel(input, 0.9, 4);
    expect(input).toEqual([0.3]);
  });
});

describe('createEmptyWaveLevels', () => {
  it('初始时间线为空（开录后从右端逐格生长）', () => {
    expect(createEmptyWaveLevels()).toEqual([]);
  });
});
