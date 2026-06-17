import {
  IDLE_DETECTION_TIMEOUT_MS,
  IDLE_WARNING_COUNTDOWN_SECONDS,
  SANDBOX,
} from '@/constants/common.constants';
import { useIdleDetection } from '@/hooks/useIdleDetection';
import { t } from '@/services/i18nRuntime';
import { apiCheckVncStatus } from '@/services/vncDesktop';
import { createLogger } from '@/utils/logger';
import { DesktopOutlined } from '@ant-design/icons';
import { Alert, Button, message, Spin, Tag } from 'antd';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import IdleWarningModal from './components/IdleWarningModal';
import styles from './index.less';
import { ConnectionStatus, VncPreviewProps, VncPreviewRef } from './type';
import { useUrlRetry } from './useUrlRetry';

// 创建 VncPreview 空闲检测专用 logger
const vncIdleLogger = createLogger('[Idle:VncPreview]');

const VncPreview = forwardRef<VncPreviewRef, VncPreviewProps>(
  (
    {
      serviceUrl,
      cId,
      readOnly = false,
      autoConnect = false,
      style,
      className,
      idleDetection,
    },
    ref,
  ) => {
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // 空闲警告弹窗状态
    const [showIdleWarning, setShowIdleWarning] = useState<boolean>(false);
    // 防止重复触发空闲超时弹窗
    const isIdleWarningActiveRef = useRef<boolean>(false);

    // 解构空闲检测配置
    const {
      enabled: idleEnabled = false,
      idleTimeoutMs = IDLE_DETECTION_TIMEOUT_MS,
      countdownSeconds = IDLE_WARNING_COUNTDOWN_SECONDS,
      onIdleTimeout,
      onIdleCancel,
    } = idleDetection || {};

    // 使用 URL 重试 hook
    const { checkWithRetry, resetRetry } = useUrlRetry({
      retryInterval: 5000, // 5 秒间隔
      maxRetryDuration: 60000, // 最长重试 1 分钟
      retryStatusCodes: [404], // 仅对 404 重试
      checkFn: async () => {
        const res = await apiCheckVncStatus(Number(cId));
        const isReady = res.data?.novnc_ready ?? false;
        return { ok: isReady, status: isReady ? 200 : 404 };
      },
    });

    // Helper to build the VNC URL
    const buildVncUrl = useCallback(() => {
      if (!cId) {
        setErrorMessage(t('PC.Components.VncPreview.missingConfig'));
        return null;
      }

      const cleanBaseUrl = serviceUrl?.replace(/\/+$/, '');
      const params = new URLSearchParams();

      params.set('resize', 'scale');
      params.set('autoconnect', 'true');
      params.set('reconnect', 'true');
      params.set('reconnect_delay', '500');

      if (readOnly) {
        params.set('view_only', 'true');
      }

      return `${cleanBaseUrl}/computer/desktop/${cId}/vnc.html?${params.toString()}`;
    }, [serviceUrl, cId, readOnly]);

    const connect = useCallback(async () => {
      const url = buildVncUrl();
      if (!url) {
        setStatus('error');
        return;
      }

      setStatus('connecting');
      setErrorMessage('');

      const result = await checkWithRetry(url, () => {
        connect();
      });

      if (result.shouldRetry) {
        return;
      }

      if (result.isTimeout) {
        setStatus('error');
        setErrorMessage(t('PC.Components.VncPreview.desktopUnavailable'));
        return;
      }

      if (result.status === 403) {
        setStatus('error');
        setErrorMessage(t('PC.Components.VncPreview.forbidden'));
        return;
      }
      if (result.status === 502 || result.status === 503) {
        setStatus('error');
        setErrorMessage(
          t(
            'PC.Components.VncPreview.serviceUnavailableWithStatus',
            String(result.status),
          ),
        );
        return;
      }
      if (result.status && result.status >= 400) {
        setStatus('error');
        setErrorMessage(
          t(
            'PC.Components.VncPreview.requestFailedWithStatus',
            String(result.status),
          ),
        );
        return;
      }

      setStatus('connected');
      setIframeUrl(url);
    }, [buildVncUrl, checkWithRetry]);

    const disconnect = useCallback(() => {
      resetRetry();
      setStatus('disconnected');
      setIframeUrl(null);
      setErrorMessage('');
    }, [resetRetry]);

    // 组件卸载时清除重试定时器
    useEffect(() => {
      return () => {
        resetRetry();
      };
    }, [resetRetry]);

    // 监听来自 noVNC iframe 的消息
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (!event.data || typeof event.data !== 'object') return;

        const { type, msg } = event.data;

        switch (type) {
          case 'vnc_connected':
            setStatus('connected');
            setErrorMessage('');
            break;
          case 'vnc_connection_failed':
            setStatus('error');
            setErrorMessage(
              msg || t('PC.Components.VncPreview.cannotConnectDesktop'),
            );
            break;
          case 'vnc_connection_closed':
            setStatus('error');
            setErrorMessage(
              msg || t('PC.Components.VncPreview.connectionClosed'),
            );
            break;
          case 'vnc_share_expired':
            setStatus('error');
            setErrorMessage(t('PC.Components.VncPreview.shareExpired'));
            break;
          default:
            break;
        }
      };

      window.addEventListener('message', handleMessage);
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
      if (autoConnect && status === 'disconnected') {
        connect();
      }
    }, [autoConnect]);

    // Handle re-connection when configuration changes
    useEffect(() => {
      if (status === 'connected' || status === 'connecting') {
        connect();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceUrl, cId, readOnly]);

    const handleIframeLoad = () => {
      // 使用函数式 setState 避免闭包陈旧值问题
      setStatus((prevStatus) => {
        if (prevStatus === 'connecting' || prevStatus === 'error') {
          setErrorMessage('');
          return 'connected';
        }
        return prevStatus;
      });
    };

    const handleIframeError = () => {
      setStatus('error');
      setErrorMessage('Failed to load VNC client.');
    };

    // Timeout fallback for connection
    useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;

      if (status === 'connecting') {
        timeoutId = setTimeout(() => {
          if (iframeRef.current) {
            setStatus('connected');
          }
        }, 5000);
      }

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }, [status]);

    // ==================== 空闲检测逻辑 ====================

    /**
     * 空闲检测启用条件：
     * 1. 配置中启用了空闲检测
     * 2. VNC 已连接
     */
    const shouldEnableIdleDetection = useMemo(() => {
      const result = idleEnabled && status === 'connected';
      vncIdleLogger.log('Evaluate idle-detection preconditions', {
        idleEnabled,
        status,
        shouldEnable: result,
      });
      return result;
    }, [idleEnabled, status]);

    /**
     * 处理空闲超时：显示警告弹窗
     * 使用 ref 防止重复触发
     */
    const handleIdleTimeout = useCallback(() => {
      // 如果弹窗已经在显示中，跳过
      if (isIdleWarningActiveRef.current) {
        vncIdleLogger.log(
          'Idle warning modal already visible, skip duplicate trigger.',
        );
        return;
      }
      isIdleWarningActiveRef.current = true;
      vncIdleLogger.log('Idle timeout reached, open warning modal.', {
        countdownSeconds,
        cId,
      });
      setShowIdleWarning(true);
    }, [countdownSeconds, cId]);

    // 使用空闲检测 Hook
    const { resetIdleTimer } = useIdleDetection({
      idleTimeoutMs,
      enabled: shouldEnableIdleDetection,
      onIdle: handleIdleTimeout,
      throttleMs: 2000,
      // 同时监听 VNC iframe 内的用户活动（同源情况下）
      iframeSelector: `iframe[data-vnc-id="${cId}"]`,
    });

    /**
     * 处理用户取消空闲警告
     */
    const handleIdleWarningCancel = useCallback(() => {
      vncIdleLogger.log('Idle warning canceled by user.', 'Reset idle timer.');
      setShowIdleWarning(false);
      isIdleWarningActiveRef.current = false;
      resetIdleTimer();
      message.success(t('PC.Components.VncPreview.autoCloseCanceled'));
      onIdleCancel?.();
    }, [resetIdleTimer, onIdleCancel]);

    /**
     * 处理空闲警告倒计时结束：断开连接
     */
    const handleIdleWarningTimeout = useCallback(() => {
      vncIdleLogger.log('Idle warning countdown finished.', {
        action: 'Disconnect VNC connection',
        cId,
      });
      setShowIdleWarning(false);
      isIdleWarningActiveRef.current = false;
      // 断开连接
      disconnect();
      message.info(t('PC.Components.VncPreview.autoClosedByIdleTimeout'));
      onIdleTimeout?.();
    }, [cId, disconnect, onIdleTimeout]);

    // ==================== 渲染相关 ====================

    const renderStatusTag = useCallback(() => {
      switch (status) {
        case 'connected':
          return (
            <Tag color="#52c41a">{t('PC.Components.VncPreview.connected')}</Tag>
          );
        case 'connecting':
          return (
            <Tag color="#1890ff">
              {t('PC.Components.VncPreview.connecting')}
            </Tag>
          );
        case 'disconnected':
          return <Tag>{t('PC.Components.VncPreview.disconnected')}</Tag>;
        case 'error':
          // 连接失败时不显示标签
          return null;
        default:
          return null;
      }
    }, [status]);

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        connect,
        disconnect,
        renderStatusTag,
        getStatus: () => status,
        resetIdleTimer,
      }),
      [connect, disconnect, renderStatusTag, status, resetIdleTimer],
    );

    return (
      <div
        className={`${styles.vncPreviewContainer} ${className || ''}`}
        style={style}
      >
        <div className={styles.iframeContainer}>
          {/* 背景占位符（未连接时显示） */}
          {status !== 'connected' && (
            <div className={styles.backgroundPlaceholder} />
          )}

          {status === 'disconnected' && (
            <div
              style={{
                color: '#fff',
                flexDirection: 'column',
                display: 'flex',
                alignItems: 'center',
                zIndex: 5,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              <DesktopOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <p>{t('PC.Components.VncPreview.preparingConnection')}</p>
            </div>
          )}

          {status === 'connecting' ? (
            <div className={styles.loadingOverlay}>
              <Spin size="large" />
              <span className={styles.loadingText}>
                {t('PC.Components.VncPreview.desktopConnecting')}
              </span>
            </div>
          ) : null}

          {status === 'error' && (
            <div className={styles.errorOverlay}>
              <Alert
                message={t('PC.Components.VncPreview.connectionError')}
                description={
                  errorMessage || t('PC.Components.VncPreview.cannotEstablish')
                }
                type="error"
                showIcon
                action={
                  <Button size="small" type="primary" onClick={connect}>
                    {t('PC.Components.VncPreview.retry')}
                  </Button>
                }
              />
            </div>
          )}

          {iframeUrl && (
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              data-vnc-id={cId}
              title="VNC Preview"
              sandbox={SANDBOX}
              scrolling="no"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{ display: status === 'disconnected' ? 'none' : 'block' }}
            />
          )}
        </div>

        {/* 空闲警告弹窗 */}
        <IdleWarningModal
          open={showIdleWarning}
          countdownSeconds={countdownSeconds}
          onCancel={handleIdleWarningCancel}
          onTimeout={handleIdleWarningTimeout}
        />
      </div>
    );
  },
);

export default VncPreview;
