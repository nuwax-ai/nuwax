import AttachFile from '@/components/ChatView/AttachFile';
import ConditionRender from '@/components/ConditionRender';
import useMarkdownRender from '@/hooks/useMarkdownRender';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  AttachmentFile,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import React from 'react';
import MarkdownRenderer from '../MarkdownRenderer';
import styles from './promptView.less';
import RunOver from './RunOver';

const cx = classNames.bind(styles);

// 聊天框组件
type PromptViewProps = {
  className?: string;
  contentClassName?: string;
  // 消息信息
  messageInfo: MessageInfo;
  ifShowReplace?: boolean;
  // 替换
  onReplace?: (messageInfo?: string) => void;
};

const PromptView: React.FC<PromptViewProps> = ({
  className,
  contentClassName,
  messageInfo,
}) => {
  const { markdownRef, messageIdRef } = useMarkdownRender({
    answer: messageInfo?.text || '',
    thinking: messageInfo?.think || '',
    id: messageInfo?.id || '',
  });
  return (
    <div className={cx(styles.container, 'flex', className)}>
      <div className={cx('flex-1')}>
        {!!messageInfo?.attachments?.length && (
          <AttachFile files={messageInfo?.attachments as AttachmentFile[]} />
        )}

        {/*助手信息或系统信息*/}
        <ConditionRender
          condition={messageInfo?.role !== AssistantRoleEnum.USER}
        >
          {/*运行状态*/}
          {messageInfo.status !== MessageStatusEnum.Complete && (
            <ConditionRender condition={!!messageInfo?.status}>
              <RunOver messageInfo={messageInfo} />
            </ConditionRender>
          )}
          {(!!messageInfo?.think || !!messageInfo?.text) && (
            <div className={cx(styles['inner-container'], contentClassName)}>
              <div
                className={cx(styles['chat-content'], 'radius-6', 'w-full', {
                  [styles.typing]:
                    messageInfo.status === MessageStatusEnum.Incomplete ||
                    messageInfo.status === MessageStatusEnum.Loading,
                })}
              >
                <MarkdownRenderer
                  key={`${messageIdRef.current}`}
                  id={`${messageIdRef.current}`}
                  headerActions={false}
                  markdownRef={markdownRef}
                />
              </div>
            </div>
          )}
          {/*底部区域*/}
          {/* <ConditionRender
            condition={
              messageInfo &&
              (messageInfo?.status === MessageStatusEnum.Complete ||
                !messageInfo?.status)
            }
          >
            <PromptViewBottomMore
              onReplace={onReplace}
              ifShowReplace={ifShowReplace}
              messageInfo={messageInfo}
            />
          </ConditionRender> */}
        </ConditionRender>
      </div>
    </div>
  );
};

export default PromptView;
