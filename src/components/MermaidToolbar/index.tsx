import renderCodePrism from '@/utils/renderCodePrism';
import {
  DownloadOutlined,
  EyeOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { Button, message, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface MermaidToolbarProps {
  // 图表容器 ID
  chartId: string;
  // 原始代码
  sourceCode: string;
  // 是否显示工具栏
  visible?: boolean;
  // 是否使用优化的导出方法（基于mermaid.render）
  useOptimizedExport?: boolean;
}

const MermaidToolbar: React.FC<MermaidToolbarProps> = ({
  chartId,
  sourceCode,
  visible = true,
}) => {
  const [isCodeView, setIsCodeView] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!visible) return null;

  // 应用缩放
  const applyZoom = (zoom: number) => {
    const wrapper = document
      .getElementById(chartId)
      ?.closest('.mermaid-wrapper');
    if (!wrapper) return;

    const imgElement = wrapper.querySelector('img') as HTMLImageElement;
    if (imgElement) {
      imgElement.style.transform = `scale(${zoom})`;
      imgElement.style.transformOrigin = 'center center';
    }
  };

  // 切换代码视图
  const toggleCodeView = () => {
    const wrapper = document
      .getElementById(chartId)
      ?.closest('.mermaid-wrapper');
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
        content: sourceCode,
      });
      // 创建代码显示元素
      const codeElement = document.createElement('div');
      codeElement.className = 'mermaid-source-code';
      codeElement.innerHTML = codeResult;
      wrapper.appendChild(codeElement);
    }

    setIsCodeView(!isCodeView);
  };

  // 放大
  const zoomIn = () => {
    const newZoom = Math.min(zoomLevel * 1.2, 3);
    setZoomLevel(newZoom);
    applyZoom(newZoom);
  };

  // 缩小
  const zoomOut = () => {
    const newZoom = Math.max(zoomLevel / 1.2, 0.3);
    setZoomLevel(newZoom);
    applyZoom(newZoom);
  };

  // 全屏切换（暂时注释掉，未在 UI 中使用）
  // const toggleFullscreen = () => {
  //   const wrapper = document
  //     .getElementById(chartId)
  //     ?.closest('.mermaid-wrapper') as HTMLElement;
  //   if (!wrapper) return;

  //   if (isFullscreen) {
  //     // 退出全屏
  //     wrapper.removeAttribute('data-fullscreen');
  //     wrapper.style.position = '';
  //     wrapper.style.top = '';
  //     wrapper.style.left = '';
  //     wrapper.style.width = '';
  //     wrapper.style.height = '';
  //     wrapper.style.zIndex = '';
  //     wrapper.style.background = '';
  //     wrapper.style.padding = '';
  //     wrapper.style.boxSizing = '';
  //     setIsFullscreen(false);
  //   } else {
  //     // 进入全屏
  //     wrapper.setAttribute('data-fullscreen', 'true');
  //     setIsFullscreen(true);
  //   }
  // };

  // 下载PNG - 使用 naturalWidth/naturalHeight 获取原始尺寸
  const downloadPNG = () => {
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
  };

  // 下载SVG
  const downloadSVG = () => {
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
  };

  return (
    <div className={cx(styles.toolbar, 'flex', 'items-center', 'gap-1')}>
      <Tooltip title="查看源代码">
        <Button
          type={isCodeView ? 'primary' : 'text'}
          size="small"
          icon={<EyeOutlined />}
          onClick={toggleCodeView}
        />
      </Tooltip>

      <Tooltip title="放大">
        <Button
          type="text"
          size="small"
          icon={<ZoomInOutlined />}
          onClick={zoomIn}
          disabled={zoomLevel >= 3}
        />
      </Tooltip>

      <Tooltip title="缩小">
        <Button
          type="text"
          size="small"
          icon={<ZoomOutOutlined />}
          onClick={zoomOut}
          disabled={zoomLevel <= 0.3}
        />
      </Tooltip>

      {/* <Tooltip title={isFullscreen ? '退出全屏' : '全屏显示'}>
        <Button
          type="text"
          size="small"
          icon={
            isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
          }
          onClick={toggleFullscreen}
        />
      </Tooltip> */}

      <Tooltip title="下载 SVG">
        <Button
          type="text"
          size="small"
          icon={<DownloadOutlined />}
          onClick={downloadSVG}
        />
      </Tooltip>

      <Tooltip title="下载 PNG">
        <Button type="text" size="small" onClick={downloadPNG}>
          PNG
        </Button>
      </Tooltip>

      {zoomLevel !== 1 && (
        <span className={cx(styles.zoomLevel)}>
          {Math.round(zoomLevel * 100)}%
        </span>
      )}
    </div>
  );
};

export default MermaidToolbar;
