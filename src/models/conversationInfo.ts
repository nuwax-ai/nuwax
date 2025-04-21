import { CONVERSATION_CONNECTION_URL } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import {
  apiAgentConversation,
  apiAgentConversationChatSuggest,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import { BindCardStyleEnum } from '@/types/enums/plugin';
import { EditAgentShowType, OpenCloseEnum } from '@/types/enums/space';
import { CardDataInfo } from '@/types/interfaces/cardInfo';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  ConversationChatParams,
  ConversationChatResponse,
  ConversationChatSuggestParams,
  ConversationInfo,
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import {
  CardInfo,
  ConversationFinalResult,
} from '@/types/interfaces/conversationInfo';
import { RequestResponse } from '@/types/interfaces/request';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { useRequest } from 'ahooks';
import moment from 'moment/moment';
import { useCallback, useRef, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';

export default () => {
  // 会话信息
  const [conversationInfo, setConversationInfo] = useState<ConversationInfo>();
  // 是否用户问题建议
  const [isSuggest, setIsSuggest] = useState<boolean>(true);
  // 会话信息
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortConnectionRef = useRef<unknown>();
  const [showType, setShowType] = useState<EditAgentShowType>(
    EditAgentShowType.Hide,
  );
  // 调试结果
  const [requestId, setRequestId] = useState<string>('');
  const [finalResult, setFinalResult] = useState<ConversationFinalResult>();
  const needUpdateTopicRef = useRef<boolean>(true);
  // 展示台卡片列表
  const [cardList, setCardList] = useState<CardInfo[]>([]);
  const [isLoadingConversation, setIsLoadingConversation] =
    useState<boolean>(false);
  // 添加一个 ref 来控制是否允许自动滚动
  const allowAutoScrollRef = useRef<boolean>(true);

  const { runHistory } = useModel('conversationHistory');

  // 修改 handleScrollBottom 函数，添加自动滚动控制
  const handleScrollBottom = () => {
    if (allowAutoScrollRef.current) {
      scrollTimeoutRef.current = setTimeout(() => {
        // 滚动到底部
        messageViewRef.current?.scrollTo({
          top: messageViewRef.current?.scrollHeight,
          behavior: 'smooth',
        });
      }, 400);
    }
  };

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
      setConversationInfo(data);
      // 是否开启用户问题建议
      setIsSuggest(data?.agent?.openSuggest === OpenCloseEnum.Open);
      setMessageList(data?.messageList || []);
      // 开场白预置问题
      setChatSuggestList(data?.agent?.openingGuidQuestions || []);
      handleScrollBottom();
    },
    onError: () => {
      setIsLoadingConversation(true);
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

  // 修改消息列表
  const handleChangeMessageList = (
    params: ConversationChatParams,
    res: ConversationChatResponse,
    // 自定义随机id
    currentMessageId: string,
  ) => {
    const { data, eventType } = res;
    timeoutRef.current = setTimeout(() => {
      setMessageList((messageList) => {
        if (!messageList?.length) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          return [];
        }
        // 深拷贝消息列表
        const list = [...messageList];
        const index = list.findIndex((item) => item.id === currentMessageId);
        // 当前消息
        const currentMessage = list.find(
          (item) => item.id === currentMessageId,
        ) as MessageInfo;
        // 消息不存在时
        if (!currentMessage) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          return messageList;
        }

        let newMessage = null;
        // 更新UI状态...
        if (eventType === ConversationEventTypeEnum.PROCESSING) {
          newMessage = {
            ...currentMessage,
            status: MessageStatusEnum.Loading,
            processingList: [
              ...(currentMessage?.processingList || []),
              data,
            ] as ProcessingInfo[],
          };

          // 已调用完毕后, 处理卡片信息
          if (
            data?.status === ProcessingEnum.FINISHED &&
            data?.cardBindConfig &&
            data?.cardData
          ) {
            // 自动展开展示台
            setShowType(EditAgentShowType.Show_Stand);
            setCardList((cardList) => {
              // 竖向列表
              if (
                data.cardBindConfig?.bindCardStyle === BindCardStyleEnum.LIST
              ) {
                const cardDataList =
                  data?.cardData?.map((item: CardDataInfo) => ({
                    ...item,
                    cardKey: data.cardBindConfig.cardKey,
                  })) || [];
                // 如果是同一次会话请求，则追加，否则更新
                return res.requestId === requestId
                  ? [...cardList, ...cardDataList]
                  : [...cardDataList];
              }
              // 单张卡片
              const cardInfo = {
                ...data?.cardData,
                cardKey: data.cardBindConfig?.cardKey,
              };
              // 如果是同一次会话请求，则追加，否则更新
              return (
                res.requestId === requestId
                  ? [...cardList, cardInfo]
                  : [cardInfo]
              ) as CardInfo[];
            });
          }
        }
        if (eventType === ConversationEventTypeEnum.MESSAGE) {
          const { text, type } = data;
          // 思考think
          if (type === MessageModeEnum.THINK) {
            newMessage = {
              ...currentMessage,
              think: `${currentMessage.think}${text}`,
              status: MessageStatusEnum.Incomplete,
            };
          } else {
            newMessage = {
              ...currentMessage,
              text: `${currentMessage.text}${text}`,
              status: MessageStatusEnum.Incomplete,
            };
          }
        }
        if (eventType === ConversationEventTypeEnum.FINAL_RESULT) {
          newMessage = {
            ...currentMessage,
            status: MessageStatusEnum.Complete,
            finalResult: data,
          };
          // 调试结果
          setRequestId(res.requestId);
          setFinalResult(data as ConversationFinalResult);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          // 是否开启问题建议,可用值:Open,Close
          if (isSuggest) {
            // 滚动到底部
            handleScrollBottom();
            runChatSuggest(params as ConversationChatSuggestParams);
          }
        }
        if (eventType === ConversationEventTypeEnum.ERROR) {
          newMessage = {
            ...currentMessage,
            status: MessageStatusEnum.Error,
          };
        }

        list.splice(index, 1, newMessage as MessageInfo);
        return list;
      });
    }, 200);
    // 滚动到底部
    handleScrollBottom();
  };

  // 会话处理
  const handleConversation = async (
    params: ConversationChatParams,
    currentMessageId: string,
  ) => {
    const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
    // 启动连接
    abortConnectionRef.current = await createSSEConnection({
      url: CONVERSATION_CONNECTION_URL,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json, text/plain, */* ',
      },
      body: params,
      onMessage: (res: ConversationChatResponse) => {
        handleChangeMessageList(params, res, currentMessageId);
      },
    });
    // 主动关闭连接
    // 确保 abortConnectionRef.current 是一个可调用的函数
    if (typeof abortConnectionRef.current === 'function') {
      abortConnectionRef.current();
    }
  };

  // 清除副作用
  const handleClearSideEffect = () => {
    setChatSuggestList([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (scrollTimeoutRef.current) {
      // 清除滚动
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    // 主动关闭连接
    if (abortConnectionRef.current) {
      // 确保 abortConnectionRef.current 是一个可调用的函数
      if (typeof abortConnectionRef.current === 'function') {
        abortConnectionRef.current();
      }
      abortConnectionRef.current = null;
    }
  };

  // 发送消息
  const onMessageSend = async (
    id: number,
    message: string,
    files: UploadFileInfo[] = [],
    debug: boolean = false,
    // 是否同步会话记录
    isSync: boolean = true,
  ) => {
    // 清除副作用
    handleClearSideEffect();

    // 附件文件
    const attachments =
      files?.map((file) => ({
        fileKey: file.key,
        fileUrl: file.url,
        fileName: file.fileName,
        mimeType: file.mimeType,
      })) || [];

    // 将文件和消息加入会话中
    const chatMessage = {
      role: AssistantRoleEnum.USER,
      type: MessageModeEnum.CHAT,
      text: message,
      time: moment().toString(),
      attachments,
      id: uuidv4(),
      messageType: MessageTypeEnum.USER,
    };

    const currentMessageId = uuidv4();
    // 当前助手信息
    const currentMessage = {
      role: AssistantRoleEnum.ASSISTANT,
      type: MessageModeEnum.CHAT,
      text: '',
      think: '',
      time: moment().toString(), // 将 moment 对象转换为字符串以匹配 MessageInfo 类型
      id: currentMessageId,
      messageType: MessageTypeEnum.ASSISTANT,
      status: MessageStatusEnum.Loading,
    } as MessageInfo;

    setMessageList((list) => {
      const _list =
        list?.map((item) => {
          if (item.status === MessageStatusEnum.Incomplete) {
            item.status = MessageStatusEnum.Complete;
          }
          return item;
        }) || [];

      return [..._list, chatMessage, currentMessage] as MessageInfo[];
    });
    // 滚动
    handleScrollBottom();
    // 会话请求参数
    const params: ConversationChatParams = {
      conversationId: id,
      message,
      attachments,
      debug,
    };
    // 处理会话
    await handleConversation(params, currentMessageId);
    // 第一次发送消息后更新主题
    if (needUpdateTopicRef.current) {
      await runUpdateTopic({
        id,
        firstMessage: message,
      });
      if (isSync) {
        // 如果是会话聊天页（chat页），同步更新会话记录
        runHistory({
          agentId: null,
        });
      }
    }
  };

  const handleDebug = useCallback((info: MessageInfo) => {
    const result = info?.finalResult;
    if (result) {
      setRequestId(info.id as string);
      setFinalResult(result);
    }
    setShowType(EditAgentShowType.Debug_Details);
  }, []);

  return {
    setIsSuggest,
    conversationInfo,
    setConversationInfo,
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
    allowAutoScrollRef,
    showType,
    setShowType,
    needUpdateTopicRef,
    handleClearSideEffect,
    cardList,
    setCardList,
  };
};
