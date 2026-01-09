/**
 * useDialogState Hook 测试
 */

import { CreateUpdateModeEnum } from '@/types/enums/common';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDialogState } from '../../hooks/useDialogState';

describe('useDialogState', () => {
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useDialogState());

    expect(result.current.isHistoryConversationOpen).toBe(false);
    expect(result.current.isTimedTaskOpen).toBe(false);
    expect(result.current.timedTaskMode).toBeUndefined();
  });

  it('should open and close history conversation', () => {
    const { result } = renderHook(() => useDialogState());

    act(() => {
      result.current.openHistoryConversation();
    });
    expect(result.current.isHistoryConversationOpen).toBe(true);

    act(() => {
      result.current.closeHistoryConversation();
    });
    expect(result.current.isHistoryConversationOpen).toBe(false);
  });

  it('should open and close timed task', () => {
    const { result } = renderHook(() => useDialogState());

    act(() => {
      result.current.openTimedTask(CreateUpdateModeEnum.Create);
    });
    expect(result.current.isTimedTaskOpen).toBe(true);
    expect(result.current.timedTaskMode).toBe(CreateUpdateModeEnum.Create);

    act(() => {
      result.current.closeTimedTask();
    });
    expect(result.current.isTimedTaskOpen).toBe(false);
  });
});
