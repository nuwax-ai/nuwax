/**
 * 会话核心逻辑聚合 Hook
 * 聚合会话状态、消息列表、滚动行为、弹窗状态和 API 请求
 */

import { useModel } from 'umi';
import { useConversationAPI } from './useConversationAPI';
import { useConversationState } from './useConversationState';
import { useDialogState } from './useDialogState';
import { useFileOperations } from './useFileOperations';
import { useMessageList } from './useMessageList';
import { useScrollBehavior } from './useScrollBehavior';

export const useConversationCore = (
  fileOperations: ReturnType<typeof useFileOperations>,
) => {
  // 基础 Model
  const { runHistory, runHistoryItem } = useModel('conversationHistory');
  const { showPagePreview, handleChatProcessingList } = useModel('chat');

  // 1. 基础状态 Hooks
  const conversationState = useConversationState();
  const messageListState = useMessageList();
  const scrollBehavior = useScrollBehavior();
  const dialogState = useDialogState();

  // 2. 将所有状态合并为一个对象，方便解构（只解构需要的）
  const combinedState = {
    ...conversationState,
    ...messageListState,
    ...scrollBehavior,
  };

  const {
    conversationInfo,
    setConversationInfo,
    setCurrentConversationId,
    setCurrentConversationRequestId,
    setRequestId,
    setFinalResult,
    setUserFillVariables,
    handleVariables,
    needUpdateTopicRef,
    isSuggest,
    setIsSuggest,
    setManualComponents,
    setShowType,
    setCardList,
    setIsLoadingConversation,
    setChatSuggestList,
    messageList,
    setMessageList,
    messageListRef,
    messageIdRef,
    isMoreMessage,
    setIsMoreMessage,
    loadingMore,
    setLoadingMore,
    checkConversationActive,
    disabledConversationActive,
    messageViewRef,
    scrollTimeoutRef,
    allowAutoScrollRef,
    setShowScrollBtn,
    messageViewScrollToBottom,
    handleScrollBottom,
    requestId,
    cardList,
  } = combinedState;

  // 3. API Hook (依赖上述状态和 FileOperations)
  const conversationAPI = useConversationAPI({
    // State Setters
    setConversationInfo,
    setCurrentConversationId,
    setCurrentConversationRequestId,
    setRequestId,
    setFinalResult,
    setMessageList,
    setIsMoreMessage,
    setLoadingMore,
    setIsSuggest,
    setManualComponents,
    setShowType,
    setCardList,
    setIsLoadingConversation,
    setChatSuggestList,
    setShowScrollBtn,
    setUserFillVariables,
    // File/Desktop Setters from FileOperations
    setTaskAgentSelectedFileId: fileOperations.setTaskAgentSelectedFileId,
    setTaskAgentSelectTrigger: fileOperations.setTaskAgentSelectTrigger,
    // Refs
    needUpdateTopicRef,
    messageIdRef,
    messageListRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    isSuggest,
    messageViewRef,
    // File/Desktop Refs from FileOperations
    isFileTreeVisibleRef: fileOperations.isFileTreeVisibleRef,
    viewModeRef: fileOperations.viewModeRef,
    // State Values
    conversationInfo,
    messageList,
    loadingMore,
    isMoreMessage,
    requestId,
    cardList,
    // Callbacks
    handleVariables,
    checkConversationActive,
    disabledConversationActive,
    messageViewScrollToBottom,
    handleScrollBottom,
    // File/Desktop Callbacks from FileOperations
    openDesktopView: fileOperations.openDesktopView,
    openPreviewView: fileOperations.openPreviewView,
    handleRefreshFileList: fileOperations.handleRefreshFileList,
    // External Models
    runHistory,
    runHistoryItem,
    showPagePreview,
    handleChatProcessingList,
  });

  return {
    conversationState,
    messageListState,
    scrollBehavior,
    dialogState,
    conversationAPI,
    // 基础 Model 方法导出，供某些特殊场景使用
    runHistory,
    runHistoryItem,
  };
};
