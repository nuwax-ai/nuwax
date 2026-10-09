import useExclusiveDropdown from '@/hooks/useExclusiveDropdown';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('useExclusiveDropdown', () => {
  it('迟到的旧入口关闭回调不会把新菜单关闭', () => {
    const { result } = renderHook(() => useExclusiveDropdown());
    const oldMenu = result.current.getDropdownProps('context');
    act(() => oldMenu.onOpenChange(true));
    act(() => result.current.getDropdownProps('more').onOpenChange(true));
    act(() => oldMenu.onOpenChange(false));
    expect(result.current.getDropdownProps('context').open).toBe(false);
    expect(result.current.getDropdownProps('more').open).toBe(true);
    act(() => result.current.close());
    expect(result.current.getDropdownProps('more').open).toBe(false);
  });
});
