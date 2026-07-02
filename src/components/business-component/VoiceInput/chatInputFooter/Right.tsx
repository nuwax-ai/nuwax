import SvgIcon from '@/components/base/SvgIcon';
import { ENABLE_VOICE_INPUT } from '@/constants/feature.constants';
import { t } from '@/services/i18nRuntime';
import { LoadingOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import VoiceButton from '../components/Button';
import { useVoiceFooter } from './context';
import styles from './index.less';

const I18N_PREFIX = 'PC.Components.VoiceInput';

export interface VoiceFooterRightProps {
  /** 非语音活跃时展示的默认操作（发送/停止会话等） */
  defaultActions: React.ReactNode;
  /** 麦克风左侧扩展区（模型选择等），语音活跃时自动隐藏 */
  children?: React.ReactNode;
  className?: string;
}

/**
 * 底栏右侧：扩展区 + 麦克风 + 语音停止/发送 或 默认操作按钮
 */
export const VoiceFooterRight: React.FC<VoiceFooterRightProps> = ({
  defaultActions,
  children,
  className,
}) => {
  const {
    disabled,
    mock,
    isActive,
    voiceControl,
    setVoiceControl,
    handleVoiceResult,
  } = useVoiceFooter();

  // 转写期间：被点击的按钮展示 loading（保持主题色），另一个置灰
  const [pendingAction, setPendingAction] = useState<'fill' | 'send' | null>(
    null,
  );
  useEffect(() => {
    if (voiceControl?.phase !== 'transcribing') {
      setPendingAction(null);
    }
  }, [voiceControl?.phase]);

  const rootClass = [
    styles['voice-footer-right'],
    isActive ? styles['voice-footer-right-active'] : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      {!isActive && children}
      {ENABLE_VOICE_INPUT && (
        <VoiceButton
          onResult={handleVoiceResult}
          disabled={disabled}
          mock={mock}
          footerExpand
          onControlChange={setVoiceControl}
          className={isActive ? styles['voice-input-hidden'] : undefined}
        />
      )}
      {isActive ? (
        <>
          <Tooltip title={t(`${I18N_PREFIX}.stopFillTooltip`)}>
            <span
              onClick={() => {
                if (voiceControl?.phase === 'recording') {
                  setPendingAction('fill');
                  voiceControl.submit('fill');
                }
              }}
              className={`${styles['voice-footer-action-box']} ${
                styles['voice-action-stop']
              }${
                voiceControl?.phase === 'transcribing' &&
                pendingAction !== 'fill'
                  ? ` ${styles['voice-action-disabled']}`
                  : ''
              }`}
            >
              {voiceControl?.phase === 'transcribing' &&
              pendingAction === 'fill' ? (
                <LoadingOutlined style={{ fontSize: 14 }} />
              ) : (
                <SvgIcon name="icons-chat-stop" />
              )}
            </span>
          </Tooltip>
          <Tooltip title={t(`${I18N_PREFIX}.stopSendTooltip`)}>
            <span
              onClick={() => {
                if (voiceControl?.phase === 'recording') {
                  setPendingAction('send');
                  voiceControl.submit('send');
                }
              }}
              className={`${styles['voice-footer-action-box']} ${
                styles['voice-action-send']
              }${
                voiceControl?.phase === 'transcribing' &&
                pendingAction !== 'send'
                  ? ` ${styles['voice-action-disabled']}`
                  : ''
              }`}
            >
              {voiceControl?.phase === 'transcribing' &&
              pendingAction === 'send' ? (
                <LoadingOutlined style={{ fontSize: 14 }} />
              ) : (
                <SvgIcon name="icons-chat-send" style={{ fontSize: 14 }} />
              )}
            </span>
          </Tooltip>
        </>
      ) : (
        defaultActions
      )}
    </div>
  );
};
