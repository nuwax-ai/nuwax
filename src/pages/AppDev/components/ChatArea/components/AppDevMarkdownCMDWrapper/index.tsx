import type { AppDevChatMessage } from '@/types/interfaces/appDev';
import React from 'react';
import useAppDevMarkdownRender from '../../../../hooks/useAppDevMarkdownRender';
import AppDevMarkdownCMD from '../AppDevMarkdownCMD';
import styles from './index.less';

interface AppDevMarkdownCMDWrapperProps {
  message: AppDevChatMessage;
  isHistoryMessage: boolean;
}

/**
 * AppDev MarkdownCMD 包装组件
 * 处理流式渲染和 Plan/ToolCall 组件显示
 */
const AppDevMarkdownCMDWrapper: React.FC<AppDevMarkdownCMDWrapperProps> = ({
  message,
  // isHistoryMessage, // 暂时未使用
}) => {
  // 使用 MarkdownCMD Hook 处理流式渲染
  const { markdownRef } = useAppDevMarkdownRender({
    id: message.id,
    content: message.text || '',
    requestId: message.requestId,
  });

  return (
    <div className={styles.chatAreaMarkdown}>
      <AppDevMarkdownCMD
        ref={markdownRef}
        id={message.id}
        className={styles.chatAreaMarkdown}
        disableTyping={true}
        interval={10}
        requestId={message.requestId}
      />
    </div>
  );
};

export default AppDevMarkdownCMDWrapper;
