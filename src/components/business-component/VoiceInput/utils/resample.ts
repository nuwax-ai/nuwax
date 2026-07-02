/**
 * PCM 下采样（区间均值法，单声道）
 *
 * 共享 AudioContext 在不支持指定采样率的环境会回退到设备默认（常见 44.1/48kHz），
 * 上传前统一降到目标采样率，把体积压回 16kHz 预期（48kHz 时约缩为 1/3），
 * 避免触碰后端 STT 的 10MB 上限。
 * 区间均值等价于“盒式低通 + 抽取”，对语音识别精度足够；纯函数便于 vitest 单测。
 */
export function downsamplePcm(
  samples: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (
    !Number.isFinite(fromRate) ||
    !Number.isFinite(toRate) ||
    toRate <= 0 ||
    toRate >= fromRate ||
    samples.length === 0
  ) {
    return samples;
  }

  const ratio = fromRate / toRate;
  const outLength = Math.max(1, Math.floor(samples.length / ratio));
  const out = new Float32Array(outLength);

  for (let i = 0; i < outLength; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(
      Math.max(start + 1, Math.floor((i + 1) * ratio)),
      samples.length,
    );
    let sum = 0;
    for (let j = start; j < end; j += 1) {
      sum += samples[j];
    }
    out[i] = sum / (end - start);
  }

  return out;
}
