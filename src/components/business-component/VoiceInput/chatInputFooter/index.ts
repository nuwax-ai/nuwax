import { VoiceFooterExpand } from './Expand';
import { VoiceFooterHideWhenActive } from './HideWhenActive';
import { VoiceFooterProvider } from './Provider';
import { VoiceFooterRight } from './Right';

export { useVoiceFooter, useVoiceFooterActive } from './context';
export type { VoiceFooterProviderProps } from './Provider';
export type { VoiceFooterRightProps } from './Right';

/**
 * 会话框底栏语音集成 —— 封装录音态布局、波形区与停止/发送按钮，降低 ChatInput 侵入
 */
export const ChatInputVoiceFooter = {
  Provider: VoiceFooterProvider,
  HideWhenActive: VoiceFooterHideWhenActive,
  Expand: VoiceFooterExpand,
  Right: VoiceFooterRight,
};

export default ChatInputVoiceFooter;
