import { dict } from '@/services/i18nRuntime';
import { getFileIcon } from '@/utils/fileTree';
import {
  BarChartOutlined,
  BranchesOutlined,
  CloseOutlined,
  CodeOutlined,
  DesktopOutlined,
  FormOutlined,
  PlusOutlined,
  PushpinFilled,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import type { Transform } from '@dnd-kit/utilities';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { PreviewTab, PreviewToolId } from '../hooks/usePreviewTabs';
import PreviewTabContextMenu from './PreviewTabContextMenu';
import PreviewTabLabel from './PreviewTabLabel';
import {
  isPointerOverPreviewTabTooltip,
  PreviewTabTooltipDragProvider,
  shouldIgnoreTabClickForTooltipSelection,
  usePreviewTabTooltipDrag,
  useTabSortableListeners,
} from './PreviewTabTooltipDrag';
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
  /** 拖拽结束后更新标签顺序 */
  onTabReorder: (activeId: string, overId: string) => void;
  /** 点击 + 打开「新建页签」内容标签 */
  onAddTab: () => void;
}

interface TabItemFaceProps {
  tab: PreviewTab;
  renderTabIcon: (tab: PreviewTab) => React.ReactNode;
  onClose?: () => void;
  overlay?: boolean;
}

/** 标签外观（列表项与 DragOverlay 共用；激活态由外层 .tab-item-active 控制） */
const TabItemFace: React.FC<TabItemFaceProps> = ({
  tab,
  renderTabIcon,
  onClose,
  overlay = false,
}) => (
  <>
    {tab.pinned && (
      <PushpinFilled
        className={cx(styles['tab-pin-icon'])}
        style={{ fontSize: 10 }}
      />
    )}
    <span className={cx(styles['tab-icon'])}>{renderTabIcon(tab)}</span>
    <span className={cx(styles['tab-label-wrap'])}>
      <PreviewTabLabel className={cx(styles['tab-label'])} text={tab.label} />
    </span>
    {!overlay && onClose && (
      <button
        type="button"
        className={cx(styles['tab-close'])}
        aria-label={dict('PC.Pages.ConversationAgentPreviewTabBar.closeTab')}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <CloseOutlined style={{ fontSize: 10 }} />
      </button>
    )}
  </>
);

/**
 * 排序动画仅保留横向位移。
 * sortable 默认 transform 含 Y 分量，在 overflow-y:hidden 的视口内会把其他标签挤出可见区域。
 */
const getHorizontalSortableStyle = (
  transform: Transform | null,
  transition: string | undefined,
  isDragging: boolean,
): React.CSSProperties => {
  if (isDragging) {
    return { opacity: 0 };
  }
  if (!transform) {
    return { transition };
  }
  return {
    transform: `translate3d(${Math.round(transform.x)}px, 0, 0)`,
    transition,
  };
};

/** 标签滚入视口时的左右留白（与 @paddingXs 一致） */
const TAB_SCROLL_INTO_VIEW_PADDING = 8;

interface SortableTabItemProps {
  tab: PreviewTab;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  renderTabIcon: (tab: PreviewTab) => React.ReactNode;
  registerTabEl: (tabId: string, el: HTMLDivElement | null) => void;
}

/** 可拖拽排序的单个标签项（拖拽中由 DragOverlay 展示，原位占位透明） */
const SortableTabItem: React.FC<SortableTabItemProps> = ({
  tab,
  isActive,
  onSelect,
  onClose,
  onContextMenu,
  renderTabIcon,
  registerTabEl,
}) => {
  const { isOverTooltip: isPointerOverTabTooltip, consumeSuppressTabClick } =
    usePreviewTabTooltipDrag();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    // 指针在 Tooltip 上时禁用 Sortable，避免与气泡内选字冲突
  } = useSortable({ id: tab.id, disabled: isPointerOverTabTooltip });
  const tabDragListeners = useTabSortableListeners(listeners);

  /**
   * 切换标签前排除 Tooltip 相关误触（逻辑见 PreviewTabTooltipDrag）：
   * 1. 点击落在 Tooltip 气泡内 → 不切换；
   * 2. 刚在 Tooltip 选字后合成到「本标签」的 click → 不切换；
   * 3. 选区仍在 Tooltip 且点的是所属标签 → 不切换；点其它标签会清选区并切换。
   */
  const handleTabClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPointerOverPreviewTabTooltip(e.clientX, e.clientY)) {
        return;
      }
      if (consumeSuppressTabClick(tab.id)) {
        return;
      }
      if (shouldIgnoreTabClickForTooltipSelection(tab.id)) {
        return;
      }
      onSelect();
    },
    [consumeSuppressTabClick, onSelect, tab.id],
  );

  const setTabNodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      registerTabEl(tab.id, node);
    },
    [setNodeRef, registerTabEl, tab.id],
  );

  return (
    <div
      ref={setTabNodeRef}
      data-preview-tab-id={tab.id}
      style={getHorizontalSortableStyle(transform, transition, isDragging)}
      className={cx(styles['tab-item'], {
        [styles['tab-item-active']]: isActive,
        [styles['tab-item-pinned']]: tab.pinned,
      })}
      onClick={handleTabClick}
      onContextMenu={onContextMenu}
      {...attributes}
      {...tabDragListeners}
    >
      <TabItemFace tab={tab} renderTabIcon={renderTabIcon} onClose={onClose} />
    </div>
  );
};

/** 工具标签图标映射 */
const TOOL_ICON_MAP: Partial<Record<PreviewToolId, React.ReactNode>> = {
  preview: <DesktopOutlined style={{ fontSize: 14 }} />,
  arrange: <FormOutlined style={{ fontSize: 14 }} />,
  editor: <CodeOutlined style={{ fontSize: 14 }} />,
  terminal: <ThunderboltOutlined style={{ fontSize: 14 }} />,
  'version-control': <BranchesOutlined style={{ fontSize: 14 }} />,
  'subscription-setting': <SettingOutlined style={{ fontSize: 14 }} />,
  'subscription-stats': <BarChartOutlined style={{ fontSize: 14 }} />,
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
  onTabReorder,
  onAddTab,
}) => {
  const [activeDragTabId, setActiveDragTabId] = useState<string | null>(null);
  const tabSortSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );
  const activeDragTab = tabs.find((tab) => tab.id === activeDragTabId) ?? null;
  const tabViewportRef = useRef<HTMLDivElement>(null);
  const tabTrackRef = useRef<HTMLDivElement>(null);
  const tabGutterRef = useRef<HTMLDivElement>(null);
  const tabElMapRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const registerTabEl = useCallback(
    (tabId: string, el: HTMLDivElement | null) => {
      if (el) {
        tabElMapRef.current.set(tabId, el);
      } else {
        tabElMapRef.current.delete(tabId);
      }
    },
    [],
  );

  /** 将已激活但可能被横向滚动隐藏的标签滚入可见区域 */
  const scrollActiveTabIntoView = useCallback((tabId: string) => {
    const viewport = tabViewportRef.current;
    const tabEl = tabElMapRef.current.get(tabId);
    if (!viewport || !tabEl) {
      return;
    }

    if (viewport.scrollWidth <= viewport.clientWidth) {
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const tabRect = tabEl.getBoundingClientRect();
    const pad = TAB_SCROLL_INTO_VIEW_PADDING;

    if (tabRect.left < viewportRect.left + pad) {
      viewport.scrollLeft -= viewportRect.left - tabRect.left + pad;
    } else if (tabRect.right > viewportRect.right - pad) {
      viewport.scrollLeft += tabRect.right - viewportRect.right + pad;
    }

    if (tabGutterRef.current) {
      tabGutterRef.current.scrollLeft = viewport.scrollLeft;
    }
  }, []);
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

  /** 激活标签变化或列表变更后，确保当前标签在横向滚动视口内可见 */
  useEffect(() => {
    if (!activeTabId || activeDragTabId) {
      return;
    }

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => scrollActiveTabIntoView(activeTabId));
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [activeTabId, tabs, activeDragTabId, scrollActiveTabIntoView]);

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

  const handleTabDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragTabId(String(event.active.id));
  }, []);

  const handleTabDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragTabId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      onTabReorder(String(active.id), String(over.id));
    },
    [onTabReorder],
  );

  const handleTabDragCancel = useCallback(() => {
    setActiveDragTabId(null);
  }, []);

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
            {/* 标签页列表 */}
            <div ref={tabTrackRef} className={cx(styles['tab-list-track'])}>
              {/* Tooltip 选字 / 拖拽排序协同，见 PreviewTabTooltipDrag.tsx */}
              <PreviewTabTooltipDragProvider onDragCancel={handleTabDragCancel}>
                <DndContext
                  sensors={tabSortSensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleTabDragStart}
                  onDragEnd={handleTabDragEnd}
                  onDragCancel={handleTabDragCancel}
                >
                  <SortableContext
                    items={tabs.map((tab) => tab.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    {tabs.map((tab) => (
                      <SortableTabItem
                        key={tab.id}
                        tab={tab}
                        isActive={tab.id === activeTabId}
                        onSelect={() => onTabSelect(tab.id)}
                        onClose={() => onTabClose(tab.id)}
                        onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
                        renderTabIcon={renderTabIcon}
                        registerTabEl={registerTabEl}
                      />
                    ))}
                  </SortableContext>
                  <DragOverlay dropAnimation={null} adjustScale={false}>
                    {activeDragTab ? (
                      <div
                        className={cx(
                          styles['tab-item'],
                          styles['tab-item-overlay'],
                          {
                            [styles['tab-item-active']]:
                              activeDragTab.id === activeTabId,
                            [styles['tab-item-pinned']]: activeDragTab.pinned,
                          },
                        )}
                      >
                        <TabItemFace
                          tab={activeDragTab}
                          renderTabIcon={renderTabIcon}
                          overlay
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </PreviewTabTooltipDragProvider>
            </div>
          </div>
          <div ref={tabGutterRef} className={cx(styles['tab-list-gutter'])}>
            <div
              className={cx(styles['tab-list-gutter-spacer'])}
              style={{ width: trackScrollWidth }}
            />
          </div>
        </div>

        {/* 「+」号按钮，点击打开「新建页签」面板 */}
        <button
          type="button"
          className={cx(styles['add-tab-btn'])}
          aria-label={dict('PC.Pages.ConversationAgentPreviewTabBar.addTab')}
          onClick={onAddTab}
        >
          <PlusOutlined style={{ fontSize: 14 }} />
        </button>
      </div>

      {/* 右侧功能操作按钮区域 */}
      <div className={cx(styles['right-actions'])}>
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

      {/* 预览区标签页右键菜单（带淡入缩放过渡） */}
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
