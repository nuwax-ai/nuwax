import React, { useCallback, useMemo, useState } from 'react';
import type { VoiceInputControl, VoiceSubmitMode } from '../types';
import { VoiceFooterContext } from './context';

export interface VoiceFooterProviderProps {
  disabled?: boolean;
  mock?: boolean;
  /** 转写后回填输入框 */
  onFill: (text: string) => void;
  /** 转写后自动发送 */
  onSend: (text: string) => void;
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
}

/**
 * 会话框底栏语音能力 Provider：统一管理录音态与转写回调
 */
export const VoiceFooterProvider: React.FC<VoiceFooterProviderProps> = ({
  disabled,
  mock,
  onFill,
  onSend,
  children,
}) => {
  const [voiceControl, setVoiceControl] = useState<VoiceInputControl | null>(
    null,
  );
  const isActive = voiceControl !== null;

  const handleVoiceResult = useCallback(
    (text: string, mode: VoiceSubmitMode) => {
      if (mode === 'send') {
        onSend(text);
        return;
      }
      onFill(text);
    },
    [onFill, onSend],
  );

  const value = useMemo(
    () => ({
      disabled,
      mock,
      voiceControl,
      isActive,
      setVoiceControl,
      handleVoiceResult,
    }),
    [disabled, mock, voiceControl, isActive, handleVoiceResult],
  );

  return (
    <VoiceFooterContext.Provider value={value}>
      {typeof children === 'function' ? children(isActive) : children}
    </VoiceFooterContext.Provider>
  );
};
