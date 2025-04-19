import PromptView from '@/components/ChatView/promptView';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { SendOutlined } from '@ant-design/icons';
import type { ModalProps } from 'antd';
import { Input, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const CodeOptimizeModal: React.FC<
  ModalProps & {
    id: number;
    onReplace?: (text?: string) => void;
    defaultValue?: string;
  }
> = ({ open, onCancel, id, onReplace }) => {
  const [message, setMessage] = useState<string>('');
  const {
    messageList,
    setMessageList,
    onMessageSend,
    messageViewRef,
    allowAutoScrollRef,
  } = useModel('assistantOptimize');
  // 智能体会话问题建议

  // 在组件挂载时添加滚动事件监听器
  useEffect(() => {
    const messageView = messageViewRef.current;
    if (messageView) {
      const handleScroll = () => {
        // 当用户手动滚动时，暂停自动滚动
        const { scrollTop, scrollHeight, clientHeight } = messageView;
        if (scrollTop + clientHeight < scrollHeight) {
          allowAutoScrollRef.current = false;
        } else {
          // 当用户滚动到底部时，重新允许自动滚动
          allowAutoScrollRef.current = true;
        }
      };

      messageView.addEventListener('scroll', handleScroll);
      return () => {
        messageView.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // 点击发送事件
  const handleSendMessage = async () => {
    if (message) {
      setMessage('');
      onMessageSend(id, message, 'code');
    }
  };

  console.log(messageList);

  return (
    <Modal
      title={'代码助手'}
      open={open}
      onCancel={(e) => {
        setMessageList([]);
        onCancel?.(e);
      }}
      mask={false}
      maskClosable={false}
      footer={null}
    >
      <div
        ref={messageViewRef}
        className={cx(styles['chat-wrapper'], 'flex-1')}
      >
        {messageList?.length > 0 ? (
          <>
            {messageList?.map((item: MessageInfo, index: number) => (
              <PromptView
                ifShowReplace={true}
                onReplace={onReplace}
                key={index}
                messageInfo={item}
              />
            ))}
          </>
        ) : (
          // Chat记录为空
          <div />
        )}
      </div>

      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <div
          className={cx(styles['chat-input'], 'flex', 'items-center', 'w-full')}
        >
          <Input.TextArea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rootClassName={styles.input}
            placeholder="请描述你的具体业务需求，逻辑尽量描述详细"
            autoSize={{ minRows: 1, maxRows: 3 }}
          />

          <span
            onClick={() => handleSendMessage()}
            className={cx(
              styles['icon-box'],
              'flex',
              'items-center',
              'content-center',
            )}
          >
            <SendOutlined />
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default CodeOptimizeModal;
