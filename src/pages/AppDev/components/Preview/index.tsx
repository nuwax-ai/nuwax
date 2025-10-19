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

/** 资源错误监听脚本 - 注入到 iframe 内部用于捕获资源加载错误 */
const RESOURCE_ERROR_LISTENER_SCRIPT = `
  (function() {
    // 监听资源加载错误
    window.addEventListener('error', function(event) {
      if (event.target !== window) {
        const target = event.target;
        const errorInfo = {
          type: target.tagName.toLowerCase(),
          url: target.src || target.href || '',
          message: event.message || '资源加载失败',
          timestamp: Date.now(),
          // 添加更详细的错误信息
          errorType: event.type,
          filename: event.filename || '',
          lineno: event.lineno || 0,
          colno: event.colno || 0,
          // 尝试获取网络错误信息
          networkError: event.target.error ? {
            code: event.target.error.code,
            message: event.target.error.message
          } : null
        };
        
        // 发送错误信息到父窗口
        window.parent.postMessage({
          type: 'RESOURCE_ERROR',
          data: errorInfo
        }, '*');
      }
    }, true);
    
    // 监听未捕获的 Promise 错误
    window.addEventListener('unhandledrejection', function(event) {
      window.parent.postMessage({
        type: 'RESOURCE_ERROR',
        data: {
          type: 'promise',
          url: '',
          message: event.reason?.message || String(event.reason),
          timestamp: Date.now(),
          errorType: 'unhandledrejection'
        }
      }, '*');
    });
    
    // 监听网络错误（fetch/XMLHttpRequest）
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).catch(error => {
        window.parent.postMessage({
          type: 'RESOURCE_ERROR',
          data: {
            type: 'fetch',
            url: args[0]?.toString() || '',
            message: error.message || '网络请求失败',
            timestamp: Date.now(),
            errorType: 'fetch',
            networkError: {
              code: error.code,
              message: error.message,
              stack: error.stack
            }
          }
        }, '*');
        throw error;
      });
    };
  })();
`;

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

      // 尝试注入资源错误监听脚本
      if (iframeRef.current?.contentWindow) {
        try {
          // 检查是否可以访问 iframe 的 document（同源检查）
          const iframeDoc = iframeRef.current.contentWindow.document;
          if (iframeDoc) {
            const script = iframeDoc.createElement('script');
            script.textContent = RESOURCE_ERROR_LISTENER_SCRIPT;
            iframeDoc.head.appendChild(script);
            console.log('[Preview] 资源错误监听脚本注入成功');
          }
        } catch (error) {
          // 跨域限制，无法注入脚本
          console.info(
            '[Preview] 跨域限制：无法注入错误监听脚本，只能捕获 iframe 本身加载错误',
          );
          setIsCrossOrigin(true);

          // 在跨域情况下，我们可以通过其他方式尝试获取错误信息
          // 比如监听 iframe 的 onerror 事件或者使用其他方法
          if (iframeRef.current) {
            // 设置额外的错误监听
            iframeRef.current.addEventListener('error', () => {
              const errorInfo: ResourceErrorInfo = {
                type: 'iframe',
                url: iframeRef.current?.src || '',
                message: 'iframe 加载失败（跨域限制）',
                timestamp: Date.now(),
              };

              setResourceErrors((prev) => [...prev, errorInfo]);
              onResourceError?.(errorInfo);
              console.error('[Preview] iframe 加载错误（跨域）:', errorInfo);
            });
          }
        }
      }
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

    // 设置 postMessage 监听器处理资源错误
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'RESOURCE_ERROR') {
          const errorInfo = event.data.data as ResourceErrorInfo;

          // 更新错误列表（限制最大数量避免内存泄漏）
          setResourceErrors((prev) => {
            const newErrors = [...prev, errorInfo];
            return newErrors.length > 50 ? newErrors.slice(-50) : newErrors;
          });

          // 控制台输出详细日志
          console.error('[Preview] 资源加载失败:', errorInfo);

          // 调用父组件回调
          onResourceError?.(errorInfo);

          // UI 提示（根据错误类型和严重程度）
          if (errorInfo.type === 'script' || errorInfo.type === 'style') {
            // 关键资源错误，显示在主要错误区域
            setLoadError(`关键资源加载失败: ${errorInfo.url}`);
          } else if (
            errorInfo.type === 'fetch' &&
            errorInfo.networkError?.code
          ) {
            // 网络错误，显示状态码信息
            const statusCode = errorInfo.networkError.code;
            if (statusCode >= 500) {
              setLoadError(`服务器错误 (${statusCode}): ${errorInfo.url}`);
            } else if (statusCode >= 400) {
              console.warn(
                `[Preview] 客户端错误 (${statusCode}): ${errorInfo.url}`,
              );
            }
          }
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [onResourceError]);

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
                  ? serverErrorCode
                    ? `服务器错误 (${formatErrorCode(serverErrorCode)})`
                    : '服务器错误'
                  : isProjectUploading
                  ? '导入项目中'
                  : isRestarting
                  ? '重启中'
                  : isStarting
                  ? '启动中'
                  : startError
                  ? serverErrorCode
                    ? `开发服务器启动失败 (${formatErrorCode(serverErrorCode)})`
                    : '开发服务器启动失败'
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
              maxDescriptionLength={150} // 限制描述文本长度
              allowDescriptionWrap={true} // 允许换行显示
              maxLines={4} // 最多显示 4 行
              clickableDescription={true} // 启用点击查看完整内容
              viewFullTextButtonText="查看完整错误信息" // 自定义按钮文本
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
