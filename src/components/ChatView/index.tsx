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
import classNames from 'classnames';
import markdownIt from 'markdown-it';
// 方程式支持
import markdownItKatexGpt from 'markdown-it-katex-gpt';
import markdownItMultimdTable from 'markdown-it-multimd-table';
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
import { encodeHTML } from '@/utils/common';
import { message } from 'antd';
import 'prismjs/themes/prism.css';
import React, { useMemo } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
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
    showImageInModal: (src: string) => void;
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

// 创建放大查看的浮层
window.showImageInModal = function (imgSrc: string) {
  // 创建遮罩层
  const overlay = document.createElement('div');
  overlay.className = styles['image-overlay'];

  // 创建放大的图片
  const zoomedImg = document.createElement('img');
  zoomedImg.src = imgSrc;

  // 添加到DOM中
  overlay.appendChild(zoomedImg);
  document.body.appendChild(overlay);

  // 监听滚轮事件
  overlay.addEventListener('wheel', (e) => {
    e.preventDefault(); // 阻止默认页面滚动行为
    const defaultScale = String(
      window
        .getComputedStyle(zoomedImg)
        .transform.match(/scale\(([\d.]+)\)/)?.[1],
    ); // 默认缩放比例
    // 获取当前缩放比例（若无transform，则默认为1）
    const currentScale = parseFloat(defaultScale) || 1;
    // 滚轮向上则放大，向下则缩小（deltaY 为负是向上滚动）
    const newScale = e.deltaY < 0 ? currentScale + 0.3 : currentScale - 0.4;
    zoomedImg.style.transform = `scale(${newScale})`;
  });

  // 触发动画
  setTimeout(() => {
    overlay.style.opacity = '1';
    zoomedImg.style.transform = 'scale(1)';
  }, 10);

  // 点击关闭
  overlay.addEventListener('click', function () {
    overlay.style.opacity = '0';
    zoomedImg.style.transform = 'scale(0.9)';
    setTimeout(() => {
      overlay?.remove();
    }, 300);
  });
};

const md = markdownIt({
  html: true, // 启用原始HTML解析
  xhtmlOut: true, // 使用 XHTML 兼容语法
  breaks: true, // 换行转换为 <br>
  linkify: true, // 自动识别链接
  typographer: true, // 优化排版
  quotes: '""\'\'', // 双引号和单引号都不替换
});

// html自定义转义
md.renderer.rules.html_block = (tokens, idx) => {
  return encodeHTML(tokens[idx].content);
};

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

// 自定义图片渲染器
md.renderer.rules.image = function (tokens, idx, options, env, self) {
  // 调用原始渲染器获取默认HTML
  const imgHtml = self.renderToken(tokens, idx, options);

  // 添加点击事件处理
  return imgHtml.replace(
    '<img',
    '<img onclick="window.showImageInModal(this.src)"',
  );
};

// 自定义 table_open 渲染规则
md.renderer.rules.table_open = function (tokens, idx, options, env, self) {
  // 调用默认的 table_open 渲染规则
  const contentHtml = self.renderToken(tokens, idx, options);
  // 添加父级 div 的开始标签
  return `<div class=${styles['custom-table']}>` + contentHtml;
};

// 自定义 table_close 渲染规则
md.renderer.rules.table_close = function (tokens, idx, options, env, self) {
  // 调用默认的 table_close 渲染规则
  const contentHtml = self.renderToken(tokens, idx, options);

  // 添加父级 div 的结束标签
  return contentHtml + '</div>';
};

// 添加 KaTeX 支持
md.use(markdownItKatexGpt, {
  delimiters: [
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false },
    { left: '$$', right: '$$', display: false },
  ],
});

// 添加表格支持
md.use(markdownItMultimdTable, {
  multiline: true,
  rowspan: true,
  headerless: false,
  multibody: true,
  aotolabel: true,
});

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

  const handleCopy = () => {
    message.success('复制成功');
  };

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
            <>
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
              <div
                className={cx(
                  styles['user-action-box'],
                  'flex',
                  'items-center',
                )}
              >
                <CopyToClipboard
                  text={messageInfo.text || ''}
                  onCopy={handleCopy}
                >
                  <span
                    className={cx(
                      'flex',
                      'items-center',
                      'cursor-pointer',
                      styles['copy-btn'],
                    )}
                  >
                    <img
                      className={cx(styles['copy-image'])}
                      src={copyImage}
                      alt=""
                    />
                    <span>复制</span>
                  </span>
                </CopyToClipboard>
              </div>
            </>
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
