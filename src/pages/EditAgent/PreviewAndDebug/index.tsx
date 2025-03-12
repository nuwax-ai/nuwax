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
import { MessageStatusEnum } from '@/types/enums/common';
import { OpenCloseEnum } from '@/types/enums/space';
import type { PreviewAndDebugHeaderProps } from '@/types/interfaces/agentConfig';
import type { UploadInfo } from '@/types/interfaces/common';
import type {
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
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const devConversationIdRef = useRef<number>(0);
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  // 查询会话
  const { run } = useRequest(apiAgentConversation, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result) => {
      setMessageList(result?.messageList || []);
    },
  });

  const roleInfo: RoleInfo = useMemo(() => {
    return {
      user: {
        name: agentConfigInfo?.creator.nickName as string,
        avatar: agentConfigInfo?.creator.avatar as string,
      },
      assistant: {
        name: agentConfigInfo?.name as string,
        avatar: agentConfigInfo?.icon as string,
      },
      system: {
        name: agentConfigInfo?.name as string,
        avatar: agentConfigInfo?.icon as string,
      },
    };
  }, [agentConfigInfo]);

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
          onExecuteResults(componentExecuteResults);
          // 是否开启问题建议,可用值:Open,Close
          if (agentConfigInfo.openSuggest === OpenCloseEnum.Open) {
            runChatSuggest(params);
          }
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

  // 清空会话记录，实际上是创建新的会话
  const handleClear = () => {
    setMessageList([]);
    setChatSuggestList([]);
    runConversationCreate({
      agentId,
      devMode: true,
    });
  };

  const handleDebug = () => {
    console.log('调试');
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
          {messageList?.length > 0 ? (
            <>
              {messageList?.map((item, index) => (
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
