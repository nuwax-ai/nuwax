import { MermaidExporter } from '@/utils/mermaidExporter';
import {
  CopyOutlined,
  DownloadOutlined,
  DownOutlined,
  EyeOutlined,
  UpOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, MenuProps, message } from 'antd';
import React, { useCallback, useState } from 'react';
import styles from './index.less';

export interface MarkdownCodeToolbarProps {
  /** 代码语言 */
  language: string;
  /** 代码内容 */
  content: string;
  /** 行数 */
  lineCount: number;
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
  language,
  content,
  lineCount,
  collapsible = true,
  defaultCollapsed = false,
  onCollapseChange,
  onCopy,
  containerId,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isCopying, setIsCopying] = useState(false);

  // Mermaid 相关状态
  const [isCodeView, setIsCodeView] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const isMermaid = language.toLowerCase() === 'mermaid';

  /**
   * 处理折叠切换
   */
  const handleCollapseToggle = useCallback(() => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);

    // 如果提供了容器ID，直接操作DOM
    if (containerId) {
      const container = document.getElementById(containerId);
      const codeBlock = container?.querySelector('pre code');
      if (codeBlock) {
        (codeBlock as HTMLElement).style.display = newCollapsed
          ? 'none'
          : 'block';
      }
    }
  }, [isCollapsed, onCollapseChange, containerId]);

  /**
   * 处理代码复制
   */
  const handleCopy = useCallback(async () => {
    if (isCopying) return;

    try {
      setIsCopying(true);

      // 使用现代 API 复制
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      message.success('代码复制成功');
      onCopy?.(content);
    } catch (error) {
      console.error('Copy failed:', error);
      message.error('复制失败');
    } finally {
      setIsCopying(false);
    }
  }, [content, isCopying, onCopy]);

  /**
   * Mermaid 源码/图形切换
   */
  const handleMermaidToggleView = useCallback(() => {
    if (!containerId) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    const codeBlock = container.querySelector('pre');
    const mermaidChart = container.querySelector('.mermaid');

    if (isCodeView) {
      // 切换到图形视图
      if (codeBlock) codeBlock.style.display = 'none';
      if (mermaidChart) (mermaidChart as HTMLElement).style.display = 'block';
    } else {
      // 切换到源码视图
      if (mermaidChart) (mermaidChart as HTMLElement).style.display = 'none';
      if (codeBlock) codeBlock.style.display = 'block';
    }

    setIsCodeView(!isCodeView);
  }, [isCodeView, containerId]);

  /**
   * Mermaid 缩放功能
   */
  const handleZoomIn = useCallback(() => {
    if (!containerId) return;

    const newZoom = Math.min(zoomLevel * 1.2, 3);
    setZoomLevel(newZoom);

    const container = document.getElementById(containerId);
    const svgElement = container?.querySelector('svg');
    if (svgElement) {
      (svgElement as HTMLElement).style.transform = `scale(${newZoom})`;
      (svgElement as HTMLElement).style.transformOrigin = 'center center';
    }
  }, [zoomLevel, containerId]);

  const handleZoomOut = useCallback(() => {
    if (!containerId) return;

    const newZoom = Math.max(zoomLevel / 1.2, 0.3);
    setZoomLevel(newZoom);

    const container = document.getElementById(containerId);
    const svgElement = container?.querySelector('svg');
    if (svgElement) {
      (svgElement as HTMLElement).style.transform = `scale(${newZoom})`;
      (svgElement as HTMLElement).style.transformOrigin = 'center center';
    }
  }, [zoomLevel, containerId]);

  /**
   * Mermaid 导出功能
   */
  const handleExportSVG = useCallback(async () => {
    if (isExporting || !containerId) return;

    setIsExporting(true);
    try {
      await MermaidExporter.exportSVG(content, {
        filename: `mermaid-chart-${Date.now()}.svg`,
      });
    } catch (error) {
      // 降级使用 DOM 方法
      MermaidExporter.exportSVGFromDOM(containerId, {
        filename: `mermaid-chart-${Date.now()}.svg`,
      });
    } finally {
      setIsExporting(false);
    }
  }, [content, containerId, isExporting]);

  const handleExportPNG = useCallback(async () => {
    if (isExporting || !containerId) return;

    setIsExporting(true);
    try {
      await MermaidExporter.exportPNG(content, {
        filename: `mermaid-chart-${Date.now()}.png`,
        scale: 2,
        backgroundColor: '#ffffff',
      });
    } catch (error) {
      // 降级使用 DOM 方法
      await MermaidExporter.exportPNGFromDOM(containerId, {
        filename: `mermaid-chart-${Date.now()}.png`,
        scale: 2,
        backgroundColor: '#ffffff',
      });
    } finally {
      setIsExporting(false);
    }
  }, [content, containerId, isExporting]);

  // 下载菜单项
  const downloadMenuItems: MenuProps['items'] = [
    {
      key: 'svg',
      label: '下载 SVG',
      icon: <DownloadOutlined />,
      onClick: handleExportSVG,
    },
    {
      key: 'png',
      label: '下载 PNG',
      icon: <DownloadOutlined />,
      onClick: handleExportPNG,
    },
  ];

  return (
    <div className={styles.toolbar}>
      {/* 左侧信息 */}
      <div className={styles.info}>
        <span className={styles.language}>{language}</span>
        {lineCount > 1 && (
          <span className={styles.lineCount}>{lineCount} 行</span>
        )}
        {isMermaid && zoomLevel !== 1 && (
          <span className={styles.zoomLevel}>
            {Math.round(zoomLevel * 100)}%
          </span>
        )}
      </div>

      {/* 右侧操作 */}
      <div className={styles.actions}>
        {/* Mermaid 特有功能 */}
        {isMermaid && (
          <>
            {/* 源码/图形切换 */}
            <Button
              type={isCodeView ? 'primary' : 'text'}
              size="small"
              icon={<EyeOutlined />}
              onClick={handleMermaidToggleView}
              title={isCodeView ? '切换到图形视图' : '查看源代码'}
              className={styles.viewToggleBtn}
            />

            {/* 缩放功能 - 只在图形视图下显示 */}
            {!isCodeView && (
              <>
                <Button
                  type="text"
                  size="small"
                  icon={<ZoomInOutlined />}
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  title="放大"
                  className={styles.zoomBtn}
                />

                <Button
                  type="text"
                  size="small"
                  icon={<ZoomOutOutlined />}
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.3}
                  title="缩小"
                  className={styles.zoomBtn}
                />
              </>
            )}

            {/* 下载功能 */}
            <Dropdown
              menu={{ items: downloadMenuItems }}
              placement="bottomRight"
              trigger={['click']}
              disabled={isExporting}
            >
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                loading={isExporting}
                title="下载图表"
                className={styles.downloadBtn}
              >
                <DownOutlined />
              </Button>
            </Dropdown>
          </>
        )}

        {/* 通用折叠功能 */}
        {collapsible && lineCount > 5 && (
          <Button
            type="text"
            size="small"
            icon={isCollapsed ? <DownOutlined /> : <UpOutlined />}
            onClick={handleCollapseToggle}
            title={isCollapsed ? '展开代码' : '折叠代码'}
            className={styles.collapseBtn}
          />
        )}

        {/* 通用复制功能 */}
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          loading={isCopying}
          onClick={handleCopy}
          title="复制代码"
          className={styles.copyBtn}
        >
          {isCopying ? '复制中' : '复制'}
        </Button>
      </div>
    </div>
  );
};

export default MarkdownCodeToolbar;
