import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatInput from '@/components/ChatInput';
import ChatView from '@/components/ChatView';
import RecommendList from '@/components/RecommendList';
import { UploadInfo } from '@/types/interfaces/common';
import { RoleInfo } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import React, { useEffect, useMemo } from 'react';
import { useLocation, useMatch, useModel } from 'umi';
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

  const {
    conversationInfo,
    messageList,
    chatSuggestList,
    runQueryConversation,
    loadingSuggest,
    onMessageSend,
    handleDebug,
    messageViewRef,
    executeResults,
  } = useModel('conversationInfo');

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

  useEffect(() => {
    // 查询会话
    if (id) {
      runQueryConversation(id);
      // 如果message或者附件不为空
      if (message || files?.length > 0) {
        onMessageSend(id, message, files);
      }
    }
  }, [id]);

  // 消息发送
  const handleMessageSend = (message: string, files?: UploadInfo[]) => {
    onMessageSend(id, message, files);
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
                  loading={loadingSuggest}
                  chatSuggestList={chatSuggestList}
                  onClick={handleMessageSend}
                />
              </>
            ) : (
              // Chat记录为空
              <AgentChatEmpty name={'智能体'} />
            )}
          </div>
          {/*会话输入框*/}
          <ChatInput onEnter={handleMessageSend} />
        </div>
      </div>
      {/*展示台区域*/}
      <ShowArea executeResults={executeResults} />
    </div>
  );
};

export default Chat;
