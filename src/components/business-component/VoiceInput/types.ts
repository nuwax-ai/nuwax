/**
 * 语音转写完成后的提交模式
 * - fill：仅回填到输入框，由用户确认后再发送
 * - send：转写完成后直接走发送链路
 */
export type VoiceSubmitMode = 'fill' | 'send';

/**
 * 语音控件对外暴露的运行时状态（供会话框复用停止/发送按钮）
 */
export interface VoiceInputControl {
  /** recording=录音中；transcribing=转写中 */
  phase: 'recording' | 'transcribing';
  /** 录音已进行秒数（转写中为 0） */
  durationSec: number;
  /** 实时波形条高度（0~1，仅 recording 阶段有效） */
  waveLevels: number[];
  /** 结束录音并按模式提交（仅 recording 阶段可调用） */
  submit: (mode: VoiceSubmitMode) => void;
}
