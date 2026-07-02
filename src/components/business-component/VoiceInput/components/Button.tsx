import SvgIcon from '@/components/base/SvgIcon';
import { speechToText } from '@/services/audio';
import { t } from '@/services/i18nRuntime';
import { LoadingOutlined } from '@ant-design/icons';
import { message, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { VOICE_INPUT_DEFAULTS, VOICE_INPUT_MOCK_TRANSCRIPT } from '../config';
import { RecorderError, useAudioRecorder } from '../hooks/useAudioRecorder';
import {
  MOCK_STT_DELAY_MS,
  useMockAudioRecorder,
} from '../hooks/useMockAudioRecorder';
import { warmUpRecorder } from '../loaders/recorderContext';
import type { VoiceInputControl, VoiceSubmitMode } from '../types';
import { createEmptyWaveLevels } from '../utils/waveLevels';
import VoiceRecordingBar from './RecordingBar';
import styles from './index.less';

export interface VoiceButtonProps {
  /**
   * 转写成功后的回调
   * @param text 识别文本（已 trim）
   * @param mode fill=回填输入框；send=自动发送
   */
  onResult: (text: string, mode: VoiceSubmitMode) => void;
  /** 整体禁用（如会话进行中） */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /**
   * 演示模式：不访问麦克风与 STT，仅模拟录音/转写 UI 流程
   */
  mock?: boolean;
  /** 演示模式下的模拟转写文案 */
  mockTranscript?: string;
  /** 录音/转写状态变化，供外层复用会话框停止与发送按钮 */
  onControlChange?: (control: VoiceInputControl | null) => void;
  /** 录音/转写 UI 由外层底栏承接 */
  footerExpand?: boolean;
}

const I18N_PREFIX = 'PC.Components.VoiceInput';

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
        return;
      default:
        key = 'recognizeFailed';
    }
  }
  message.error(t(`${I18N_PREFIX}.${key}`));
};

/**
 * 语音输入控件
 *
 * 交互：
 * - 空闲：麦克风按钮开始录音
 * - 录音中：波形 + 计时（停止/发送由会话框原有按钮承接）
 * - 转写中：loading 态
 */
const VoiceButton: React.FC<VoiceButtonProps> = ({
  onResult,
  disabled,
  className,
  mock = false,
  mockTranscript = VOICE_INPUT_MOCK_TRANSCRIPT,
  onControlChange,
  footerExpand = false,
}) => {
  const realRecorder = useAudioRecorder();
  const mockRecorder = useMockAudioRecorder();
  const recorder = mock ? mockRecorder : realRecorder;
  const { status, durationSec, waveLevels } = recorder;
  const isRecording = status === 'recording';
  const isStopping = status === 'stopping';
  const isConnecting = status === 'connecting';
  const [transcribing, setTranscribing] = useState(false);

  const isBusy = disabled || transcribing || isStopping || isConnecting;

  // 挂载即预热 worklet（真实模式），让首次点击更快、有即时反馈
  useEffect(() => {
    if (!mock) {
      warmUpRecorder();
    }
  }, [mock]);

  /**
   * 停止录音 -> STT -> 按模式回填或发送
   */
  const finishRecording = useCallback(
    async (mode: VoiceSubmitMode) => {
      let blob: Blob;
      try {
        blob = await recorder.stop();
      } catch (e) {
        showError(e);
        recorder.reset();
        return;
      }

      // 后端 STT 有单文件 10MB 上限；16kHz 下 maxDurationSec 内不会触达，
      // 此处兜底配置漂移或采样率异常，避免整段录音上传必败
      if (blob.size > VOICE_INPUT_DEFAULTS.maxFileSizeBytes) {
        message.error(t(`${I18N_PREFIX}.tooLarge`));
        recorder.reset();
        return;
      }

      setTranscribing(true);
      try {
        let trimmed: string;
        if (mock) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, MOCK_STT_DELAY_MS);
          });
          trimmed = mockTranscript.trim();
        } else {
          const text = await speechToText(blob, {
            timeoutMs: VOICE_INPUT_DEFAULTS.sttTimeoutMs,
          });
          trimmed = text?.trim() ?? '';
        }
        if (trimmed) {
          onResult(trimmed, mode);
        } else {
          message.error(t(`${I18N_PREFIX}.recognizeFailed`));
        }
      } catch {
        message.error(t(`${I18N_PREFIX}.recognizeFailed`));
      } finally {
        setTranscribing(false);
        recorder.reset();
      }
    },
    [recorder, onResult, mock, mockTranscript],
  );

  const finishRecordingRef = useRef(finishRecording);
  finishRecordingRef.current = finishRecording;

  /** 向父级同步录音/转写态，便于复用会话框停止与发送按钮 */
  useEffect(() => {
    if (!onControlChange) {
      return;
    }
    if (transcribing || isStopping) {
      onControlChange({
        phase: 'transcribing',
        durationSec: 0,
        waveLevels: createEmptyWaveLevels(),
        submit: () => {},
      });
    } else if (isRecording) {
      onControlChange({
        phase: 'recording',
        durationSec,
        waveLevels,
        submit: (mode) => void finishRecordingRef.current(mode),
      });
    } else {
      onControlChange(null);
    }
    return () => onControlChange(null);
  }, [
    isRecording,
    transcribing,
    isStopping,
    durationSec,
    waveLevels,
    onControlChange,
  ]);

  /** 空闲态：点击麦克风开始录音 */
  const handleStartRecording = useCallback(async () => {
    if (isBusy || isRecording) {
      return;
    }
    try {
      await recorder.start();
    } catch (e) {
      showError(e);
    }
  }, [isBusy, isRecording, recorder]);

  // 到达最大时长自动停止并回填（保守默认，用户可再点发送）
  useEffect(() => {
    if (isRecording && durationSec >= VOICE_INPUT_DEFAULTS.maxDurationSec) {
      void finishRecording('fill');
    }
  }, [isRecording, durationSec, finishRecording]);

  // 转写中：外层 footerExpand 时由底栏展示
  if (transcribing || isStopping) {
    if (footerExpand) {
      return null;
    }
    return (
      <span
        className={`${styles['voice-transcribing']}${
          className ? ` ${className}` : ''
        }`}
      >
        <LoadingOutlined style={{ fontSize: 14 }} />
      </span>
    );
  }

  // 录音中：外层 footerExpand 时由底栏占满中间区域展示
  if (isRecording) {
    if (footerExpand) {
      return null;
    }
    return (
      <VoiceRecordingBar
        phase="recording"
        durationSec={durationSec}
        waveLevels={waveLevels}
        className={className}
      />
    );
  }

  // 空闲 / 连接中：麦克风入口（连接中给脉冲反馈；悬停再预热一次，幂等）
  return (
    <Tooltip
      title={t(
        `${I18N_PREFIX}.${isConnecting ? 'connecting' : 'startTooltip'}`,
      )}
    >
      <span
        className={`${
          isConnecting ? styles['voice-connecting'] : styles['voice-idle']
        }${className ? ` ${className}` : ''}${
          isBusy && !isConnecting ? ` ${styles['voice-disabled']}` : ''
        }`}
        onMouseEnter={() => {
          if (!mock) {
            warmUpRecorder();
          }
        }}
        onClick={() => {
          if (!isBusy) {
            void handleStartRecording();
          }
        }}
      >
        <SvgIcon
          name="icons-chat-voice"
          style={{ fontSize: 18 }}
          className={styles['voice-icon']}
        />
      </span>
    </Tooltip>
  );
};

export default VoiceButton;
