import { createContext, useContext } from 'react';
import type { VoiceInputControl, VoiceSubmitMode } from '../types';

export interface VoiceFooterContextValue {
  disabled?: boolean;
  mock?: boolean;
  voiceControl: VoiceInputControl | null;
  isActive: boolean;
  setVoiceControl: (control: VoiceInputControl | null) => void;
  handleVoiceResult: (text: string, mode: VoiceSubmitMode) => void;
}

export const VoiceFooterContext = createContext<VoiceFooterContextValue | null>(
  null,
);

/** 读取语音底栏上下文（需在 Provider 内使用） */
export const useVoiceFooter = (): VoiceFooterContextValue => {
  const ctx = useContext(VoiceFooterContext);
  if (!ctx) {
    throw new Error(
      'useVoiceFooter must be used within ChatInputVoiceFooter.Provider',
    );
  }
  return ctx;
};

/** 是否在录音/转写中 */
export const useVoiceFooterActive = (): boolean => {
  return useContext(VoiceFooterContext)?.isActive ?? false;
};
