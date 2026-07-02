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
      // 回填依赖 MentionEditor 的外部 value 同步，而编辑器聚焦时会跳过该同步：
      // 若用户在转写期间点回输入框，回填文本只进 state 不上屏、随后被下次输入覆盖。
      // 回填前先失焦，确保同步生效。
      if (typeof document !== 'undefined') {
        (document.activeElement as HTMLElement | null)?.blur?.();
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
