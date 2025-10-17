import {
  ExclamationCircleOutlined,
  GlobalOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Alert, Button, Spin } from 'antd';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import styles from './index.less';

interface PreviewProps {
  devServerUrl?: string;
  className?: string;
  isStarting?: boolean;
  startError?: string | null;
}

export interface PreviewRef {
  refresh: () => void;
}

/**
 * 预览组件
 * 用于显示开发服务器的实时预览
 */
const Preview = React.forwardRef<PreviewRef, PreviewProps>(
  ({ devServerUrl, className, isStarting, startError }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    /**
     * 加载开发服务器预览
     */
    const loadDevServerPreview = useCallback(() => {
      // Loading dev server preview...

      if (!devServerUrl) {
        // No dev server URL available
        setLoadError('开发服务器URL不可用');
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      if (iframeRef.current) {
        // Loading URL
        iframeRef.current.src = devServerUrl;
        setLastRefreshed(new Date());
      }
    }, [devServerUrl]);

    /**
     * 刷新预览
     */
    const refreshPreview = useCallback(() => {
      // 刷新预览

      if (devServerUrl) {
        loadDevServerPreview();
      } else if (iframeRef.current) {
        // 如果devServerUrl为空，清空iframe
        iframeRef.current.src = '';
        setLoadError('开发服务器URL不可用');
        setLastRefreshed(new Date());
      } else {
        // iframeRef.current 为空，无法刷新
      }
    }, [devServerUrl, loadDevServerPreview]);

    // 暴露refresh方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        refresh: refreshPreview,
      }),
      [refreshPreview],
    );

    /**
     * iframe加载完成处理
     */
    const handleIframeLoad = useCallback(() => {
      setIsLoading(false);
      setLoadError(null);
      // Iframe loaded successfully
    }, []);

    /**
     * iframe加载错误处理
     */
    const handleIframeError = useCallback(() => {
      setIsLoading(false);
      setLoadError('预览加载失败，请检查开发服务器状态');
      // Iframe load error
    }, []);

    // 当开发服务器URL可用时，自动加载预览
    useEffect(() => {
      // Dev server URL changed
      if (devServerUrl) {
        // Dev server URL available, loading preview
        loadDevServerPreview();
      } else {
        // Dev server URL is empty, clearing iframe
        if (iframeRef.current) {
          iframeRef.current.src = '';
        }
        setLoadError('开发服务器URL不可用');
        setLastRefreshed(new Date());
      }
    }, [devServerUrl, loadDevServerPreview]);

    return (
      <div className={`${styles.preview} ${className || ''}`}>
        <div className={styles.previewHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.titleSection}>
              <span className={styles.title}>页面预览</span>
              {devServerUrl && (
                <span className={styles.statusBadge}>开发服务器已连接</span>
              )}
              {isLoading && (
                <span className={styles.loadingBadge}>
                  <Spin size="small" />
                  加载中...
                </span>
              )}
              {lastRefreshed && (
                <span className={styles.lastUpdated}>
                  最后更新: {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <div className={styles.headerRight}>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={refreshPreview}
              disabled={isLoading || !devServerUrl}
              loading={isLoading}
              className={styles.refreshButton}
            >
              刷新
            </Button>
          </div>
        </div>

        {loadError && (
          <div className={styles.errorContainer}>
            <Alert
              message="预览加载失败"
              description={loadError}
              type="error"
              icon={<ExclamationCircleOutlined />}
              showIcon
              action={
                <Button size="small" onClick={refreshPreview}>
                  重试
                </Button>
              }
            />
          </div>
        )}

        <div className={styles.previewContainer}>
          {devServerUrl ? (
            <iframe
              ref={iframeRef}
              className={styles.previewIframe}
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          ) : isStarting ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Spin size="large" />
              </div>
              <h3 className={styles.emptyTitle}>开发服务器启动中</h3>
              <p className={styles.emptyDescription}>
                正在启动开发环境，请稍候...
              </p>
            </div>
          ) : startError ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} style={{ color: '#ff4d4f' }}>
                <ExclamationCircleOutlined />
              </div>
              <h3 className={styles.emptyTitle}>开发服务器启动失败</h3>
              <p className={styles.emptyDescription}>{startError}</p>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <GlobalOutlined />
              </div>
              <h3 className={styles.emptyTitle}>等待开发服务器启动</h3>
              <p className={styles.emptyDescription}>
                正在连接开发服务器，请稍候...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },
);

Preview.displayName = 'Preview';

export default Preview;
