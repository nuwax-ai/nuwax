import { SANDBOX } from '@/constants/common.constants';
import { dict } from '@/services/i18nRuntime';
import { Button, Empty } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 嵌入页允许剪贴板与全屏，与 sandbox 配合使用 */
const IFRAME_ALLOW = 'clipboard-read; clipboard-write; fullscreen';

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

  useEffect(() => {
    setLoadError(false);
  }, [src, iframeKey]);

  const handleLoad = useCallback(() => {
    setLoadError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setLoadError(true);
    onError?.();
  }, [onError]);

  const handleRetry = useCallback(() => {
    setLoadError(false);
    onRetry?.();
    setReloadNonce((prev) => prev + 1);
  }, [onRetry]);

  return (
    <div className={cx(styles.wrap, className)}>
      <iframe
        key={`${src}-${String(iframeKey ?? '')}-${reloadNonce}`}
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
