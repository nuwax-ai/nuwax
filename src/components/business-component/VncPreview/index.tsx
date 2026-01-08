import {
  IDLE_DETECTION_TIMEOUT_MS,
  IDLE_WARNING_COUNTDOWN_SECONDS,
  SANDBOX,
} from '@/constants/common.constants';
import { useIdleDetection } from '@/hooks/useIdleDetection';
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
        setErrorMessage('缺少必要配置（服务地址或容器 ID）');
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
        setErrorMessage('智能体电脑暂时不可用，请稍后手动刷新重试。');
        return;
      }

      if (result.status === 403) {
        setStatus('error');
        setErrorMessage('访问被拒绝 (403 Forbidden)，请检查权限配置。');
        return;
      }
      if (result.status === 502 || result.status === 503) {
        setStatus('error');
        setErrorMessage(`服务暂时不可用 (${result.status})，请稍后重试。`);
        return;
      }
      if (result.status && result.status >= 400) {
        setStatus('error');
        setErrorMessage(`请求失败 (HTTP ${result.status})，请检查服务状态。`);
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
            setErrorMessage(msg || '无法连接到智能体电脑');
            break;
          case 'vnc_connection_closed':
            setStatus('error');
            setErrorMessage(msg || '连接已断开');
            break;
          case 'vnc_share_expired':
            setStatus('error');
            setErrorMessage('分享已过期');
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
      vncIdleLogger.log('检查空闲检测启用条件', {
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
        vncIdleLogger.log('⚠️ 弹窗已显示，跳过重复触发');
        return;
      }
      isIdleWarningActiveRef.current = true;
      vncIdleLogger.log('⏰ 空闲超时，显示警告弹窗', {
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
      vncIdleLogger.log('✅ 用户取消空闲警告', '重置空闲计时器');
      setShowIdleWarning(false);
      isIdleWarningActiveRef.current = false;
      resetIdleTimer();
      message.success('已取消自动关闭');
      onIdleCancel?.();
    }, [resetIdleTimer, onIdleCancel]);

    /**
     * 处理空闲警告倒计时结束：断开连接
     */
    const handleIdleWarningTimeout = useCallback(() => {
      vncIdleLogger.log('⏱️ 空闲警告倒计时结束', {
        action: '断开 VNC 连接',
        cId,
      });
      setShowIdleWarning(false);
      isIdleWarningActiveRef.current = false;
      // 断开连接
      disconnect();
      message.info('由于长时间未操作，已自动关闭智能体电脑连接');
      onIdleTimeout?.();
    }, [cId, disconnect, onIdleTimeout]);

    // ==================== 渲染相关 ====================

    const renderStatusTag = useCallback(() => {
      switch (status) {
        case 'connected':
          return <Tag color="#52c41a">已连接</Tag>;
        case 'connecting':
          return <Tag color="#1890ff">连接中...</Tag>;
        case 'disconnected':
          return <Tag>未连接</Tag>;
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
              <p>准备连接</p>
            </div>
          )}

          {status === 'connecting' ? (
            <div className={styles.loadingOverlay}>
              <Spin size="large" />
              <span className={styles.loadingText}>智能体电脑连接中...</span>
            </div>
          ) : null}

          {status === 'error' && (
            <div className={styles.errorOverlay}>
              <Alert
                message="连接错误"
                description={errorMessage || '无法建立连接'}
                type="error"
                showIcon
                action={
                  <Button size="small" type="primary" onClick={connect}>
                    重试
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
