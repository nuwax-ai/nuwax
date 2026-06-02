import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';
import { getFileIcon } from '@/utils/fileTree';
import {
  BranchesOutlined,
  CloseOutlined,
  CodeOutlined,
  DesktopOutlined,
  ExportOutlined,
  FullscreenExitOutlined,
  PlusOutlined,
  PushpinFilled,
  SunOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import MoreActionsMenu from '../FilePathHeader/MoreActionsMenu';
import type { FilePathHeaderProps } from '../FilePathHeader/type';
import type { PreviewTab, PreviewToolId } from '../hooks/usePreviewTabs';
import PreviewTabContextMenu from './PreviewTabContextMenu';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface PreviewTabBarProps {
  tabs: PreviewTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  /** 关闭除指定标签外的所有标签 */
  onCloseOtherTabs: (tabId: string) => void;
  /** 关闭所有标签 */
  onCloseAllTabs: () => void;
  /** 切换标签固定状态 */
  onTogglePinTab: (tabId: string) => void;
  /** 点击 + 打开「新建页签」内容标签 */
  onAddTab: () => void;
  /** 右侧文件操作区 props（复用原 FilePathHeader 能力） */
  headerActions?: FilePathHeaderProps;
}

/** 工具标签图标映射 */
const TOOL_ICON_MAP: Partial<Record<PreviewToolId, React.ReactNode>> = {
  preview: <DesktopOutlined style={{ fontSize: 14 }} />,
  editor: <CodeOutlined style={{ fontSize: 14 }} />,
  terminal: <ThunderboltOutlined style={{ fontSize: 14 }} />,
  'version-control': <BranchesOutlined style={{ fontSize: 14 }} />,
};

/**
 * 预览区顶部标签栏
 * 左侧为可切换/关闭的标签页，右侧为功能操作按钮
 */
const PreviewTabBar: React.FC<PreviewTabBarProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onCloseOtherTabs,
  onCloseAllTabs,
  onTogglePinTab,
  onAddTab,
  headerActions,
}) => {
  const targetNode = headerActions?.targetNode;
  const tabViewportRef = useRef<HTMLDivElement>(null);
  const tabTrackRef = useRef<HTMLDivElement>(null);
  const tabGutterRef = useRef<HTMLDivElement>(null);
  const [trackScrollWidth, setTrackScrollWidth] = useState(0);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    tabId: string | null;
  }>({ visible: false, x: 0, y: 0, tabId: null });

  const contextTab = tabs.find((tab) => tab.id === contextMenu.tabId) ?? null;

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false, tabId: null }));
  }, []);

  const handleTabContextMenu = useCallback(
    (e: React.MouseEvent, tabId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        tabId,
      });
    },
    [],
  );

  /** 标签栏快捷键（与右键菜单一致） */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeTabId) {
        return;
      }
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      if (e.altKey && !isMod && e.key.toLowerCase() === 'w' && !e.shiftKey) {
        e.preventDefault();
        onTabClose(activeTabId);
        return;
      }
      if (isMod && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        onCloseOtherTabs(activeTabId);
        return;
      }
      if (e.altKey && !isMod && e.key.toLowerCase() === 'w' && e.shiftKey) {
        e.preventDefault();
        onCloseAllTabs();
        return;
      }
      if (e.altKey && !isMod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        onTogglePinTab(activeTabId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTabId,
    onTabClose,
    onCloseOtherTabs,
    onCloseAllTabs,
    onTogglePinTab,
  ]);

  /** 同步 tabs 轨道宽度，供底部滚动条槽位使用 */
  useEffect(() => {
    const trackEl = tabTrackRef.current;
    if (!trackEl) {
      return;
    }

    const updateTrackWidth = () => {
      setTrackScrollWidth(trackEl.scrollWidth);
    };

    updateTrackWidth();
    const resizeObserver = new ResizeObserver(updateTrackWidth);
    resizeObserver.observe(trackEl);
    return () => {
      resizeObserver.disconnect();
    };
  }, [tabs]);

  /** 同步 tabs 视口与底部滚动条槽位的横向滚动位置 */
  useEffect(() => {
    const viewportEl = tabViewportRef.current;
    const gutterEl = tabGutterRef.current;
    if (!viewportEl || !gutterEl) {
      return;
    }

    let syncing = false;

    const syncScrollLeft = (from: HTMLDivElement, to: HTMLDivElement) => {
      if (syncing) {
        return;
      }
      syncing = true;
      to.scrollLeft = from.scrollLeft;
      syncing = false;
    };

    const handleViewportScroll = () => {
      syncScrollLeft(viewportEl, gutterEl);
    };
    const handleGutterScroll = () => {
      syncScrollLeft(gutterEl, viewportEl);
    };

    viewportEl.addEventListener('scroll', handleViewportScroll);
    gutterEl.addEventListener('scroll', handleGutterScroll);
    return () => {
      viewportEl.removeEventListener('scroll', handleViewportScroll);
      gutterEl.removeEventListener('scroll', handleGutterScroll);
    };
  }, [tabs.length, trackScrollWidth]);

  /** 鼠标滚轮纵向滑动时，转为 tabs 横向滚动 */
  useEffect(() => {
    const viewportEl = tabViewportRef.current;
    if (!viewportEl) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (viewportEl.scrollWidth <= viewportEl.clientWidth) {
        return;
      }

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (delta === 0) {
        return;
      }

      event.preventDefault();
      viewportEl.scrollLeft += delta;
    };

    viewportEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      viewportEl.removeEventListener('wheel', handleWheel);
    };
  }, [tabs.length, trackScrollWidth]);

  const renderTabIcon = (tab: PreviewTab) => {
    if (tab.type === 'picker') {
      return <PlusOutlined style={{ fontSize: 14 }} />;
    }
    if (tab.type === 'file' && tab.fileId) {
      return getFileIcon(tab.label);
    }
    if (tab.type === 'tool' && tab.toolId) {
      return TOOL_ICON_MAP[tab.toolId] || null;
    }
    return null;
  };

  return (
    <div className={cx(styles['tab-bar'])}>
      <div className={cx(styles['tab-bar-left'])}>
        <div className={cx(styles['tab-list-shell'])}>
          <div ref={tabViewportRef} className={cx(styles['tab-list-viewport'])}>
            <div ref={tabTrackRef} className={cx(styles['tab-list-track'])}>
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={cx(styles['tab-item'], {
                    [styles['tab-item-active']]: tab.id === activeTabId,
                    [styles['tab-item-pinned']]: tab.pinned,
                  })}
                  onClick={() => onTabSelect(tab.id)}
                  onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
                  title={tab.label}
                >
                  {tab.pinned && (
                    <PushpinFilled
                      className={cx(styles['tab-pin-icon'])}
                      style={{ fontSize: 10 }}
                    />
                  )}
                  <span className={cx(styles['tab-icon'])}>
                    {renderTabIcon(tab)}
                  </span>
                  <span className={cx(styles['tab-label'])}>{tab.label}</span>
                  <button
                    type="button"
                    className={cx(styles['tab-close'])}
                    aria-label={dict(
                      'PC.Pages.ConversationAgentPreviewTabBar.closeTab',
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTabClose(tab.id);
                    }}
                  >
                    <CloseOutlined style={{ fontSize: 10 }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div ref={tabGutterRef} className={cx(styles['tab-list-gutter'])}>
            <div
              className={cx(styles['tab-list-gutter-spacer'])}
              style={{ width: trackScrollWidth }}
            />
          </div>
        </div>

        <button
          type="button"
          className={cx(styles['add-tab-btn'])}
          aria-label={dict('PC.Pages.ConversationAgentPreviewTabBar.addTab')}
          onClick={onAddTab}
        >
          <PlusOutlined style={{ fontSize: 14 }} />
        </button>
      </div>

      <div className={cx(styles['right-actions'])}>
        <Tooltip title={dict('PC.Pages.ConversationAgentPreviewTabBar.theme')}>
          <button type="button" className={cx(styles['icon-btn'])}>
            <SunOutlined style={{ fontSize: 16 }} />
          </button>
        </Tooltip>

        <div className={cx(styles['icon-group'])}>
          <Tooltip
            title={dict(
              'PC.Pages.ConversationAgentPreviewTabBar.sourceControl',
            )}
          >
            <button type="button" className={cx(styles['icon-btn'])}>
              <BranchesOutlined style={{ fontSize: 16 }} />
            </button>
          </Tooltip>
          <Tooltip
            title={dict('PC.Pages.ConversationAgentPreviewTabBar.splitView')}
          >
            <button type="button" className={cx(styles['icon-btn'])}>
              <SvgIcon name="icons-common-copy" style={{ fontSize: 16 }} />
            </button>
          </Tooltip>
          <Tooltip
            title={dict('PC.Pages.ConversationAgentPreviewTabBar.openExternal')}
          >
            <button type="button" className={cx(styles['icon-btn'])}>
              <ExportOutlined style={{ fontSize: 16 }} />
            </button>
          </Tooltip>
        </div>

        {headerActions && (
          <div className={cx(styles['header-actions'])}>
            <div className={cx(styles['action-buttons'])}>
              {headerActions.isShowShare && targetNode?.fileProxyUrl && (
                <Tooltip
                  title={dict('PC.Components.FilePathHeader.share')}
                  placement="bottom"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={
                      <SvgIcon
                        name="icons-chat-share"
                        style={{ fontSize: 16 }}
                      />
                    }
                    className={styles['action-button']}
                  />
                </Tooltip>
              )}

              {(headerActions.showFullscreenIcon ||
                headerActions.isFullscreen) && (
                <Tooltip
                  title={
                    headerActions.isFullscreen
                      ? dict('PC.Components.FilePathHeader.exitFullscreen')
                      : dict('PC.Components.FilePathHeader.fullscreen')
                  }
                >
                  <Button
                    type="text"
                    size="small"
                    icon={
                      headerActions.isFullscreen ? (
                        <FullscreenExitOutlined style={{ fontSize: 16 }} />
                      ) : (
                        <SvgIcon
                          name="icons-common-fullscreen"
                          style={{ fontSize: 16 }}
                        />
                      )
                    }
                    onClick={headerActions.onFullscreen}
                    className={styles.actionButton}
                  />
                </Tooltip>
              )}

              {headerActions.showMoreActions && (
                <MoreActionsMenu
                  onImportProject={headerActions.onImportProject}
                  onRestartServer={headerActions.onRestartServer}
                  onRestartAgent={headerActions.onRestartAgent}
                  onExportProject={headerActions.onExportProject}
                  isCloudComputer={headerActions.isCloudComputer}
                />
              )}
            </div>
          </div>
        )}

        <Button className={cx(styles['action-btn'], styles['collaborate-btn'])}>
          {dict('PC.Pages.ConversationAgentPreviewTabBar.collaborate')}
        </Button>
        <Button
          type="primary"
          className={cx(styles['action-btn'], styles['deploy-btn'])}
        >
          {dict('PC.Pages.ConversationAgentPreviewTabBar.deploy')}
        </Button>
      </div>

      <PreviewTabContextMenu
        visible={contextMenu.visible}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        isPinned={!!contextTab?.pinned}
        onClose={closeContextMenu}
        onCloseTab={
          contextMenu.tabId ? () => onTabClose(contextMenu.tabId!) : undefined
        }
        onCloseOtherTabs={
          contextMenu.tabId
            ? () => onCloseOtherTabs(contextMenu.tabId!)
            : undefined
        }
        onCloseAllTabs={onCloseAllTabs}
        onTogglePin={
          contextMenu.tabId
            ? () => onTogglePinTab(contextMenu.tabId!)
            : undefined
        }
      />
    </div>
  );
};

export default PreviewTabBar;
