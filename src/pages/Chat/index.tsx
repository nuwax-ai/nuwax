import AgentChatEmpty from '@/components/AgentChatEmpty';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import RecommendList from '@/components/RecommendList';
import { MessageTypeEnum } from '@/types/enums/agent';
import { EditAgentShowType } from '@/types/enums/space';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { RoleInfo } from '@/types/interfaces/conversationInfo';
import { addBaseTarget } from '@/utils/common';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useEffect, useMemo } from 'react';
import { useLocation, useModel, useParams } from 'umi';
import styles from './index.less';
import ShowArea from './ShowArea';

const cx = classNames.bind(styles);

/**
 * 主页咨询聊天页面
 */
const Chat: React.FC = () => {
  const location = useLocation();
  // 会话ID
  const { id } = useParams();
  // 附加state
  const message = location.state?.message;
  const files = location.state?.files;

  const {
    conversationInfo,
    loadingConversation,
    isLoadingConversation,
    setIsLoadingConversation,
    messageList,
    setMessageList,
    chatSuggestList,
    runAsync,
    loadingSuggest,
    onMessageSend,
    messageViewRef,
    needUpdateTopicRef,
    handleClearSideEffect,
    setCardList,
    setShowType,
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

  useEffect(() => {
    if (id) {
      const asyncFun = async () => {
        setIsLoadingConversation(true);
        // 同步查询会话, 此处必须先同步查询会话信息，因为成功后会设置消息列表，如果是异步查询，会导致发送消息时，清空消息列表的bug
        const res = await runAsync(id);
        // 会话消息列表
        const list = res?.data?.messageList || [];
        const len = list?.length || 0;
        // 会话消息列表为空或者只有一条消息并且此消息时开场白时，可以发送消息
        const isCanMessage =
          !len ||
          (len === 1 && list[0].messageType === MessageTypeEnum.ASSISTANT);
        // 如果message或者附件不为空,可以发送消息，但刷新页面时，不重新发送消息
        if (isCanMessage && (message || files?.length > 0)) {
          onMessageSend(id, message, files);
        }
      };
      asyncFun();
    }

    return () => {
      setShowType(EditAgentShowType.Hide);
      handleClearSideEffect();
      setCardList([]);
      setMessageList([]);
      needUpdateTopicRef.current = true;
    };
  }, [id, message, files]);

  useEffect(() => {
    addBaseTarget();
  }, []);

  // 消息发送
  const handleMessageSend = (message: string, files?: UploadFileInfo[]) => {
    onMessageSend(id, message, files);
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
              {messageList?.map((item, index) => (
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
      {/*展示台区域*/}
      <ShowArea />
    </div>
  );
};

export default Chat;
