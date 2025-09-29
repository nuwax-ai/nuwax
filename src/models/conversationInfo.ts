import { CONVERSATION_CONNECTION_URL } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { getCustomBlock } from '@/plugins/ds-markdown-process';
import {
  apiAgentConversation,
  apiAgentConversationChatStop,
  apiAgentConversationChatSuggest,
  apiAgentConversationUpdate,
} from '@/services/agentConfig';
import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import {
  CreateUpdateModeEnum,
  MessageStatusEnum,
  ProcessingEnum,
} from '@/types/enums/common';
import { BindCardStyleEnum } from '@/types/enums/plugin';
import { EditAgentShowType, OpenCloseEnum } from '@/types/enums/space';
import {
  AgentManualComponentInfo,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import { CardDataInfo } from '@/types/interfaces/cardInfo';
import type {
  BindConfigWithSub,
  UploadFileInfo,
} from '@/types/interfaces/common';
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
import {
  CardInfo,
  ConversationFinalResult,
} from '@/types/interfaces/conversationInfo';
import { RequestResponse } from '@/types/interfaces/request';
import { isEmptyObject } from '@/utils/common';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';

export default () => {
  const { runHistoryItem } = useModel('conversationHistory');
  // 会话信息
  const [conversationInfo, setConversationInfo] =
    useState<ConversationInfo | null>();
  // 会话消息ID
  const [currentConversationRequestId, setCurrentConversationRequestId] =
    useState<string>('');
  // 是否用户问题建议
  // const [isSuggest, setIsSuggest] = useState<boolean>(false);
  const isSuggest = useRef(false);
  const setIsSuggest = (suggest: boolean) => {
    isSuggest.current = suggest;
  };
  // 会话信息
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 缓存消息列表，用于消息会话错误时，修改消息状态（将当前会话的loading状态的消息改为Error状态）
  const messageListRef = useRef<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortConnectionRef = useRef<unknown>();
  const [showType, setShowType] = useState<EditAgentShowType>(
    EditAgentShowType.Hide,
  );
  // 会话请求ID
  const [requestId, setRequestId] = useState<string>('');
  // 会话消息ID
  const messageIdRef = useRef<string>('');
  // 调试结果
  const [finalResult, setFinalResult] =
    useState<ConversationFinalResult | null>(null);
  // 是否需要更新主题
  const needUpdateTopicRef = useRef<boolean>(true);
  // 展示台卡片列表
  const [cardList, setCardList] = useState<CardInfo[]>([]);
  // 是否正在加载会话
  const [isLoadingConversation, setIsLoadingConversation] =
    useState<boolean>(false);
  // 会话是否正在进行中（有消息正在处理）
  const [isConversationActive, setIsConversationActive] =
    useState<boolean>(false);
  // 添加一个 ref 来控制是否允许自动滚动
  const allowAutoScrollRef = useRef<boolean>(true);
  // 是否显示点击下滚按钮
  const [showScrollBtn, setShowScrollBtn] = useState<boolean>(false);
  // 可手动选择的组件列表
  const [manualComponents, setManualComponents] = useState<
    AgentManualComponentInfo[]
  >([]);
  // 变量参数
  const [variables, setVariables] = useState<BindConfigWithSub[]>([]);

  // 历史会话弹窗状态管理
  const [isHistoryConversationOpen, setIsHistoryConversationOpen] =
    useState<boolean>(false);

  // 打开历史会话弹窗
  const openHistoryConversation = useCallback(() => {
    setIsHistoryConversationOpen(true);
  }, []);

  // 关闭历史会话弹窗
  const closeHistoryConversation = useCallback(() => {
    setIsHistoryConversationOpen(false);
  }, []);

  // 定时任务弹窗状态管理
  const [isTimedTaskOpen, setIsTimedTaskOpen] = useState<boolean>(false);
  const [timedTaskMode, setTimedTaskMode] = useState<CreateUpdateModeEnum>();

  // 打开定时任务弹窗
  const openTimedTask = useCallback((taskMode: CreateUpdateModeEnum) => {
    setIsTimedTaskOpen(true);
    setTimedTaskMode(taskMode);
  }, []);

  // 关闭定时任务弹窗
  const closeTimedTask = useCallback(() => {
    setIsTimedTaskOpen(false);
  }, []);
  // 用户填写的变量参数
  const [userFillVariables, setUserFillVariables] = useState<Record<
    string,
    string | number
  > | null>(null);
  // 必填变量参数name列表
  const [requiredNameList, setRequiredNameList] = useState<string[]>([]);
  // 历史记录
  const { runHistory } = useModel('conversationHistory');
  const { handleChatProcessingList } = useModel('chat');

  // 滚动到底部
  const messageViewScrollToBottom = () => {
    // 滚动到底部
    messageViewRef.current?.scrollTo({
      top: messageViewRef.current?.scrollHeight,
      behavior: 'smooth',
    });
  };

  // 修改 handleScrollBottom 函数，添加自动滚动控制
  const handleScrollBottom = () => {
    if (allowAutoScrollRef.current) {
      scrollTimeoutRef.current = setTimeout(() => {
        // 滚动到底部
        messageViewScrollToBottom();
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

  // 处理变量参数
  const handleVariables = (_variables: BindConfigWithSub[]) => {
    setVariables(_variables);
    // 必填参数name列表
    const _requiredNameList = _variables
      ?.filter(
        (item: BindConfigWithSub) => !item.systemVariable && item.require,
      )
      ?.map((item: BindConfigWithSub) => item.name);
    setRequiredNameList(_requiredNameList || []);
  };

  // 检查会话是否正在进行中（有消息正在处理）
  const checkConversationActive = (messages: MessageInfo[]) => {
    const hasActiveMessage =
      (messages?.length &&
        messages.some(
          (message) =>
            message.status === MessageStatusEnum.Loading ||
            message.status === MessageStatusEnum.Incomplete,
        )) ||
      false;
    setIsConversationActive(hasActiveMessage);
  };

  const disabledConversationActive = () => {
    setIsConversationActive(false);
  };

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
      // 可手动选择的组件列表
      setManualComponents(data?.agent?.manualComponents || []);
      // 变量参数
      const _variables = data?.agent?.variables || [];
      // 处理变量参数
      handleVariables(_variables);
      // 用户填写的变量参数
      setUserFillVariables(data?.variables || null);
      // 消息列表
      const _messageList = data?.messageList || [];
      const len = _messageList?.length || 0;
      if (len) {
        setMessageList(() => {
          checkConversationActive(_messageList);
          return _messageList;
        });
        // 最后一条消息为"问答"时，获取问题建议
        const lastMessage = _messageList[len - 1];
        if (
          lastMessage.type === MessageModeEnum.QUESTION &&
          lastMessage.ext?.length
        ) {
          // 问题建议列表
          const suggestList = lastMessage.ext.map((item) => item.content) || [];
          setChatSuggestList(suggestList);
        }
        // 如果消息列表大于1时，说明已开始会话，就不显示预置问题，反之显示
        else if (len === 1) {
          // 如果存在预置问题，显示预置问题
          setChatSuggestList(data?.agent?.openingGuidQuestions || []);
        }
      }
      // 不存在会话消息时，才显示开场白预置问题
      else {
        setChatSuggestList(data?.agent?.openingGuidQuestions || []);
      }

      // 使用 setTimeout 确保在 DOM 完全渲染后再滚动
      setTimeout(() => {
        // 滚动到底部
        messageViewScrollToBottom();
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
  const { run: runStopConversation, loading: loadingStopConversation } =
    useRequest(apiAgentConversationChatStop, {
      manual: true,
    });

  // 修改消息列表
  const handleChangeMessageList = (
    params: ConversationChatParams,
    res: ConversationChatResponse,
    // 自定义随机id
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
        // 深拷贝消息列表
        const list = [...messageList];
        const index = list.findIndex((item) => item.id === currentMessageId);
        // 数组splice方法的第二个参数表示删除的数量，这里我们只需要删除一个元素，所以设置为1， 如果为0，则表示不删除元素。
        let arraySpliceAction = 1;
        // 当前消息
        const currentMessage = list.find(
          (item) => item.id === currentMessageId,
        ) as MessageInfo;
        // 消息不存在时
        if (!currentMessage) {
          return messageList;
        }

        let newMessage = null;

        // 更新UI状态...
        if (eventType === ConversationEventTypeEnum.PROCESSING) {
          const processingResult = data.result || {};
          data.executeId = processingResult.executeId;
          newMessage = {
            ...currentMessage,
            text: getCustomBlock(currentMessage.text || '', data),
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
            // 卡片列表
            setCardList((cardList) => {
              // 竖向列表
              if (
                data.cardBindConfig?.bindCardStyle === BindCardStyleEnum.LIST
              ) {
                // 过滤掉空对象, 因为cardData中可能存在空对象
                const _cardData =
                  data?.cardData?.filter(
                    (item: CardDataInfo) => !isEmptyObject(item),
                  ) || [];
                // 如果卡片列表不为空，则自动展开展示台
                if (_cardData?.length) {
                  // 自动展开展示台
                  setShowType(EditAgentShowType.Show_Stand);
                }
                const cardDataList =
                  _cardData?.map((item: CardDataInfo) => ({
                    ...item,
                    cardKey: data.cardBindConfig.cardKey,
                  })) || [];
                // 如果是同一次会话请求，则追加，否则更新
                return res.requestId === requestId
                  ? [...cardList, ...cardDataList]
                  : [...cardDataList];
              }
              // 自动展开展示台
              setShowType(EditAgentShowType.Show_Stand);
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

          handleChatProcessingList([
            ...(currentMessage?.processingList || []),
            { ...data },
          ] as ProcessingInfo[]);
        }
        // MESSAGE事件
        if (eventType === ConversationEventTypeEnum.MESSAGE) {
          const { text, type, ext, id, finished } = data;
          // 思考think
          if (type === MessageModeEnum.THINK) {
            newMessage = {
              ...currentMessage,
              think: `${currentMessage.think}${text}`,
              status: MessageStatusEnum.Incomplete,
            };
          }
          // 问答
          else if (type === MessageModeEnum.QUESTION) {
            newMessage = {
              ...currentMessage,
              text: `${currentMessage.text}${text}`,
              // 如果finished为true，则状态为null，此时不会显示运行状态组件，否则为Incomplete
              status: finished ? null : MessageStatusEnum.Incomplete,
            };
            if (ext?.length) {
              // 问题建议
              setChatSuggestList(
                ext.map((extItem: MessageQuestionExtInfo) => extItem.content) ||
                  [],
              );
            }
          } else {
            // 工作流过程输出
            if (
              messageIdRef.current &&
              messageIdRef.current !== id &&
              finished
            ) {
              newMessage = {
                ...currentMessage,
                id,
                text: `${currentMessage.text}${text}`, // 这里需要添加 展示MCP 或者其他工具调用
                status: null, // 隐藏运行状态
              };
              // 插入新的消息
              arraySpliceAction = 0;
            } else {
              messageIdRef.current = id;
              newMessage = {
                ...currentMessage,
                text: `${currentMessage.text}${text}`,
                status: MessageStatusEnum.Incomplete,
              };
            }
          }
        }
        // FINAL_RESULT事件
        if (eventType === ConversationEventTypeEnum.FINAL_RESULT) {
          newMessage = {
            ...currentMessage,
            status: MessageStatusEnum.Complete,
            finalResult: data,
            requestId: res.requestId,
          };

          // 调试结果
          setRequestId(res.requestId);
          setFinalResult(data as ConversationFinalResult);
          // 是否开启问题建议,可用值:Open,Close
          if (isSuggest.current) {
            runChatSuggest(params as ConversationChatSuggestParams);
          }
        }
        // ERROR事件
        if (eventType === ConversationEventTypeEnum.ERROR) {
          newMessage = {
            ...currentMessage,
            status: MessageStatusEnum.Error,
          };
        }

        // 会话事件兼容处理，防止消息为空时，页面渲染报length错误
        if (newMessage) {
          list.splice(index, arraySpliceAction, newMessage as MessageInfo);
        }

        // 检查会话状态
        checkConversationActive(list);

        return list;
      });
    }, 200);
  };

  // 会话处理
  const handleConversation = async (
    params: ConversationChatParams,
    currentMessageId: string,
    // 是否同步会话记录
    isSync: boolean = true,
    data: any = null,
  ) => {
    const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

    // //模拟数据 一定删除 ====
    // let index = 0;
    // const mockData = mockChatData;
    // const len = mockData.length;
    // console.log('mockChatData', mockData);

    // console.time('mockData');

    // const interval = setInterval(() => {
    //   if (index < len) {
    //     console.timeLog('mockData', index);

    //     handleChangeMessageList(params, mockData[index], currentMessageId);
    //     // 滚动到底部
    //     handleScrollBottom();
    //   } else {
    //     clearInterval(interval);
    //     console.timeEnd('mockData');
    //   }
    //   index++;
    // }, 100);

    // return;
    // //===== 模拟数据 一定删除 ====

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
        // 滚动到底部
        handleScrollBottom();
      },
      onClose: async () => {
        const currentInfo = conversationInfo ?? data;
        // 第一次发送消息后更新主题
        if (currentInfo && currentInfo?.topicUpdated !== 1) {
          const { data } = await runUpdateTopic({
            id: params.conversationId,
            firstMessage: params.message,
          });
          // 更新会话记录
          setConversationInfo({
            ...currentInfo,
            topicUpdated: data.topicUpdated,
            topic: data.topic,
          });

          if (isSync) {
            // 如果是会话聊天页（chat页），同步更新会话记录
            runHistory({
              agentId: null,
              limit: 20,
            });

            // 获取当前智能体的历史记录
            runHistoryItem({
              agentId: currentInfo.agentId,
              limit: 20,
            });
          }
        }

        disabledConversationActive();
      },
      onError: () => {
        message.error('网络超时或服务不可用，请稍后再试');
        // 将当前会话的loading状态的消息改为Error状态
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
    // 清除滚动
    if (scrollTimeoutRef.current) {
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

  // 重置初始化
  const resetInit = () => {
    handleClearSideEffect();
    setShowType(EditAgentShowType.Hide);
    setManualComponents([]);
    needUpdateTopicRef.current = true;
    allowAutoScrollRef.current = true;
    setShowScrollBtn(false);
    // 重置卡片列表
    setCardList([]);
    // 重置消息列表
    setMessageList([]);
    // 重置会话信息
    setConversationInfo(null);
    // 重置问题建议
    setIsSuggest(false);
    // 重置请求ID
    setRequestId('');
    // 重置调试结果
    setFinalResult(null);
    // 重置会话消息ID
    setCurrentConversationRequestId('');

    if (timeoutRef.current) {
      //清除会话定时器
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // 发送消息
  const onMessageSend = async (
    id: number,
    messageInfo: string,
    files: UploadFileInfo[] = [],
    infos: AgentSelectedComponentInfo[] = [],
    variableParams?: Record<string, string | number>,
    debug: boolean = false,
    // 是否同步会话记录
    isSync: boolean = true,
    data: any = null,
  ) => {
    // 清除副作用
    handleClearSideEffect();

    // 附件文件
    const attachments: AttachmentFile[] =
      files?.map((file) => ({
        fileKey: file.key || '',
        fileUrl: file.url || '',
        fileName: file.name || '',
        mimeType: file.type || '',
      })) || [];

    // 将文件和消息加入会话中
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
    // 当前助手信息
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

    // 将Incomplete状态的消息改为Complete状态
    const completeMessageList =
      messageList?.map((item: MessageInfo) => {
        if (item.status === MessageStatusEnum.Incomplete) {
          item.status = MessageStatusEnum.Complete;
        }
        return item;
      }) || [];
    const newMessageList = [
      ...completeMessageList,
      chatMessage,
      currentMessage,
    ];
    setMessageList(() => {
      checkConversationActive(newMessageList);
      return newMessageList;
    });
    // 缓存消息列表
    messageListRef.current = newMessageList;

    // 允许滚动
    allowAutoScrollRef.current = true;
    // 隐藏点击下滚按钮
    setShowScrollBtn(false);
    // 滚动
    handleScrollBottom();
    // 会话请求参数
    const params: ConversationChatParams = {
      conversationId: id,
      variableParams,
      message: messageInfo,
      attachments,
      debug,
      selectedComponents: infos,
    };
    // 处理会话
    handleConversation(params, currentMessageId, isSync, data);
  };

  const handleDebug = useCallback((info: MessageInfo) => {
    const result = info?.finalResult;
    if (result) {
      setRequestId(info.requestId as string);
      setFinalResult(result);
    }
    setShowType(EditAgentShowType.Debug_Details);
  }, []);

  const getCurrentConversationRequestId = useCallback(() => {
    return currentConversationRequestId;
  }, [currentConversationRequestId]);

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
    isHistoryConversationOpen,
    openHistoryConversation,
    closeHistoryConversation,
    timedTaskMode,
    isTimedTaskOpen,
    openTimedTask,
    closeTimedTask,
    setConversationInfo,
  };
};
