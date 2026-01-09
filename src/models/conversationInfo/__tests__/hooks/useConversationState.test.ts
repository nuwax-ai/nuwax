/**
 * useConversationState Hook 测试
 */

import { EditAgentShowType } from '@/types/enums/space';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useConversationState } from '../../hooks/useConversationState';

describe('useConversationState', () => {
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useConversationState());

    expect(result.current.conversationInfo).toBeUndefined();
    expect(result.current.currentConversationId).toBeNull();
    expect(result.current.currentConversationRequestId).toBe('');
    expect(result.current.requestId).toBe('');
    expect(result.current.finalResult).toBeNull();
    expect(result.current.variables).toEqual([]);
    expect(result.current.requiredNameList).toEqual([]);
    expect(result.current.userFillVariables).toBeNull();
    expect(result.current.manualComponents).toEqual([]);
    expect(result.current.showType).toBe(EditAgentShowType.Hide);
    expect(result.current.cardList).toEqual([]);
    expect(result.current.isLoadingConversation).toBe(false);
    expect(result.current.isLoadingOtherInterface).toBe(false);
  });

  it('should update conversation info', () => {
    const { result } = renderHook(() => useConversationState());
    const mockInfo = { id: 123, topic: 'test' } as ConversationInfo;

    act(() => {
      result.current.setConversationInfo(mockInfo);
    });

    expect(result.current.conversationInfo).toEqual(mockInfo);
  });

  it('should update current conversation id and request id', () => {
    const { result } = renderHook(() => useConversationState());

    act(() => {
      result.current.setCurrentConversationId(100);
      result.current.setCurrentConversationRequestId('req-1');
      result.current.setRequestId('req-2');
    });

    expect(result.current.currentConversationId).toBe(100);
    expect(result.current.currentConversationRequestId).toBe('req-1');
    expect(result.current.requestId).toBe('req-2');
  });

  it('should handle variables updates', () => {
    const { result } = renderHook(() => useConversationState());
    const variables = [
      { name: 'var1', require: true, systemVariable: false },
      { name: 'var2', require: true, systemVariable: true }, // system var ignored in required list
      { name: 'var3', require: false, systemVariable: false },
    ] as any;

    act(() => {
      result.current.handleVariables(variables);
    });

    expect(result.current.variables).toEqual(variables);
    expect(result.current.requiredNameList).toEqual(['var1']);
  });

  it('should update manual components', () => {
    const { result } = renderHook(() => useConversationState());
    const components = [{ id: 'comp1' }] as any;

    act(() => {
      result.current.setManualComponents(components);
    });

    expect(result.current.manualComponents).toEqual(components);
  });

  it('should update show type', () => {
    const { result } = renderHook(() => useConversationState());

    act(() => {
      result.current.setShowType(EditAgentShowType.Show_Stand);
    });

    expect(result.current.showType).toBe(EditAgentShowType.Show_Stand);
  });

  it('should update loading states', () => {
    const { result } = renderHook(() => useConversationState());

    act(() => {
      result.current.setIsLoadingConversation(true);
      result.current.setIsLoadingOtherInterface(true);
    });

    expect(result.current.isLoadingConversation).toBe(true);
    expect(result.current.isLoadingOtherInterface).toBe(true);
  });

  it('should update suggest setting', () => {
    const { result } = renderHook(() => useConversationState());

    act(() => {
      result.current.setIsSuggest(true);
    });

    expect(result.current.isSuggest.current).toBe(true);
  });

  it('should get current conversation id via getter', () => {
    const { result } = renderHook(() => useConversationState());

    act(() => {
      result.current.setCurrentConversationId(123);
    });

    expect(result.current.getCurrentConversationId()).toBe(123);
  });
});
