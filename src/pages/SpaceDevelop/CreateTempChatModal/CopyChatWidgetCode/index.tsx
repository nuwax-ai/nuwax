import iframeCopyImage from '@/assets/images/iframe-copy.png';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

const cx = classNames;

interface CopyChatWidgetCodeProps {
  /** 聊天小部件的访问地址 */
  chatUrl: string;
  /** 图标大小 */
  size?: number;
  /** 提示文本 */
  tooltipText?: string;
}

interface WidgetConfig {
  /** 按钮位置 - 底部距离 */
  bottom: number;
  /** 按钮位置 - 右侧距离 */
  right: number;
  /** 按钮大小 */
  size: number;
  /** 按钮背景色 */
  backgroundColor: string;
  /** 窗口宽度 */
  windowWidth: number;
  /** 窗口高度 */
  windowHeight: number;
  /** 是否显示阴影 */
  showShadow: boolean;
}

/**
 * 复制聊天小部件代码组件
 * 点击图标可以复制包含动态iframe.src地址的JavaScript代码
 * 支持简单复制和模态框配置两种模式
 *
 * @param chatUrl - 聊天小部件的访问地址
 * @param className - 自定义样式类名
 * @param size - 图标大小，默认16
 * @param tooltipText - 提示文本，默认"复制代码"
 * @param showModal - 是否显示模态框模式，默认false
 * @param buttonText - 按钮文本，默认"复制代码"
 * @param buttonType - 按钮类型：'icon' | 'button' | 'both'，默认'icon'
 */
const CopyChatWidgetCode: React.FC<CopyChatWidgetCodeProps> = ({
  chatUrl,
  size = 16,
  tooltipText = 'iframe代码复制',
}) => {
  // 小部件配置状态
  const config = {
    bottom: 20,
    right: 20,
    size: 60,
    backgroundColor: '#1F315B',
    windowWidth: 400,
    windowHeight: 600,
    showShadow: true,
  };

  /**
   * 生成聊天小部件的JavaScript代码
   * @param url - 聊天小部件的访问地址
   * @param widgetConfig - 小部件配置
   * @returns 格式化后的JavaScript代码
   */
  const generateChatWidgetCode = (
    url: string,
    widgetConfig: WidgetConfig = config,
  ): string => {
    const shadowStyle = widgetConfig.showShadow
      ? '0 2px 10px rgba(0, 0, 0, 0.2)'
      : 'none';

    return `<script>
    // 创建客服图标和浮动窗口
    function createFloatingChat() {
        // 创建浮动按钮
        const chatButton = document.createElement('div');
        chatButton.id = 'floating-chat-button';    
        chatButton.style.position = 'fixed';
        chatButton.style.bottom = '${widgetConfig.bottom}px';
        chatButton.style.right = '${widgetConfig.right}px';
        chatButton.style.width = '${widgetConfig.size}px';
        chatButton.style.height = '${widgetConfig.size}px';
        chatButton.style.borderRadius = '50%';
        chatButton.style.backgroundColor = '${widgetConfig.backgroundColor}';
        chatButton.style.color = 'white';
        chatButton.style.display = 'flex';
        chatButton.style.alignItems = 'center';
        chatButton.style.justifyContent = 'center';
        chatButton.style.cursor = 'pointer';
        chatButton.style.boxShadow = '${shadowStyle}';
        chatButton.style.zIndex = '9999';
        chatButton.innerHTML = '<div class="cs-widget-icon" id="cs-icon">\\n' +
            '            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">\\n' +
            '                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>\\n' +
            '                <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>\\n' +
            '            </svg>\\n' +
            '        </div>';

        // 创建浮动窗口
        const chatWindow = document.createElement('div');
        chatWindow.id = 'floating-chat-window';
        chatWindow.style.position = 'fixed';
        chatWindow.style.bottom = '${
          widgetConfig.bottom + widgetConfig.size + 10
        }px';
        chatWindow.style.right = '${widgetConfig.right}px';
        chatWindow.style.width = '${widgetConfig.windowWidth}px';
        chatWindow.style.height = '${widgetConfig.windowHeight}px';
        chatWindow.style.backgroundColor = 'white';
        chatWindow.style.borderRadius = '8px';
        chatWindow.style.boxShadow = '${shadowStyle}';
        chatWindow.style.display = 'none';
        chatWindow.style.zIndex = '9998';
        chatWindow.style.overflow = 'hidden';

        // 创建 iframe
        const iframe = document.createElement('iframe');
        iframe.src = '${url}';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        // 将 iframe 添加到窗口
        chatWindow.appendChild(iframe);

        // 将按钮和窗口添加到页面
        document.body.appendChild(chatButton);
        document.body.appendChild(chatWindow);

        // 点击按钮切换窗口显示/隐藏
        chatButton.addEventListener('click', () => {
            if (chatWindow.style.display === 'none') {
                overlay.style.display = "block"
                chatWindow.style.display = 'block';
            } else {
                overlay.style.display = "none"
                chatWindow.style.display = 'none';
            }
        });
        const overlay = document.getElementById("widget-overlay");
        overlay.addEventListener("click", function () {
            console.log("click")
            chatWindow.style.display = 'none';
            overlay.style.display = "none"
        })
    }

    // 页面加载完成后执行
    window.onload = createFloatingChat;
</script>`;
  };

  /**
   * 复制成功回调
   */
  const handleCopy = () => {
    message.success('iframe代码复制成功');
  };

  return (
    <CopyToClipboard text={generateChatWidgetCode(chatUrl)} onCopy={handleCopy}>
      <img
        className={cx('cursor-pointer')}
        src={iframeCopyImage}
        alt="复制代码"
        style={{ width: size, height: size }}
        title={tooltipText}
      />
    </CopyToClipboard>
  );
};

export default CopyChatWidgetCode;
