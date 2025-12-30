import { DesktopOutlined } from '@ant-design/icons';
import { Alert, Button, Spin, Tag } from 'antd';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import styles from './index.less';
import { ConnectionStatus, VncPreviewProps, VncPreviewRef } from './type';
import { useUrlRetry } from './useUrlRetry';

const VncPreview = forwardRef<VncPreviewRef, VncPreviewProps>(
  (
    {
      serviceUrl,
      cId,
      readOnly = false,
      autoConnect = false,
      style,
      className,
    },
    ref,
  ) => {
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // 使用 URL 重试 hook
    // TODO: 后端 API 准备好后，取消下面的 checkFn 注释以启用后端代理检测
    const { checkWithRetry, resetRetry } = useUrlRetry({
      retryInterval: 5000, // 5 秒间隔
      maxRetryDuration: 60000, // 最长重试 1 分钟
      retryStatusCodes: [404], // 仅对 404 重试
      // 后端 API 准备好后启用此函数绕过 CORS：
      // checkFn: async () => {
      //   const res = await apiCheckVncUrl(Number(cId));
      //   return { ok: res.data?.available ?? false, status: res.data?.status };
      // },
    });

    // Helper to build the VNC URL
    const buildVncUrl = useCallback(() => {
      if (!cId) {
        setErrorMessage('缺少必要配置（服务地址或容器 ID）');
        return null;
      }

      const cleanBaseUrl = serviceUrl?.replace(/\/+$/, '');
      const params = new URLSearchParams();

      // Always use scaling
      params.set('resize', 'scale');

      // Auto-connect param for the internal VNC client (noVNC usually supports this)
      params.set('autoconnect', 'true');

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
        // 重试回调
        connect();
      });

      if (result.shouldRetry) {
        // 正在重试中，保持 connecting 状态
        return;
      }

      if (result.isTimeout) {
        // 重试超时
        setStatus('error');
        setErrorMessage('智能体电脑暂时不可用，请稍后手动刷新重试。');
        return;
      }

      // 其他错误状态码
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

      // 成功，加载 iframe
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

    useEffect(() => {
      if (autoConnect) {
        connect();
      }
    }, [autoConnect, connect]);

    // Handle re-connection when configuration changes and we are already connected or connecting
    useEffect(() => {
      if (status === 'connected' || status === 'connecting') {
        connect();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceUrl, cId, readOnly]);

    const handleIframeLoad = () => {
      // If we were connecting, we mark as connected when iframe loads.
      // Note: VNC might still be negotiating inside the iframe, but from container perspective, it's loaded.
      // The previous code had specific timeouts, but iframe.onload is a good first step.
      if (status === 'connecting') {
        setStatus('connected');
      }
    };

    const handleIframeError = () => {
      setStatus('error');
      setErrorMessage('Failed to load VNC client.');
    };

    // Timeout fallback for connection - similar to the original HTML logic
    useEffect(() => {
      let timeoutId: any;

      if (status === 'connecting') {
        timeoutId = setTimeout(() => {
          // If still connecting after X seconds, check if iframe really failed or just slow
          // Since we can't easily access cross-origin iframe content, we assume connected if no error fired
          if (iframeRef.current) {
            setStatus('connected');
          }
        }, 5000); // 5 seconds timeout
      }

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }, [status]);

    const renderStatusTag = useCallback(() => {
      switch (status) {
        case 'connected':
          return <Tag color="#52c41a">已连接</Tag>;
        case 'connecting':
          return <Tag color="#1890ff">连接中...</Tag>;
        case 'disconnected':
          return <Tag>未连接</Tag>;
        case 'error':
          return <Tag color="#ff4d4f">连接失败</Tag>;
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
      }),
      [connect, disconnect, renderStatusTag, status],
    );

    return (
      <div
        className={`${styles.vncPreviewContainer} ${className || ''}`}
        style={style}
      >
        {/* <div className={styles.controlsBar}>
        <div className={styles.statusArea}>
          <DesktopOutlined />
          <span style={{ fontWeight: 500 }}>Remote Desktop</span>
          {renderStatusTag()}
        </div>
        <div className={styles.actionsArea}>
          {status === 'disconnected' || status === 'error' ? (
            <Button
              type="primary"
              icon={<PoweroffOutlined />}
              onClick={connect}
              size="small"
            >
              Connect
            </Button>
          ) : (
            <>
              <Button
                danger
                icon={<PoweroffOutlined />}
                onClick={disconnect}
                size="small"
              >
                Disconnect
              </Button>
              <Tooltip title="Reconnect">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    disconnect();
                    setTimeout(connect, 100);
                  }}
                  size="small"
                />
              </Tooltip>
            </>
          )}
        </div>
      </div> */}

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
              title="VNC Preview"
              scrolling="no"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{ display: status === 'disconnected' ? 'none' : 'block' }}
            />
          )}
        </div>
      </div>
    );
  },
);

export default VncPreview;
