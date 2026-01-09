/**
 * conversationInfo Model 主入口
 * 聚合所有 Hooks，保持与原有接口完全兼容
 */

import { EditAgentShowType } from '@/types/enums/space';
import { useCallback } from 'react';
import { useModel } from 'umi';

// 导入拆分的 Hooks
import { useConversationAPI } from './hooks/useConversationAPI';
import { useConversationState } from './hooks/useConversationState';
import { useDialogState } from './hooks/useDialogState';
import { useFileTree } from './hooks/useFileTree';
import { useMessageList } from './hooks/useMessageList';
import { useScrollBehavior } from './hooks/useScrollBehavior';
import { useVncDesktop } from './hooks/useVncDesktop';

export default () => {
  // 历史记录
  const { runHistory, runHistoryItem } = useModel('conversationHistory');
  const { showPagePreview, handleChatProcessingList } = useModel('chat');

  // ========== 使用拆分的 Hooks ==========

  // 会话状态
  const conversationState = useConversationState();
  const {
    conversationInfo,
    setConversationInfo,
    setCurrentConversationId,
    setCurrentConversationRequestId,
    requestId,
    setRequestId,
    finalResult,
    setFinalResult,
    variables,
    setVariables,
    requiredNameList,
    userFillVariables,
    setUserFillVariables,
    handleVariables,
    needUpdateTopicRef,
    getCurrentConversationId,
    getCurrentConversationRequestId,
    isSuggest,
    setIsSuggest,
    manualComponents,
    setManualComponents,
    showType,
    setShowType,
    cardList,
    setCardList,
    isLoadingConversation,
    setIsLoadingConversation,
    isLoadingOtherInterface,
    setIsLoadingOtherInterface,
  } = conversationState;

  // 消息列表
  const messageListState = useMessageList();
  const {
    messageList,
    setMessageList,
    messageListRef,
    messageIdRef,
    isMoreMessage,
    setIsMoreMessage,
    loadingMore,
    setLoadingMore,
    isConversationActive,
    checkConversationActive,
    disabledConversationActive,
    chatSuggestList,
    setChatSuggestList,
  } = messageListState;

  // 滚动行为
  const scrollBehavior = useScrollBehavior();
  const {
    messageViewRef,
    scrollTimeoutRef,
    allowAutoScrollRef,
    showScrollBtn,
    setShowScrollBtn,
    messageViewScrollToBottom,
    handleScrollBottom,
  } = scrollBehavior;

  // 弹窗状态
  const dialogState = useDialogState();
  const {
    isHistoryConversationOpen,
    openHistoryConversation,
    closeHistoryConversation,
    isTimedTaskOpen,
    timedTaskMode,
    openTimedTask,
    closeTimedTask,
  } = dialogState;

  // 文件树
  const fileTreeState = useFileTree();
  const {
    isFileTreeVisible,
    setIsFileTreeVisible,
    isFileTreePinned,
    setIsFileTreePinned,
    fileTreeData,
    setFileTreeData,
    fileTreeDataLoading,
    viewMode,
    setViewMode,
    viewModeRef,
    isFileTreeVisibleRef,
    taskAgentSelectedFileId,
    setTaskAgentSelectedFileId,
    taskAgentSelectTrigger,
    setTaskAgentSelectTrigger,
    handleRefreshFileList,
    openPreviewChangeState,
    closePreviewView,
    clearFilePanelInfo,
    openPreviewView,
  } = fileTreeState;

  // 远程桌面
  const vncDesktopState = useVncDesktop({
    openPreviewChangeState,
  });
  const {
    vncContainerInfo,
    openDesktopView,
    restartVncPod,
    restartAgent,
    isRestartAgentLoading,
  } = vncDesktopState;

  // ========== 会话 API ==========
  const conversationAPI = useConversationAPI({
    // 状态 setters
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
    setTaskAgentSelectedFileId,
    setTaskAgentSelectTrigger,
    setUserFillVariables,
    // Refs
    needUpdateTopicRef,
    messageIdRef,
    messageListRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    isSuggest,
    isFileTreeVisibleRef,
    viewModeRef,
    messageViewRef,
    // 状态值
    conversationInfo,
    messageList,
    loadingMore,
    isMoreMessage,
    requestId,
    cardList,
    // 回调函数
    handleVariables,
    checkConversationActive,
    disabledConversationActive,
    messageViewScrollToBottom,
    handleScrollBottom,
    openDesktopView,
    openPreviewView,
    handleRefreshFileList,
    // 外部 model 函数
    runHistory,
    runHistoryItem,
    showPagePreview,
    handleChatProcessingList,
  });

  const {
    runQueryConversation,
    runAsync,
    loadingConversation,
    runStopConversation,
    loadingStopConversation,
    loadingSuggest,
    handleLoadMoreMessage,
    onMessageSend,
    handleClearSideEffect,
  } = conversationAPI;

  // ========== 额外功能 ==========

  // 重置初始化
  const resetInit = useCallback(() => {
    setConversationInfo(null);
    setMessageList([]);
    setChatSuggestList([]);
    setCardList([]);
    setShowType(EditAgentShowType.Show_Stand);
    disabledConversationActive();
    handleClearSideEffect();
    clearFilePanelInfo();
  }, [
    setConversationInfo,
    setMessageList,
    setChatSuggestList,
    setCardList,
    setShowType,
    disabledConversationActive,
    handleClearSideEffect,
    clearFilePanelInfo,
  ]);

  // 处理调试
  const handleDebug = useCallback(
    (info: any) => {
      const result = info?.finalResult;
      if (result) {
        setRequestId(info.requestId as string);
        setFinalResult(result);
      }
      setShowType(EditAgentShowType.Debug_Details);
      setIsFileTreeVisible(false);
      isFileTreeVisibleRef.current = false;
    },
    [
      setRequestId,
      setFinalResult,
      setShowType,
      setIsFileTreeVisible,
      isFileTreeVisibleRef,
    ],
  );

  // ========== 返回所有状态和方法（保持原接口完全兼容）==========
  return {
    setIsSuggest,
    conversationInfo,
    manualComponents,
    messageList,
    setMessageList,
    requestId,
    finalResult,
    setFinalResult,
    chatSuggestList,
    setChatSuggestList,
    loadingConversation,
    runQueryConversation,
    isLoadingConversation,
    setIsLoadingConversation,
    runAsync,
    loadingSuggest,
    onMessageSend,
    handleDebug,
    messageViewRef,
    isMoreMessage,
    loadingMore,
    handleLoadMoreMessage,
    messageViewScrollToBottom,
    allowAutoScrollRef,
    scrollTimeoutRef,
    showType,
    setShowType,
    handleClearSideEffect,
    cardList,
    showScrollBtn,
    setShowScrollBtn,
    resetInit,
    variables,
    setVariables,
    userFillVariables,
    requiredNameList,
    handleVariables,
    runStopConversation,
    loadingStopConversation,
    isConversationActive,
    checkConversationActive,
    disabledConversationActive,
    setCurrentConversationRequestId,
    getCurrentConversationRequestId,
    getCurrentConversationId,
    isHistoryConversationOpen,
    openHistoryConversation,
    closeHistoryConversation,
    timedTaskMode,
    isTimedTaskOpen,
    openTimedTask,
    closeTimedTask,
    setConversationInfo,
    isFileTreeVisible,
    isFileTreePinned,
    setIsFileTreePinned,
    closePreviewView,
    clearFilePanelInfo,
    fileTreeData,
    fileTreeDataLoading,
    setFileTreeData,
    viewMode,
    setViewMode,
    handleRefreshFileList,
    openDesktopView,
    openPreviewView,
    restartVncPod,
    restartAgent,
    isRestartAgentLoading,
    vncContainerInfo,
    taskAgentSelectedFileId,
    setTaskAgentSelectedFileId,
    taskAgentSelectTrigger,
    setTaskAgentSelectTrigger,
    isLoadingOtherInterface,
    setIsLoadingOtherInterface,
  };
};
