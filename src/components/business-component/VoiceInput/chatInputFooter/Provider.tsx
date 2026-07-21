import React, { useCallback, useMemo, useRef, useState } from 'react';
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

/** 将转写文本追加到现有草稿，供“回填”和“直接发送”保持一致语义 */
export const mergeVoiceTranscript = (
  draft: string,
  transcript: string,
): string => {
  return draft ? `${draft}\n${transcript}` : transcript;
};

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
  const latestResultHandlersRef = useRef({ disabled, onFill, onSend });
  latestResultHandlersRef.current = { disabled, onFill, onSend };

  const handleVoiceResult = useCallback(
    (text: string, mode: VoiceSubmitMode) => {
      const latest = latestResultHandlersRef.current;
      if (mode === 'send' && !latest.disabled) {
        latest.onSend(text);
        return;
      }
      // 自动发送等待期间如果会话已进入禁用态，降级为回填以保留识别结果，
      // 不绕过输入框最新的发送条件。
      // 回填依赖 MentionEditor 的外部 value 同步，而编辑器聚焦时会跳过该同步：
      // 若用户在转写期间点回输入框，回填文本只进 state 不上屏、随后被下次输入覆盖。
      // 回填前先失焦，确保同步生效。
      if (typeof document !== 'undefined') {
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
      latest.onFill(text);
    },
    [],
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
