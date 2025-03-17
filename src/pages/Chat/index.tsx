import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatInput from '@/components/ChatInput';
import ChatView from '@/components/ChatView';
import RecommendList from '@/components/RecommendList';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { RoleInfo } from '@/types/interfaces/conversationInfo';
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
    messageViewRef,
    executeResults,
  } = useModel('conversationInfo');

  // 角色信息（名称、头像）
  const roleInfo: RoleInfo = useMemo(() => {
    const agent = conversationInfo?.agent;
    return {
      user: {
        name: agent?.publishUser?.nickName as string,
        avatar: agent?.publishUser?.avatar as string,
      },
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
    if (id) {
      const asyncFun = async () => {
        // 查询会话, 此处必须先同步查询会话信息，因为成功后会设置消息列表，如果是异步查询，会导致发送消息时，清空消息列表的bug
        await runQueryConversation(id);
        // 如果message或者附件不为空
        if (message || files?.length > 0) {
          onMessageSend(id, message, files);
        }
      };
      asyncFun();
    }
  }, [id, message, files]);

  // 消息发送
  const handleMessageSend = (message: string, files?: UploadFileInfo[]) => {
    onMessageSend(id, message, files);
  };

  return (
    <div className={cx('flex', 'h-full', 'overflow-y')} ref={messageViewRef}>
      <div className={cx('flex-1', 'flex', 'flex-col', styles['main-content'])}>
        <h3 className={cx(styles.title)}>{conversationInfo?.topic}</h3>
        <div className={cx(styles['chat-wrapper'], 'flex-1')}>
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
              icon={conversationInfo?.agent?.icon}
              name={conversationInfo?.agent?.name}
            />
          )}
        </div>
        {/*会话输入框*/}
        <ChatInput
          className={cx(styles['chat-input'])}
          onEnter={handleMessageSend}
        />
      </div>
      {/*展示台区域*/}
      <ShowArea executeResults={executeResults} />
    </div>
  );
};

export default Chat;
