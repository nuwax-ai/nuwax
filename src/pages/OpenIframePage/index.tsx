import SvgIcon from '@/components/base/SvgIcon';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { t } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useModel } from 'umi';

/**
 * 打开iframe页面
 * @description 打开iframe页面，用于打开外部链接
 */
const OpenIframePage: React.FC = () => {
  const location = useLocation();
  // url地址
  const [iframeUrl, setIframeUrl] = useState<string>('');
  /** 重复点击同一菜单时通过 _refresh 参数强制 iframe 重载 */
  const iframeKey = useMemo(() => {
    return new URLSearchParams(location.search).get('_refresh') || '0';
  }, [location.search]);

  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    const iframeUrl = url.get('url');
    if (iframeUrl) {
      setIframeUrl(decodeURIComponent(iframeUrl));
    }
  }, [location]);

  // 仅在 /app 下 BaseTemplate 组件中渲染时，才支持侧边栏展开操作
  const isAppShell = location.pathname.startsWith('/app/');
  const { isAppSidebarVisible, toggleAppSidebarVisible, isAppSidebarMode } =
    useModel('useOpenApp');
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  /** 生态市场页面域名地址，用于 postMessage 来源校验与回传 */
  const ecoWebOrigin = useMemo(() => {
    const ecoWebUrl = tenantConfigInfo?.ecoWebUrl;
    if (!ecoWebUrl) {
      return '';
    }

    return ecoWebUrl;
  }, [tenantConfigInfo?.ecoWebUrl]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 监听 iframe 消息（iframeUrl / iframeKey 变化时重新绑定，handler 内通过 ref 读取最新 iframe）
  useEffect(() => {
    if (!iframeUrl || !ecoWebOrigin) {
      return;
    }

    const handleMessage = async (e: MessageEvent) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) {
        return;
      }

      if (e.origin !== ecoWebOrigin) {
        return;
      }
      const { type, api, payload, requestId } = e.data;
      console.log('e.data回调数据: ', e.data, e);
      if (type === 'Request' && api) {
        try {
          const res = await fetch(api, {
            method: payload.method || 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...payload.headers,
            },
            body:
              payload.method !== 'GET'
                ? JSON.stringify(payload.body)
                : undefined,
            credentials: 'include', // 带父页面的 Cookie
          });
          const data = await res.json();
          // 返回结果
          iframe.contentWindow.postMessage(
            {
              type: 'Response',
              requestId, // 原样带回，方便 iframe 匹配请求
              ok: res.ok,
              status: res.status,
              data,
            },
            ecoWebOrigin,
          );
        } catch (err) {
          iframe.contentWindow.postMessage(
            {
              type: 'Response',
              requestId,
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            },
            ecoWebOrigin,
          );
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [iframeUrl, iframeKey, ecoWebOrigin]);

  return (
    <div className={classNames('h-full', 'w-full', 'relative')}>
      {/* 独立会话页面 BaseTemplate 侧边栏隐藏时的展开按钮 */}
      <ConditionRender
        condition={isAppShell && isAppSidebarMode && !isAppSidebarVisible}
      >
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
          }}
        >
          <TooltipIcon
            title={t('PC.Components.ConversationDetails.expandNavigation')}
            icon={
              <SvgIcon
                name="icons-nav-sidebar"
                style={{ fontSize: 16 }}
                onClick={toggleAppSidebarVisible}
              />
            }
          />
        </div>
      </ConditionRender>
      {iframeUrl && (
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={iframeUrl}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      )}
    </div>
  );
};

export default OpenIframePage;
