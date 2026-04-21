import { dict } from '@/services/i18nRuntime';
import { SyncOutlined } from '@ant-design/icons';
import { Segmented } from 'antd';
import React, { useEffect } from 'react';
import { useModel } from 'umi';

interface ChatAreaTabsProps {
  activeTab: 'chat' | 'data' | 'design';
  setActiveTab: (tab: 'chat' | 'data' | 'design') => void;
  isSupportDesignMode: boolean;
  hiddenTabs?: Array<'chat' | 'data' | 'design'>;
}

const ChatAreaTabs: React.FC<ChatAreaTabsProps> = ({
  activeTab,
  setActiveTab,
  isSupportDesignMode,
  hiddenTabs = [],
}) => {
  const { isIframeLoaded, iframeDesignMode, setIframeDesignMode } =
    useModel('appDevDesign');

  /**
   * 向预览 iframe 同步设计模式状态
   * 说明：默认进入 design Tab 时并不会触发 onChange，因此需要在副作用里主动同步一次。
   */
  const syncIframeDesignMode = (enabled: boolean) => {
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'TOGGLE_DESIGN_MODE',
          enabled,
          timestamp: Date.now(),
        },
        '*',
      );
    }
  };

  // 监听 iframe 发送的 DESIGN_MODE_CHANGED 消息
  // 将此监听放在 ChatAreaTabs 中，因为 DesignViewer 在切换到 data tab 时会被卸载
  // 导致其内部的消息监听器被移除，iframeDesignMode 状态无法正确更新
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, enabled } = event.data;
      if (type === 'DESIGN_MODE_CHANGED') {
        setIframeDesignMode(enabled);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [setIframeDesignMode]);

  // 监听 iframeDesignMode 变化，同步 Tab 状态
  useEffect(() => {
    if (iframeDesignMode) {
      setActiveTab('design');
    } else if (activeTab === 'design') {
      // 只有当前是 design 且 iframeDesignMode 变为 false 时才切换
      // 如果 chat 被隐藏，则回退到 data；两者都隐藏时保持 design
      if (!hiddenTabs.includes('chat')) {
        setActiveTab('chat');
      } else if (!hiddenTabs.includes('data')) {
        setActiveTab('data');
      }
    }
  }, [iframeDesignMode, activeTab, hiddenTabs, setActiveTab]);

  /**
   * 当 activeTab 或 iframe 就绪状态变化时，同步 iframe 设计模式。
   * - 解决默认 tab=design 但未触发 onChange 导致 iframe 仍处于非设计态的问题。
   */
  useEffect(() => {
    if (!isIframeLoaded) {
      return;
    }
    syncIframeDesignMode(activeTab === 'design');
  }, [activeTab, isIframeLoaded]);

  const handleTabChange = (value: 'chat' | 'data' | 'design') => {
    if (value === 'design') {
      if (!isIframeLoaded) return;
      // 不立即切换到 design，而是等待 iframeDesignMode 变化后的副作用来切换
      // 这样可以保持与原来 ToggleDesignBtn 相同的逻辑：完全由 iframeDesignMode 控制
    } else {
      setActiveTab(value);
    }

    // 切换 Tab 时，同步 iframe 的设计模式状态
    // ... rest of logic
    syncIframeDesignMode(value === 'design');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 20px',
        borderBottom: '1px solid rgba(0, 0, 0, 10%)',
      }}
    >
      <Segmented
        value={activeTab}
        onChange={(value) =>
          handleTabChange(value as 'chat' | 'data' | 'design')
        }
        options={[
          ...(!hiddenTabs.includes('chat')
            ? [
                {
                  label: dict('PC.Pages.AppDevChatArea.chatTab'),
                  value: 'chat',
                },
              ]
            : []),
          ...(isSupportDesignMode
            ? [
                {
                  label: (
                    <div className="flex items-center gap-4">
                      {!isIframeLoaded ? (
                        <SyncOutlined
                          spin
                          style={{ fontSize: 12, marginRight: 4 }}
                        />
                      ) : null}
                      {dict('PC.Pages.AppDevChatArea.designTab')}
                    </div>
                  ),
                  value: 'design',
                  disabled: !isIframeLoaded,
                },
              ]
            : []),
          ...(!hiddenTabs.includes('data')
            ? [
                {
                  label: dict('PC.Pages.AppDevChatArea.dataTab'),
                  value: 'data',
                },
              ]
            : []),
        ]}
        block
      />
    </div>
  );
};

export default ChatAreaTabs;
