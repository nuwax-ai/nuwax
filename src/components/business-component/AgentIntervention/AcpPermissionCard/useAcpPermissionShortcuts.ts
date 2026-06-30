import { useEffect } from 'react';
import {
  isFormFieldTarget,
  useInterventionEscapeKey,
} from '../hooks/useInterventionEscapeKey';
import type { AcpPermissionOption } from '../types/acpIntervention';

const KIND_DIGIT_KEY: Partial<Record<string, string>> = {
  allow_once: '1',
  allow_always: '2',
  reject_once: '3',
};

interface UseAcpPermissionShortcutsOptions {
  enabled: boolean;
  options: AcpPermissionOption[];
  onSelect: (optionId: string) => void;
  onCancel: () => void;
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
}

export function useAcpPermissionShortcuts({
  enabled,
  options,
  onSelect,
  onCancel,
  activeIndex,
  setActiveIndex,
}: UseAcpPermissionShortcutsOptions): void {
  useInterventionEscapeKey({
    enabled,
    onEscape: onCancel,
    respectFormFieldFocus: true,
  });

  useEffect(() => {
    if (!enabled || !options.length) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isFormFieldTarget(event.target)) {
        return;
      }

      if (event.key === 'Escape') {
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((prev) => {
          const count = options.length;
          if (count === 0) return prev;
          if (event.key === 'ArrowDown') {
            return (prev + 1) % count;
          } else {
            return (prev - 1 + count) % count;
          }
        });
        return;
      }

      if (
        event.key === 'Enter' &&
        !event.shiftKey &&
        !event.metaKey &&
        !event.ctrlKey
      ) {
        event.preventDefault();
        const activeOption = options[activeIndex];
        if (activeOption) {
          onSelect(activeOption.optionId);
        }
        return;
      }

      const digit = event.key.length === 1 ? event.key : '';
      if (!/^[1-9]$/.test(digit)) {
        return;
      }

      const matched = options.find(
        (option) => KIND_DIGIT_KEY[option.kind] === digit,
      );
      if (matched) {
        event.preventDefault();
        onSelect(matched.optionId);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled, onSelect, options, activeIndex, setActiveIndex]);
}

export function getAcpPermissionShortcutHint(kind: string): string | undefined {
  return KIND_DIGIT_KEY[kind];
}
