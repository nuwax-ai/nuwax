import { ENABLE_VOICE_INPUT } from '@/constants/feature.constants';
import React from 'react';
import { ChatInputVoiceFooter } from './chatInputFooter';
import VoiceButton from './components/Button';
import VoiceRecordingBar from './components/RecordingBar';
import type { VoiceInputControl, VoiceSubmitMode } from './types';

export { ChatInputVoiceFooter, VoiceRecordingBar };
export type { VoiceInputControl, VoiceSubmitMode };

export interface VoiceInputSlotProps {
  /**
   * 转写成功后的回调
   * @param text 识别文本
   * @param mode fill=回填输入框；send=自动发送
   */
  onResult: (text: string, mode: VoiceSubmitMode) => void;
  /** 整体禁用（如会话进行中） */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 演示模式：模拟录音与转写，不访问麦克风/STT */
  mock?: boolean;
  /** 演示模式下的模拟转写文案 */
  mockTranscript?: string;
  /** 录音/转写状态变化，供外层复用会话框停止与发送按钮 */
  onControlChange?: (control: VoiceInputControl | null) => void;
  /**
   * 录音/转写 UI 由会话框底栏承接（占满中间区域），本插口仅保留逻辑与空闲麦克风
   */
  footerExpand?: boolean;
}

/**
 * 语音输入插口 —— 本模块唯一对外组件。
 *
 * 业务侧（聊天输入框）只需在工具栏放一个 <VoiceInputSlot/>，
 * 内部自理录音、识别、错误提示；对外通过 onResult 区分回填与自动发送。
 *
 * 可插拔：当 ENABLE_VOICE_INPUT=false 时整体返回 null，
 * 业务文件无需任何回改即可移除该功能。
 */
const VoiceInputSlot: React.FC<VoiceInputSlotProps> = ({
  onResult,
  disabled,
  className,
  mock,
  mockTranscript,
  onControlChange,
  footerExpand = false,
}) => {
  if (!ENABLE_VOICE_INPUT) {
    return null;
  }
  return (
    <VoiceButton
      onResult={onResult}
      disabled={disabled}
      className={className}
      mock={mock}
      mockTranscript={mockTranscript}
      onControlChange={onControlChange}
      footerExpand={footerExpand}
    />
  );
};

export default VoiceInputSlot;
