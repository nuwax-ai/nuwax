import { useInterventionEscapeKey } from '../../hooks/useInterventionEscapeKey';

interface UseMcpAskShortcutsOptions {
  enabled: boolean;
  onCancel: () => void;
}

export function useMcpAskShortcuts({
  enabled,
  onCancel,
}: UseMcpAskShortcutsOptions): void {
  useInterventionEscapeKey({
    enabled,
    onEscape: onCancel,
    respectFormFieldFocus: false,
  });
}
