/**
 * useMessageList Hook 测试
 */

import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { act, renderHook } from '@testing-library/react-hooks';
import { useMessageList } from '../../hooks/useMessageList';

describe('useMessageList', () => {
  it('should initialize with empty message list', () => {
    const { result } = renderHook(() => useMessageList());

    expect(result.current.messageList).toEqual([]);
    expect(result.current.isMoreMessage).toBe(false);
    expect(result.current.loadingMore).toBe(false);
    expect(result.current.isConversationActive).toBe(false);
  });

  it('should update messageList', () => {
    const { result } = renderHook(() => useMessageList());
    const newMessages = [
      { id: '1', text: 'Hello', status: MessageStatusEnum.Complete },
      { id: '2', text: 'World', status: MessageStatusEnum.Complete },
    ] as MessageInfo[];

    act(() => {
      result.current.setMessageList(newMessages);
    });

    expect(result.current.messageList).toHaveLength(2);
    expect(result.current.messageList[0].text).toBe('Hello');
  });

  describe('checkConversationActive', () => {
    it('should set active when has Loading message', () => {
      const { result } = renderHook(() => useMessageList());
      const messages = [
        { id: '1', status: MessageStatusEnum.Complete },
        { id: '2', status: MessageStatusEnum.Loading },
      ] as MessageInfo[];

      act(() => {
        result.current.checkConversationActive(messages);
      });

      expect(result.current.isConversationActive).toBe(true);
    });

    it('should set active when has Incomplete message', () => {
      const { result } = renderHook(() => useMessageList());
      const messages = [
        { id: '1', status: MessageStatusEnum.Complete },
        { id: '2', status: MessageStatusEnum.Incomplete },
      ] as MessageInfo[];

      act(() => {
        result.current.checkConversationActive(messages);
      });

      expect(result.current.isConversationActive).toBe(true);
    });

    it('should set inactive when all messages complete', () => {
      const { result } = renderHook(() => useMessageList());
      const messages = [
        { id: '1', status: MessageStatusEnum.Complete },
        { id: '2', status: MessageStatusEnum.Complete },
      ] as MessageInfo[];

      act(() => {
        result.current.checkConversationActive(messages);
      });

      expect(result.current.isConversationActive).toBe(false);
    });

    it('should only check last 5 messages', () => {
      const { result } = renderHook(() => useMessageList());
      const messages = [
        ...Array(5)
          .fill(null)
          .map((_, i) => ({
            id: `old-${i}`,
            status: MessageStatusEnum.Loading,
          })),
        ...Array(5)
          .fill(null)
          .map((_, i) => ({
            id: `new-${i}`,
            status: MessageStatusEnum.Complete,
          })),
      ] as MessageInfo[];

      act(() => {
        result.current.checkConversationActive(messages);
      });

      expect(result.current.isConversationActive).toBe(false);
    });
  });

  it('should disable conversation active', () => {
    const { result } = renderHook(() => useMessageList());

    act(() => {
      result.current.checkConversationActive([
        { id: '1', status: MessageStatusEnum.Loading },
      ] as MessageInfo[]);
    });
    expect(result.current.isConversationActive).toBe(true);

    act(() => {
      result.current.disabledConversationActive();
    });
    expect(result.current.isConversationActive).toBe(false);
  });

  it('should update loading states', () => {
    const { result } = renderHook(() => useMessageList());

    act(() => {
      result.current.setIsMoreMessage(true);
      result.current.setLoadingMore(true);
    });

    expect(result.current.isMoreMessage).toBe(true);
    expect(result.current.loadingMore).toBe(true);
  });

  it('should update chat suggest list', () => {
    const { result } = renderHook(() => useMessageList());
    const suggests = ['建议1', '建议2'];

    act(() => {
      result.current.setChatSuggestList(suggests);
    });

    expect(result.current.chatSuggestList).toEqual(suggests);
  });
});
