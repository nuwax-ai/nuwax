import { SANDBOX } from '@/constants/common.constants';
import { dict } from '@/services/i18nRuntime';
import { Button, Empty } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 嵌入页允许剪贴板与全屏，与 sandbox 配合使用 */
const IFRAME_ALLOW = 'clipboard-read; clipboard-write; fullscreen';

/**
 * 浏览器给带 src 的 iframe 常先对 about:blank 打一次 load。
 * 这次不能当成应用就绪，否则会先收遮罩露出白页。
 *
 * @param frame iframe 元素
 * @returns 是否为空文档 load
 */
const isBlankIframeLoad = (frame: HTMLIFrameElement | null): boolean => {
  if (!frame) {
    return false;
  }
  try {
    const href = frame.contentWindow?.location?.href;
    return !href || href === 'about:blank';
  } catch {
    // 跨域读不了 location：能走到 load 视为真正页面
    return false;
  }
};

export interface AppDevProIframeProps {
  /** 嵌入地址 */
  src: string;
  /** 无障碍标题 */
  title: string;
  /** 额外重挂载标记（如刷新计数） */
  iframeKey?: React.Key;
  /** 外层容器类名 */
  className?: string;
  /** iframe 加载完成 */
  onLoad?: () => void;
  /** iframe 自身加载失败 */
  onError?: () => void;
  /** 点击刷新、即将重新加载 */
  onRetry?: () => void;
}

/**
 * AppDevPro 嵌入页 iframe：统一 sandbox 与 onError。
 * 同一实例的 load/error 只处理一次，避免 sandbox iframe 重复触发导致更新深度超限。
 *
 * @param props 嵌入页属性
 * @returns 带失败提示的 iframe
 */
const AppDevProIframe: React.FC<AppDevProIframeProps> = ({
  src,
  title,
  iframeKey,
  className,
  onLoad,
  onError,
  onRetry,
}) => {
  const [loadError, setLoadError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const instanceId = `${src}::${String(iframeKey ?? '')}::${reloadNonce}`;
  const settledInstanceRef = useRef('');
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onRetryRef = useRef(onRetry);
  const prevSrcKeyRef = useRef(`${src}::${String(iframeKey ?? '')}`);
  onLoadRef.current = onLoad;
  onErrorRef.current = onError;
  onRetryRef.current = onRetry;

  const srcKey = `${src}::${String(iframeKey ?? '')}`;
  if (prevSrcKeyRef.current !== srcKey) {
    prevSrcKeyRef.current = srcKey;
    if (loadError) {
      setLoadError(false);
    }
  }

  const handleLoad = useCallback(() => {
    if (settledInstanceRef.current === instanceId) {
      return;
    }
    if (isBlankIframeLoad(iframeRef.current)) {
      return;
    }
    settledInstanceRef.current = instanceId;
    setLoadError(false);
    onLoadRef.current?.();
  }, [instanceId]);

  const handleError = useCallback(() => {
    if (settledInstanceRef.current === instanceId) {
      return;
    }
    settledInstanceRef.current = instanceId;
    setLoadError(true);
    onErrorRef.current?.();
  }, [instanceId]);

  const handleRetry = useCallback(() => {
    settledInstanceRef.current = '';
    setLoadError(false);
    onRetryRef.current?.();
    setReloadNonce((prev) => prev + 1);
  }, []);

  return (
    <div className={cx(styles.wrap, className)}>
      <iframe
        ref={iframeRef}
        key={instanceId}
        className={cx(styles.iframe)}
        src={src}
        title={title}
        sandbox={SANDBOX}
        allow={IFRAME_ALLOW}
        onLoad={handleLoad}
        onError={handleError}
      />
      {loadError ? (
        <div className={cx(styles.errorOverlay)}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={dict('PC.Pages.AppDevPro.iframeLoadFailed')}
          />
          <Button type="primary" onClick={handleRetry}>
            {dict('PC.Common.Global.refresh')}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default AppDevProIframe;
