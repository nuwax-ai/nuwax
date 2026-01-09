/**
 * useConversationCore Hook 测试
 * 验证核心状态聚合逻辑
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useConversationCore } from '../../hooks/useConversationCore'; // Fix import path

// Mock useModel
vi.mock('umi', () => ({
  useModel: (namespace: string) => {
    if (namespace === 'conversationHistory') {
      return { runHistory: vi.fn(), runHistoryItem: vi.fn() };
    }
    if (namespace === 'chat') {
      return { showPagePreview: vi.fn(), handleChatProcessingList: vi.fn() };
    }
    return {};
  },
}));

// Mock 子 hooks 以隔离测试聚合逻辑
vi.mock('../../hooks/useConversationState', () => ({
  useConversationState: () => ({
    conversationInfo: null,
    setConversationInfo: vi.fn(),
    // ... 添加其他需要的 mock 属性，或者使用 proxy
    isLoadingConversation: false,
    requestId: 'req-123',
    // 为了简单，我们只测试部分属性的聚合
    manualComponents: [],
    cardList: [],
    variables: [],
    requiredNameList: [],
    userFillVariables: null,
    handleVariables: vi.fn(),
    getCurrentConversationId: vi.fn(),
    getCurrentConversationRequestId: vi.fn(),
    isSuggest: { current: false },
    setIsSuggest: vi.fn(),
    setManualComponents: vi.fn(),
    setShowType: vi.fn(),
    setCardList: vi.fn(),
    setIsLoadingConversation: vi.fn(),
    setFinalResult: vi.fn(),
    setUserFillVariables: vi.fn(),
    setRequestId: vi.fn(),
    setCurrentConversationId: vi.fn(),
    setCurrentConversationRequestId: vi.fn(),
    setRequiredNameList: vi.fn(), // Missing in useConversationState return type mock?
    setIsLoadingOtherInterface: vi.fn(),
    isLoadingOtherInterface: false,
    showType: 0,
    currentConversationId: null,
    currentConversationRequestId: '',
    finalResult: null,
    needUpdateTopicRef: { current: false },
  }),
}));

vi.mock('../../hooks/useMessageList', () => ({
  useMessageList: () => ({
    messageList: [],
    setMessageList: vi.fn(),
    isMoreMessage: false,
    setIsMoreMessage: vi.fn(),
    loadingMore: false,
    setLoadingMore: vi.fn(),
    isConversationActive: false,
    checkConversationActive: vi.fn(),
    disabledConversationActive: vi.fn(),
    chatSuggestList: [],
    setChatSuggestList: vi.fn(),
    messageListRef: { current: [] },
    messageIdRef: { current: '' },
  }),
}));

vi.mock('../../hooks/useScrollBehavior', () => ({
  useScrollBehavior: () => ({
    messageViewRef: { current: null },
    scrollTimeoutRef: { current: null },
    allowAutoScrollRef: { current: false },
    showScrollBtn: false,
    setShowScrollBtn: vi.fn(),
    messageViewScrollToBottom: vi.fn(),
    handleScrollBottom: vi.fn(),
  }),
}));

vi.mock('../../hooks/useDialogState', () => ({
  useDialogState: () => ({
    isHistoryConversationOpen: false,
    openHistoryConversation: vi.fn(),
    closeHistoryConversation: vi.fn(),
    isTimedTaskOpen: false,
    openTimedTask: vi.fn(),
    closeTimedTask: vi.fn(),
    timedTaskMode: undefined,
  }),
}));

vi.mock('../../hooks/useConversationAPI', () => ({
  useConversationAPI: () => ({
    loadingConversation: false,
    runQueryConversation: vi.fn(),
    runAsync: vi.fn(),
    loadingSuggest: false,
    onMessageSend: vi.fn(),
    handleLoadMoreMessage: vi.fn(),
    handleClearSideEffect: vi.fn(),
    runStopConversation: vi.fn(),
    loadingStopConversation: false,
  }),
}));

// Mock useFileOperations result
const mockFileOperations = {
  setTaskAgentSelectedFileId: vi.fn(),
  setTaskAgentSelectTrigger: vi.fn(),
  isFileTreeVisibleRef: { current: false },
  viewModeRef: { current: 'preview' },
  openDesktopView: vi.fn(),
  openPreviewView: vi.fn(),
  handleRefreshFileList: vi.fn(),
};

describe('useConversationCore', () => {
  it('should aggregate all core states and API', () => {
    // Cast mock to match type reasonably enough for test
    const { result } = renderHook(() =>
      useConversationCore(mockFileOperations as any),
    );

    // Verify aggregation
    expect(result.current.conversationState).toBeDefined();
    expect(result.current.messageListState).toBeDefined();
    expect(result.current.scrollBehavior).toBeDefined();
    expect(result.current.dialogState).toBeDefined();
    expect(result.current.conversationAPI).toBeDefined();

    // Verify external model export
    expect(typeof result.current.runHistory).toBe('function');
  });
});
