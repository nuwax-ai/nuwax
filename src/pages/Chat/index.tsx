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
import type { CreatorInfo } from '@/types/interfaces/agent';
import type { UploadInfo } from '@/types/interfaces/common';
import {
  ConversationChatResponse,
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { createSSEConnection } from '@/utils/fetchEventSource';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
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
  // 发布者信息
  const [publishUser, setPublishUser] = useState<CreatorInfo>();
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  // 智能体会话问题建议
  const { run: runChatSuggest } = useRequest(apiAgentConversationChatSuggest, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result) => {
      setChatSuggestList(result);
    },
  });

  // 会话处理
  const handleConversation = async (
    value: string,
    files: UploadInfo[] = [],
  ) => {
    if (!id) {
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

    const params = {
      conversationId: id,
      message: value,
      attachments,
    };

    // 将文件和消息加入会话中
    const chatMessage = {
      role: AssistantRoleEnum.USER,
      type: MessageModeEnum.CHAT,
      text: value,
      time: moment(),
      id: null,
      ext: attachments,
      finished: false,
      metadata: null,
      messageType: MessageTypeEnum.USER,
    };

    const _messageList = cloneDeep(messageList);
    _messageList?.push(chatMessage);
    setMessageList(_messageList);

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
        console.log(data, '-------');
        // 更新UI状态...
        if (data.eventType === ConversationEventTypeEnum.FINAL_RESULT) {
          // 调试结果
          const { componentExecuteResults, outputText } = data.data;
          console.log(componentExecuteResults, outputText);
          // onExecuteResults(componentExecuteResults);
          // const chatResponseMessage = {
          //   role: AssistantRoleEnum.ASSISTANT,
          //   type: MessageModeEnum.CHAT,
          //   text: outputText,
          //   time: moment(),
          //   // id: null,
          //   // ext: '',
          //   // finished: true,
          //   // metadata: null,
          //   messageType: MessageTypeEnum.ASSISTANT,
          // };
          // messageList?.push(chatResponseMessage);
          // setConversationInfo(_conversationInfo);
          runChatSuggest(params);
          // 是否开启问题建议,可用值:Open,Close
          // if (agentConfigInfo.openSuggest === OpenCloseEnum.Open) {
          //   runChatSuggest(params);
          // }
        }
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

  // 查询会话
  const { run } = useRequest(apiAgentConversation, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result) => {
      setConversationInfo(result);
      setPublishUser(result?.agent?.publishUser);
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
                    icon={conversationInfo?.agent?.publishUser?.avatar}
                    name={conversationInfo?.agent?.publishUser?.nickName}
                    key={index}
                    messageInfo={item}
                    avatar={publishUser?.avatar as string}
                    nickname={publishUser?.nickName as string}
                  />
                ))}
                {/*会话建议*/}
                <RecommendList
                  chatSuggestList={chatSuggestList}
                  onClick={handleConversation}
                />
              </>
            ) : (
              // Chat记录为空
              <AgentChatEmpty name={'智能体'} />
            )}
          </div>
          {/*会话输入框*/}
          <ChatInput onEnter={handleConversation} />
        </div>
      </div>
      {/*展示台区域*/}
      <ShowArea />
    </div>
  );
};

export default Chat;
