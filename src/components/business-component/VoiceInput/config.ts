/**
 * 语音输入模块默认配置
 *
 * 集中管理可调参数，便于后续按需调整，避免散落到各文件。
 */
export const VOICE_INPUT_DEFAULTS = {
  /** 采样率：16kHz 对中文语音识别足够，且文件体积小（60s≈1.9MB） */
  sampleRate: 16000,
  /** 声道数：单声道即可满足语音识别 */
  channelCount: 1,
  /**
   * 最大录音时长（秒），到达后自动停止并识别。
   * 300s × 16kHz × 16bit ≈ 9.6MB，须保持在 maxFileSizeBytes(10MB) 以内
   */
  maxDurationSec: 300,
  /** 最小有效录音时长（秒），低于此值视为误触 */
  minDurationSec: 0.5,
  /** STT 接口超时（毫秒） */
  sttTimeoutMs: 30000,
  /** 上传文件大小硬上限（字节），与后端 10MB 约束对齐 */
  maxFileSizeBytes: 10 * 1024 * 1024,
  /**
   * 波形时间线保留的最大历史条数（数据层上限，约 41s）。
   * 实际可见条数由展示层按容器宽度自适应裁切，此值只需大于任何屏宽的可见条数
   */
  waveBarCount: 512,
  /** 波形推进间隔（毫秒）：每步新音量从右端进入时间线 */
  waveShiftIntervalMs: 80,
} as const;

/** 演示模式默认模拟转写文案 */
export const VOICE_INPUT_MOCK_TRANSCRIPT =
  '这是模拟识别的语音内容，用于预览回填与自动发送交互。';
