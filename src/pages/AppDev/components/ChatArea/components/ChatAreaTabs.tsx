import { SyncOutlined } from '@ant-design/icons';
import { Segmented } from 'antd';
import React, { useEffect } from 'react';
import { useModel } from 'umi';

interface ChatAreaTabsProps {
  activeTab: 'chat' | 'data' | 'design';
  setActiveTab: (tab: 'chat' | 'data' | 'design') => void;
  isSupportDesignMode: boolean;
}

const ChatAreaTabs: React.FC<ChatAreaTabsProps> = ({
  activeTab,
  setActiveTab,
  isSupportDesignMode,
}) => {
  const { isIframeLoaded, iframeDesignMode } = useModel('appDevDesign');
  console.log('ChatAreaTabs render:', {
    activeTab,
    isIframeLoaded,
    iframeDesignMode,
    isSupportDesignMode,
  });

  // 监听 iframeDesignMode 变化，同步 Tab 状态
  useEffect(() => {
    if (iframeDesignMode) {
      setActiveTab('design');
    } else if (activeTab === 'design') {
      // 只有当前是 design 且 iframeDesignMode 变为 false 时才切回 chat
      // 如果本来就在 data 或 chat，不需要切换
      setActiveTab('chat');
    }
  }, [iframeDesignMode]);

  const handleTabChange = (value: 'chat' | 'data' | 'design') => {
    if (value === 'design') {
      if (!isIframeLoaded) return;
      // 不立即切换到 design，而是等待 iframeDesignMode 变化后的副作用来切换
      // 这样可以保持与原来 ToggleDesignBtn 相同的逻辑：完全由 iframeDesignMode 控制
    } else {
      setActiveTab(value);
    }

    // 切换 Tab 时，同步 iframe 的设计模式状态
    const iframe = document.querySelector('iframe');
    // ... rest of logic
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'TOGGLE_DESIGN_MODE',
          enabled: value === 'design',
          timestamp: Date.now(),
        },
        '*',
      );
    }
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
          { label: '对话', value: 'chat' },
          { label: '数据', value: 'data' },
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
                      设计
                    </div>
                  ),
                  value: 'design',
                  disabled: !isIframeLoaded,
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
