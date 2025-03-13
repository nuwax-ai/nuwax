import { CONVERSATION_CONNECTION_URL } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import {
  apiAgentConversation,
  apiAgentConversationChatSuggest,
} from '@/services/agentConfig';
import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { UploadInfo } from '@/types/interfaces/common';
import type {
  AttachmentFile,
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import {
  ConversationInfo,
  ExecuteResultInfo,
} from '@/types/interfaces/conversationInfo';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { useRequest } from '@@/exports';
import moment from 'moment/moment';
import { useCallback, useEffect, useRef, useState } from 'react';

export default () => {
  // 会话信息
  const [conversationInfo, setConversationInfo] = useState<ConversationInfo>();
  // 会话信息
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<number>(0);
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

  // 查询会话
  const { run: runQueryConversation } = useRequest(apiAgentConversation, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result) => {
      setConversationInfo(result);
      setMessageList(result?.messageList || []);
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
        setChatSuggestList(result);
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
    openSuggest = false,
  ) => {
    const params = {
      conversationId: id,
      message,
      attachments,
      // debug: true,
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
            let newMessage;
            // 更新UI状态...
            if (data.eventType === ConversationEventTypeEnum.PROCESSING) {
              newMessage = {
                ...lastMessage,
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
              const { outputText, componentExecuteResults } = data.data;
              newMessage = {
                ...lastMessage,
                text: outputText,
                status: MessageStatusEnum.Complete,
                finalResult: data.data,
              };
              // 调试结果
              setExecuteResults(componentExecuteResults);
              // 是否开启问题建议,可用值:Open,Close
              if (openSuggest) {
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
    clearTimeout(timeoutRef.current);
    timeoutRef.current = 0;
  };

  // 发送消息
  const onMessageSend = async (
    id: number,
    message: string,
    files: UploadInfo[] = [],
    openSuggest?: boolean,
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
      (messageList) =>
        [...messageList, chatMessage, assistantMessage] as MessageInfo[],
    );
    handleScrollBottom();
    // 处理会话
    await handleConversation(id, message, attachments, openSuggest);
  };

  const handleDebug = useCallback((item: MessageInfo) => {
    const result = item?.finalResult?.componentExecuteResults;
    if (result) {
      setExecuteResults(result as ExecuteResultInfo[]);
    }
  }, []);

  return {
    conversationInfo,
    messageList,
    setMessageList,
    executeResults,
    chatSuggestList,
    setChatSuggestList,
    runQueryConversation,
    loadingSuggest,
    onMessageSend,
    handleDebug,
    messageViewRef,
  };
};
