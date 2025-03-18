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
import moment from 'moment/moment';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRequest } from 'ahooks';

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
  const [showType, setShowType] = useState<EditAgentShowType>(
    EditAgentShowType.Hide,
  );
  // 调试结果
  const [executeResults, setExecuteResults] = useState<ExecuteResultInfo[]>([]);
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

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
      setConversationInfo((info) => ({
        ...info,
        topic: result?.data?.topic,
      } as ConversationInfo));
    },
  });

  // 查询会话
  const { run: runQueryConversation, runAsync } = useRequest(apiAgentConversation, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result) => {
      setConversationInfo(result.data);
      setMessageList(result.data?.messageList || []);
      handleScrollBottom();
    },
  });

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
    };
  }, []);

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

    // 启动连接
    const abortConnection = await createSSEConnection({
      url: CONVERSATION_CONNECTION_URL,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json, text/plain, */* ',
      },
      body: params,
      onMessage: (data: ConversationChatResponse) => {
        timeoutRef.current = setTimeout(() => {
          setMessageList((list) => {
            const lastMessage = list.slice(-1)[0] as MessageInfo;
            if (!lastMessage) {
              return [];
            }
            let newMessage = null;
            // 更新UI状态...
            if (data.eventType === ConversationEventTypeEnum.PROCESSING) {
              newMessage = {
                ...lastMessage,
                status: MessageStatusEnum.Loading,
                processingList: [
                  ...(lastMessage?.processingList || []),
                  data.data,
                ] as ProcessingInfo[],
              };
            }
            if (data.eventType === ConversationEventTypeEnum.MESSAGE) {
              const { text } = data.data;
              newMessage = {
                ...lastMessage,
                text: `${lastMessage.text}${text}`,
                status: MessageStatusEnum.Incomplete,
              };
            }
            if (data.eventType === ConversationEventTypeEnum.FINAL_RESULT) {
              const { componentExecuteResults } = data.data;
              newMessage = {
                ...lastMessage,
                status: MessageStatusEnum.Complete,
                finalResult: data.data,
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

            return [...list.slice(0, -1), newMessage] as MessageInfo[];
          });
        }, 200);
        // 滚动到底部
        handleScrollBottom();
      },
    });
    // 主动关闭连接
    abortConnection();
  };

  // 发送消息
  const onMessageSend = async (
    id: number,
    message: string,
    files: UploadFileInfo[] = [],
    debug = false,
  ) => {
    setChatSuggestList([]);
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
