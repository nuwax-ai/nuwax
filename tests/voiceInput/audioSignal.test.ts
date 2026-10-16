import { downsamplePcm } from '@/components/business-component/VoiceInput/utils/resample';
import { encodeWav } from '@/components/business-component/VoiceInput/utils/wavEncoder';
import {
  appendSmoothedWaveLevel,
  computeFrameRms,
  createEmptyWaveLevels,
  normalizeWaveLevel,
  smoothWaveLevel,
} from '@/components/business-component/VoiceInput/utils/waveLevels';
import { describe, expect, it } from 'vitest';

describe('downsamplePcm', () => {
  it('48kHz -> 16kHz 输出长度约为 1/3', () => {
    const input = new Float32Array(48000); // 1 秒
    const out = downsamplePcm(input, 48000, 16000);
    expect(out.length).toBe(16000);
  });

  it('常数信号下采样后保持常数（区间均值不改变直流分量）', () => {
    const input = new Float32Array(4800).fill(0.5);
    const out = downsamplePcm(input, 48000, 16000);
    expect(out.length).toBe(1600);
    for (const v of out) {
      expect(v).toBeCloseTo(0.5, 6);
    }
  });

  it('整数倍抽取取区间均值', () => {
    // 48k->16k 比例为 3：每 3 个样本合成 1 个均值
    const input = new Float32Array([0, 0.3, 0.6, 0.9, 0.9, 0.9]);
    const out = downsamplePcm(input, 48000, 16000);
    expect(out.length).toBe(2);
    expect(out[0]).toBeCloseTo((0 + 0.3 + 0.6) / 3, 6);
    expect(out[1]).toBeCloseTo(0.9, 6);
  });

  it('非整数比率（44.1kHz -> 16kHz）输出长度按比例取整', () => {
    const input = new Float32Array(44100); // 1 秒
    const out = downsamplePcm(input, 44100, 16000);
    expect(out.length).toBe(16000);
  });

  it('目标采样率不低于源采样率时原样返回', () => {
    const input = new Float32Array([0.1, 0.2, 0.3]);
    expect(downsamplePcm(input, 16000, 16000)).toBe(input);
    expect(downsamplePcm(input, 16000, 48000)).toBe(input);
  });

  it('空输入与非法采样率原样返回', () => {
    const empty = new Float32Array(0);
    expect(downsamplePcm(empty, 48000, 16000)).toBe(empty);
    const input = new Float32Array([0.1]);
    expect(downsamplePcm(input, NaN, 16000)).toBe(input);
    expect(downsamplePcm(input, 48000, 0)).toBe(input);
  });
});

const readStr = (view: DataView, offset: number, len: number): string => {
  let s = '';
  for (let i = 0; i < len; i += 1) {
    s += String.fromCharCode(view.getUint8(offset + i));
  }
  return s;
};

describe('encodeWav', () => {
  it('写出正确的 RIFF/WAVE 头与文件长度', () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const sampleRate = 16000;
    const buf = encodeWav(samples, sampleRate);
    const view = new DataView(buf);

    // 总长度 = 44 头 + samples * 2 字节
    expect(buf.byteLength).toBe(44 + samples.length * 2);

    expect(readStr(view, 0, 4)).toBe('RIFF');
    expect(readStr(view, 8, 4)).toBe('WAVE');
    expect(readStr(view, 12, 4)).toBe('fmt ');
    expect(readStr(view, 36, 4)).toBe('data');

    expect(view.getUint32(4, true)).toBe(36 + samples.length * 2); // 文件大小 - 8
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // 单声道
    expect(view.getUint32(24, true)).toBe(sampleRate);
    expect(view.getUint32(28, true)).toBe(sampleRate * 1 * 2); // byte rate
    expect(view.getUint16(32, true)).toBe(2); // block align
    expect(view.getUint16(34, true)).toBe(16); // 每采样 16 bit
    expect(view.getUint32(40, true)).toBe(samples.length * 2); // data size
  });

  it('将 [-1,1] 浮点正确量化为 int16', () => {
    const samples = new Float32Array([1, -1, 0]);
    const view = new DataView(encodeWav(samples, 16000));

    expect(view.getInt16(44, true)).toBe(0x7fff); // 1.0 -> 32767
    expect(view.getInt16(46, true)).toBe(-0x8000); // -1.0 -> -32768
    expect(view.getInt16(48, true)).toBe(0); // 0
  });

  it('对越界浮点做 clamp', () => {
    const samples = new Float32Array([5, -5]);
    const view = new DataView(encodeWav(samples, 16000));

    expect(view.getInt16(44, true)).toBe(0x7fff);
    expect(view.getInt16(46, true)).toBe(-0x8000);
  });

  it('支持空采样（仅输出 44 字节头）', () => {
    const buf = encodeWav(new Float32Array(0), 16000);
    expect(buf.byteLength).toBe(44);
  });
});

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
