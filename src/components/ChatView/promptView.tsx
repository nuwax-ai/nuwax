import AttachFile from '@/components/ChatView/AttachFile';
import ConditionRender from '@/components/ConditionRender';
import useMarkdownRender from '@/hooks/useMarkdownRender';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import { CodeLangEnum } from '@/types/enums/plugin';
import type {
  AttachmentFile,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import React, { useCallback } from 'react';
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
  codeLanguage?: CodeLangEnum;
  theme?: 'light' | 'dark';
  // 替换
  onReplace?: (messageInfo?: string) => void;
};
// 处理映射codeLanguage
const getCodeLanguage = (codeLanguage: CodeLangEnum) => {
  switch (codeLanguage) {
    case CodeLangEnum.JavaScript:
      return 'js';
    case CodeLangEnum.Python:
      return 'python';
    case CodeLangEnum.JSON:
      return 'json';
    case CodeLangEnum.Text:
      return 'plaintext';
    default:
      return 'plaintext';
  }
};
const PromptView: React.FC<PromptViewProps> = ({
  className,
  contentClassName,
  messageInfo,
  codeLanguage = CodeLangEnum.Text,
  theme = 'light',
}) => {
  console.log('codeLanguage', getCodeLanguage(codeLanguage), messageInfo);

  const addCodeType = useCallback(
    (text: string) => {
      const codeType = getCodeLanguage(codeLanguage);
      // 如果codeType为plaintext，则直接返回text
      if (codeType === 'plaintext') {
        return text;
      }
      // 写一个正则 把 第一个``` 后端添加一个codeType
      return text.replace(/```/, `\`\`\`${codeType}`);
    },
    [codeLanguage],
  );

  const { markdownRef, messageIdRef } = useMarkdownRender({
    answer: addCodeType(messageInfo?.text || ''),
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
                  theme={theme}
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
