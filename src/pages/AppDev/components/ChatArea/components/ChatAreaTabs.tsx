import { dict } from '@/services/i18nRuntime';
import { SyncOutlined } from '@ant-design/icons';
import { Button, Segmented } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useRef } from 'react';
import { useModel } from 'umi';
import styles from './ChatAreaTabs.less';
import { useDesignModeTabSync } from './useDesignModeTabSync';

// 模拟「用户手动切回 chat 再切回 design」的间隔。给 iframe 完成 navigate 到新 dev URL 留时间。
const AUTO_RESYNC_DELAY = 800;

const cx = classNames.bind(styles);

interface ChatAreaTabsProps {
  activeTab: 'chat' | 'data' | 'design';
  setActiveTab: (tab: 'chat' | 'data' | 'design') => void;
  isSupportDesignMode: boolean;
  hiddenTabs?: Array<'chat' | 'data' | 'design'>;
  /**
   * iframe 在超时窗口内未回应 TOGGLE_DESIGN_MODE 时回调，调用方负责重启 dev server。
   * 可返回 Promise，恢复完成（restart + refresh）后再走自动 chat→design 切换。
   */
  onDesignModeUnreachable?: () => void | Promise<void>;
}

const ChatAreaTabs: React.FC<ChatAreaTabsProps> = ({
  activeTab,
  setActiveTab,
  isSupportDesignMode,
  hiddenTabs = [],
  onDesignModeUnreachable,
}) => {
  const {
    isIframeLoaded,
    iframeDesignMode,
    setIframeDesignMode,
    previewIframeElement,
  } = useModel('appDevDesign');

  // 整个页面生命周期内只走一次自动恢复，避免「ack 超时 → 自动切换 → 又 ack 超时 → 又切换」的循环。
  const autoResyncFiredRef = useRef(false);
  const handleAckTimeout = useCallback(() => {
    if (autoResyncFiredRef.current) return;
    if (!onDesignModeUnreachable) return;
    autoResyncFiredRef.current = true;
    // 页面层会先 restart + refresh，等它返回后再模拟用户手动「切回 chat → 切回 design」，
    // 强制 useDesignModeTabSync 的 auto-sync useEffect 在干净的 iframe 上重发 TOGGLE_DESIGN_MODE。
    Promise.resolve(onDesignModeUnreachable()).finally(() => {
      setActiveTab('chat');
      window.setTimeout(() => {
        setActiveTab('design');
      }, AUTO_RESYNC_DELAY);
    });
  }, [onDesignModeUnreachable, setActiveTab]);

  const { handleTabChange, syncIframeDesignMode, isDesignModeLoading } =
    useDesignModeTabSync({
      activeTab,
      setActiveTab,
      isIframeLoaded,
      isSupportDesignMode,
      iframeDesignMode,
      setIframeDesignMode,
      previewIframeElement,
      onAckTimeout: onDesignModeUnreachable ? handleAckTimeout : undefined,
    });

  const isOnlyDesignTab =
    hiddenTabs.includes('chat') &&
    hiddenTabs.includes('data') &&
    isSupportDesignMode;

  const handleDesignToggle = () => {
    if (!isIframeLoaded) return;
    if (activeTab === 'design') {
      if (iframeDesignMode) {
        syncIframeDesignMode(false);
      } else {
        syncIframeDesignMode(true);
      }
    } else {
      handleTabChange('design');
    }
  };

  if (isOnlyDesignTab) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 20px',
          borderBottom: '1px solid rgba(0, 0, 0, 10%)',
        }}
      >
        <Button
          type={iframeDesignMode ? 'primary' : 'default'}
          disabled={!isIframeLoaded}
          onClick={handleDesignToggle}
          icon={
            isDesignModeLoading ? (
              <SyncOutlined spin className={cx(styles.loadingIcon)} />
            ) : undefined
          }
        >
          {dict('PC.Pages.AppDevChatArea.designTab')}
        </Button>
      </div>
    );
  }

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
