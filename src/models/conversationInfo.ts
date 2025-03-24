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
import { MessageStatusEnum } from '@/types/enums/common';
import { EditAgentShowType, OpenCloseEnum } from '@/types/enums/space';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  AttachmentFile,
  ConversationChatResponse,
  ConversationInfo,
  ExecuteResultInfo,
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { useRequest } from 'ahooks';
import moment from 'moment/moment';
import { useCallback, useEffect, useRef, useState } from 'react';

export default () => {
  const [needUpdateTopic, setNeedUpdateTopic] = useState<boolean>(true);
  // 会话信息
  const [conversationInfo, setConversationInfo] = useState<ConversationInfo>();
  // 会话信息
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<number>(0);
  const abortConnectionRef = useRef<unknown>();
  const [showType, setShowType] = useState<EditAgentShowType>(
    EditAgentShowType.Hide,
  );
  // 调试结果
  const [executeResults, setExecuteResults] = useState<ExecuteResultInfo[]>([]);

  const handleScrollBottom = () => {
    scrollTimeoutRef.current = setTimeout(() => {
      // 滚动到底部
      messageViewRef.current?.scrollTo({
        top: messageViewRef.current?.scrollHeight,
        behavior: 'smooth',
      });
    }, 400);
  };

  // 根据用户消息更新会话主题
  const { run: runUpdateTopic } = useRequest(apiAgentConversationUpdate, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result) => {
      setNeedUpdateTopic(false);
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
  const { run: runQueryConversation, runAsync } = useRequest(
    apiAgentConversation,
    {
      manual: true,
      debounceWait: 300,
      onSuccess: (result) => {
        setConversationInfo(result.data);
        setMessageList(result.data?.messageList || []);
        handleScrollBottom();
      },
    },
  );

  // 智能体会话问题建议
  const { run: runChatSuggest, loading: loadingSuggest } = useRequest(
    apiAgentConversationChatSuggest,
    {
      manual: true,
      debounceWait: 300,
      onSuccess: (result) => {
        setChatSuggestList(result.data);
        handleScrollBottom();
      },
    },
  );

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = 0;
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = 0;
      if (abortConnectionRef.current) {
        abortConnectionRef.current();
        abortConnectionRef.current = null;
      }
    };
  }, [timeoutRef, scrollTimeoutRef, abortConnectionRef]);

  // 会话处理
  const handleConversation = async (
    id: number,
    message: string,
    attachments: AttachmentFile[] = [],
    debug = false,
  ) => {
    const params = {
      conversationId: id,
      message,
      attachments,
      debug,
    };

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
        const { data, eventType } = res;
        timeoutRef.current = setTimeout(() => {
          setMessageList((list) => {
            const lastMessage = list.slice(-1)[0] as MessageInfo;
            const currentMessage =
              list.find((info) => info.id === data?.id) || lastMessage;
            if (!currentMessage) {
              return [];
            }
            let newMessage = null;
            // 更新UI状态...
            if (eventType === ConversationEventTypeEnum.PROCESSING) {
              newMessage = {
                ...currentMessage,
                id: data?.id,
                status: MessageStatusEnum.Loading,
                processingList: [
                  ...(currentMessage?.processingList || []),
                  data,
                ] as ProcessingInfo[],
              };
            }
            if (eventType === ConversationEventTypeEnum.MESSAGE) {
              const { id: messageId, text, think } = res.data;
              newMessage = {
                ...currentMessage,
                id: messageId,
                text: `${currentMessage.text}${text}`,
                think: `${currentMessage.think}${think}`,
                status: MessageStatusEnum.Incomplete,
              };
            }
            if (eventType === ConversationEventTypeEnum.FINAL_RESULT) {
              const { componentExecuteResults } = data;
              newMessage = {
                ...currentMessage,
                status: MessageStatusEnum.Complete,
                finalResult: data,
              };
              // 调试结果
              setExecuteResults(componentExecuteResults);
              clearTimeout(timeoutRef.current);
              timeoutRef.current = 0;
              // 是否开启问题建议,可用值:Open,Close
              if (conversationInfo?.agent.openSuggest === OpenCloseEnum.Open) {
                // 滚动到底部
                handleScrollBottom();
                runChatSuggest(params);
              }
            }
            if (res.eventType === ConversationEventTypeEnum.ERROR) {
              return list;
            }

            return [...list.slice(0, -1), newMessage] as MessageInfo[];
          });
        }, 200);
        // 滚动到底部
        handleScrollBottom();
      },
    });
    // 主动关闭连接
    abortConnectionRef.current();
  };

  // 发送消息
  const onMessageSend = async (
    id: number,
    message: string,
    files: UploadFileInfo[] = [],
    debug = false,
  ) => {
    setChatSuggestList([]);
    timeoutRef.current = 0;
    clearTimeout(timeoutRef.current);
    if (abortConnectionRef.current) {
      abortConnectionRef.current();
      abortConnectionRef.current = null;
    }

    setMessageList((list) => {
      return list?.map((item) => {
        if (item.status === MessageStatusEnum.Incomplete) {
          item.status = MessageStatusEnum.Complete;
        }
        return item;
      }) as MessageInfo[];
    });

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
      time: moment(),
      attachments,
      id: Math.random(),
      messageType: MessageTypeEnum.USER,
    };
    // 助手信息
    const assistantMessage = {
      role: AssistantRoleEnum.ASSISTANT,
      type: MessageModeEnum.CHAT,
      text: '',
      time: moment(),
      id: Math.random(),
      messageType: MessageTypeEnum.ASSISTANT,
      status: MessageStatusEnum.Loading,
    } as MessageInfo;

    setMessageList(
      (list) => [...list, chatMessage, assistantMessage] as MessageInfo[],
    );
    await handleScrollBottom();
    // 处理会话
    await handleConversation(id, message, attachments, debug);
    // 第一次发送消息后更新主题
    if (needUpdateTopic) {
      runUpdateTopic({
        id,
        firstMessage: message,
      });
    }
  };

  const handleDebug = useCallback((item: MessageInfo) => {
    const result = item?.finalResult?.componentExecuteResults;
    if (result) {
      setExecuteResults(result as ExecuteResultInfo[]);
    }
    setShowType(EditAgentShowType.Debug_Details);
  }, []);

  return {
    conversationInfo,
    messageList,
    setMessageList,
    executeResults,
    chatSuggestList,
    setChatSuggestList,
    runQueryConversation,
    runAsync,
    loadingSuggest,
    onMessageSend,
    handleDebug,
    messageViewRef,
    showType,
    setShowType,
    setNeedUpdateTopic,
  };
};
