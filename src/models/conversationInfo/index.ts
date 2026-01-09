/**
 * conversationInfo Model 主入口
 * 聚合所有 Hooks，保持与原有接口完全兼容
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { CONVERSATION_CONNECTION_URL } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import {
  apiAgentConversation,
  apiAgentConversationChatStop,
  apiAgentConversationChatSuggest,
  apiAgentConversationMessageList,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import {
  AgentComponentTypeEnum,
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import { EditAgentShowType, OpenCloseEnum } from '@/types/enums/space';
import type { AgentSelectedComponentInfo } from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  AttachmentFile,
  ConversationChatParams,
  ConversationChatResponse,
  ConversationChatSuggestParams,
  ConversationInfo,
  MessageInfo,
  MessageQuestionExtInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import { RequestResponse } from '@/types/interfaces/request';
import { extractTaskResult } from '@/utils';
import { modalConfirm } from '@/utils/ant-custom';
import { createSSEConnection } from '@/utils/fetchEventSourceConversationInfo';
import { adjustScrollPositionAfterDOMUpdate } from '@/utils/scrollUtils';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useRef } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';

// 导入拆分的 Hooks
import { useConversationState } from './hooks/useConversationState';
import { useDialogState } from './hooks/useDialogState';
import { useFileTree } from './hooks/useFileTree';
import { useMessageList } from './hooks/useMessageList';
import { useScrollBehavior } from './hooks/useScrollBehavior';
import { useVncDesktop } from './hooks/useVncDesktop';

// 导入工具函数
import { hasValidCardData, processCardData } from './utils/cardProcessor';
import {
  completeIncompleteMessages,
  processErrorEvent,
  processFinalResultEvent,
  processMessageEvent,
  processProcessingEvent,
  stopActiveMessages,
} from './utils/messageProcessor';

// 会话消息列表数量
const MESSAGE_LIST_SIZE = 20;

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

  // 文件树（先声明，因为 vncDesktopState 依赖它）
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
    setVncContainerInfo,
    openDesktopView,
    restartVncPod,
    restartAgent,
    isRestartAgentLoading,
  } = vncDesktopState;

  // ========== 其他 Refs ==========
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortConnectionRef = useRef<unknown>();

  // ========== API 请求 ==========

  // 根据用户消息更新会话主题
  const { runAsync: runUpdateTopic } = useRequest(apiAgentConversationUpdate, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<ConversationInfo>) => {
      needUpdateTopicRef.current = false;
      setConversationInfo(
        (info) =>
          ({
            ...info,
            topic: result?.data?.topic,
          } as ConversationInfo),
      );
    },
  });

  // 更新会话主题（仅在会话开始时调用一次）
  const updateTopicOnce = useCallback(
    async (
      params: ConversationChatParams,
      currentInfo: ConversationInfo | null | undefined,
      isSync: boolean,
    ) => {
      if (
        isSync &&
        currentInfo &&
        currentInfo?.topicUpdated !== 1 &&
        needUpdateTopicRef.current
      ) {
        needUpdateTopicRef.current = false;

        try {
          const result: RequestResponse<ConversationInfo> =
            await runUpdateTopic({
              id: params.conversationId,
              firstMessage: params.message,
            });

          setConversationInfo({
            ...currentInfo,
            topicUpdated: result.data?.topicUpdated,
            topic: result.data?.topic,
          });

          runHistory({
            agentId: null,
            limit: 20,
          });

          runHistoryItem({
            agentId: currentInfo.agentId,
            limit: 20,
          });
        } catch (error) {
          console.error('更新会话主题失败:', error);
          needUpdateTopicRef.current = true;
        }
      }
    },
    [runUpdateTopic, runHistory, runHistoryItem, setConversationInfo],
  );

  // 设置所有的详细信息
  const setChatProcessingList = useCallback(
    (messageList: MessageInfo[]) => {
      const list: any[] = [];
      messageList
        .filter((item) => item.role === AssistantRoleEnum.ASSISTANT)
        .forEach((item) => {
          const componentExecutedList = item?.componentExecutedList || [];
          const _list = componentExecutedList.map((item: any) => ({
            ...item,
            executeId: item.result.executeId,
          }));
          list.push(..._list);
        });

      handleChatProcessingList(list);
    },
    [handleChatProcessingList],
  );

  // 查询会话消息列表
  const { runAsync: runQueryConversationMessageList } = useRequest(
    apiAgentConversationMessageList,
    {
      manual: true,
      debounceWait: 300,
    },
  );

  // 加载更多消息
  const handleLoadMoreMessage = useCallback(
    async (conversationId: number) => {
      if (
        !conversationId ||
        loadingMore ||
        !isMoreMessage ||
        messageList?.length === 0
      ) {
        return;
      }

      const firstMessage = messageList?.[0] as MessageInfo;
      const currentIndex = firstMessage?.index || 0;

      const messageView = messageViewRef.current;
      const oldScrollHeight = messageView?.scrollHeight || 0;
      const oldScrollTop = messageView?.scrollTop || 0;

      setLoadingMore(true);
      try {
        const { code, data } = await runQueryConversationMessageList({
          conversationId,
          index: currentIndex,
          size: MESSAGE_LIST_SIZE,
        });

        if (code === SUCCESS_CODE) {
          if (!!data?.length) {
            setMessageList((messageList: MessageInfo[]) => {
              return [...data, ...messageList];
            });

            if (data.length < MESSAGE_LIST_SIZE) {
              setIsMoreMessage(false);
            } else {
              setIsMoreMessage(true);
            }

            adjustScrollPositionAfterDOMUpdate(
              messageView,
              oldScrollTop,
              oldScrollHeight,
            );
          } else {
            setIsMoreMessage(false);
          }
        }
      } catch (error) {
        console.error('加载更多消息失败:', error);
      } finally {
        setLoadingMore(false);
      }
    },
    [
      loadingMore,
      isMoreMessage,
      messageList,
      messageViewRef,
      runQueryConversationMessageList,
      setLoadingMore,
      setMessageList,
      setIsMoreMessage,
    ],
  );

  // 查询会话
  const {
    run: runQueryConversation,
    runAsync,
    loading: loadingConversation,
  } = useRequest(apiAgentConversation, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<ConversationInfo>) => {
      setIsLoadingConversation(true);
      const { data } = result;
      setChatProcessingList(data?.messageList || []);
      setConversationInfo(data);
      if (data?.id) {
        setCurrentConversationId(data.id);
      }
      setIsSuggest(data?.agent?.openSuggest === OpenCloseEnum.Open);
      setManualComponents(data?.agent?.manualComponents || []);
      const _variables = data?.agent?.variables || [];
      handleVariables(_variables);
      setUserFillVariables(data?.variables || null);

      const _messageList = data?.messageList || [];
      const len = _messageList?.length || 0;
      if (len) {
        setMessageList(() => {
          checkConversationActive(_messageList);
          return _messageList;
        });
        const lastMessage = _messageList[len - 1];
        if (
          lastMessage.type === MessageModeEnum.QUESTION &&
          lastMessage.ext?.length
        ) {
          const suggestList = lastMessage.ext.map((item) => item.content) || [];
          setChatSuggestList(suggestList);
        } else if (len === 1) {
          const guidQuestionDtos = data?.agent?.guidQuestionDtos || [];
          setChatSuggestList(guidQuestionDtos);
        }

        if (len === MESSAGE_LIST_SIZE) {
          setIsMoreMessage(true);
        }
      } else {
        setMessageList([]);
        const guidQuestionDtos = data?.agent?.guidQuestionDtos || [];
        setChatSuggestList(guidQuestionDtos);
      }

      setTimeout(() => {
        if (allowAutoScrollRef.current) {
          messageViewScrollToBottom();
        }
      }, 800);
    },
    onError: () => {
      setIsLoadingConversation(true);
      disabledConversationActive();
    },
  });

  // 智能体会话问题建议
  const { run: runChatSuggest, loading: loadingSuggest } = useRequest(
    apiAgentConversationChatSuggest,
    {
      manual: true,
      debounceWait: 300,
      onSuccess: (result: RequestResponse<string[]>) => {
        setChatSuggestList(result.data);
        handleScrollBottom();
      },
    },
  );

  // 停止会话
  const { runAsync: runStopConversation, loading: loadingStopConversation } =
    useRequest(apiAgentConversationChatStop, {
      manual: true,
      debounceWait: 300,
    });

  // 修改消息列表
  const handleChangeMessageList = useCallback(
    (
      params: ConversationChatParams,
      res: ConversationChatResponse,
      currentMessageId: string,
    ) => {
      const { data, eventType } = res;
      setCurrentConversationRequestId(res.requestId);
      timeoutRef.current = setTimeout(() => {
        setMessageList((messageList) => {
          if (!messageList?.length) {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            disabledConversationActive();
            return [];
          }
          let list: any[] = [...messageList];
          const index = list.findIndex((item) => item.id === currentMessageId);
          let arraySpliceAction = 1;
          const currentMessage = list.find(
            (item) => item.id === currentMessageId,
          ) as MessageInfo;
          if (!currentMessage) {
            return messageList;
          }

          let newMessage: any = null;

          // PROCESSING 事件 - 使用工具函数处理消息状态
          if (eventType === ConversationEventTypeEnum.PROCESSING) {
            // 使用工具函数生成基础消息更新
            const messageUpdate = processProcessingEvent(currentMessage, data);
            newMessage = { ...currentMessage, ...messageUpdate };

            // 处理副作用：页面预览
            if (
              data.status === ProcessingEnum.EXECUTING &&
              data.type === 'Page'
            ) {
              const processingResult = data.result || {};
              const input = processingResult.input;
              input.uri_type = processingResult.input.uri_type ?? 'Page';

              if (!input.uri_type || input.uri_type === 'Page') {
                showPagePreview({
                  uri: input.uri,
                  params: input.arguments || {},
                  executeId: data.executeId || '',
                  method: input.method,
                  request_id: input.request_id,
                  data_type: input.data_type,
                });
              }

              if (input.uri_type === 'Link') {
                const queryString = new URLSearchParams(
                  input.arguments,
                ).toString();
                window.open(`${input.uri}?${queryString}`, '_blank');
              }
            }

            // 处理副作用：卡片数据 - 使用工具函数
            if (
              data?.status === ProcessingEnum.FINISHED &&
              hasValidCardData(data)
            ) {
              const newCardData = processCardData(
                data,
                cardList,
                requestId,
                res.requestId,
              );
              if (newCardData) {
                setShowType(EditAgentShowType.Show_Stand);
                setCardList(newCardData);
              }
            }

            // 处理副作用：打开桌面视图
            if (
              data.type === AgentComponentTypeEnum.Event &&
              data.subEventType === 'OPEN_DESKTOP' &&
              params.conversationId
            ) {
              openDesktopView(params.conversationId);
            }

            // 处理副作用：刷新文件列表
            if (
              data.type === AgentComponentTypeEnum.ToolCall &&
              isFileTreeVisibleRef.current &&
              viewModeRef.current === 'preview' &&
              params.conversationId
            ) {
              handleRefreshFileList(params.conversationId);
            }

            handleChatProcessingList([
              ...(currentMessage?.processingList || []),
              { ...data },
            ] as ProcessingInfo[]);
          }

          // MESSAGE 事件 - 使用工具函数处理消息状态
          if (eventType === ConversationEventTypeEnum.MESSAGE) {
            const { ext, id, finished, type } = data;

            // 使用工具函数生成基础消息更新
            const messageUpdate = processMessageEvent(currentMessage, data);

            // 处理特殊情况：多消息 ID
            if (
              type !== MessageModeEnum.THINK &&
              type !== MessageModeEnum.QUESTION
            ) {
              if (
                messageIdRef.current &&
                messageIdRef.current !== id &&
                finished
              ) {
                newMessage = {
                  ...currentMessage,
                  ...messageUpdate,
                  id,
                  status: null,
                };
                arraySpliceAction = 0;
              } else {
                messageIdRef.current = id;
                newMessage = { ...currentMessage, ...messageUpdate };
              }
            } else {
              newMessage = { ...currentMessage, ...messageUpdate };
            }

            // 处理副作用：问题建议
            if (type === MessageModeEnum.QUESTION && ext?.length) {
              setChatSuggestList(
                ext.map((extItem: MessageQuestionExtInfo) => extItem.content) ||
                  [],
              );
            }
          }

          // FINAL_RESULT 事件 - 使用工具函数处理消息状态
          if (eventType === ConversationEventTypeEnum.FINAL_RESULT) {
            messageIdRef.current = '';

            // 使用工具函数生成基础消息更新
            const messageUpdate = processFinalResultEvent(
              currentMessage,
              data,
              res.requestId,
            );
            newMessage = { ...currentMessage, ...messageUpdate };

            // 处理副作用：刷新文件列表和预览
            setTimeout(async () => {
              if (params.conversationId) {
                await handleRefreshFileList(params.conversationId);
              }

              const taskResult = extractTaskResult(data.outputText);
              if (
                params.conversationId &&
                taskResult.hasTaskResult &&
                taskResult.file
              ) {
                openPreviewView(params.conversationId);
                const fileId = taskResult.file
                  ?.split(`${params.conversationId}/`)
                  .pop();
                if (fileId) {
                  setTaskAgentSelectedFileId(fileId);
                  setTaskAgentSelectTrigger(Date.now());
                }
              }
            }, 0);

            // 处理副作用：任务执行中提示
            if (
              res.error?.includes('正在执行任务') ||
              (!data?.success && data?.error?.includes('正在执行任务'))
            ) {
              modalConfirm(
                '提示',
                '智能体正在执行任务中，需要先暂停当前任务后才能发送新请求，是否暂停当前任务？',
                () => {
                  if (params?.conversationId) {
                    runStopConversation(params?.conversationId.toString());
                  }
                  return new Promise<void>((resolve) => {
                    setTimeout(resolve, 2000);
                  });
                },
              );
            }

            setRequestId(res.requestId);
            setFinalResult(data);
            if (isSuggest.current) {
              runChatSuggest(params as ConversationChatSuggestParams);
            }

            // 处理副作用：用户取消任务
            if (!data?.success && data?.error?.includes('用户主动取消任务')) {
              if (!newMessage?.text && !data.outputText) {
                newMessage = null;
                list.splice(index, 1);
              }
            }
          }

          // ERROR 事件 - 使用工具函数处理消息状态
          if (eventType === ConversationEventTypeEnum.ERROR) {
            const messageUpdate = processErrorEvent();
            newMessage = { ...currentMessage, ...messageUpdate };
          }

          if (newMessage) {
            list.splice(index, arraySpliceAction, newMessage as MessageInfo);
          }

          checkConversationActive(list);

          return list;
        });
      }, 200);
    },
    [
      setCurrentConversationRequestId,
      setMessageList,
      disabledConversationActive,
      setCardList,
      setShowType,
      cardList,
      requestId,
      openDesktopView,
      isFileTreeVisibleRef,
      viewModeRef,
      handleRefreshFileList,
      handleChatProcessingList,
      setChatSuggestList,
      messageIdRef,
      openPreviewView,
      setTaskAgentSelectedFileId,
      setTaskAgentSelectTrigger,
      runStopConversation,
      setRequestId,
      setFinalResult,
      isSuggest,
      runChatSuggest,
      checkConversationActive,
      showPagePreview,
    ],
  );

  // 会话处理
  const handleConversation = useCallback(
    async (
      params: ConversationChatParams,
      currentMessageId: string,
      isSync: boolean = true,
      data: any = null,
    ) => {
      const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

      abortConnectionRef.current = createSSEConnection({
        url: CONVERSATION_CONNECTION_URL,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json, text/plain, */* ',
        },
        body: params,
        onMessage: (res: ConversationChatResponse) => {
          updateTopicOnce(params, conversationInfo ?? data, isSync);
          handleChangeMessageList(params, res, currentMessageId);
          handleScrollBottom();
        },
        onClose: async () => {
          setMessageList((list) => {
            try {
              const updatedList = stopActiveMessages(list);
              if (updatedList.length > 0) {
                const lastMessage = updatedList[updatedList.length - 1];
                if (lastMessage.processingList) {
                  handleChatProcessingList(lastMessage.processingList);
                }
              }
              return updatedList;
            } catch (error) {
              console.error('[onClose] ERROR:', error);
              return list;
            }
          });
          disabledConversationActive();
        },
        onError: () => {
          message.error('网络超时或服务不可用，请稍后再试');
          const list =
            messageListRef.current?.map((info: MessageInfo) => {
              if (info?.id === currentMessageId) {
                return { ...info, status: MessageStatusEnum.Error };
              }
              return info;
            }) || [];
          setMessageList(() => {
            disabledConversationActive();
            return list;
          });
        },
      });
    },
    [
      conversationInfo,
      updateTopicOnce,
      handleChangeMessageList,
      handleScrollBottom,
      setMessageList,
      disabledConversationActive,
      handleChatProcessingList,
      messageListRef,
    ],
  );

  // 清除副作用
  const handleClearSideEffect = useCallback(() => {
    messageIdRef.current = '';
    setChatSuggestList([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    if (abortConnectionRef.current) {
      if (typeof abortConnectionRef.current === 'function') {
        abortConnectionRef.current();
      }
      abortConnectionRef.current = null;
    }
  }, [messageIdRef, setChatSuggestList, scrollTimeoutRef]);

  // 重置初始化
  const resetInit = useCallback(() => {
    handleClearSideEffect();
    setIsMoreMessage(false);
    setLoadingMore(false);
    setShowType(EditAgentShowType.Hide);
    setManualComponents([]);
    needUpdateTopicRef.current = true;
    allowAutoScrollRef.current = true;
    setShowScrollBtn(false);
    setCardList([]);
    setMessageList([]);
    setConversationInfo(null);
    setCurrentConversationId(null);
    setIsSuggest(false);
    setRequestId('');
    setFinalResult(null);
    setCurrentConversationRequestId('');
    setVariables([]);
    setUserFillVariables(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    clearFilePanelInfo();
    setVncContainerInfo(null);
  }, [
    handleClearSideEffect,
    setIsMoreMessage,
    setLoadingMore,
    setShowType,
    setManualComponents,
    needUpdateTopicRef,
    allowAutoScrollRef,
    setShowScrollBtn,
    setCardList,
    setMessageList,
    setConversationInfo,
    setCurrentConversationId,
    setIsSuggest,
    setRequestId,
    setFinalResult,
    setCurrentConversationRequestId,
    setVariables,
    setUserFillVariables,
    clearFilePanelInfo,
    setVncContainerInfo,
  ]);

  // 发送消息
  const onMessageSend = useCallback(
    async (
      id: number,
      messageInfo: string,
      files: UploadFileInfo[] = [],
      infos: AgentSelectedComponentInfo[] = [],
      variableParams?: Record<string, string | number>,
      debug: boolean = false,
      isSync: boolean = true,
      data: any = null,
    ) => {
      handleClearSideEffect();

      const attachments: AttachmentFile[] =
        files?.map((file) => ({
          fileKey: file.key || '',
          fileUrl: file.url || '',
          fileName: file.name || '',
          mimeType: file.type || '',
        })) || [];

      const chatMessage = {
        role: AssistantRoleEnum.USER,
        type: MessageModeEnum.CHAT,
        text: messageInfo,
        time: dayjs().toString(),
        attachments,
        id: uuidv4(),
        messageType: MessageTypeEnum.USER,
      };

      const currentMessageId = uuidv4();
      const currentMessage = {
        role: AssistantRoleEnum.ASSISTANT,
        type: MessageModeEnum.CHAT,
        text: '',
        think: '',
        time: dayjs().toString(),
        id: currentMessageId,
        messageType: MessageTypeEnum.ASSISTANT,
        status: MessageStatusEnum.Loading,
      } as MessageInfo;

      const completeMessageList = completeIncompleteMessages(messageList);

      const newMessageList = [
        ...completeMessageList,
        chatMessage,
        currentMessage,
      ] as MessageInfo[];

      setMessageList(() => {
        checkConversationActive(newMessageList);
        return newMessageList;
      });
      messageListRef.current = newMessageList;

      allowAutoScrollRef.current = true;
      setShowScrollBtn(false);
      handleScrollBottom();

      const params: ConversationChatParams = {
        conversationId: id,
        variableParams,
        message: messageInfo,
        attachments,
        debug,
        selectedComponents: infos,
      };

      handleConversation(params, currentMessageId, isSync, data);
    },
    [
      handleClearSideEffect,
      messageList,
      setMessageList,
      checkConversationActive,
      messageListRef,
      allowAutoScrollRef,
      setShowScrollBtn,
      handleScrollBottom,
      handleConversation,
    ],
  );

  // 处理调试
  const handleDebug = useCallback(
    (info: MessageInfo) => {
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
