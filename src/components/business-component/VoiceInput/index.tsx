import { ENABLE_VOICE_INPUT } from '@/constants/feature.constants';
import React from 'react';
import VoiceButton from './components/Button';

export interface VoiceInputSlotProps {
  /** 拿到识别文字后的回调（由父级绑定到输入框的 confirmSendMessage，实现自动发送） */
  onSend: (text: string) => void;
  /** 整体禁用（如会话进行中） */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 语音输入插口 —— 本模块唯一对外组件。
 *
 * 业务侧（聊天输入框）只需在工具栏放一个 <VoiceInputSlot/>，
 * 内部自理录音、识别、错误提示与自动发送，对外仅暴露 onSend/disabled。
 *
 * 可插拔：当 ENABLE_VOICE_INPUT=false 时整体返回 null，
 * 业务文件无需任何回改即可移除该功能。
 */
const VoiceInputSlot: React.FC<VoiceInputSlotProps> = ({
  onSend,
  disabled,
  className,
}) => {
  if (!ENABLE_VOICE_INPUT) {
    return null;
  }
  return (
    <VoiceButton onSend={onSend} disabled={disabled} className={className} />
  );
};

export default VoiceInputSlot;
