import SvgIcon from '@/components/base/SvgIcon';
import ConversationShareModal from '@/components/business-component/ConversationShareModal';
import { dict } from '@/services/i18nRuntime';
import { buildMessageMarkdown } from '@/utils/conversationShareMd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ShareMessageButtonProps {
  /** 待分享的消息正文 */
  text: string;
  isUser: boolean;
  className?: string;
}

/**
 * 消息分享入口(需求 5c):消息操作栏「分享」按钮。
 * 会话信息(conversationId/topic)从全局 store 自取,入口只关心正文与角色;
 * 分享弹窗与落地页链路见同目录 ConversationShareModal。
 */
const ShareMessageButton: React.FC<ShareMessageButtonProps> = ({
  text,
  isUser,
  className,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { conversationInfo } = useModel('conversationInfo');

  if (!text?.trim()) {
    return null;
  }

  return (
    <>
      <span
        role="button"
        tabIndex={-1}
        className={cx('share-message-btn', className)}
        onClick={() => setModalOpen(true)}
      >
        <SvgIcon name="icons-chat-share" className={cx('share-image')} />
        {dict('PC.Components.ConversationShareModal.share')}
      </span>
      <ConversationShareModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        kind="message"
        conversationId={conversationInfo?.id}
        title={
          conversationInfo?.topic ||
          dict('PC.Components.ConversationShareModal.titleMessage')
        }
        markdown={buildMessageMarkdown(text, isUser)}
      />
    </>
  );
};

export default ShareMessageButton;
