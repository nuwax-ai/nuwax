/**
 * 语音输入模块对外入口
 *
 * 业务侧（聊天输入框底栏）通过 ChatInputVoiceFooter 套件接入：
 * - Provider：管理录音/转写态与「回填 / 自动发送」回调
 * - HideWhenActive：录音时隐藏 @、模型选择等底栏项
 * - Expand：录音波形与计时占满底栏中间区域
 * - Right：麦克风入口与语音停止/发送按钮（内部判断 ENABLE_VOICE_INPUT，
 *   关闭开关即整体下线，业务文件无需回改）
 */
import { ChatInputVoiceFooter } from './chatInputFooter';
import VoiceRecordingBar from './components/RecordingBar';
import type { VoiceInputControl, VoiceSubmitMode } from './types';

export { mergeVoiceTranscript } from './chatInputFooter/Provider';
export { ChatInputVoiceFooter, VoiceRecordingBar };
export type { VoiceInputControl, VoiceSubmitMode };
