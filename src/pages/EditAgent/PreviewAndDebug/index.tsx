import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatInput from '@/components/ChatInput';
import ChatView from '@/components/ChatView';
import RecommendList from '@/components/RecommendList';
import { apiAgentConversationCreate } from '@/services/agentConfig';
import type { PreviewAndDebugHeaderProps } from '@/types/interfaces/agentConfig';
import type {
  ConversationInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import { OpenCloseEnum } from '@/types/enums/space';
import { UploadInfo } from '@/types/interfaces/common';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useModel, useRequest } from 'umi';
import styles from './index.less';
import PreviewAndDebugHeader from './PreviewAndDebugHeader';

const cx = classNames.bind(styles);

/**
 * 预览与调试组件
 */
const PreviewAndDebug: React.FC<PreviewAndDebugHeaderProps> = ({
  agentId,
  agentConfigInfo,
  onPressDebug,
}) => {
  // 会话ID
  const devConversationIdRef = useRef<number>(0);
  const {
    messageList,
    setMessageList,
    chatSuggestList,
    setChatSuggestList,
    runQueryConversation,
    loadingSuggest,
    onMessageSend,
    messageViewRef,
  } = useModel('conversationInfo');

  // 角色信息（名称、头像）
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
      runQueryConversation(devConversationId);
    }
  }, [agentConfigInfo?.devConversationId]);

  // 清空会话记录，实际上是创建新的会话
  const handleClear = useCallback(() => {
    setMessageList([]);
    setChatSuggestList([]);
    runConversationCreate({
      agentId,
      devMode: true,
    });
  }, [agentId]);

  // 消息发送
  const handleMessageSend = (message: string, files?: UploadInfo[]) => {
    const id = devConversationIdRef.current;
    if (!id) {
      return;
    }
    const openSuggest = agentConfigInfo.openSuggest === OpenCloseEnum.Open;
    onMessageSend(id, message, files, openSuggest, true);
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
                <ChatView key={index} messageInfo={item} roleInfo={roleInfo} />
              ))}
              {/*会话建议*/}
              <RecommendList
                loading={loadingSuggest}
                chatSuggestList={chatSuggestList}
                onClick={handleMessageSend}
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
        <ChatInput onEnter={handleMessageSend} onClear={handleClear} />
      </div>
    </div>
  );
};

export default PreviewAndDebug;
