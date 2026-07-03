import React from 'react';
import VoiceRecordingBar from '../components/RecordingBar';
import { useVoiceFooter } from './context';

/** 录音/转写时占满底栏中间区域的波形展示 */
export const VoiceFooterExpand: React.FC = () => {
  const { isActive, voiceControl } = useVoiceFooter();
  if (!isActive || !voiceControl) {
    return null;
  }
  return (
    <VoiceRecordingBar
      expanded
      phase={voiceControl.phase}
      durationSec={voiceControl.durationSec}
      waveLevels={voiceControl.waveLevels}
    />
  );
};
