import { useEffect } from 'react';

export interface UseInterventionEscapeKeyOptions {
  /** 是否监听 Esc */
  enabled: boolean;
  /** Esc 时关闭/取消 */
  onEscape: () => void;
  /**
   * 为 true 时：焦点在 input/textarea/select 上不触发（避免打字时误关）
   * MCP Ask 文本输入场景建议 false，确保 Esc 总能关闭窗口
   */
  respectFormFieldFocus?: boolean;
}

function isFormFieldTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

/**
 * 干预窗口 Esc 关闭：ACP 权限 / MCP Ask 等共用
 */
export function useInterventionEscapeKey({
  enabled,
  onEscape,
  respectFormFieldFocus = true,
}: UseInterventionEscapeKeyOptions): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      if (respectFormFieldFocus && isFormFieldTarget(event.target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onEscape();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled, onEscape, respectFormFieldFocus]);
}
