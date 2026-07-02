import SvgIcon from '@/components/base/SvgIcon';
import { speechToText } from '@/services/audio';
import { t } from '@/services/i18nRuntime';
import { LoadingOutlined } from '@ant-design/icons';
import { message, Tooltip } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { VOICE_INPUT_DEFAULTS } from '../config';
import { RecorderError, useAudioRecorder } from '../hooks/useAudioRecorder';
import styles from './index.less';

export interface VoiceButtonProps {
  /** 拿到识别文字后的回调（由父级绑定到输入框的 confirmSendMessage，实现自动发送） */
  onSend: (text: string) => void;
  /** 整体禁用（如会话进行中） */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

const I18N_PREFIX = 'PC.Components.VoiceInput';

const formatDuration = (sec: number): string => {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

/** 把录音/识别错误映射为国际化 key 并提示 */
const showError = (e: unknown) => {
  let key = 'recognizeFailed';
  if (e instanceof RecorderError) {
    switch (e.kind) {
      case 'permission-denied':
        key = 'permissionDenied';
        break;
      case 'not-supported':
        key = 'notSupported';
        break;
      case 'too-short':
        key = 'tooShort';
        break;
      case 'aborted':
        // 用户主动中断，不提示
        return;
      default:
        key = 'recognizeFailed';
    }
  }
  message.error(t(`${I18N_PREFIX}.${key}`));
};

const VoiceButton: React.FC<VoiceButtonProps> = ({
  onSend,
  disabled,
  className,
}) => {
  const recorder = useAudioRecorder();
  const { status, durationSec } = recorder;
  const isRecording = status === 'recording';
  const isStopping = status === 'stopping';
  const [transcribing, setTranscribing] = useState(false);

  /** 停止录音 -> 识别 -> 自动发送 */
  const finishRecording = useCallback(async () => {
    let blob: Blob;
    try {
      blob = await recorder.stop();
    } catch (e) {
      showError(e);
      recorder.reset();
      return;
    }

    setTranscribing(true);
    try {
      const text = await speechToText(blob);
      const trimmed = text?.trim();
      if (trimmed) {
        onSend(trimmed);
      } else {
        message.error(t(`${I18N_PREFIX}.recognizeFailed`));
      }
    } catch {
      message.error(t(`${I18N_PREFIX}.recognizeFailed`));
    } finally {
      setTranscribing(false);
      recorder.reset();
    }
  }, [recorder, onSend]);

  const handleClick = useCallback(async () => {
    if (disabled || transcribing || isStopping) {
      return;
    }
    if (isRecording) {
      void finishRecording();
      return;
    }
    // 开始录音
    try {
      await recorder.start();
    } catch (e) {
      showError(e);
    }
  }, [
    disabled,
    transcribing,
    isStopping,
    isRecording,
    recorder,
    finishRecording,
  ]);

  // 到达最大时长自动停止并识别
  useEffect(() => {
    if (isRecording && durationSec >= VOICE_INPUT_DEFAULTS.maxDurationSec) {
      void finishRecording();
    }
  }, [isRecording, durationSec, finishRecording]);

  const tooltipKey = isRecording
    ? 'stopTooltip'
    : transcribing || isStopping
    ? 'transcribing'
    : 'startTooltip';

  const rootClass = isRecording
    ? styles['voice-recording']
    : transcribing || isStopping
    ? styles['voice-transcribing']
    : styles['voice-idle'];

  return (
    <Tooltip title={t(`${I18N_PREFIX}.${tooltipKey}`)}>
      <span
        className={`${rootClass}${className ? ` ${className}` : ''}`}
        onClick={handleClick}
      >
        {transcribing || isStopping ? (
          <LoadingOutlined style={{ fontSize: 14 }} />
        ) : isRecording ? (
          <>
            <SvgIcon
              name="icons-chat-voice"
              style={{ fontSize: 14 }}
              className={styles['voice-icon']}
            />
            <span className={styles['voice-timer']}>
              {formatDuration(durationSec)}
            </span>
            <span className={styles['voice-wave']}>
              <i />
              <i />
              <i />
              <i />
            </span>
          </>
        ) : (
          <SvgIcon
            name="icons-chat-voice"
            style={{ fontSize: 14 }}
            className={styles['voice-icon']}
          />
        )}
      </span>
    </Tooltip>
  );
};

export default VoiceButton;
