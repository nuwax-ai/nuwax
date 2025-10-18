import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import {
  ExclamationCircleOutlined,
  GlobalOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Spin } from 'antd';
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
  isRestarting?: boolean; // 新增
  isProjectUploading?: boolean; // 新增
  startError?: string | null;
  /** 服务器接口返回的消息 */
  serverMessage?: string | null;
  /** 启动开发服务器回调 */
  onStartDev?: () => void;
  /** 重启开发服务器回调 */
  onRestartDev?: () => void;
}

export interface PreviewRef {
  refresh: () => void;
}

/**
 * 预览组件
 * 用于显示开发服务器的实时预览
 */
const Preview = React.forwardRef<PreviewRef, PreviewProps>(
  (
    {
      devServerUrl,
      className,
      isStarting,
      isRestarting,
      isProjectUploading,
      startError,
      serverMessage,
      onStartDev,
      onRestartDev,
    },
    ref,
  ) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [retrying, setRetrying] = useState(false);

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
     * 重试预览
     */
    const retryPreview = useCallback(async () => {
      setRetrying(true);
      setLoadError(null);

      try {
        if (devServerUrl) {
          // 如果有开发服务器URL，重新加载预览
          loadDevServerPreview();
        } else if (devServerUrl === undefined && onRestartDev) {
          // 如果没有预览地址，调用重启开发服务器接口
          onRestartDev();
        } else if (onStartDev) {
          // 如果没有开发服务器URL，调用启动开发服务器接口
          onStartDev();
        } else {
          setLoadError('开发服务器URL不可用');
        }
      } catch (error) {
        setLoadError('重试失败，请检查网络连接');
      } finally {
        setRetrying(false);
      }
    }, [devServerUrl, loadDevServerPreview, onStartDev, onRestartDev]);

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
      setLoadError('预览加载失败，请检查开发服务器状态或网络连接');
      // Iframe load error
    }, []);

    // 当开发服务器URL可用时，自动加载预览
    useEffect(() => {
      // Dev server URL changed
      if (devServerUrl) {
        // Dev server URL available, loading preview
        loadDevServerPreview();
      } else {
        // Dev server URL is empty, clearing iframe and resetting states
        if (iframeRef.current) {
          iframeRef.current.src = '';
        }
        setIsLoading(false);
        setLoadError(null);
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

        <div className={styles.previewContainer}>
          {devServerUrl &&
          !loadError &&
          !serverMessage &&
          !isStarting &&
          !isRestarting &&
          !isProjectUploading ? (
            <iframe
              ref={iframeRef}
              className={styles.previewIframe}
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          ) : (
            <AppDevEmptyState
              type={
                loadError || serverMessage
                  ? 'error'
                  : isProjectUploading
                  ? 'loading'
                  : isRestarting
                  ? 'loading'
                  : isStarting
                  ? 'loading'
                  : startError
                  ? 'error'
                  : devServerUrl === undefined
                  ? 'no-data'
                  : 'empty'
              }
              icon={
                loadError || serverMessage ? (
                  <ExclamationCircleOutlined />
                ) : isProjectUploading ? (
                  <ThunderboltOutlined />
                ) : isRestarting ? (
                  <ThunderboltOutlined />
                ) : isStarting ? (
                  <ThunderboltOutlined />
                ) : startError ? (
                  <ExclamationCircleOutlined />
                ) : (
                  <GlobalOutlined />
                )
              }
              title={
                loadError
                  ? '预览加载失败'
                  : serverMessage
                  ? '服务器错误'
                  : isProjectUploading
                  ? '导入项目中'
                  : isRestarting
                  ? '重启中'
                  : isStarting
                  ? '启动中'
                  : startError
                  ? '开发服务器启动失败'
                  : devServerUrl === undefined
                  ? '暂无预览地址'
                  : '等待开发服务器启动'
              }
              description={
                serverMessage ||
                (loadError
                  ? '预览页面加载失败，请检查开发服务器状态或网络连接'
                  : isProjectUploading
                  ? '正在导入项目并重启开发服务器，请稍候...'
                  : isRestarting
                  ? '正在重启开发服务器，请稍候...'
                  : isStarting
                  ? '正在启动开发环境，请稍候...'
                  : startError
                  ? startError
                  : devServerUrl === undefined
                  ? '当前没有可用的预览地址，请先启动开发服务器'
                  : '正在连接开发服务器，请稍候...')
              }
              buttons={
                loadError || serverMessage
                  ? [
                      {
                        text: retrying ? '重试中...' : '重试',
                        icon: <ReloadOutlined />,
                        onClick: retryPreview,
                        loading: retrying,
                        disabled: retrying,
                      },
                      ...(serverMessage && onRestartDev
                        ? [
                            {
                              text: '重启服务器',
                              icon: <ThunderboltOutlined />,
                              onClick: onRestartDev,
                              type: 'primary' as const,
                            },
                          ]
                        : []),
                    ]
                  : isStarting || isRestarting || isProjectUploading
                  ? undefined // 启动中、重启中或导入项目中时不显示按钮
                  : onStartDev || onRestartDev
                  ? [
                      {
                        text: retrying ? '重启中...' : '重启服务',
                        icon: <ReloadOutlined />,
                        onClick: retryPreview,
                        loading: retrying,
                        disabled: retrying,
                      },
                    ]
                  : undefined
              }
            />
          )}
        </div>
      </div>
    );
  },
);

Preview.displayName = 'Preview';

export default Preview;
