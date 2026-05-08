import { dict } from '@/services/i18nRuntime';
import { SyncOutlined } from '@ant-design/icons';
import { Button, Segmented } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';
import styles from './ChatAreaTabs.less';
import { useDesignModeTabSync } from './useDesignModeTabSync';

// 等到 iframe 加载完后切回 design 之前的小延迟，给 React 处理一轮 setState 的时间。
const RESYNC_TAB_TOGGLE_DELAY = 200;

// 兜底：如果 iframe load 事件迟迟不来（dev server 起得太慢），最长等 15s 后强制切 tab。
const RESYNC_LOAD_TIMEOUT = 15000;

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
  // 进入恢复流程时记录当时的 iframe 元素，方便等真正「重启后新 mount 的 iframe load 完成」。
  const preRecoveryIframeRef = useRef<HTMLIFrameElement | null>(null);
  // 'idle' → 平时；'awaiting-load' → 已经 await 完 restart，等新 iframe 触发 load 事件后切回 design。
  const [recoveryPhase, setRecoveryPhase] = useState<'idle' | 'awaiting-load'>(
    'idle',
  );

  const handleAckTimeout = useCallback(() => {
    if (autoResyncFiredRef.current) return;
    if (!onDesignModeUnreachable) return;
    autoResyncFiredRef.current = true;
    // 记录恢复前 iframe，使下方 useEffect 能识别「这是恢复后新 mount 的 iframe」而不是同一个。
    preRecoveryIframeRef.current = previewIframeElement;
    Promise.resolve(onDesignModeUnreachable()).finally(() => {
      // restart 完成 → 进入「等 iframe 重新加载」阶段，
      // 真正的 setActiveTab 切回 design 在下方 useEffect 收到 load 事件后再做。
      setRecoveryPhase('awaiting-load');
    });
  }, [onDesignModeUnreachable, previewIframeElement]);

  // 等重启之后新 mount 的 iframe 触发 load 事件，再模拟用户「切到 chat → 切回 design」，
  // 让 useDesignModeTabSync 的 auto-sync useEffect 在已经稳定的 iframe 上重发 TOGGLE_DESIGN_MODE。
  // 用 DOM 'load' 事件而不是 React 的 isIframeLoaded：后者在重启路径上不会发生 false→true 的状态切换，
  // 因为 Preview 没有在 iframe 卸载时把 isIframeLoaded 设回 false。
  useEffect(() => {
    if (recoveryPhase !== 'awaiting-load') return;
    if (!previewIframeElement) return;
    // 还没 mount 出新 iframe（仍是恢复前那一个），等下一次 effect 重跑。
    if (previewIframeElement === preRecoveryIframeRef.current) return;

    const iframe = previewIframeElement;
    let done = false;
    let safetyTimer: number | null = null;

    function handleSettled() {
      if (done) return;
      done = true;
      iframe.removeEventListener('load', handleSettled);
      if (safetyTimer !== null) window.clearTimeout(safetyTimer);
      setRecoveryPhase('idle');
      setActiveTab('chat');
      window.setTimeout(() => {
        setActiveTab('design');
      }, RESYNC_TAB_TOGGLE_DELAY);
    }

    iframe.addEventListener('load', handleSettled);
    safetyTimer = window.setTimeout(handleSettled, RESYNC_LOAD_TIMEOUT);

    return () => {
      done = true;
      iframe.removeEventListener('load', handleSettled);
      if (safetyTimer !== null) window.clearTimeout(safetyTimer);
    };
  }, [recoveryPhase, previewIframeElement, setActiveTab]);

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
