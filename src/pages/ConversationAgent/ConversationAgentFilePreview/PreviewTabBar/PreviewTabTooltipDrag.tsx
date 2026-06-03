import type { DraggableSyntheticListeners } from '@dnd-kit/core';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/** 预览标签栏 Tooltip 根节点 class（与 PreviewTabLabel 一致） */
export const PREVIEW_TAB_LABEL_TOOLTIP_SELECTOR = '.preview-tab-label-tooltip';

/** 指针是否位于预览标签 Tooltip 气泡内 */
export const isPointerOverPreviewTabTooltip = (
  clientX: number,
  clientY: number,
): boolean => {
  const el = document.elementFromPoint(clientX, clientY);
  return !!el?.closest(PREVIEW_TAB_LABEL_TOOLTIP_SELECTOR);
};

const PointerOverTabTooltipContext = createContext(false);

interface PreviewTabTooltipDragProviderProps {
  children: React.ReactNode;
  /** pointercancel 后同步清理本地拖拽状态 */
  onDragCancel?: () => void;
}

/**
 * 跟踪指针是否在标签 Tooltip 上，并在「从标签按下后移入 Tooltip」时取消 dnd-kit 激活。
 */
export const PreviewTabTooltipDragProvider: React.FC<
  PreviewTabTooltipDragProviderProps
> = ({ children, onDragCancel }) => {
  const [isOverTooltip, setIsOverTooltip] = useState(false);
  const pointerDownOnTabRef = useRef(false);

  useEffect(() => {
    const syncOver = (e: PointerEvent) => {
      setIsOverTooltip(isPointerOverPreviewTabTooltip(e.clientX, e.clientY));
    };

    const onPointerDown = (e: PointerEvent) => {
      syncOver(e);
      const target = e.target as HTMLElement;
      const onTabItem = !!target.closest('[data-preview-tab-id]');
      const onTooltip = isPointerOverPreviewTabTooltip(e.clientX, e.clientY);
      pointerDownOnTabRef.current = onTabItem && !onTooltip;
    };

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

    const onPointerUp = () => {
      pointerDownOnTabRef.current = false;
    };

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);

    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };
  }, [onDragCancel]);

  return (
    <PointerOverTabTooltipContext.Provider value={isOverTooltip}>
      {children}
    </PointerOverTabTooltipContext.Provider>
  );
};

export const useIsPointerOverPreviewTabTooltip = (): boolean =>
  useContext(PointerOverTabTooltipContext);

/** 指针在 Tooltip 上时不触发排序；在标签上按下时正常拖拽 */
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
