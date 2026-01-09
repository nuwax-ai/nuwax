/**
 * 会话 API 管理 Hook
 * 管理会话相关的 API 请求和 SSE 连接
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
import type { RequestResponse } from '@/types/interfaces/request';
import { extractTaskResult } from '@/utils';
import { modalConfirm } from '@/utils/ant-custom';
import { createSSEConnection } from '@/utils/fetchEventSourceConversationInfo';
import { adjustScrollPositionAfterDOMUpdate } from '@/utils/scrollUtils';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { hasValidCardData, processCardData } from '../utils/cardProcessor';
import {
  completeIncompleteMessages,
  processErrorEvent,
  processFinalResultEvent,
  processMessageEvent,
  processProcessingEvent,
  stopActiveMessages,
} from '../utils/messageProcessor';

// 会话消息列表数量
const MESSAGE_LIST_SIZE = 20;

interface UseConversationAPIProps {
  // 状态 setters
  setConversationInfo: React.Dispatch<
    React.SetStateAction<ConversationInfo | null | undefined>
  >;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<number | null>>;
  setCurrentConversationRequestId: React.Dispatch<React.SetStateAction<string>>;
  setRequestId: React.Dispatch<React.SetStateAction<string>>;
  setFinalResult: React.Dispatch<React.SetStateAction<any>>;
  setMessageList: React.Dispatch<React.SetStateAction<MessageInfo[]>>;
  setIsMoreMessage: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSuggest: (suggest: boolean) => void;
  setManualComponents: React.Dispatch<React.SetStateAction<any[]>>;
  setShowType: React.Dispatch<React.SetStateAction<EditAgentShowType>>;
  setCardList: React.Dispatch<React.SetStateAction<any[]>>;
  setIsLoadingConversation: React.Dispatch<React.SetStateAction<boolean>>;
  setChatSuggestList: React.Dispatch<React.SetStateAction<any>>;
  setShowScrollBtn: React.Dispatch<React.SetStateAction<boolean>>;
  setTaskAgentSelectedFileId: React.Dispatch<React.SetStateAction<string>>;
  setTaskAgentSelectTrigger: React.Dispatch<
    React.SetStateAction<number | string>
  >;
  setUserFillVariables: React.Dispatch<
    React.SetStateAction<Record<string, string | number> | null>
  >;
  // Refs
  needUpdateTopicRef: React.MutableRefObject<boolean>;
  messageIdRef: React.MutableRefObject<string>;
  messageListRef: React.MutableRefObject<MessageInfo[]>;
  allowAutoScrollRef: React.MutableRefObject<boolean>;
  scrollTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  isSuggest: React.MutableRefObject<boolean>;
  isFileTreeVisibleRef: React.MutableRefObject<boolean>;
  viewModeRef: React.MutableRefObject<'preview' | 'desktop'>;
  messageViewRef: React.RefObject<HTMLDivElement | null>;
  // 状态值
  conversationInfo: ConversationInfo | null | undefined;
  messageList: MessageInfo[];
  loadingMore: boolean;
  isMoreMessage: boolean;
  requestId: string;
  cardList: any[];
  // 回调函数
  handleVariables: (variables: any[]) => void;
  checkConversationActive: (messages: MessageInfo[]) => void;
  disabledConversationActive: () => void;
  messageViewScrollToBottom: () => void;
  handleScrollBottom: () => void;
  openDesktopView: (cId: number) => Promise<void>;
  openPreviewView: (cId: number) => Promise<void>;
  handleRefreshFileList: (conversationId?: number) => Promise<void>;
  // 外部 model 函数
  runHistory: (params: any) => void;
  runHistoryItem: (params: any) => void;
  showPagePreview: (data: any) => void;
  handleChatProcessingList: (list: ProcessingInfo[]) => void;
}

export const useConversationAPI = (props: UseConversationAPIProps) => {
  const {
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
    needUpdateTopicRef,
    messageIdRef,
    messageListRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    isSuggest,
    isFileTreeVisibleRef,
    viewModeRef,
    messageViewRef,
    conversationInfo,
    messageList,
    loadingMore,
    isMoreMessage,
    requestId,
    cardList,
    handleVariables,
    checkConversationActive,
    disabledConversationActive,
    messageViewScrollToBottom,
    handleScrollBottom,
    openDesktopView,
    openPreviewView,
    handleRefreshFileList,
    runHistory,
    runHistoryItem,
    showPagePreview,
    handleChatProcessingList,
  } = props;

  // ========== Refs ==========
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortConnectionRef = useRef<unknown>();

  // ========== API 请求 ==========

  // 更新会话主题
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
          const result = await runUpdateTopic({
            id: params.conversationId,
            firstMessage: params.message,
          });
          setConversationInfo({
            ...currentInfo,
            topicUpdated: result.data?.topicUpdated,
            topic: result.data?.topic,
          });
          runHistory({ agentId: null, limit: 20 });
          runHistoryItem({ agentId: currentInfo.agentId, limit: 20 });
        } catch (error) {
          console.error('更新会话主题失败:', error);
          needUpdateTopicRef.current = true;
        }
      }
    },
    [
      runUpdateTopic,
      runHistory,
      runHistoryItem,
      setConversationInfo,
      needUpdateTopicRef,
    ],
  );

  // 查询会话消息列表
  const { runAsync: runQueryConversationMessageList } = useRequest(
    apiAgentConversationMessageList,
    { manual: true, debounceWait: 300 },
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
          if (data?.length) {
            setMessageList((list) => [...data, ...list]);
            setIsMoreMessage(data.length >= MESSAGE_LIST_SIZE);
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

  // 设置处理列表
  const setChatProcessingList = useCallback(
    (msgList: MessageInfo[]) => {
      const list: any[] = [];
      msgList
        .filter((item) => item.role === AssistantRoleEnum.ASSISTANT)
        .forEach((item) => {
          const componentExecutedList = item?.componentExecutedList || [];
          const _list = componentExecutedList.map((comp: any) => ({
            ...comp,
            executeId: comp.result.executeId,
          }));
          list.push(..._list);
        });
      handleChatProcessingList(list);
    },
    [handleChatProcessingList],
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
      if (data?.id) setCurrentConversationId(data.id);
      setIsSuggest(data?.agent?.openSuggest === OpenCloseEnum.Open);
      setManualComponents(data?.agent?.manualComponents || []);
      handleVariables(data?.agent?.variables || []);
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
          setChatSuggestList(
            lastMessage.ext.map((item: any) => item.content) || [],
          );
        } else if (len === 1) {
          setChatSuggestList(data?.agent?.guidQuestionDtos || []);
        }
        if (len === MESSAGE_LIST_SIZE) setIsMoreMessage(true);
      } else {
        setMessageList([]);
        setChatSuggestList(data?.agent?.guidQuestionDtos || []);
      }

      setTimeout(() => {
        if (allowAutoScrollRef.current) messageViewScrollToBottom();
      }, 800);
    },
    onError: () => {
      setIsLoadingConversation(true);
      disabledConversationActive();
    },
  });

  // 会话问题建议
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

  // ========== SSE 消息处理 ==========

  const handleChangeMessageList = useCallback(
    (
      params: ConversationChatParams,
      res: ConversationChatResponse,
      currentMessageId: string,
    ) => {
      const { data, eventType } = res;
      setCurrentConversationRequestId(res.requestId);

      timeoutRef.current = setTimeout(() => {
        setMessageList((msgList) => {
          if (!msgList?.length) {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            disabledConversationActive();
            return [];
          }

          let list = [...msgList];
          const index = list.findIndex((item) => item.id === currentMessageId);
          let arraySpliceAction = 1;
          const currentMessage = list.find(
            (item) => item.id === currentMessageId,
          ) as MessageInfo;
          if (!currentMessage) return msgList;

          let newMessage: any = null;

          // PROCESSING
          if (eventType === ConversationEventTypeEnum.PROCESSING) {
            const messageUpdate = processProcessingEvent(currentMessage, data);
            newMessage = { ...currentMessage, ...messageUpdate };

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

            if (
              data.type === AgentComponentTypeEnum.Event &&
              data.subEventType === 'OPEN_DESKTOP' &&
              params.conversationId
            ) {
              openDesktopView(params.conversationId);
            }

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

          // MESSAGE
          if (eventType === ConversationEventTypeEnum.MESSAGE) {
            const { ext, id, finished, type } = data;
            const messageUpdate = processMessageEvent(currentMessage, data);

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

            if (type === MessageModeEnum.QUESTION && ext?.length) {
              setChatSuggestList(
                ext.map((e: MessageQuestionExtInfo) => e.content) || [],
              );
            }
          }

          // FINAL_RESULT
          if (eventType === ConversationEventTypeEnum.FINAL_RESULT) {
            messageIdRef.current = '';
            const messageUpdate = processFinalResultEvent(
              currentMessage,
              data,
              res.requestId,
            );
            newMessage = { ...currentMessage, ...messageUpdate };

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

            if (!data?.success && data?.error?.includes('用户主动取消任务')) {
              if (!newMessage?.text && !data.outputText) {
                newMessage = null;
                list.splice(index, 1);
              }
            }
          }

          // ERROR
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

  // 建立 SSE 连接
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

      const completeList = completeIncompleteMessages(messageList);
      const newMessageList = [
        ...completeList,
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

  return {
    // API 请求
    runQueryConversation,
    runAsync,
    loadingConversation,
    runStopConversation,
    loadingStopConversation,
    loadingSuggest,
    handleLoadMoreMessage,
    // 消息处理
    onMessageSend,
    handleConversation,
    handleChangeMessageList,
    handleClearSideEffect,
    // refs
    timeoutRef,
    abortConnectionRef,
  };
};
