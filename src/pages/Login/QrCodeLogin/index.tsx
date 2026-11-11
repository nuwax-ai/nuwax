import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiCreateQrLoginCode, apiGetQrLoginStatus } from '@/services/qrLogin';
import type { QrLoginCode, QrLoginResult } from '@/types/interfaces/qrLogin';
import { CheckCircleFilled, ReloadOutlined } from '@ant-design/icons';
import { Button, QRCode, Spin, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';

type Phase =
  | 'loading'
  | 'waiting'
  | 'scanned'
  | 'confirming'
  | 'expired'
  | 'error';

interface Props {
  logoUrl?: string;
  onSuccess: (result: QrLoginResult, isCurrent: () => boolean) => Promise<void>;
  onConfirmingChange: (confirming: boolean) => void;
}

const POLL_INTERVAL_MS = 2000;

const QrCodeLogin: React.FC<Props> = ({
  logoUrl,
  onSuccess,
  onConfirmingChange,
}) => {
  const tenantLogoUrl = logoUrl?.trim();
  const [loadedLogoUrl, setLoadedLogoUrl] = useState<string>();
  const [generation, setGeneration] = useState(0);
  const [code, setCode] = useState<QrLoginCode>();
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorText, setErrorText] = useState('');
  const cancelCurrent = useRef<() => void>(() => {});
  const callbacks = useRef({ onSuccess, onConfirmingChange });
  callbacks.current = { onSuccess, onConfirmingChange };

  useEffect(() => {
    let cancelled = false;
    let stopped = false;
    let completing = false;
    const controller = new AbortController();
    let pollTimer: ReturnType<typeof setTimeout>;
    let expiryTimer: ReturnType<typeof setTimeout>;
    const stop = () => {
      stopped = true;
      clearTimeout(pollTimer);
      clearTimeout(expiryTimer);
      controller.abort();
    };
    const cancel = () => {
      cancelled = true;
      stop();
    };
    cancelCurrent.current = cancel;
    const expire = () => {
      stop();
      setPhase('expired');
    };
    const fail = (error: unknown) => {
      stop();
      setErrorText(
        error instanceof Error && error.name !== 'AxiosError' && error.message
          ? error.message
          : dict('PC.Pages.Login.qrLoadFailed'),
      );
      setPhase('error');
    };

    setCode(undefined);
    setErrorText('');
    setPhase('loading');

    const start = async () => {
      const response = await apiCreateQrLoginCode(controller.signal);
      if (cancelled || stopped) return;
      const data = response.data;
      if (
        response.code !== SUCCESS_CODE ||
        !data?.sceneId ||
        !data.pollToken ||
        !data.qrContent ||
        !Number.isFinite(data.expireSeconds)
      ) {
        throw new Error(
          (response.code !== SUCCESS_CODE && response.message) ||
            dict('PC.Pages.Login.qrLoadFailed'),
        );
      }
      setCode(data);
      if (data.expireSeconds <= 0) {
        expire();
        return;
      }
      const deadline = Date.now() + data.expireSeconds * 1000;
      setPhase('waiting');
      expiryTimer = setTimeout(expire, data.expireSeconds * 1000);

      const poll = async () => {
        try {
          if (Date.now() >= deadline) {
            expire();
            return;
          }
          const response = await apiGetQrLoginStatus(
            { sceneId: data.sceneId, pollToken: data.pollToken },
            controller.signal,
          );
          if (cancelled || stopped) return;
          if (response.code !== SUCCESS_CODE || !response.data) {
            throw new Error(
              (response.code !== SUCCESS_CODE && response.message) ||
                dict('PC.Pages.Login.qrLoadFailed'),
            );
          }
          const result = response.data;
          if (result.status === 'CONFIRMED') {
            // 确认响应会设置 Cookie；停止轮询后只做一次已有登录收尾。
            completing = true;
            stop();
            setPhase('confirming');
            callbacks.current.onConfirmingChange(true);
            try {
              await callbacks.current.onSuccess(result, () => !cancelled);
            } finally {
              if (!cancelled) callbacks.current.onConfirmingChange(false);
            }
          } else if (result.status === 'EXPIRED' || Date.now() >= deadline) {
            expire();
          } else if (
            result.status === 'WAITING' ||
            result.status === 'SCANNED'
          ) {
            setPhase(result.status === 'SCANNED' ? 'scanned' : 'waiting');
            // 上一请求结束后再排下一次，慢网络不会叠加轮询。
            pollTimer = setTimeout(() => void poll(), POLL_INTERVAL_MS);
          } else {
            throw new Error(dict('PC.Pages.Login.qrLoadFailed'));
          }
        } catch (error) {
          if (!cancelled && (!stopped || completing)) {
            fail(error);
          }
        }
      };
      void poll();
    };

    void start().catch((error) => {
      if (!cancelled && !stopped) fail(error);
    });
    return cancel;
  }, [generation]);

  const retry = () => {
    // 主动换码时立即失效旧请求，不能等下一次 effect 清理才阻止迟到确认。
    cancelCurrent.current();
    setCode(undefined);
    setPhase('loading');
    setGeneration((value) => value + 1);
  };
  // 品牌名固定为「女娲Nuwax」，只翻译前后的提示，保留各语言的语序。
  const [hintBeforeApp, hintAfterApp] = dict(
    'PC.Pages.Login.qrHintWithAppName',
  ).split('{0}');
  const statusText =
    phase === 'scanned' ? (
      dict('PC.Pages.Login.qrScanned')
    ) : phase === 'confirming' ? (
      dict('PC.Pages.Login.qrConfirming')
    ) : phase === 'error' ? (
      errorText
    ) : (
      <>
        {hintBeforeApp}
        <Typography.Link
          href="https://nuwax.com/app.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          {dict('PC.Pages.Login.qrClientName', '女娲Nuwax')}
        </Typography.Link>
        {hintAfterApp}
        <br />
        {dict('PC.Pages.Login.qrLoginOrDownload')}
      </>
    );

  return (
    <div className={styles.panel}>
      <Typography.Title level={3}>
        {dict('PC.Pages.Login.qrLogin')}
      </Typography.Title>
      <div className={styles.code}>
        {phase === 'loading' || phase === 'confirming' ? (
          <Spin size="large" />
        ) : phase === 'scanned' ? (
          <CheckCircleFilled className={styles.scanned} />
        ) : (phase === 'waiting' || phase === 'expired') && code ? (
          <div
            className={styles['qr-image']}
            role={phase === 'expired' ? undefined : 'img'}
            aria-label={
              phase === 'expired'
                ? undefined
                : dict('PC.Pages.Login.qrCodeLabel')
            }
          >
            <QRCode
              value={code.qrContent}
              size={200}
              type="svg"
              bgColor="#fff"
              errorLevel={tenantLogoUrl ? 'H' : 'M'}
              aria-hidden={phase === 'expired' || undefined}
              status={phase === 'expired' ? 'expired' : 'active'}
              onRefresh={retry}
              statusRender={({ onRefresh }) => (
                <button
                  type="button"
                  className={styles['expired-refresh']}
                  aria-label={dict('PC.Pages.Login.qrRefresh')}
                  onClick={onRefresh}
                >
                  <span className={styles['expired-icon']} aria-hidden>
                    <ReloadOutlined />
                  </span>
                  <span
                    role="status"
                    aria-live="polite"
                    className={styles['expired-message']}
                  >
                    <span>{dict('PC.Pages.Login.qrExpiredTitle')}</span>
                    <span>{dict('PC.Pages.Login.qrClickRefresh')}</span>
                  </span>
                </button>
              )}
            />
            {/* 租户图标可能跨域且非方形，等比展示，加载成功后才覆盖码面。 */}
            {tenantLogoUrl && (
              <img
                key={tenantLogoUrl}
                src={tenantLogoUrl}
                alt=""
                aria-hidden
                className={styles.logo}
                style={{
                  visibility:
                    loadedLogoUrl === tenantLogoUrl ? 'visible' : 'hidden',
                }}
                onLoad={() => setLoadedLogoUrl(tenantLogoUrl)}
                onError={() => setLoadedLogoUrl(undefined)}
              />
            )}
          </div>
        ) : (
          <Button
            type="primary"
            icon={<ReloadOutlined aria-hidden />}
            onClick={retry}
          >
            {dict('PC.Pages.Login.qrRefresh')}
          </Button>
        )}
      </div>
      <Typography.Paragraph
        role={phase === 'expired' ? undefined : 'status'}
        aria-live={phase === 'expired' ? undefined : 'polite'}
        type={phase === 'error' ? 'danger' : 'secondary'}
      >
        {statusText}
      </Typography.Paragraph>
      {phase === 'scanned' && (
        <Button
          type="link"
          icon={<ReloadOutlined aria-hidden />}
          onClick={retry}
        >
          {dict('PC.Pages.Login.qrRefresh')}
        </Button>
      )}
    </div>
  );
};

export default QrCodeLogin;
