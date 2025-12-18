import {
  DesktopOutlined,
  PoweroffOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Alert, Button, Spin, Tag, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';

export interface VncPreviewProps {
  /**
   * RCoder service base URL
   * e.g., "http://rcoder-service.example.com"
   */
  serviceUrl: string;
  /**
   * Active User ID
   */
  userId: string;
  /**
   * Project ID
   */
  projectId: string;
  /**
   * Whether to enable view-only mode
   * @default false
   */
  readOnly?: boolean;
  /**
   * Whether to auto-connect on mount
   * @default false
   */
  autoConnect?: boolean;
  /**
   * Custom styles for the container
   */
  style?: React.CSSProperties;
  /**
   * Custom class name for the container
   */
  className?: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const VncPreview: React.FC<VncPreviewProps> = ({
  serviceUrl,
  userId,
  projectId,
  readOnly = false,
  autoConnect = false,
  style,
  className,
}) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Helper to build the VNC URL
  const buildVncUrl = () => {
    if (!serviceUrl || !userId || !projectId) {
      setErrorMessage(
        'Missing required configuration (Service URL, User ID, or Project ID)',
      );
      return null;
    }

    const cleanBaseUrl = serviceUrl.replace(/\/+$/, '');
    const params = new URLSearchParams();

    // Always use scaling
    params.set('resize', 'scale');

    // Auto-connect param for the internal VNC client (noVNC usually supports this)
    params.set('autoconnect', 'true');

    if (readOnly) {
      params.set('view_only', 'true');
    }

    return `${cleanBaseUrl}/computer/vnc/${userId}/${projectId}/vnc.html?${params.toString()}`;
  };

  const connect = () => {
    const url = buildVncUrl();
    if (!url) {
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setErrorMessage('');
    setIframeUrl(url);
  };

  const disconnect = () => {
    setStatus('disconnected');
    setIframeUrl(null);
    setErrorMessage('');
  };

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

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

  const renderStatusTag = () => {
    switch (status) {
      case 'connected':
        return <Tag color="#52c41a">Connected</Tag>;
      case 'connecting':
        return <Tag color="#1890ff">Connecting...</Tag>;
      case 'disconnected':
        return <Tag>Disconnected</Tag>;
      case 'error':
        return <Tag color="#ff4d4f">Error</Tag>;
      default:
        return null;
    }
  };

  return (
    <div
      className={`${styles.vncPreviewContainer} ${className || ''}`}
      style={style}
    >
      <div className={styles.controlsBar}>
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
      </div>

      <div className={styles.iframeContainer}>
        {status === 'disconnected' && (
          <div
            style={{
              color: '#999',
              flexDirection: 'column',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <DesktopOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>Ready to connect</p>
          </div>
        )}

        {status === 'connecting' ? (
          <div className={styles.loadingOverlay}>
            <Spin size="large" />
            <span className={styles.loadingText}>
              Connecting to remote session...
            </span>
          </div>
        ) : null}

        {status === 'error' && (
          <div className={styles.errorOverlay}>
            <Alert
              message="Connection Error"
              description={errorMessage || 'Unable to establish connection.'}
              type="error"
              showIcon
              action={
                <Button size="small" type="primary" onClick={connect}>
                  Retry
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
};

export default VncPreview;
