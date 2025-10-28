import {
  CODE_OPTIMIZE_URL,
  PROMPT_OPTIMIZE_URL,
  SQL_OPTIMIZE_URL,
} from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import {
  AssistantRoleEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import {
  CodeCreateParams,
  OptimizeTypeEnum,
  PromptOptimizeParams,
  PromptOptimizeRes,
  SqlCreateParams,
} from '@/types/interfaces/assistant';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { createSSEConnection } from '@/utils/fetchEventSource';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default () => {
  // 会话信息
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 会话问题建议
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortConnectionRef = useRef<unknown>();

  // 添加一个 ref 来控制是否允许自动滚动
  const allowAutoScrollRef = useRef<boolean>(true);

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

  // 修改消息列表
  const handleChangeMessageList = (
    res: PromptOptimizeRes,
    // 自定义随机id
    currentMessageId: string,
  ) => {
    const { finished, ...data } = res;
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

        if (!finished) {
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
        } else {
          newMessage = {
            ...currentMessage,
            status: MessageStatusEnum.Complete,
            finalResult: data,
          };
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }

        list.splice(index, 1, newMessage as MessageInfo);
        return list;
      });
    }, 200);
    // 滚动到底部
    handleScrollBottom();
  };

  const returnUrl = (type: OptimizeTypeEnum) => {
    const obj = {
      prompt: PROMPT_OPTIMIZE_URL,
      code: CODE_OPTIMIZE_URL,
      sql: SQL_OPTIMIZE_URL,
    };
    return obj[type];
  };

  // 会话处理
  const handleConversation = async (
    params: PromptOptimizeParams | SqlCreateParams | CodeCreateParams,
    currentMessageId: string,
    type: OptimizeTypeEnum,
  ) => {
    const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
    // 启动连接
    abortConnectionRef.current = await createSSEConnection({
      url: returnUrl(type),
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json, text/plain, */* ',
      },
      body: params,
      onMessage: (res: PromptOptimizeRes) => {
        handleChangeMessageList(res, currentMessageId);
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
    params: PromptOptimizeParams | SqlCreateParams | CodeCreateParams,
    type: OptimizeTypeEnum,
  ) => {
    // 清除副作用
    handleClearSideEffect();

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

    setMessageList((list) => {
      const _list =
        list?.map((item) => {
          if (item.status === MessageStatusEnum.Incomplete) {
            item.status = MessageStatusEnum.Complete;
          }
          return item;
        }) || [];

      return [..._list, currentMessage] as MessageInfo[];
    });
    // 滚动
    handleScrollBottom();
    // 处理会话
    await handleConversation(params, currentMessageId, type);
  };

  // 重置初始化
  const resetInit = () => {
    handleClearSideEffect();
    setMessageList([]);
    allowAutoScrollRef.current = true;
  };

  return {
    messageList,
    setMessageList,
    onMessageSend,
    messageViewRef,
    allowAutoScrollRef,
    resetInit,
  };
};
