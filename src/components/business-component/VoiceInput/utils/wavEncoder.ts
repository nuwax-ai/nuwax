/**
 * PCM Float32 -> 16-bit PCM WAV 编码（单声道）
 *
 * 纯函数，无任何副作用与运行环境依赖，便于在 vitest 中单测。
 * WAV 文件由 44 字节 RIFF/WAVE 头 + 原始 PCM 数据组成，
 * 后端 /api/audio/stt 支持 wav/PCM 格式，且所有浏览器编码一致，确保 Safari 兼容。
 */

const WAV_HEADER_SIZE = 44;
const BYTES_PER_SAMPLE = 2; // 16-bit PCM

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i += 1) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * 将 Float32 采样（范围 [-1, 1]）编码为单声道 16-bit PCM WAV。
 * @param samples    PCM 浮点采样数据
 * @param sampleRate 采样率（需与采集时 AudioContext.sampleRate 一致）
 * @returns          包含完整 WAV 文件的 ArrayBuffer
 */
export function encodeWav(
  samples: Float32Array,
  sampleRate: number,
): ArrayBuffer {
  const numChannels = 1;
  const blockAlign = numChannels * BYTES_PER_SAMPLE;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * BYTES_PER_SAMPLE;
  const bufferLength = WAV_HEADER_SIZE + dataSize;

  const buffer = new ArrayBuffer(bufferLength);
  const view = new DataView(buffer);

  // —— RIFF chunk descriptor ——
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // 文件大小 - 8
  writeString(view, 8, 'WAVE');

  // —— fmt sub-chunk ——
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM 子块大小
  view.setUint16(20, 1, true); // audio format = 1 (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 每采样位数

  // —— data sub-chunk ——
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // —— PCM 采样：Float32 [-1,1] -> Int16 ——
  let offset = WAV_HEADER_SIZE;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    // 有符号 16 位量化
    const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += BYTES_PER_SAMPLE;
  }

  return buffer;
}
