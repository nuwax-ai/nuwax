import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatInputHome from '@/components/ChatInputHome';
import ChatInputPhone from '@/components/ChatInputPhone';
import ChatView from '@/components/ChatView';
import ConditionRender from '@/components/ConditionRender';
import RecommendList from '@/components/RecommendList';
import {
  TEMP_CONVERSATION_CONNECTION_URL,
  TEMP_CONVERSATION_UID,
} from '@/constants/common.constants';
import {
  apiTempChatConversationCreate,
  apiTempChatConversationQuery,
} from '@/services/tempChat';
import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import {
  AgentManualComponentInfo,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  ConversationChatResponse,
  ConversationInfo,
  MessageInfo,
  MessageQuestionExtInfo,
  ProcessingInfo,
  RoleInfo,
  TempConversationChatParams,
} from '@/types/interfaces/conversationInfo';
import { RequestResponse } from '@/types/interfaces/request';
import { addBaseTarget } from '@/utils/common';
import { createSSEConnection } from '@/utils/fetchEventSource';
import { LoadingOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { message } from 'antd';
import classNames from 'classnames';
import { throttle } from 'lodash';
import moment from 'moment';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 主页咨询聊天页面
 */
const ChatTemp: React.FC = () => {
  // 链接Key
  const { chatKey } = useParams();
  // 会话信息
  const [conversationInfo, setConversationInfo] =
    useState<ConversationInfo | null>();
  // 会话信息
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortConnectionRef = useRef<unknown>();
  const [isLoadingConversation, setIsLoadingConversation] =
    useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  // 添加一个 ref 来控制是否允许自动滚动
  const allowAutoScrollRef = useRef<boolean>(true);
  // 是否显示点击下滚按钮
  const [showScrollBtn, setShowScrollBtn] = useState<boolean>(false);
  // 可手动选择的组件列表
  const [manualComponents, setManualComponents] = useState<
    AgentManualComponentInfo[]
  >([]);
  // 会话UID
  const conversationUid = useRef<string>();

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

  // 查询临时会话详细
  const { run: runQueryConversation } = useRequest(
    apiTempChatConversationQuery,
    {
      manual: true,
      debounceWait: 300,
      onSuccess: (result: RequestResponse<ConversationInfo>) => {
        setIsLoadingConversation(false);
        const { data } = result;
        setConversationInfo(data);
        setIsLoaded(true);
        // 消息列表
        const _messageList = data?.messageList || [];
        // 可手动选择的组件列表
        setManualComponents(data?.agent?.manualComponents || []);
        // 问题建议列表
        let suggestList: string[] = [];
        if (_messageList?.length) {
          setMessageList(_messageList || []);
          // 最后一条消息为"问答"时，获取问题建议
          const lastMessage = _messageList?.[_messageList.length - 1];
          if (
            lastMessage.type === MessageModeEnum.QUESTION &&
            lastMessage.ext?.length
          ) {
            suggestList = lastMessage.ext.map((item) => item.content) || [];
          }
        }
        if (suggestList?.length) {
          setChatSuggestList(suggestList);
        } else {
          // 开场白预置问题
          setChatSuggestList(data?.agent?.openingGuidQuestions || []);
        }
        handleScrollBottom();
      },
      onError: () => {
        setIsLoadingConversation(false);
      },
    },
  );

  // 创建临时会话
  const { runAsync: runTempChatCreate } = useRequest(
    apiTempChatConversationCreate,
    {
      manual: true,
      debounceWait: 300,
    },
  );

  // 修改消息列表
  const handleChangeMessageList = (
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
        }
        // MESSAGE事件
        if (eventType === ConversationEventTypeEnum.MESSAGE) {
          const { text, type, ext } = data;
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
              status: MessageStatusEnum.Incomplete,
            };
            if (ext?.length) {
              // 问题建议
              setChatSuggestList(
                ext.map((extItem: MessageQuestionExtInfo) => extItem.content) ||
                  [],
              );
            }
          } else {
            newMessage = {
              ...currentMessage,
              text: `${currentMessage.text}${text}`,
              status: MessageStatusEnum.Incomplete,
            };
          }
        }
        // FINAL_RESULT事件
        if (eventType === ConversationEventTypeEnum.FINAL_RESULT) {
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
        // ERROR事件
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
  };

  // 会话处理
  const handleConversation = async (
    params: TempConversationChatParams,
    currentMessageId: string,
  ) => {
    // 启动连接
    abortConnectionRef.current = await createSSEConnection({
      url: TEMP_CONVERSATION_CONNECTION_URL,
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */* ',
      },
      body: params,
      onMessage: (res: ConversationChatResponse) => {
        handleChangeMessageList(res, currentMessageId);
        // 滚动到底部
        handleScrollBottom();
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
    setMessageList([]);
    setConversationInfo(null);
    allowAutoScrollRef.current = true;
    setShowScrollBtn(false);
  };

  // 发送消息
  const onMessageSend = async (
    message: string,
    files: UploadFileInfo[] = [],
    infos: AgentSelectedComponentInfo[] = [],
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
    // 允许滚动
    allowAutoScrollRef.current = true;
    // 隐藏点击下滚按钮
    setShowScrollBtn(false);
    // 滚动
    handleScrollBottom();
    // 会话请求参数
    const params: TempConversationChatParams = {
      chatKey,
      conversationUid: conversationUid.current || '',
      message,
      attachments,
      selectedComponents: infos,
    };
    // 处理会话
    handleConversation(params, currentMessageId);
  };

  // 角色信息（名称、头像）
  const roleInfo: RoleInfo = useMemo(() => {
    const agent = conversationInfo?.agent;
    return {
      assistant: {
        name: agent?.name as string,
        avatar: agent?.icon as string,
      },
      system: {
        name: agent?.name as string,
        avatar: agent?.icon as string,
      },
    };
  }, [conversationInfo]);

  useEffect(() => {
    const asyncFun = async () => {
      if (chatKey) {
        setIsLoadingConversation(true);
        const uid = sessionStorage.getItem(TEMP_CONVERSATION_UID);
        if (uid) {
          // 查询临时会话详细
          runQueryConversation({ chatKey, conversationUid: uid });
          conversationUid.current = uid;
          return;
        }
        // 创建临时会话
        const {
          data,
          success,
          message: _message,
        } = await runTempChatCreate({ chatKey });
        if (success) {
          conversationUid.current = data.uid;
          sessionStorage.setItem(TEMP_CONVERSATION_UID, data.uid);
          // 查询临时会话详细
          runQueryConversation({ chatKey, conversationUid: data.uid });
        } else {
          setIsLoadingConversation(false);
          message.warning(_message);
        }
      }
    };

    asyncFun();
  }, [chatKey]);

  // 在组件挂载时添加滚动事件监听器
  useEffect(() => {
    const messageView = messageViewRef.current;
    if (messageView) {
      const handleScroll = () => {
        // 当用户手动滚动时，暂停自动滚动
        const { scrollTop, scrollHeight, clientHeight } = messageView;
        if (scrollTop + clientHeight < scrollHeight) {
          allowAutoScrollRef.current = false;
          // 清除滚动
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = null;
          }
          setShowScrollBtn(true);
        } else {
          // 当用户滚动到底部时，重新允许自动滚动
          allowAutoScrollRef.current = true;
          setShowScrollBtn(false);
        }
      };

      messageView.addEventListener('wheel', throttle(handleScroll, 300));
      // 组件卸载时移除滚动事件监听器
      return () => {
        messageView.removeEventListener('wheel', throttle(handleScroll, 300));
        resetInit();
      };
    }
  }, []);

  useEffect(() => {
    addBaseTarget();
  }, []);

  // 消息发送
  const handleMessageSend = (
    message: string,
    files?: UploadFileInfo[],
    selectedComponentInfos?: AgentSelectedComponentInfo[],
  ) => {
    onMessageSend(message, files, selectedComponentInfos);
  };

  // 修改 handleScrollBottom 函数，添加自动滚动控制
  const onScrollBottom = () => {
    allowAutoScrollRef.current = true;
    // 滚动到底部
    messageViewRef.current?.scrollTo({
      top: messageViewRef.current?.scrollHeight,
      behavior: 'smooth',
    });
    setShowScrollBtn(false);
  };

  return (
    <div
      className={cx(
        styles.container,
        'flex',
        'flex-col',
        'h-full',
        'overflow-y',
      )}
      ref={messageViewRef}
    >
      <div className={cx('flex-1', 'flex', 'flex-col', styles['main-content'])}>
        <ConditionRender condition={messageList?.length > 0}>
          <h3 className={cx(styles.title, 'text-ellipsis')}>
            {conversationInfo?.agent?.name
              ? `和${conversationInfo?.agent?.name}开始会话`
              : '开始会话'}
          </h3>
        </ConditionRender>
        <div className={cx(styles['chat-wrapper'], 'flex-1')}>
          {isLoadingConversation ? (
            <div
              className={cx('flex', 'items-center', 'content-center', 'h-full')}
            >
              <LoadingOutlined className={cx(styles.loading)} />
            </div>
          ) : messageList?.length > 0 ? (
            <>
              {messageList?.map((item: MessageInfo, index: number) => (
                <ChatView
                  className={cx(styles['phone-chat-item'])}
                  key={index}
                  messageInfo={item}
                  roleInfo={roleInfo}
                  mode={'home'}
                />
              ))}
              {/*会话建议*/}
              <RecommendList
                chatSuggestList={chatSuggestList}
                onClick={handleMessageSend}
              />
            </>
          ) : (
            isLoaded && (
              // Chat记录为空
              <AgentChatEmpty
                icon={conversationInfo?.agent?.icon}
                name={conversationInfo?.agent?.name || ''}
                // 会话建议
                extra={
                  <RecommendList
                    className="mt-16"
                    itemClassName={cx(styles['suggest-item'])}
                    chatSuggestList={chatSuggestList}
                    onClick={handleMessageSend}
                  />
                }
              />
            )
          )}
        </div>
        <div className={cx(styles['chat-input-container'])}>
          {/*会话输入框*/}
          <ChatInputHome
            className={cx(styles['input-container'])}
            onEnter={handleMessageSend}
            visible={showScrollBtn}
            manualComponents={manualComponents}
            onScrollBottom={onScrollBottom}
          />
          <ChatInputPhone
            className={cx(styles['phone-container'])}
            onEnter={handleMessageSend}
            visible={showScrollBtn}
            manualComponents={manualComponents}
            onScrollBottom={onScrollBottom}
          />
          <p
            className={cx(styles['welcome-text'], 'text-ellipsis')}
          >{`欢迎使用${conversationInfo?.agent?.name}平台，快速搭建你的个性化智能体`}</p>
        </div>
      </div>
    </div>
  );
};

export default ChatTemp;
