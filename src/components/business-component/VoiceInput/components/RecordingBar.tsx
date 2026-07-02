import React, { useLayoutEffect, useRef, useState } from 'react';
import styles from './index.less';

const WAVE_MIN_PX = 3;
const WAVE_MAX_PX = 26;
/** 与 less 中 .voice-wave i 的宽度、gap 保持一致 */
const WAVE_BAR_WIDTH_PX = 2;
const WAVE_BAR_GAP_PX = 2;
/** 轨道左端为虚线基线保留的最小宽度（含与波形的间距） */
const BASELINE_RESERVE_PX = 20;
/** 容器测量完成前的兜底可见条数 */
const FALLBACK_VISIBLE_COUNT = 48;

const formatDuration = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export interface VoiceRecordingBarProps {
  /** recording=波形计时；transcribing=转写中 */
  phase: 'recording' | 'transcribing';
  durationSec?: number;
  /** 实时波形条高度（0~1），由录音 Hook 驱动 */
  waveLevels?: number[];
  /** 占满会话框底部中间区域（与左侧 +/刷子、右侧停止/发送配合） */
  expanded?: boolean;
  className?: string;
}

/**
 * 录音/转写展示条：虚线基线 + 实时波形时间线 + REC 红点 + 计时
 *
 * 波形从右端逐格生长、直到填满整条轨道后向左滚动；
 * 可见条数按轨道实际宽度自适应（数据层保留更长历史，视图裁尾部窗口）。
 */
const VoiceRecordingBar: React.FC<VoiceRecordingBarProps> = ({
  phase,
  durationSec = 0,
  waveLevels,
  expanded = false,
  className,
}) => {
  // 时间线初始为空：开录后波形条随时间从右端逐格生长
  const levels = waveLevels ?? [];

  const trackRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(FALLBACK_VISIBLE_COUNT);

  // 按轨道实际宽度计算可见条数，宽度变化（窗口缩放/侧栏开合）时自适应
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    const update = () => {
      const width = el.clientWidth;
      if (width > 0) {
        setVisibleCount(
          Math.max(
            8,
            Math.floor(
              (width - BASELINE_RESERVE_PX) /
                (WAVE_BAR_WIDTH_PX + WAVE_BAR_GAP_PX),
            ),
          ),
        );
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  // 只渲染时间线尾部能放下的窗口：未满时右端生长，满后即向左滚动
  const visibleLevels = levels.slice(-visibleCount);

  return (
    <div className={rootClass}>
      <span ref={trackRef} className={styles['voice-track']}>
        <span className={styles['voice-baseline']} aria-hidden />
        <span
          className={`${styles['voice-wave']} ${styles['voice-wave-live']}`}
        >
          {visibleLevels.map((level, index) => {
            const height = WAVE_MIN_PX + level * (WAVE_MAX_PX - WAVE_MIN_PX);
            return <i key={index} style={{ height: `${height}px` }} />;
          })}
        </span>
      </span>
      <span className={styles['voice-rec-dot']} aria-hidden />
      <span className={styles['voice-timer']}>
        {formatDuration(durationSec)}
      </span>
    </div>
  );
};

export default VoiceRecordingBar;
