import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAcpPermissionShortcuts } from './useAcpPermissionShortcuts';

function ShortcutHarness({
  onSelect,
  onCancel,
}: {
  onSelect: (optionId: string) => void;
  onCancel: () => void;
}) {
  useAcpPermissionShortcuts({
    enabled: true,
    options: [
      { optionId: 'allow-once', kind: 'allow_once', name: 'Allow once' },
      { optionId: 'allow-always', kind: 'allow_always', name: 'Allow always' },
      { optionId: 'reject-once', kind: 'reject_once', name: 'Reject once' },
    ],
    onSelect,
    onCancel,
  });
  return <div>shortcuts</div>;
}

describe('useAcpPermissionShortcuts', () => {
  it('selects only explicit permission options', () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    render(<ShortcutHarness onSelect={onSelect} onCancel={onCancel} />);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onSelect).toHaveBeenNthCalledWith(1, 'allow-once');
    expect(onSelect).toHaveBeenNthCalledWith(2, 'reject-once');
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
