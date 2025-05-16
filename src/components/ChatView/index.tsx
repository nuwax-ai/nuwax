import agentImage from '@/assets/images/agent_image.png';
import avatar from '@/assets/images/avatar.png';
import AttachFile from '@/components/ChatView/AttachFile';
import ConditionRender from '@/components/ConditionRender';
import { USER_INFO } from '@/constants/home.constants';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  AttachmentFile,
  ChatViewProps,
} from '@/types/interfaces/conversationInfo';
import mk from '@vscode/markdown-it-katex';
import classNames from 'classnames';
import markdownIt from 'markdown-it';
import Prism from 'prismjs';
// 可选：添加更多语言支持 Prism.js 默认只支持少量语言。如果需要支持更多语言，可以导入相应的语言组件：
import 'prismjs/components/prism-bash.min.js';
import 'prismjs/components/prism-icon.min.js';
import 'prismjs/components/prism-java.min.js';
import 'prismjs/components/prism-javascript.min.js';
import 'prismjs/components/prism-jq.min.js';
import 'prismjs/components/prism-json.min.js';
import 'prismjs/components/prism-jsx.min.js';
import 'prismjs/components/prism-kotlin.min.js';
import 'prismjs/components/prism-log.min.js';
import 'prismjs/components/prism-markdown.min.js';
import 'prismjs/components/prism-perl.min.js';
import 'prismjs/components/prism-powershell.min.js';
import 'prismjs/components/prism-python.min.js';
import 'prismjs/components/prism-regex.min.js';
import 'prismjs/components/prism-sass.min.js';
import 'prismjs/components/prism-sql.min.js';
import 'prismjs/components/prism-tsx.min.js';
import 'prismjs/components/prism-typescript.min.js';
// import 'prismjs/themes/prism-okaidia.css';
import copyImage from '@/assets/images/copy.png';
import { message } from 'antd';
import 'prismjs/themes/prism.css';
import React, { useMemo } from 'react';
import { useModel } from 'umi';
import ChatBottomMore from './ChatBottomMore';
import ChatSampleBottom from './ChatSampleBottom';
import RunOver from './RunOver';
import styles from './index.less';

const cx = classNames.bind(styles);

// 为了避免 "类型“Window & typeof globalThis”上不存在属性“handleClipboard”" 错误，
// 可以使用自定义类型扩展 Window 类型。
declare global {
  interface Window {
    handleClipboard: (span: HTMLElement) => void;
  }
}

// 全局点击处理函数 - 复制代码
window.handleClipboard = function (span: HTMLElement) {
  const textContent =
    span?.parentElement?.parentElement?.querySelector('.code-content')
      ?.textContent || '';

  navigator.clipboard.writeText(textContent).then(() => {
    message.success('复制成功');
  });
};

const md = markdownIt({
  html: true,
  breaks: true,
  linkify: true,
});

// 修改代码块渲染函数
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  // 获取语言标识
  const lang = token.info?.trim() || '';
  // 获取代码内容
  const content = token.content;
  // 代码高亮处理
  let code = `<pre><code class="code-content">${md.utils.escapeHtml(
    content,
  )}</code></pre>`;

  // 检查语言是否支持
  if (lang && Prism.languages[lang]) {
    try {
      code = `<pre class="language-${lang}"><code class="language-${lang} code-content">${Prism.highlight(
        content,
        Prism.languages[lang],
        lang,
      )}</code></pre>`;
    } catch (__) {}
  }

  // 构建带有复制按钮的代码块
  return `
    <div class="${styles['code-block-wrapper']}">
      <div class="${styles['code-header']} flex items-center content-between">
        <span class="${styles['code-lang']}">${lang}</span>
        <span class='flex content-center items-center cursor-pointer copy-btn ${styles['ext-box']}' onclick="handleClipboard(this)">
          <img class="${styles['copy-img']}" src="${copyImage}" alt="" />
          <span>复制</span>
        </span>
      </div>
      ${code}
    </div>
  `;
};

md.use(mk);

// 聊天视图组件
const ChatView: React.FC<ChatViewProps> = ({
  className,
  contentClassName,
  roleInfo,
  messageInfo,
  mode = 'chat',
}) => {
  const { userInfo } = useModel('userInfo');
  // 当前用户信息
  const _userInfo =
    userInfo || JSON.parse(localStorage.getItem(USER_INFO) as string);

  // 角色名称和头像
  const info = useMemo(() => {
    const { assistant, system } = roleInfo;
    switch (messageInfo?.role) {
      // 用户信息
      case AssistantRoleEnum.USER:
        return {
          name: _userInfo?.nickName || _userInfo?.userName || '游客',
          avatar: _userInfo?.avatar || avatar,
        };
      // 助手信息
      case AssistantRoleEnum.ASSISTANT:
        return {
          name: assistant.name,
          avatar: assistant.avatar || agentImage,
        };
      // 系统信息
      case AssistantRoleEnum.SYSTEM:
        return {
          name: system.name,
          avatar: system.avatar || agentImage,
        };
    }
  }, [roleInfo, _userInfo, messageInfo?.role]);

  return (
    <div className={cx(styles.container, 'flex', className)}>
      <img className={cx(styles.avatar)} src={info?.avatar as string} alt="" />
      <div className={cx('flex-1', 'overflow-hide')}>
        <div className={cx(styles.author)}>{info?.name}</div>
        {!!messageInfo?.attachments?.length && (
          <AttachFile files={messageInfo?.attachments as AttachmentFile[]} />
        )}
        {/*用户信息*/}
        {messageInfo?.role === AssistantRoleEnum.USER &&
          !!messageInfo?.text && (
            <div
              className={cx(
                styles['chat-content'],
                styles.user,
                'radius-6',
                contentClassName,
              )}
              dangerouslySetInnerHTML={{
                __html: md.render(messageInfo.text),
              }}
            />
          )}
        {/*助手信息或系统信息*/}
        <ConditionRender
          condition={messageInfo?.role !== AssistantRoleEnum.USER}
        >
          {/*运行状态*/}
          <ConditionRender condition={!!messageInfo?.status}>
            <RunOver messageInfo={messageInfo} />
          </ConditionRender>
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
          <ConditionRender
            condition={
              messageInfo &&
              (messageInfo?.status === MessageStatusEnum.Complete ||
                !messageInfo?.status)
            }
          >
            {mode === 'chat' ? (
              <ChatBottomMore messageInfo={messageInfo} />
            ) : mode === 'home' ? (
              <ChatSampleBottom messageInfo={messageInfo} />
            ) : null}
          </ConditionRender>
        </ConditionRender>
      </div>
    </div>
  );
};

export default ChatView;
