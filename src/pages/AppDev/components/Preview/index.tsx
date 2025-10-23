import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import { SANDBOX } from '@/constants/common.constants';
import {
  ExclamationCircleOutlined,
  GlobalOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
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
  /** 白屏检测回调 */
  onWhiteScreen?: () => void;
}

export interface PreviewRef {
  refresh: () => void;
  getIsLoading: () => boolean;
  getLastRefreshed: () => Date | null;
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
      onWhiteScreen,
    },
    ref,
  ) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [retrying, setRetrying] = useState(false);
    const [whiteScreenDetected, setWhiteScreenDetected] = useState(false);

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
        description = '正在生成，请稍候...';
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
        getIsLoading: () => isLoading,
        getLastRefreshed: () => lastRefreshed,
      }),
      [refreshPreview, isLoading, lastRefreshed],
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
      } else {
        // Dev server URL is empty, clearing iframe and resetting states

        setIsLoading(false);
        setLoadError(null);
        setLastRefreshed(new Date());
      }
    }, [devServerUrl, loadDevServerPreview]);

    // 白屏检测
    useEffect(() => {
      if (!devServerUrl || !iframeRef.current) return;

      const checkWhiteScreen = () => {
        try {
          const iframe = iframeRef.current;
          if (!iframe) return;

          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!doc) return;

          // 检查页面是否为空或只有空白内容
          const body = doc.body;
          if (!body) return;

          const bodyText = body.innerText?.trim() || '';
          const bodyHTML = body.innerHTML?.trim() || '';

          // 如果body为空或只有空白字符，认为是白屏
          if (bodyText === '' && bodyHTML === '') {
            if (!whiteScreenDetected) {
              setWhiteScreenDetected(true);
              onWhiteScreen?.();
              console.warn('[Preview] 检测到白屏');
            }
          } else {
            setWhiteScreenDetected(false);
          }
        } catch (error) {
          // 跨域或其他错误，忽略
          console.debug('[Preview] 白屏检测失败（可能是跨域）:', error);
        }
      };

      // 延迟检测，给页面加载时间
      const timer = setTimeout(checkWhiteScreen, 3000);

      return () => clearTimeout(timer);
    }, [devServerUrl, whiteScreenDetected, onWhiteScreen]);

    useEffect(() => {
      return () => {
        if (iframeRef.current) {
          iframeRef.current = null;
        }
      };
    }, []);

    return (
      <div className={`${styles.preview} ${className || ''}`}>
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
              sandbox={SANDBOX}
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
