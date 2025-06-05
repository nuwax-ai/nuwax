import sendImage from '@/assets/images/send_image_gray.png';
import PromptView from '@/components/ChatView/promptView';
import {
  OptimizeTypeEnum,
  PromptOptimizeParams,
  PromptOptimizeTypeEnum,
} from '@/types/interfaces/assistant';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type { ModalProps } from 'antd';
import { Button, Input, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

const PromptOptimizeModal: React.FC<
  ModalProps & {
    title?: string;
    targetId?: number;
    type?: PromptOptimizeTypeEnum;
    onReplace: (text?: string) => void;
    defaultValue?: string;
  }
> = ({
  title,
  open,
  onCancel,
  onReplace,
  defaultValue,
  targetId,
  type = PromptOptimizeTypeEnum.AGENT,
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
  // 智能体会话问题建议
  const [id, setId] = useState<string>('');

  useEffect(() => {
    setId(uuidv4());

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

  // 点击发送事件
  const handleSendMessage = async (text?: string) => {
    setMessageList([]);
    setMessage('');
    // 参数
    const params: PromptOptimizeParams = {
      requestId: id,
      prompt: text || message,
      type,
      // 智能体ID或工作流节点ID，可选
      id: targetId,
    };
    onMessageSend(params, OptimizeTypeEnum.prompt);
  };

  // enter事件
  const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const { value, selectionStart, selectionEnd } =
      e.target as HTMLTextAreaElement;
    // shift+enter或者ctrl+enter时换行
    if (
      e.nativeEvent.keyCode === 13 &&
      (e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)
    ) {
      // 在光标位置插入换行符
      const newValue =
        value.slice(0, selectionStart) + '\n' + value.slice(selectionEnd);
      setMessage(newValue);
    } else if (e.nativeEvent.keyCode === 13 && !!value.trim()) {
      // enter事件
      const params: PromptOptimizeParams = {
        requestId: id,
        prompt: message,
        type,
        // 智能体ID或工作流节点ID，可选
        id: targetId,
      };
      onMessageSend(params, OptimizeTypeEnum.prompt);
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
      mask={false}
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
                onReplace={onReplace}
                key={index}
                messageInfo={item}
              />
            ))}
          </>
        )}
      </div>
      {messageList?.length > 0 ? (
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
      ) : (
        <Button
          type="default"
          className={cx(styles['btn'])}
          onClick={() =>
            // 如果有默认文本就优化默认文本
            handleSendMessage(
              defaultValue || '一个能为你提供工作帮助和建议的智能机器人',
            )
          }
        >
          自动优化
        </Button>
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
            placeholder="请描述你的提示词需求，比如角色定义、技能要求等"
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

export default PromptOptimizeModal;
