import React from 'react';
import { useVoiceFooterActive } from './context';

export interface VoiceFooterHideWhenActiveProps {
  children: React.ReactNode;
}

/** 录音/转写活跃时隐藏子节点（用于 @、模型选择等底栏项） */
export const VoiceFooterHideWhenActive: React.FC<
  VoiceFooterHideWhenActiveProps
> = ({ children }) => {
  const isActive = useVoiceFooterActive();
  if (isActive) {
    return null;
  }
  return <>{children}</>;
};
