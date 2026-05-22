import { useEffect } from 'react';

export interface UseInterventionEscapeKeyOptions {
  enabled: boolean;
  onEscape: () => void;
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
