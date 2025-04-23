import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import RecommendList from '@/components/RecommendList';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useModel, useParams } from 'umi';
import AgentSidebar from './AgentSidebar';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 主页咨询聊天页面
 */
const AgentDetails: React.FC = () => {
  // 智能体ID
  const { agentId } = useParams();

  console.log(agentId);

  const {
    conversationInfo,
    loadingConversation,
    messageList,
    chatSuggestList,
    isLoadingConversation,
    loadingSuggest,
    messageViewRef,
  } = useModel('conversationInfo');

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

  // 消息发送
  const handleMessageSend = (message: string, files?: UploadFileInfo[]) => {
    // onMessageSend(message, files);
    console.log(message, files);
  };

  return (
    <div className={cx('flex', 'h-full', 'overflow-y')} ref={messageViewRef}>
      <div className={cx('flex-1', 'flex', 'flex-col', styles['main-content'])}>
        <h3 className={cx(styles.title)}>{conversationInfo?.topic}</h3>
        <div className={cx(styles['chat-wrapper'], 'flex-1')}>
          {loadingConversation ? (
            <div
              className={cx('flex', 'items-center', 'content-center', 'h-full')}
            >
              <LoadingOutlined className={cx(styles.loading)} />
            </div>
          ) : messageList?.length > 0 || chatSuggestList?.length > 0 ? (
            <>
              {messageList?.map((item: MessageInfo, index: number) => (
                <ChatView
                  key={index}
                  messageInfo={item}
                  roleInfo={roleInfo}
                  canDebug={false}
                  contentClassName={styles['chat-inner']}
                />
              ))}
              {/*会话建议*/}
              <RecommendList
                className={styles['suggest-item']}
                loading={loadingSuggest}
                chatSuggestList={chatSuggestList}
                onClick={handleMessageSend}
              />
            </>
          ) : (
            isLoadingConversation && (
              // Chat记录为空
              <AgentChatEmpty
                icon={conversationInfo?.agent?.icon}
                name={conversationInfo?.agent?.name}
              />
            )
          )}
        </div>
        {/*会话输入框*/}
        <ChatInputHome
          className={cx(styles['chat-input'])}
          onEnter={handleMessageSend}
        />
      </div>
      <AgentSidebar />
    </div>
  );
};

export default AgentDetails;
