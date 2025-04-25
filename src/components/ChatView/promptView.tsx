import AttachFile from '@/components/ChatView/AttachFile';
import ConditionRender from '@/components/ConditionRender';
import { AssistantRoleEnum } from '@/types/enums/agent';
// import { MessageStatusEnum } from '@/types/enums/common';
import type {
  AttachmentFile,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import markdown from 'markdown-it';
import React from 'react';
import styles from './promptView.less';
import RunOver from './RunOver';

const cx = classNames.bind(styles);

const md = markdown({
  html: true,
  breaks: true,
  linkify: true,
});

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
          {messageInfo.status !== 'complete' && (
            <ConditionRender condition={!!messageInfo?.status}>
              <RunOver messageInfo={messageInfo} />
            </ConditionRender>
          )}
          {(!!messageInfo?.think || !!messageInfo?.text) && (
            <div className={cx(styles['inner-container'], contentClassName)}>
              {/*think*/}
              {!!messageInfo?.think && !!md.render(messageInfo.think) && (
                <div
                  className={cx(styles['think-content'], 'radius-6', 'w-full')}
                  dangerouslySetInnerHTML={{
                    __html: md.render(messageInfo.think),
                  }}
                />
              )}
              {/*文本内容*/}
              {!!messageInfo?.text && (
                <div
                  className={cx(styles['chat-content'], 'radius-6', 'w-full')}
                  dangerouslySetInnerHTML={{
                    __html: md.render(messageInfo.text),
                  }}
                />
              )}
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
