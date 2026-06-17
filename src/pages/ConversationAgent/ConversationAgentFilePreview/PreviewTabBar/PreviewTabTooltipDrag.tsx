/**
 * 预览标签栏：Tooltip 与拖拽排序的协同逻辑。
 *
 * 目标行为：
 * - 鼠标在标签本体上：可点击切换、可拖拽排序（dnd-kit）；
 * - 鼠标在溢出文件名 Tooltip 气泡内：可选中/复制文字，不触发拖拽；
 * - 在 Tooltip 内选字后若在「同一标签」上松开导致合成 click：不切换标签（防误触）；
 * - 在 Tooltip 内选字后点击「其它标签」：一次点击即可切换，不消耗「抑制 click」。
 *
 * 实现要点：document 级指针监听 + 按 tabId Scoped 的 click 抑制 + Sortable disabled / 包装 listeners。
 */
import type { DraggableSyntheticListeners } from '@dnd-kit/core';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/** 预览标签栏 Tooltip 根节点 class（与 PreviewTabLabel 一致，portal 在 body） */
export const PREVIEW_TAB_LABEL_TOOLTIP_SELECTOR = '.preview-tab-label-tooltip';

/** 指针是否位于预览标签 Tooltip 气泡内（用于禁用 Sortable、拦截拖拽激活） */
export const isPointerOverPreviewTabTooltip = (
  clientX: number,
  clientY: number,
): boolean => {
  const el = document.elementFromPoint(clientX, clientY);
  return !!el?.closest(PREVIEW_TAB_LABEL_TOOLTIP_SELECTOR);
};

interface PreviewTabTooltipDragContextValue {
  isOverTooltip: boolean;
  /**
   * 仅当本次 click 落在曾发生 Tooltip 选字交互的标签上时消费抑制。
   * 点击其它标签返回 false，可立即切换。
   */
  consumeSuppressTabClick: (tabId: string) => boolean;
}

const PreviewTabTooltipDragContext =
  createContext<PreviewTabTooltipDragContextValue>({
    isOverTooltip: false,
    consumeSuppressTabClick: () => false,
  });

/**
 * 当前展示中的 Tooltip 属于哪条标签。
 * Tooltip 挂在 body，通过触发器上的 aria-describedby 反查所属 [data-preview-tab-id]。
 */
const getOpenPreviewTabTooltipTabId = (): string | null => {
  const tooltip = document.querySelector(PREVIEW_TAB_LABEL_TOOLTIP_SELECTOR);
  if (!tooltip?.id) {
    return null;
  }
  const trigger = document.querySelector(
    `[aria-describedby="${CSS.escape(tooltip.id)}"]`,
  );
  return (
    trigger
      ?.closest('[data-preview-tab-id]')
      ?.getAttribute('data-preview-tab-id') ?? null
  );
};

/** 从 pointer 事件目标或当前打开的 Tooltip 解析标签 id */
const resolveTabIdFromPointerEvent = (e: PointerEvent): string | null => {
  const fromTarget = (e.target as HTMLElement).closest('[data-preview-tab-id]');
  if (fromTarget) {
    return fromTarget.getAttribute('data-preview-tab-id');
  }
  return getOpenPreviewTabTooltipTabId();
};

interface PreviewTabTooltipDragProviderProps {
  children: React.ReactNode;
  /** pointercancel 后同步清理本地拖拽状态 */
  onDragCancel?: () => void;
}

/**
 * 提供 isOverTooltip / consumeSuppressTabClick，并注册 document 级指针与 click 监听。
 */
export const PreviewTabTooltipDragProvider: React.FC<
  PreviewTabTooltipDragProviderProps
> = ({ children, onDragCancel }) => {
  /** 指针是否在 Tooltip 上（驱动 useSortable disabled） */
  const [isOverTooltip, setIsOverTooltip] = useState(false);
  /** 是否从标签本体按下且尚未移入 Tooltip（用于中途取消拖拽激活） */
  const pointerDownOnTabRef = useRef(false);
  /** 是否从 Tooltip 内按下 */
  const pointerDownOnTooltipRef = useRef(false);
  /**
   * 仅需忽略下一次 click 的标签 id。
   * 典型场景：在 Tooltip 选字后 mouseup 落在同一标签上，浏览器会合成 click。
   */
  const suppressTabClickTabIdRef = useRef<string | null>(null);

  const consumeSuppressTabClick = useCallback((tabId: string) => {
    if (suppressTabClickTabIdRef.current !== tabId) {
      return false;
    }
    suppressTabClickTabIdRef.current = null;
    return true;
  }, []);

  useEffect(() => {
    const syncOver = (e: PointerEvent) => {
      setIsOverTooltip(isPointerOverPreviewTabTooltip(e.clientX, e.clientY));
    };

    const onPointerDown = (e: PointerEvent) => {
      syncOver(e);
      const onTooltip = isPointerOverPreviewTabTooltip(e.clientX, e.clientY);
      pointerDownOnTooltipRef.current = onTooltip;
      const target = e.target as HTMLElement;
      const tabEl = target.closest('[data-preview-tab-id]');
      const onTabItem = !!tabEl;
      pointerDownOnTabRef.current = onTabItem && !onTooltip;

      // 开始点击其它标签时，清除「仅抑制上一标签」的标记，保证一次点击即可切换
      if (onTabItem && !onTooltip) {
        const tabId = tabEl?.getAttribute('data-preview-tab-id');
        if (
          tabId &&
          suppressTabClickTabIdRef.current &&
          suppressTabClickTabIdRef.current !== tabId
        ) {
          suppressTabClickTabIdRef.current = null;
        }
      }
    };

    // 从标签按下后移入 Tooltip：取消 dnd-kit 的拖拽激活，避免与选字冲突
    const onPointerMove = (e: PointerEvent) => {
      syncOver(e);
      if (e.buttons === 0 || !pointerDownOnTabRef.current) {
        return;
      }
      if (!isPointerOverPreviewTabTooltip(e.clientX, e.clientY)) {
        return;
      }

      pointerDownOnTabRef.current = false;
      document.dispatchEvent(
        new PointerEvent('pointercancel', {
          bubbles: true,
          cancelable: true,
          pointerId: e.pointerId,
          clientX: e.clientX,
          clientY: e.clientY,
        }),
      );
      onDragCancel?.();
    };

    // Tooltip 内按下或抬起：标记「可能产生误触 click」的所属标签 id
    const onPointerUp = (e: PointerEvent) => {
      const endedOnTooltip = isPointerOverPreviewTabTooltip(
        e.clientX,
        e.clientY,
      );
      if (pointerDownOnTooltipRef.current || endedOnTooltip) {
        suppressTabClickTabIdRef.current =
          resolveTabIdFromPointerEvent(e) ?? getOpenPreviewTabTooltipTabId();
      }
      pointerDownOnTabRef.current = false;
      pointerDownOnTooltipRef.current = false;
    };

    // 直接点在 Tooltip 内：同样只抑制所属标签的后续 click
    const onClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(PREVIEW_TAB_LABEL_TOOLTIP_SELECTOR)) {
        suppressTabClickTabIdRef.current = getOpenPreviewTabTooltipTabId();
      }
    };

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    document.addEventListener('click', onClickCapture, true);

    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      document.removeEventListener('click', onClickCapture, true);
    };
  }, [onDragCancel]);

  const contextValue = useMemo(
    () => ({ isOverTooltip, consumeSuppressTabClick }),
    [isOverTooltip, consumeSuppressTabClick],
  );

  return (
    <PreviewTabTooltipDragContext.Provider value={contextValue}>
      {children}
    </PreviewTabTooltipDragContext.Provider>
  );
};

export const usePreviewTabTooltipDrag = (): PreviewTabTooltipDragContextValue =>
  useContext(PreviewTabTooltipDragContext);

export const useIsPointerOverPreviewTabTooltip = (): boolean =>
  usePreviewTabTooltipDrag().isOverTooltip;

/** 选区是否落在预览标签 Tooltip 内 */
export const isSelectionInPreviewTabTooltip = (): boolean => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    return false;
  }
  const tooltip = document.querySelector(PREVIEW_TAB_LABEL_TOOLTIP_SELECTOR);
  if (!tooltip) {
    return false;
  }
  const { anchorNode, focusNode } = selection;
  return (
    (!!anchorNode && tooltip.contains(anchorNode)) ||
    (!!focusNode && tooltip.contains(focusNode))
  );
};

/**
 * 是否应忽略本次标签 click。
 * - 选区在 Tooltip 内且点击的是该 Tooltip 所属标签 → true（避免选字后误切换）；
 * - 点击其它标签 → false，并清除残留选区，保证一次点击切换。
 */
export const shouldIgnoreTabClickForTooltipSelection = (
  tabId: string,
): boolean => {
  if (!isSelectionInPreviewTabTooltip()) {
    return false;
  }
  const ownerTabId = getOpenPreviewTabTooltipTabId();
  if (!ownerTabId || ownerTabId !== tabId) {
    window.getSelection()?.removeAllRanges();
    return false;
  }
  return true;
};

/**
 * 包装 dnd-kit listeners：指针在 Tooltip 上时不向 Sortable 传递 onPointerDown。
 */
export const useTabSortableListeners = (
  listeners: DraggableSyntheticListeners | undefined,
): DraggableSyntheticListeners | undefined => {
  const isOverTooltip = useIsPointerOverPreviewTabTooltip();

  return useMemo(() => {
    if (!listeners) {
      return undefined;
    }

    const { onPointerDown, ...rest } = listeners;
    return {
      ...rest,
      onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
        if (isOverTooltip) {
          return;
        }
        const native = event.nativeEvent as PointerEvent;
        if (isPointerOverPreviewTabTooltip(native.clientX, native.clientY)) {
          return;
        }
        onPointerDown?.(event);
      },
    };
  }, [listeners, isOverTooltip]);
};
