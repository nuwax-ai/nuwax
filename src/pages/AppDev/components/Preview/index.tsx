import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import {
  ExclamationCircleOutlined,
  GlobalOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Spin, Tooltip } from 'antd';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import styles from './index.less';

/** 网络错误信息 */
interface NetworkErrorInfo {
  code?: number;
  message?: string;
  stack?: string;
}

/** 资源错误信息 */
interface ResourceErrorInfo {
  type: 'iframe' | 'script' | 'style' | 'image' | 'other' | 'promise' | 'fetch';
  url: string;
  message: string;
  timestamp: number;
  errorType?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  networkError?: NetworkErrorInfo | null;
}

interface PreviewProps {
  devServerUrl?: string;
  className?: string;
  isStarting?: boolean;
  isDeveloping?: boolean;
  isRestarting?: boolean; // 新增
  isProjectUploading?: boolean; // 新增
  startError?: string | null;
  /** 服务器接口返回的消息 */
  serverMessage?: string | null;
  /** 服务器错误码 */
  serverErrorCode?: string | null;
  /** 启动开发服务器回调 */
  onStartDev?: () => void;
  /** 重启开发服务器回调 */
  onRestartDev?: () => void;
  /** 资源加载失败回调 */
  onResourceError?: (error: ResourceErrorInfo) => void;
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
      isDeveloping,
      isRestarting,
      isProjectUploading,
      startError,
      serverMessage,
      serverErrorCode,
      onStartDev,
      onRestartDev,
      onResourceError,
    },
    ref,
  ) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [retrying, setRetrying] = useState(false);
    const [resourceErrors, setResourceErrors] = useState<ResourceErrorInfo[]>(
      [],
    );
    const [isCrossOrigin, setIsCrossOrigin] = useState(false);

    /**
     * 获取错误类型前缀
     */
    const getErrorTypePrefix = useCallback(
      (errorCode: string | null | undefined) => {
        if (!errorCode) return '';

        // 根据错误码判断类型，目前只有三种：RESTART、START、KEEPALIVE
        if (errorCode.includes('RESTART') || errorCode.includes('restart')) {
          return 'RESTART';
        }
        if (errorCode.includes('START') || errorCode.includes('start')) {
          return 'START';
        }
        if (
          errorCode.includes('KEEPALIVE') ||
          errorCode.includes('keepalive')
        ) {
          return 'KEEPALIVE';
        }

        // 如果错误码不包含关键词，根据当前状态判断类型
        if (isRestarting) return 'RESTART';
        if (isStarting) return 'START';
        if (serverMessage) return 'KEEPALIVE';

        return '';
      },
      [isRestarting, isStarting, serverMessage],
    );

    /**
     * 格式化错误码显示
     */
    const formatErrorCode = useCallback(
      (errorCode: string | null | undefined) => {
        if (!errorCode) return '';

        const prefix = getErrorTypePrefix(errorCode);
        return prefix ? `${prefix}: ${errorCode}` : errorCode;
      },
      [getErrorTypePrefix],
    );

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
     * 获取空状态配置
     * 根据当前状态返回 AppDevEmptyState 的配置信息
     */
    const getEmptyStateConfig = useCallback(() => {
      // 判断当前状态类型
      const hasError = loadError || serverMessage;
      const isLoading =
        isProjectUploading || isRestarting || isDeveloping || isStarting;
      const hasStartError = !!startError;
      const noServerUrl = devServerUrl === undefined;

      // 确定状态类型
      let type: 'error' | 'loading' | 'no-data' | 'empty';
      if (hasError) {
        type = 'error';
      } else if (isLoading) {
        type = 'loading';
      } else if (noServerUrl) {
        type = 'no-data';
      } else {
        type = 'empty';
      }

      // 确定图标
      let icon: React.ReactNode;
      if (hasError) {
        icon = <ExclamationCircleOutlined />;
      } else if (isProjectUploading || isRestarting || isStarting) {
        icon = <ThunderboltOutlined />;
      } else if (hasStartError) {
        icon = <ExclamationCircleOutlined />;
      } else {
        icon = <GlobalOutlined />;
      }

      // 确定标题
      let title: string;
      if (loadError) {
        title = '预览加载失败';
      } else if (serverMessage) {
        title = serverErrorCode
          ? `服务器错误 (${formatErrorCode(serverErrorCode)})`
          : '服务器错误';
      } else if (isProjectUploading) {
        title = '导入项目中';
      } else if (isRestarting) {
        title = '重启中';
      } else if (isStarting) {
        title = '启动中';
      } else if (isDeveloping) {
        title = '开发中';
      } else if (hasStartError) {
        title = serverErrorCode
          ? `开发服务器启动失败 (${formatErrorCode(serverErrorCode)})`
          : '开发服务器启动失败';
      } else if (noServerUrl) {
        title = '暂无预览地址';
      } else {
        title = '等待开发服务器启动';
      }

      // 确定描述
      let description: string;
      if (serverMessage) {
        description = serverMessage;
      } else if (loadError) {
        description = '预览页面加载失败，请检查开发服务器状态或网络连接';
      } else if (isProjectUploading) {
        description = '正在导入项目并重启开发服务器，请稍候...';
      } else if (isRestarting) {
        description = '正在重启开发服务器，请稍候...';
      } else if (isStarting) {
        description = '正在启动开发环境，请稍候...';
      } else if (isDeveloping) {
        description = '正在开发中，请稍候...';
      } else if (hasStartError) {
        description = startError || '';
      } else if (noServerUrl) {
        description = '当前没有可用的预览地址，请先启动开发服务器';
      } else {
        description = '正在连接开发服务器，请稍候...';
      }

      // 确定按钮配置
      let buttons:
        | Array<{
            text: string;
            icon: React.ReactNode;
            onClick: () => void;
            loading?: boolean;
            disabled?: boolean;
            type?: 'primary';
          }>
        | undefined;

      if (hasError) {
        // 有错误时显示重试按钮
        buttons = [
          {
            text: retrying ? '重试中...' : '重试',
            icon: <ReloadOutlined />,
            onClick: retryPreview,
            loading: retrying,
            disabled: retrying,
          },
        ];

        // 如果是服务器错误且有重启回调，添加重启服务器按钮
        if (serverMessage && onRestartDev) {
          buttons.push({
            text: '重启服务器',
            icon: <ThunderboltOutlined />,
            onClick: onRestartDev,
            type: 'primary',
          });
        }
      } else if (isLoading) {
        // 加载中时不显示按钮
        buttons = undefined;
      } else if (onStartDev || onRestartDev) {
        // 其他情况且有启动/重启回调时显示重启服务按钮
        buttons = [
          {
            text: retrying ? '重启中...' : '重启服务',
            icon: <ReloadOutlined />,
            onClick: retryPreview,
            loading: retrying,
            disabled: retrying,
          },
        ];
      } else {
        buttons = undefined;
      }

      return {
        type,
        icon,
        title,
        description,
        buttons,
      };
    }, [
      loadError,
      serverMessage,
      isProjectUploading,
      isRestarting,
      isDeveloping,
      isStarting,
      startError,
      devServerUrl,
      serverErrorCode,
      formatErrorCode,
      retrying,
      retryPreview,
      onRestartDev,
      onStartDev,
    ]);

    /**
     * 刷新预览
     */
    const refreshPreview = useCallback(() => {
      // 刷新预览

      if (devServerUrl) {
        loadDevServerPreview();
      } else if (iframeRef.current) {
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
    }, [onResourceError]);

    /**
     * iframe加载错误处理
     */
    const handleIframeError = useCallback((...args: any[]) => {
      setIsLoading(false);
      setLoadError('预览加载失败，请检查开发服务器状态或网络连接');
      console.log('iframe加载错误', args);
      // Iframe load error
    }, []);

    // 移除脚本注入后，不再监听来自 iframe 的资源错误 postMessage

    // 当开发服务器URL可用时，自动加载预览
    useEffect(() => {
      // Dev server URL changed
      if (devServerUrl) {
        // Dev server URL available, loading preview
        loadDevServerPreview();
        // 清空之前的资源错误和跨域状态
        setResourceErrors([]);
        setIsCrossOrigin(false);
      } else {
        // Dev server URL is empty, clearing iframe and resetting states

        setIsLoading(false);
        setLoadError(null);
        setLastRefreshed(new Date());
        setResourceErrors([]);
        setIsCrossOrigin(false);
      }
    }, [devServerUrl, loadDevServerPreview]);

    useEffect(() => {
      return () => {
        if (iframeRef.current) {
          iframeRef.current = null;
        }
      };
    }, []);

    return (
      <div className={`${styles.preview} ${className || ''}`}>
        <div className={styles.previewHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.titleSection}>
              <span className={styles.title}>页面预览</span>
              {devServerUrl && (
                <span className={styles.statusBadge}>
                  开发服务器已连接
                  {isCrossOrigin && (
                    <span
                      style={{
                        marginLeft: '4px',
                        fontSize: '10px',
                        opacity: 0.7,
                      }}
                    >
                      (跨域模式)
                    </span>
                  )}
                </span>
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
              {resourceErrors.length > 0 && (
                <Tooltip
                  title={
                    <div>
                      <div>
                        检测到 {resourceErrors.length} 个资源加载错误：
                        {isCrossOrigin && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#ffa940',
                              marginTop: '2px',
                            }}
                          >
                            ⚠️ 跨域限制：只能捕获 iframe 本身错误
                          </div>
                        )}
                      </div>
                      {resourceErrors.slice(-5).map((error, index) => (
                        <div
                          key={index}
                          style={{ fontSize: '12px', marginTop: '4px' }}
                        >
                          <div style={{ fontWeight: 'bold' }}>
                            • {error.type}: {error.url || '未知资源'}
                          </div>
                          <div style={{ color: '#ff4d4f', marginLeft: '8px' }}>
                            {error.message}
                          </div>
                          {error.networkError && (
                            <div
                              style={{
                                color: '#999',
                                marginLeft: '8px',
                                fontSize: '11px',
                              }}
                            >
                              网络错误:{' '}
                              {error.networkError.message || '未知网络错误'}
                            </div>
                          )}
                        </div>
                      ))}
                      {resourceErrors.length > 5 && (
                        <div
                          style={{
                            fontSize: '12px',
                            marginTop: '4px',
                            color: '#999',
                          }}
                        >
                          ... 还有 {resourceErrors.length - 5} 个错误
                        </div>
                      )}
                    </div>
                  }
                  placement="bottom"
                >
                  <span className={styles.errorBadge}>
                    <ExclamationCircleOutlined />
                    {resourceErrors.length} 个错误
                    {isCrossOrigin && (
                      <span style={{ fontSize: '10px', marginLeft: '2px' }}>
                        ⚠️
                      </span>
                    )}
                  </span>
                </Tooltip>
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
          !isDeveloping &&
          !isProjectUploading ? (
            <iframe
              ref={iframeRef}
              className={styles.previewIframe}
              data-id={`${+(lastRefreshed || 0)}`}
              key={`${+(lastRefreshed || 0)}`} // 添加key属性，当devServerUrl变化时强制重新渲染iframe
              src={devServerUrl}
              title="Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          ) : (
            <AppDevEmptyState
              {...getEmptyStateConfig()}
              maxDescriptionLength={150} // 限制描述文本长度
              allowDescriptionWrap={true} // 允许换行显示
              maxLines={4} // 最多显示 4 行
              clickableDescription={true} // 启用点击查看完整内容
              viewFullTextButtonText="查看完整错误信息" // 自定义按钮文本
            />
          )}
        </div>
      </div>
    );
  },
);

Preview.displayName = 'Preview';

export default Preview;
