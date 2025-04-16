import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatInput from '@/components/ChatInput';
import ChatView from '@/components/ChatView';
import RecommendList from '@/components/RecommendList';
import useConversation from '@/hooks/useConversation';
import { EditAgentShowType } from '@/types/enums/space';
import type { PreviewAndDebugHeaderProps } from '@/types/interfaces/agentConfig';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { RoleInfo } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useModel } from 'umi';
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
    setConversationInfo,
    messageList,
    setMessageList,
    chatSuggestList,
    runQueryConversation,
    loadingSuggest,
    onMessageSend,
    messageViewRef,
    needUpdateTopicRef,
    handleClearSideEffect,
    setCardList,
    setShowType,
  } = useModel('conversationInfo');
  // 创建智能体会话
  const { runAsyncConversationCreate } = useConversation();

  // 角色信息（名称、头像）
  const roleInfo: RoleInfo = useMemo(() => {
    return {
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

  useEffect(() => {
    if (agentConfigInfo) {
      const { devConversationId } = agentConfigInfo;
      devConversationIdRef.current = devConversationId;
      // 查询会话
      runQueryConversation(devConversationId);
    }

    return () => {
      setShowType(EditAgentShowType.Hide);
      setCardList([]);
      handleClearSideEffect();
      setMessageList([]);
      setConversationInfo(null);
      needUpdateTopicRef.current = true;
    };
  }, [agentConfigInfo?.devConversationId]);

  // 清空会话记录，实际上是创建新的会话
  const handleClear = useCallback(async () => {
    handleClearSideEffect();
    setMessageList([]);
    // 创建智能体会话
    const { success, data } = await runAsyncConversationCreate({
      agentId,
      devMode: false,
    });

    if (success) {
      const id = data?.id;
      devConversationIdRef.current = id;
      // 查询会话
      runQueryConversation(id);
    }
  }, [agentId]);

  // 消息发送
  const handleMessageSend = (message: string, files?: UploadFileInfo[]) => {
    const id = devConversationIdRef.current;
    if (!id) {
      return;
    }

    onMessageSend(id, message, files, true);
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
          {messageList?.length > 0 || chatSuggestList?.length > 0 ? (
            <>
              {messageList?.map((item, index: number) => (
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
        <ChatInput
          disabled={!messageList?.length}
          onEnter={handleMessageSend}
          onClear={handleClear}
        />
      </div>
    </div>
  );
};

export default PreviewAndDebug;
