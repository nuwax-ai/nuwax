import renderCodePrism from '@/utils/renderCodePrism';
import {
  CodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, message, Tooltip } from 'antd';
import React, { useCallback, useState } from 'react';
import styles from './index.less';

export interface MarkdownCodeToolbarProps {
  /** 标题 */
  title: string;
  /** 代码语言 */
  language: string;
  /** 代码内容 */
  content: string;
  /** 行数 */
  lineCount?: number;
  /** 是否支持折叠 */
  collapsible?: boolean;
  /** 初始折叠状态 */
  defaultCollapsed?: boolean;
  /** 折叠状态变化回调 */
  onCollapseChange?: (collapsed: boolean) => void;
  /** 复制成功回调 */
  onCopy?: (content: string) => void;
  /** 容器ID，用于查找代码块 */
  containerId?: string;
}

/**
 * Markdown 代码块工具栏组件
 * 提供语言显示、行数统计、折叠切换、代码复制等功能
 * 对于 mermaid 类型还提供图形操作功能
 */
export const MarkdownCodeToolbar: React.FC<MarkdownCodeToolbarProps> = ({
  title,
  language,
  content,
  onCopy,
  containerId,
}) => {
  const [isCopying, setIsCopying] = useState(false);

  // Mermaid 相关状态
  const [isCodeView, setIsCodeView] = useState(false);

  const isMermaid = language.toLowerCase() === 'mermaid';

  // 传统复制方法（降级方案）
  const fallbackCopyTextToClipboard = useCallback(
    (text: string, callback?: (context: string) => void) => {
      const textArea = document.createElement('textarea');
      textArea.value = text;

      // 避免在iOS上出现缩放
      textArea.style.fontSize = '16px';
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          // 优先调用传入的回调，如果没有则调用默认提示
          if (callback) {
            callback(text);
          }
        } else {
          message.error('复制失败');
        }
      } catch (err) {
        console.error('复制失败:', err);
        message.error('复制失败');
      }

      document.body.removeChild(textArea);
    },
    [],
  );
  /**
   * 处理代码复制
   */
  const handleCopy = useCallback(async () => {
    if (isCopying) return;

    // 优先从 data-code 属性获取代码内容
    let textContent = content || '';

    // HTML解码
    textContent = textContent
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    if (!textContent) {
      message.error('复制失败：未找到代码内容');
      return;
    }
    setIsCopying(true);

    // 使用现代剪贴板API或降级到传统方法
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(textContent)
        .then(
          () => {
            // 优先调用传入的回调，如果没有则调用默认提示
            if (onCopy) {
              onCopy(textContent);
            }
          },
          (err) => {
            console.error('复制失败:', err);
            message.error('复制失败');
            fallbackCopyTextToClipboard(textContent, onCopy);
          },
        )
        .finally(() => {
          setIsCopying(false);
        });
    } else {
      // 降级到传统复制方法
      fallbackCopyTextToClipboard(textContent, onCopy);
      setIsCopying(false);
    }
  }, [content, isCopying, onCopy]);
  // 切换代码视图
  const toggleCodeView = useCallback(
    (chartId: string) => {
      if (!chartId) return;
      const wrapper = document.getElementById(chartId);
      if (!wrapper) return;

      const mermaidContainer = wrapper.querySelector(
        '.mermaid-container',
      ) as HTMLElement;
      if (!mermaidContainer) return;

      let codeElement = wrapper.querySelector('.mermaid-source-code');

      if (isCodeView) {
        // 显示图表，隐藏代码
        mermaidContainer.style.display = 'block';
        if (codeElement) codeElement.remove();
      } else {
        // 隐藏图表，显示代码
        mermaidContainer.style.display = 'none';
        const codeResult = renderCodePrism({
          info: 'mermaid',
          content: content,
        });
        // 创建代码显示元素
        const codeElement = document.createElement('div');
        codeElement.className = 'mermaid-source-code';
        codeElement.innerHTML = codeResult;
        wrapper.appendChild(codeElement);
      }

      setIsCodeView(!isCodeView);
    },
    [isCodeView, content, setIsCodeView],
  );

  // 下载PNG - 使用 naturalWidth/naturalHeight 获取原始尺寸
  const downloadPNG = useCallback((chartId: string) => {
    if (!chartId) return;
    const imgElement = document.querySelector(
      `#${chartId} img`,
    ) as HTMLImageElement;
    if (!imgElement) {
      message.error('未找到图片元素');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      message.error('下载失败');
      return;
    }

    // 确保图片已加载完成
    const processDownload = () => {
      // 优先使用 naturalWidth/naturalHeight 获取原始尺寸
      const width = imgElement.naturalWidth * 10;
      const height = imgElement.naturalHeight * 10;
      console.log('图片原始尺寸:', { width, height });

      // 检查是否成功获取到原始尺寸
      if (width === 0 || height === 0) {
        message.error('无法获取图片原始尺寸');
        return;
      }

      console.log('图片原始尺寸:', { width, height });

      // 设置canvas尺寸为图片原始尺寸
      canvas.width = width;
      canvas.height = height;

      // 设置高质量渲染
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 绘制图片到canvas，使用原始尺寸
      ctx.drawImage(imgElement, 0, 0, width, height);

      // 生成并下载PNG
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mermaid-chart-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
            message.success(`PNG图片下载成功 (${width}×${height})`);
          } else {
            message.error('生成PNG失败');
          }
        },
        'image/png',
        1.0,
      );
    };

    // 检查图片是否已加载
    if (imgElement.complete && imgElement.naturalWidth !== 0) {
      processDownload();
    } else {
      // 等待图片加载完成
      imgElement.onload = processDownload;
      imgElement.onerror = () => {
        message.error('图片加载失败');
      };
    }
  }, []);

  // 下载SVG
  const downloadSVG = useCallback((chartId: string) => {
    if (!chartId) return;
    const imgElement = document.querySelector(
      `#${chartId} img`,
    ) as HTMLImageElement;
    if (!imgElement) {
      message.error('未找到图片元素');
      return;
    }

    const src = imgElement.src;

    if (src.startsWith('data:image/svg+xml,')) {
      // 解码SVG数据
      const svgData = decodeURIComponent(
        src.replace('data:image/svg+xml,', ''),
      );

      // 创建Blob
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      // 下载
      const a = document.createElement('a');
      a.href = url;
      a.download = `mermaid-chart-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('SVG图片下载成功');
    } else {
      message.error('无法获取SVG数据');
    }
  }, []);

  return (
    <div className={styles.toolbar}>
      {/* 左侧信息 */}
      <div className={styles.info}>
        <span className={styles.title}>{title}</span>
      </div>

      {/* 右侧操作 */}
      <div className={styles.actions}>
        {isMermaid && (
          <>
            <Tooltip title="查看源代码">
              <Button
                type={isCodeView ? 'primary' : 'text'}
                size="small"
                icon={<CodeOutlined />}
                onClick={() => toggleCodeView(containerId || '')}
              />
            </Tooltip>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'svg',
                    label: 'SVG',
                    icon: <DownloadOutlined />,
                    onClick: () => downloadSVG(containerId || ''),
                  },
                  {
                    key: 'png',
                    label: 'PNG',
                    icon: <DownloadOutlined />,
                    onClick: () => downloadPNG(containerId || ''),
                  },
                ],
              }}
              trigger={['click']}
            >
              <Button type="text" size="small" icon={<DownloadOutlined />}>
                下载 <DownOutlined />
              </Button>
            </Dropdown>
          </>
        )}
        {/* 通用复制功能 */}
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          loading={isCopying}
          className={styles.copyBtn}
          onClick={handleCopy}
          title="复制代码"
        >
          {isCopying ? '复制中' : '复制'}
        </Button>
      </div>
    </div>
  );
};

export default MarkdownCodeToolbar;
