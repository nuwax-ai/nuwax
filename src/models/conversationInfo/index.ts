/**
 * conversationInfo Model 主入口
 * 聚合所有 Hooks，保持与原有接口完全兼容
 *
 * 重构说明：
 * 逻辑被拆分为两大核心 Hook：
 * 1. useFileOperations: 文件树、远程桌面、VNC 相关
 * 2. useConversationCore: 会话状态、消息列表、API 交互相关
 */

import { EditAgentShowType } from '@/types/enums/space';
import { useCallback } from 'react';
import { useConversationCore } from './hooks/useConversationCore';
import { useFileOperations } from './hooks/useFileOperations';

export default () => {
  // 1. 文件与桌面操作
  const fileOperations = useFileOperations();
  const { fileTreeState, vncDesktopState } = fileOperations;

  // 2. 会话核心逻辑 (注入 fileOperations 依赖)
  const conversationCore = useConversationCore(fileOperations);
  const {
    conversationState,
    messageListState,
    scrollBehavior,
    dialogState,
    conversationAPI,
  } = conversationCore;

  // ========== 扁平化导出 (保持原有 API 兼容性) ==========

  // 额外功能：重置初始化
  const resetInit = useCallback(() => {
    conversationState.setConversationInfo(null);
    messageListState.setMessageList([]);
    messageListState.setChatSuggestList([]);
    conversationState.setCardList([]);
    conversationState.setShowType(EditAgentShowType.Show_Stand);
    messageListState.disabledConversationActive();
    conversationAPI.handleClearSideEffect();
    fileTreeState.clearFilePanelInfo();
  }, [conversationState, messageListState, conversationAPI, fileTreeState]);

  // 额外功能：处理调试
  const handleDebug = useCallback(
    (info: any) => {
      const result = info?.finalResult;
      if (result) {
        conversationState.setRequestId(info.requestId as string);
        conversationState.setFinalResult(result);
      }
      conversationState.setShowType(EditAgentShowType.Debug_Details);
      fileTreeState.setIsFileTreeVisible(false);
      fileTreeState.isFileTreeVisibleRef.current = false;
    },
    [conversationState, fileTreeState],
  );

  return {
    // 会话状态
    conversationInfo: conversationState.conversationInfo,
    setConversationInfo: conversationState.setConversationInfo,
    requestId: conversationState.requestId,
    finalResult: conversationState.finalResult,
    setFinalResult: conversationState.setFinalResult,
    variables: conversationState.variables,
    setVariables: conversationState.setVariables,
    requiredNameList: conversationState.requiredNameList,
    userFillVariables: conversationState.userFillVariables,
    handleVariables: conversationState.handleVariables,
    isSuggest: conversationState.isSuggest,
    setIsSuggest: conversationState.setIsSuggest,
    manualComponents: conversationState.manualComponents,
    showType: conversationState.showType,
    setShowType: conversationState.setShowType,
    cardList: conversationState.cardList,
    isLoadingConversation: conversationState.isLoadingConversation,
    setIsLoadingConversation: conversationState.setIsLoadingConversation,
    isLoadingOtherInterface: conversationState.isLoadingOtherInterface,
    setIsLoadingOtherInterface: conversationState.setIsLoadingOtherInterface,
    setCurrentConversationRequestId:
      conversationState.setCurrentConversationRequestId,
    getCurrentConversationRequestId:
      conversationState.getCurrentConversationRequestId,
    getCurrentConversationId: conversationState.getCurrentConversationId,

    // 消息列表
    messageList: messageListState.messageList,
    setMessageList: messageListState.setMessageList,
    isMoreMessage: messageListState.isMoreMessage,
    loadingMore: messageListState.loadingMore,
    isConversationActive: messageListState.isConversationActive,
    checkConversationActive: messageListState.checkConversationActive,
    disabledConversationActive: messageListState.disabledConversationActive,
    chatSuggestList: messageListState.chatSuggestList,
    setChatSuggestList: messageListState.setChatSuggestList,

    // 滚动
    messageViewRef: scrollBehavior.messageViewRef,
    scrollTimeoutRef: scrollBehavior.scrollTimeoutRef,
    allowAutoScrollRef: scrollBehavior.allowAutoScrollRef,
    showScrollBtn: scrollBehavior.showScrollBtn,
    setShowScrollBtn: scrollBehavior.setShowScrollBtn,
    messageViewScrollToBottom: scrollBehavior.messageViewScrollToBottom,

    // 弹窗
    isHistoryConversationOpen: dialogState.isHistoryConversationOpen,
    openHistoryConversation: dialogState.openHistoryConversation,
    closeHistoryConversation: dialogState.closeHistoryConversation,
    timedTaskMode: dialogState.timedTaskMode,
    isTimedTaskOpen: dialogState.isTimedTaskOpen,
    openTimedTask: dialogState.openTimedTask,
    closeTimedTask: dialogState.closeTimedTask,

    // API
    loadingConversation: conversationAPI.loadingConversation,
    runQueryConversation: conversationAPI.runQueryConversation,
    runAsync: conversationAPI.runAsync,
    loadingSuggest: conversationAPI.loadingSuggest,
    onMessageSend: conversationAPI.onMessageSend,
    handleLoadMoreMessage: conversationAPI.handleLoadMoreMessage,
    handleClearSideEffect: conversationAPI.handleClearSideEffect,
    runStopConversation: conversationAPI.runStopConversation,
    loadingStopConversation: conversationAPI.loadingStopConversation,

    // 文件树
    isFileTreeVisible: fileTreeState.isFileTreeVisible,
    isFileTreePinned: fileTreeState.isFileTreePinned,
    setIsFileTreePinned: fileTreeState.setIsFileTreePinned,
    fileTreeData: fileTreeState.fileTreeData,
    fileTreeDataLoading: fileTreeState.fileTreeDataLoading,
    setFileTreeData: fileTreeState.setFileTreeData,
    viewMode: fileTreeState.viewMode,
    setViewMode: fileTreeState.setViewMode,
    taskAgentSelectedFileId: fileTreeState.taskAgentSelectedFileId,
    setTaskAgentSelectedFileId: fileTreeState.setTaskAgentSelectedFileId,
    taskAgentSelectTrigger: fileTreeState.taskAgentSelectTrigger,
    setTaskAgentSelectTrigger: fileTreeState.setTaskAgentSelectTrigger,
    closePreviewView: fileTreeState.closePreviewView,
    clearFilePanelInfo: fileTreeState.clearFilePanelInfo,
    handleRefreshFileList: fileTreeState.handleRefreshFileList,
    openPreviewView: fileTreeState.openPreviewView,

    // 远程桌面
    vncContainerInfo: vncDesktopState.vncContainerInfo,
    openDesktopView: vncDesktopState.openDesktopView,
    restartVncPod: vncDesktopState.restartVncPod,
    restartAgent: vncDesktopState.restartAgent,
    isRestartAgentLoading: vncDesktopState.isRestartAgentLoading,

    // 聚合方法
    handleDebug,
    resetInit,
  };
};
