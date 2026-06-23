import SvgIcon from '@/components/base/SvgIcon';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { t } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useLocation, useModel } from 'umi';

/**
 * 打开iframe页面
 * @description 打开iframe页面，用于打开外部链接
 */
const OpenIframePage: React.FC = () => {
  const location = useLocation();
  // url地址
  const [iframeUrl, setIframeUrl] = useState<string>('');

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
      <iframe
        src={iframeUrl}
        width="100%"
        height="100%"
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default OpenIframePage;
