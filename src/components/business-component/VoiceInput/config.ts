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
  /** 最大录音时长（秒），到达后自动停止并识别 */
  maxDurationSec: 600,
  /** 最小有效录音时长（秒），低于此值视为误触 */
  minDurationSec: 0.5,
  /** 识别语言（透传给后端 STT，预留） */
  language: 'zh-CN',
  /** STT 接口超时（毫秒） */
  sttTimeoutMs: 30000,
  /** 上传文件大小硬上限（字节），与后端 10MB 约束对齐 */
  maxFileSizeBytes: 10 * 1024 * 1024,
} as const;
