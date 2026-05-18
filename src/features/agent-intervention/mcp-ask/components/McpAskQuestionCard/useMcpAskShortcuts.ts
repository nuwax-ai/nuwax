import { useInterventionEscapeKey } from '../../../hooks/useInterventionEscapeKey';

interface UseMcpAskShortcutsOptions {
  enabled: boolean;
  onCancel: () => void;
}

/**
 * MCP Ask 键盘：Esc 关闭窗口（含 textarea 焦点时）
 */
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
