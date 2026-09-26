import VncPreview from '@/components/business-component/VncPreview';
import { dict } from '@/services/i18nRuntime';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import type { UserAppEnvPodStatus } from '../../hooks/useUserAppEnvPod';
import { getUserAppVncProxyUrl } from '../../services/appDevPro';
import styles from '../AppDevDatabasePanel/index.less';
import AppDevServiceStartStatus from '../AppDevStatusHero';

const cx = classNames.bind(styles);

export interface AppDevRemoteDesktopPanelProps {
  /** 应用 ID，用于拼远程桌面代理地址 */
  appId?: number;
  /** 真实开发会话 ID；不以 appId 替代会话/容器身份。 */
  conversationId?: number;
  serviceUrl?: string;
  /**
   * 开发环境容器状态。未传时直接加载 iframe。
   * 已传入时须 running 后才嵌入远程桌面，避免容器未就绪就请求 VNC 代理。
   */
  containerStatus?: UserAppEnvPodStatus;
  /** 容器启动失败时重试 */
  onRetryContainer?: () => Promise<void> | void;
}

/**
 * AppDevPro 远程桌面：容器就绪后嵌入开发环境 VNC 代理页。
 * 由父级仅在用户打开远程桌面时挂载，关闭后卸载，避免进页就请求代理地址。
 *
 * @param props.appId 应用 ID
 * @param props.containerStatus 开发环境容器状态
 * @returns 远程桌面面板
 */
const AppDevRemoteDesktopPanel: React.FC<AppDevRemoteDesktopPanelProps> = ({
  appId,
  conversationId,
  serviceUrl = process.env.BASE_URL || '',
  containerStatus,
  onRetryContainer,
}) => {
  const iframeSrc = useMemo(() => {
    if (!appId) {
      return '';
    }
    return getUserAppVncProxyUrl(appId);
  }, [appId]);

  const waitingContainer =
    containerStatus !== undefined && containerStatus !== 'running';

  if (waitingContainer) {
    return (
      <div className={cx(styles.container)}>
        <AppDevServiceStartStatus
          failed={containerStatus === 'error'}
          onRetry={onRetryContainer}
        />
      </div>
    );
  }

  if (!iframeSrc || !conversationId) {
    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.empty)}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={dict('PC.Pages.AppDevPro.remoteDesktopEmpty')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cx(styles.container)}>
      <VncPreview
        key={`${appId}:${conversationId}`}
        cId={String(conversationId)}
        serviceUrl={serviceUrl}
        sourceUrl={iframeSrc}
        appStage="dev"
        autoConnect
        onReconnect={onRetryContainer}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default AppDevRemoteDesktopPanel;
