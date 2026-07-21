import { downsamplePcm } from '@/components/business-component/VoiceInput/utils/resample';
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
