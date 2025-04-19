import PromptView from '@/components/ChatView/promptView';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { SendOutlined } from '@ant-design/icons';
import type { ModalProps } from 'antd';
import { Button, Input, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const PromptOptimizeModal: React.FC<
  ModalProps & {
    id: number;
    onReplace: (text?: string) => void;
    defaultValue?: string;
  }
> = ({ open, onCancel, id, onReplace, defaultValue }) => {
  const [message, setMessage] = useState<string>('');
  const {
    messageList,

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
  const handleSendMessage = async (text?: string) => {
    if (text) {
      setMessage('');
      onMessageSend(id, text);
    } else if (message) {
      // const data = await promptOptimize({ prompt: message, requestId: '1' });
      // console.log(message);

      // const files = uploadFiles.map((file) => {
      //   return {
      //     uid: file.uid,
      //     name: file.name,
      //     url: file.url,
      //   };
      //

      // enter事件
      // onEnter(message, files);
      // // 置空
      // setFiles([]);
      setMessage('');
      onMessageSend(id, message);
    }
  };

  console.log(messageList);

  return (
    <Modal
      title={false}
      open={open}
      onCancel={onCancel}
      mask={false}
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
      <Button
        type="default"
        className={cx(styles['btn'])}
        onClick={() =>
          // 如果有默认文本就优化默认文本
          handleSendMessage(
            defaultValue
              ? defaultValue
              : '一个能为你提供工作帮助和建议的智能机器人',
          )
        }
      >
        自动优化
      </Button>
      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <div
          className={cx(styles['chat-input'], 'flex', 'items-center', 'w-full')}
        >
          <Input.TextArea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rootClassName={styles.input}
            placeholder="请描述你的提示词需求，比如角色定义、技能要求等"
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

export default PromptOptimizeModal;
