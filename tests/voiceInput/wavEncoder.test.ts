import { encodeWav } from '@/components/business-component/VoiceInput/utils/wavEncoder';
import { describe, expect, it } from 'vitest';

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
