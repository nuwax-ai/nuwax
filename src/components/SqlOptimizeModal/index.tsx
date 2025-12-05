import sendImage from '@/assets/images/send_image_gray.png';
import PromptView from '@/components/ChatView/promptView';
import { OptimizeTypeEnum } from '@/types/interfaces/assistant';
import { BindConfigWithSub } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type { ModalProps } from 'antd';
import { Button, Input, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface SqlOptimizeModalProps extends ModalProps {
  onReplace: (text?: string) => void;
  tableId?: number;
  inputArgs?: BindConfigWithSub[];
}

// sql生成优化
const SqlOptimizeModal: React.FC<SqlOptimizeModalProps> = ({
  open,
  onCancel,
  onReplace,
  title,
  tableId,
  inputArgs,
}) => {
  const [message, setMessage] = useState<string>('');
  const {
    messageList,
    setMessageList,
    onMessageSend,
    messageViewRef,
    allowAutoScrollRef,
    resetInit,
  } = useModel('assistantOptimize');

  const [requestId, setRequestIdId] = useState<string>('');

  useEffect(() => {
    setRequestIdId(uuidv4());

    return () => {
      resetInit();
    };
  }, []);

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

  const handleSendMessage = async (text?: string) => {
    setMessageList([]);
    setMessage('');
    const params = {
      requestId,
      prompt: text || message,
      tableId,
      inputArgs,
    };

    onMessageSend(params, OptimizeTypeEnum.sql);
  };

  // enter事件
  const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const { value } = e.target as HTMLTextAreaElement;
    // shift+enter或者ctrl+enter时换行
    if (
      e.nativeEvent.keyCode === 13 &&
      (e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)
    ) {
      setMessage(value);
    } else if (e.nativeEvent.keyCode === 13 && !!value.trim()) {
      e.preventDefault();
      // enter事件
      const params = {
        requestId,
        prompt: message,
        tableId,
        inputArgs,
      };

      onMessageSend(params, OptimizeTypeEnum.sql);
      // 置空
      setMessage('');
    }
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={(e) => {
        setMessageList([]);
        onCancel?.(e);
      }}
      maskClosable={false}
      footer={null}
    >
      <div
        ref={messageViewRef}
        className={cx(styles['chat-wrapper'], 'flex-1')}
      >
        {messageList?.length > 0 && (
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
        )}
      </div>
      {messageList?.length > 0 && (
        <div className={cx('flex')}>
          <Button
            className={cx(styles['replace-btn'], styles['btn'])}
            loading={
              messageList?.[messageList?.length - 1]?.status !== 'complete'
            }
            disabled={
              messageList?.[messageList?.length - 1]?.status !== 'complete'
            }
            onClick={() =>
              onReplace?.(messageList?.[messageList?.length - 1]?.text)
            }
          >
            替换
          </Button>
          <Button
            onClick={(e) => {
              setMessageList([]);
              onCancel?.(e as any);
            }}
            className={cx(styles['btn'], 'ml-10 ')}
          >
            退出
          </Button>
        </div>
      )}
      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <div
          className={cx(styles['chat-input'], 'flex', 'items-center', 'w-full')}
        >
          <Input.TextArea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rootClassName={styles.input}
            onPressEnter={handlePressEnter}
            placeholder={'请输入你的SQL查询需求，逻辑尽量描述详细'}
            autoSize={{ minRows: 1, maxRows: 3 }}
          />

          <img
            onClick={() => handleSendMessage()}
            className={cx(styles['send-image'], 'cursor-pointer')}
            src={sendImage as string}
            alt=""
          />
        </div>
      </div>
    </Modal>
  );
};

export default SqlOptimizeModal;
