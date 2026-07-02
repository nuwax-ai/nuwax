import React, { useMemo } from 'react';
import { createEmptyWaveLevels } from '../utils/waveLevels';
import styles from './index.less';

const WAVE_MIN_PX = 4;
const WAVE_MAX_PX = 18;

const formatDuration = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export interface VoiceRecordingBarProps {
  /** recording=波形计时；transcribing=转写 loading */
  phase: 'recording' | 'transcribing';
  durationSec?: number;
  /** 实时波形条高度（0~1），由录音 Hook 驱动 */
  waveLevels?: number[];
  /** 占满会话框底部中间区域（与左侧 +/刷子、右侧停止/发送配合） */
  expanded?: boolean;
  className?: string;
}

/**
 * 录音/转写展示条：虚线基线 + 实时波形 + 计时，或转写 loading
 */
const VoiceRecordingBar: React.FC<VoiceRecordingBarProps> = ({
  phase,
  durationSec = 0,
  waveLevels,
  expanded = false,
  className,
}) => {
  const levels = useMemo(() => {
    if (waveLevels?.length) {
      return waveLevels;
    }
    return createEmptyWaveLevels();
  }, [waveLevels]);

  const rootClass = [
    styles['voice-recording-bar'],
    expanded ? styles['voice-recording-bar-expanded'] : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  // 转写中：不展示 loading（由底栏右侧动作按钮承接），仅保留基线维持布局
  if (phase === 'transcribing') {
    return (
      <div className={rootClass}>
        <span className={styles['voice-baseline']} aria-hidden />
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <span className={styles['voice-baseline']} aria-hidden />
      <span className={`${styles['voice-wave']} ${styles['voice-wave-live']}`}>
        {levels.map((level, index) => {
          const height = WAVE_MIN_PX + level * (WAVE_MAX_PX - WAVE_MIN_PX);
          const width = index % 3 === 0 ? 3 : index % 3 === 1 ? 1.5 : 2;
          return (
            <i
              key={index}
              style={{
                height: `${height}px`,
                width: `${width}px`,
              }}
            />
          );
        })}
      </span>
      <span className={styles['voice-timer']}>
        {formatDuration(durationSec)}
      </span>
    </div>
  );
};

export default VoiceRecordingBar;
