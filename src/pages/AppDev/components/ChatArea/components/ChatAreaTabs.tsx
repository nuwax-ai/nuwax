import { dict } from '@/services/i18nRuntime';
import { SyncOutlined } from '@ant-design/icons';
import { Segmented } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './ChatAreaTabs.less';
import { useDesignModeTabSync } from './useDesignModeTabSync';

const cx = classNames.bind(styles);

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
  const {
    isIframeLoaded,
    iframeDesignMode,
    setIframeDesignMode,
    previewIframeElement,
  } = useModel('appDevDesign');
  const { handleTabChange, isDesignModeLoading } = useDesignModeTabSync({
    activeTab,
    setActiveTab,
    isIframeLoaded,
    isSupportDesignMode,
    iframeDesignMode,
    setIframeDesignMode,
    previewIframeElement,
  });

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
                      {isDesignModeLoading ? (
                        <SyncOutlined
                          spin
                          className={cx(styles.loadingIcon)}
                          aria-label="Loading design mode"
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
