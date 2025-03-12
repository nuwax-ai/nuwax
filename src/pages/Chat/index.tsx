import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatInput from '@/components/ChatInput';
import ChatView from '@/components/ChatView';
import RecommendList from '@/components/RecommendList';
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
import {
  AttachmentFile,
  ConversationChatResponse,
  ConversationInfo,
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { createSSEConnection } from '@/utils/fetchEventSource';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import moment from 'moment';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useMatch, useRequest } from 'umi';
import styles from './index.less';
import ShowArea from './ShowArea';

const cx = classNames.bind(styles);

/**
 * 主页咨询聊天页面
 */
const Chat: React.FC = () => {
  const location = useLocation();
  const match = useMatch('/home/chat/:id');
  // 会话ID
  const id = match.params?.id;
  // 附加state
  const message = location.state?.message;
  const files = location.state?.files;
  // 会话信息
  const [conversationInfo, setConversationInfo] = useState<ConversationInfo>();
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
  // 调试结果
  const [executeResults, setExecuteResults] = useState<string[]>([]);
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  // 智能体会话问题建议
  const { run: runChatSuggest, loading } = useRequest(
    apiAgentConversationChatSuggest,
    {
      manual: true,
      debounceWait: 300,
      onSuccess: (result) => {
        setChatSuggestList(result);
      },
    },
  );

  const roleInfo: RoleInfo = useMemo(() => {
    return {
      user: {
        name: conversationInfo?.agent?.publishUser?.nickName as string,
        avatar: conversationInfo?.agent?.publishUser?.avatar as string,
      },
      assistant: {
        name: conversationInfo?.agent?.name as string,
        avatar: conversationInfo?.agent?.icon as string,
      },
      system: {
        name: conversationInfo?.agent?.name as string,
        avatar: conversationInfo?.agent?.icon as string,
      },
    };
  }, [conversationInfo]);

  // 会话处理
  const handleConversation = async (
    message: string,
    attachments: AttachmentFile[] = [],
  ) => {
    const params = {
      conversationId: id,
      message,
      attachments,
      debug: true,
    };

    // 启动连接
    const abortConnection = await createSSEConnection({
      url: `${process.env.BASE_URL}/api/agent/conversation/chat`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json, text/plain, */* ',
      },
      body: params,
      onMessage: (data: ConversationChatResponse) => {
        // console.log(data, '====');
        const _messageList = cloneDeep(messageList);
        const lastMessage = _messageList.slice(-1)[0] as MessageInfo;
        let newMessage;
        // 更新UI状态...
        if (data.eventType === ConversationEventTypeEnum.PROCESSING) {
          newMessage = {
            ...lastMessage,
            status: MessageStatusEnum.Incomplete,
          };
        }
        if (data.eventType === ConversationEventTypeEnum.MESSAGE) {
          const { text } = data.data;
          newMessage = {
            ...lastMessage,
            text: `${lastMessage.text}${text}`,
          };

          console.log(`${lastMessage.text}${text}`);
        }
        if (data.eventType === ConversationEventTypeEnum.FINAL_RESULT) {
          const { outputText, componentExecuteResults } = data.data;
          newMessage = {
            ...lastMessage,
            text: outputText,
            status: MessageStatusEnum.Complete,
            finalResult: componentExecuteResults,
          };
          // 调试结果
          setExecuteResults(componentExecuteResults);
          runChatSuggest(params);
        }

        setMessageList([
          ..._messageList.slice(0, -1),
          newMessage,
        ] as MessageInfo[]);
      },
    });
    // 主动关闭连接
    abortConnection();
    // 滚动到底部
    messageViewRef.current?.scrollTo({
      top: messageViewRef.current?.scrollHeight,
      behavior: 'smooth',
    });
  };

  // 发送消息
  const onMessageSend = async (message: string, files: UploadInfo[] = []) => {
    if (!devConversationIdRef.current) {
      return;
    }
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
    // 处理会话
    await handleConversation(message, attachments);
  };

  // 查询会话
  const { run } = useRequest(apiAgentConversation, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result) => {
      setConversationInfo(result);
      // 如果message或者附件不为空
      if (message || files?.length > 0) {
        handleConversation(message, files);
      }
    },
  });

  useEffect(() => {
    // 查询会话
    if (id) {
      run(id);
    }
  }, [id]);

  const handleDebug = () => {
    console.log('调试');
  };

  return (
    <div className={cx('flex', 'h-full')}>
      <div className={cx('flex-1', 'flex', 'flex-col', 'items-center')}>
        {/*<h3 className={cx(styles.title)}>{chatTitle}</h3>*/}
        <div
          className={cx(
            styles['main-content'],
            'flex-1',
            'flex',
            'flex-col',
            'w-full',
            'overflow-y',
          )}
        >
          <div
            className={cx(styles['chat-wrapper'], 'flex-1')}
            ref={messageViewRef}
          >
            {conversationInfo?.messageList?.length > 0 ? (
              <>
                {conversationInfo?.messageList?.map((item, index) => (
                  <ChatView
                    key={index}
                    messageInfo={item}
                    roleInfo={roleInfo}
                    onDebug={handleDebug}
                  />
                ))}
                {/*会话建议*/}
                <RecommendList
                  loading={loading}
                  chatSuggestList={chatSuggestList}
                  onClick={onMessageSend}
                />
              </>
            ) : (
              // Chat记录为空
              <AgentChatEmpty name={'智能体'} />
            )}
          </div>
          {/*会话输入框*/}
          <ChatInput onEnter={onMessageSend} />
        </div>
      </div>
      {/*展示台区域*/}
      <ShowArea executeResults={executeResults} />
    </div>
  );
};

export default Chat;
