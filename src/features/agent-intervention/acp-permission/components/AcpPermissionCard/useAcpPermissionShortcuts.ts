import { useEffect } from 'react';
import { useInterventionEscapeKey } from '../../../hooks/useInterventionEscapeKey';
import type { AcpPermissionOption } from '../../../types';

/** 选项 kind → 数字快捷键 */
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
}

/**
 * 权限卡片键盘快捷键：
 * - 1 / 2 / 3：按选项顺序（允许一次 / 始终允许 / 拒绝）
 * - Enter：允许一次（主操作）
 * - Escape：取消
 */
export function useAcpPermissionShortcuts({
  enabled,
  options,
  onSelect,
  onCancel,
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

    const findByKind = (kind: string) =>
      options.find((o) => o.kind === kind)?.optionId;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      if (event.key === 'Escape') {
        return;
      }

      if (
        event.key === 'Enter' &&
        !event.shiftKey &&
        !event.metaKey &&
        !event.ctrlKey
      ) {
        const allowOnceId = findByKind('allow_once');
        if (allowOnceId) {
          event.preventDefault();
          onSelect(allowOnceId);
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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, options, onSelect, onCancel]);
}

/** 展示在按钮上的快捷键文案 */
export function getAcpPermissionShortcutHint(kind: string): string | undefined {
  return KIND_DIGIT_KEY[kind];
}
