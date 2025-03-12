import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatInput from '@/components/ChatInput';
import ChatView from '@/components/ChatView';
import RecommendList from '@/components/RecommendList';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import {
  apiAgentConversation,
  apiAgentConversationChatSuggest,
  apiAgentConversationCreate,
} from '@/services/agentConfig';
import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { OpenCloseEnum } from '@/types/enums/space';
import type { CreatorInfo } from '@/types/interfaces/agent';
import type { PreviewAndDebugHeaderProps } from '@/types/interfaces/agentConfig';
import type { UploadInfo } from '@/types/interfaces/common';
import {
  AttachmentFile,
  ConversationChatResponse,
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { createSSEConnection } from '@/utils/fetchEventSource';
import classNames from 'classnames';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';
import PreviewAndDebugHeader from './PreviewAndDebugHeader';

const cx = classNames.bind(styles);

/**
 * 预览与调试组件
 */
const PreviewAndDebug: React.FC<PreviewAndDebugHeaderProps> = ({
  agentId,
  onExecuteResults,
  agentConfigInfo,
  onPressDebug,
}) => {
  // 会话信息
  const [conversationInfo, setConversationInfo] = useState<ConversationInfo>();
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
  // 发布者信息
  const [publishUser, setPublishUser] = useState<CreatorInfo>();
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const devConversationIdRef = useRef<number>(0);
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  // 查询会话
  const { run } = useRequest(apiAgentConversation, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result) => {
      if (result) {
        setConversationInfo(result);
        setMessageList(result.messageList || []);
        setPublishUser(result.agent?.publishUser);
      }
    },
  });

  // 智能体会话问题建议
  const { run: runChatSuggest } = useRequest(apiAgentConversationChatSuggest, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result) => {
      setChatSuggestList(result);
    },
  });

  // 创建会话
  const { run: runConversationCreate } = useRequest(
    apiAgentConversationCreate,
    {
      manual: true,
      debounceWait: 300,
      onSuccess: (result: ConversationInfo) => {
        devConversationIdRef.current = result.id;
      },
    },
  );

  useEffect(() => {
    if (agentConfigInfo) {
      const { devConversationId } = agentConfigInfo;
      devConversationIdRef.current = devConversationId;
      // 查询会话
      run(devConversationId);
    }
  }, [agentConfigInfo?.devConversationId]);

  // 会话处理
  const handleConversation = async (
    message: string,
    attachments: AttachmentFile[] = [],
  ) => {
    const params = {
      conversationId: devConversationIdRef.current,
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
        console.log(data);
        // 更新UI状态...
        if (data.eventType === ConversationEventTypeEnum.FINAL_RESULT) {
          // 调试结果
          const { componentExecuteResults, outputText } = data.data;
          onExecuteResults(componentExecuteResults);
          const chatResponseMessage = {
            role: AssistantRoleEnum.ASSISTANT,
            type: MessageModeEnum.CHAT,
            text: outputText,
            time: moment(),
            id: null,
            // ext: '',
            // finished: true,
            metadata: null,
            messageType: MessageTypeEnum.ASSISTANT,
          };
          setMessageList(
            (messageList) =>
              [...messageList, chatResponseMessage] as MessageInfo[],
          );
          // 是否开启问题建议,可用值:Open,Close
          if (agentConfigInfo.openSuggest === OpenCloseEnum.Open) {
            runChatSuggest(params);
          }
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
      id: Math.random(),
      ext: attachments,
      finished: false,
      metadata: null,
      messageType: MessageTypeEnum.USER,
    };

    setMessageList(
      (messageList) => [...messageList, chatMessage] as MessageInfo[],
    );
    // 处理会话
    await handleConversation(message, attachments);
  };

  // 清空会话记录，实际上是创建新的会话
  const handleClear = () => {
    setConversationInfo(null);
    setChatSuggestList([]);
    runConversationCreate({
      agentId,
      devMode: true,
    });
  };

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <PreviewAndDebugHeader onPressDebug={onPressDebug} />
      <div className={cx(styles['divider-horizontal'])}></div>
      <div
        className={cx(
          styles['main-content'],
          'flex-1',
          'flex',
          'flex-col',
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
                  icon={agentConfigInfo?.icon as string}
                  name={agentConfigInfo?.name as string}
                  avatar={publishUser?.avatar as string}
                  nickname={publishUser?.nickName as string}
                />
              ))}
              {/*会话建议*/}
              <RecommendList
                chatSuggestList={chatSuggestList}
                onClick={onMessageSend}
              />
            </>
          ) : (
            // Chat记录为空
            <AgentChatEmpty
              icon={agentConfigInfo?.icon}
              name={agentConfigInfo?.name as string}
            />
          )}
        </div>
        {/*会话输入框*/}
        <ChatInput onEnter={onMessageSend} onClear={handleClear} />
      </div>
    </div>
  );
};

export default PreviewAndDebug;
