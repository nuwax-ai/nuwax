/**
 * Mermaid图表导出工具类
 * 提供统一的SVG和PNG导出功能
 */
import { message } from 'antd';
import mermaid from 'mermaid';

export interface ExportOptions {
  filename?: string;
  scale?: number; // PNG导出的缩放比例，默认为2（高清）
  backgroundColor?: string; // PNG背景色，默认白色
}

export class MermaidExporter {
  /**
   * 导出SVG格式
   * @param sourceCode mermaid源代码
   * @param options 导出选项
   */
  static async exportSVG(
    sourceCode: string,
    options: ExportOptions = {},
  ): Promise<void> {
    try {
      const { filename = `mermaid-chart-${Date.now()}.svg` } = options;

      // 使用mermaid.render获取干净的SVG
      // @ts-ignore
      const { svg } = await mermaid.render(`export-${Date.now()}`, sourceCode);

      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      this.downloadBlob(blob, filename);

      message.success('SVG 导出成功');
    } catch (error) {
      console.error('SVG export error:', error);
      message.error('SVG 导出失败');
      throw error;
    }
  }

  /**
   * 导出PNG格式
   * @param sourceCode mermaid源代码
   * @param options 导出选项
   */
  static async exportPNG(
    sourceCode: string,
    options: ExportOptions = {},
  ): Promise<void> {
    try {
      const {
        filename = `mermaid-chart-${Date.now()}.png`,
        scale = 2,
        backgroundColor = '#ffffff',
      } = options;

      // 先获取SVG
      // @ts-ignore
      const { svg } = await mermaid.render('undefined', sourceCode);
      console.log('svg', svg);
      // 转换为PNG
      const pngBlob = await this.svgToPng(svg, scale, backgroundColor);
      this.downloadBlob(pngBlob, filename);

      message.success('PNG 导出成功');
    } catch (error) {
      console.error('PNG export error:', error);
      message.error('PNG 导出失败');
      throw error;
    }
  }

  /**
   * 从容器DOM导出SVG（兼容旧方法）
   * @param containerId 容器ID
   * @param options 导出选项
   */
  static exportSVGFromDOM(
    containerId: string,
    options: ExportOptions = {},
  ): void {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container with id ${containerId} not found`);
      }

      const svgElement = container.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG element not found in container');
      }

      const { filename = `mermaid-chart-${Date.now()}.svg` } = options;

      // 克隆SVG以避免修改原始元素
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      clonedSvg.style.transform = 'none'; // 重置变换

      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

      this.downloadBlob(blob, filename);
      message.success('SVG 导出成功');
    } catch (error) {
      console.error('SVG export error:', error);
      message.error('SVG 导出失败');
    }
  }

  /**
   * 从容器DOM导出PNG（直接获取完整SVG）
   * @param containerId 容器ID
   * @param options 导出选项
   */
  static async exportPNGFromDOM(
    containerId: string,
    options: ExportOptions = {},
  ): Promise<void> {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container with id ${containerId} not found`);
      }

      const svgElement = container.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG element not found in container');
      }

      const {
        filename = `mermaid-chart-${Date.now()}.png`,
        scale = 2,
        backgroundColor = '#ffffff',
      } = options;

      // 等待SVG完全渲染
      await this.waitForSvgComplete();

      // 获取SVG的完整边界框
      const fullBounds = this.getFullSvgBounds(svgElement);
      console.log('SVG bounds:', fullBounds); // 调试信息

      // 创建新的Canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // 设置Canvas尺寸
      canvas.width = fullBounds.width * scale;
      canvas.height = fullBounds.height * scale;

      // 设置高质量渲染
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.scale(scale, scale);

      // 设置背景
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, fullBounds.width, fullBounds.height);

      // 直接将SVG转换为图像
      const svgData = this.prepareSvgForExport(svgElement, fullBounds);
      const blob = await this.renderSvgToCanvas(
        svgData,
        canvas,
        ctx,
        fullBounds,
      );

      this.downloadBlob(blob, filename);
      message.success('PNG 导出成功');
    } catch (error) {
      console.error('PNG export error:', error);
      message.error('PNG 导出失败');
    }
  }

  /**
   * SVG转换为PNG
   * @param svgData SVG数据（字符串）
   * @param scale 缩放比例
   * @param backgroundColor 背景颜色
   * @returns PNG Blob
   */
  private static svgToPng(
    svgData: string,
    scale: number,
    backgroundColor: string,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 获取SVG的真实尺寸
        const svgSize = this.getSvgDimensions(svgData);
        const width = svgSize.width || img.width || img.naturalWidth;
        const height = svgSize.height || img.height || img.naturalHeight;

        // 设置Canvas尺寸
        canvas.width = width * scale;
        canvas.height = height * scale;

        if (ctx) {
          // 设置高质量渲染
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // 缩放上下文
          ctx.scale(scale, scale);

          // 设置背景色
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, width, height);

          // 绘制SVG - 确保完整绘制
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          'image/png',
          0.95,
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load SVG image'));
      };

      // 使用增强的SVG数据
      const enhancedSvgData = this.enhanceSvgForExport(svgData);
      const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        enhancedSvgData,
      )}`;
      img.src = svgDataUrl;
    });
  }

  /**
   * 使用固定尺寸转换PNG
   */
  private static svgToPngWithFixedSize(
    svgData: string,
    width: number,
    height: number,
    scale: number,
    backgroundColor: string,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = width * scale;
        canvas.height = height * scale;

        if (ctx) {
          ctx.scale(scale, scale);
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          'image/png',
          0.95,
        );
      };

      img.onerror = reject;
      const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        svgData,
      )}`;
      img.src = svgDataUrl;
    });
  }

  /**
   * 获取SVG的真实尺寸
   * @param svgData SVG数据
   * @returns 尺寸对象
   */
  private static getSvgDimensions(svgData: string): {
    width: number;
    height: number;
  } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, 'image/svg+xml');
    const svg = doc.querySelector('svg');

    if (!svg) {
      return { width: 800, height: 600 }; // 默认尺寸
    }

    // 尝试从不同属性获取尺寸
    let width = 0;
    let height = 0;

    // 1. 从width/height属性获取
    const widthAttr = svg.getAttribute('width');
    const heightAttr = svg.getAttribute('height');

    if (widthAttr && heightAttr) {
      width = parseFloat(widthAttr.replace(/[^0-9.]/g, ''));
      height = parseFloat(heightAttr.replace(/[^0-9.]/g, ''));
    }

    // 2. 从viewBox获取
    if ((!width || !height) && svg.getAttribute('viewBox')) {
      const viewBox = svg.getAttribute('viewBox')!.split(' ');
      if (viewBox.length === 4) {
        width = parseFloat(viewBox[2]);
        height = parseFloat(viewBox[3]);
      }
    }

    // 3. 从style获取
    if (!width || !height) {
      const style = svg.getAttribute('style');
      if (style) {
        const widthMatch = style.match(/width:\s*(\d+(?:\.\d+)?)/);
        const heightMatch = style.match(/height:\s*(\d+(?:\.\d+)?)/);
        if (widthMatch) width = parseFloat(widthMatch[1]);
        if (heightMatch) height = parseFloat(heightMatch[1]);
      }
    }

    // 4. 计算内容边界
    if (!width || !height) {
      const bbox = this.calculateSvgBoundingBox(svg);
      width = bbox.width;
      height = bbox.height;
    }

    return {
      width: Math.max(width, 100), // 最小宽度
      height: Math.max(height, 100), // 最小高度
    };
  }

  /**
   * 计算SVG内容的边界框
   * @param svg SVG元素
   * @returns 边界框
   */
  private static calculateSvgBoundingBox(svg: SVGElement): {
    width: number;
    height: number;
  } {
    try {
      // 临时添加到DOM中以获取真实尺寸
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        visibility: hidden;
        width: auto;
        height: auto;
      `;

      const clonedSvg = svg.cloneNode(true) as SVGElement;
      tempDiv.appendChild(clonedSvg);
      document.body.appendChild(tempDiv);

      // 获取边界框
      const bbox = (clonedSvg as any).getBBox();
      const width = bbox.width + bbox.x;
      const height = bbox.height + bbox.y;

      // 清理
      document.body.removeChild(tempDiv);

      return {
        width: Math.max(width, 100),
        height: Math.max(height, 100),
      };
    } catch (error) {
      console.warn('Failed to calculate SVG bounding box:', error);
      return { width: 800, height: 600 };
    }
  }

  /**
   * 增强SVG数据以确保完整导出
   * @param svgData 原始SVG数据
   * @returns 增强后的SVG数据
   */
  private static enhanceSvgForExport(svgData: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, 'image/svg+xml');
    const svg = doc.querySelector('svg');

    if (!svg) return svgData;

    // 获取真实尺寸
    const dimensions = this.getSvgDimensions(svgData);

    // 确保SVG有正确的尺寸属性
    svg.setAttribute('width', dimensions.width.toString());
    svg.setAttribute('height', dimensions.height.toString());

    // 设置viewBox以确保内容完整显示
    if (!svg.getAttribute('viewBox')) {
      svg.setAttribute(
        'viewBox',
        `0 0 ${dimensions.width} ${dimensions.height}`,
      );
    }

    // 确保有正确的命名空间
    if (!svg.getAttribute('xmlns')) {
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    // 添加样式以确保字体正确渲染
    const style = document.createElement('style');
    style.textContent = `
      text { font-family: Arial, sans-serif; }
      .node text { font-size: 14px; }
      .edgeLabel text { font-size: 12px; }
    `;
    svg.insertBefore(style, svg.firstChild);

    return new XMLSerializer().serializeToString(doc);
  }

  /**
   * 下载Blob文件
   * @param blob 文件Blob
   * @param filename 文件名
   */
  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 清理URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * 获取图表的SVG字符串（不下载）
   * @param sourceCode mermaid源代码
   * @returns SVG字符串
   */
  static async getSVGString(sourceCode: string): Promise<string> {
    try {
      // @ts-ignore
      const { svg } = await mermaid.render(`get-svg-${Date.now()}`, sourceCode);
      return svg;
    } catch (error) {
      console.error('Get SVG string error:', error);
      throw error;
    }
  }

  /**
   * 检查是否支持导出功能
   * @returns 是否支持
   */
  static isExportSupported(): boolean {
    return !!(
      document.createElement('canvas').getContext('2d') &&
      window.URL &&
      window.Blob
    );
  }

  /**
   * 等待SVG完全渲染
   */
  private static waitForSvgComplete(): Promise<void> {
    return new Promise((resolve) => {
      // 等待所有图像和字体加载完成
      if (document.readyState === 'complete') {
        setTimeout(resolve, 100); // 额外等待100ms确保渲染完成
      } else {
        window.addEventListener('load', () => {
          setTimeout(resolve, 100);
        });
      }
    });
  }

  /**
   * 获取SVG的完整边界框
   */
  private static getFullSvgBounds(svgElement: SVGElement): {
    width: number;
    height: number;
    x: number;
    y: number;
  } {
    try {
      // 方法1: 获取SVG的getBBox()
      const bbox = (svgElement as any).getBBox();
      console.log('SVG getBBox:', bbox);

      // 方法2: 获取所有子元素的边界框
      const allElements = svgElement.querySelectorAll('*');
      let minX = bbox.x;
      let minY = bbox.y;
      let maxX = bbox.x + bbox.width;
      let maxY = bbox.y + bbox.height;

      allElements.forEach((element) => {
        try {
          if (
            element instanceof SVGElement &&
            typeof (element as any).getBBox === 'function'
          ) {
            const elementBBox = (element as any).getBBox();
            minX = Math.min(minX, elementBBox.x);
            minY = Math.min(minY, elementBBox.y);
            maxX = Math.max(maxX, elementBBox.x + elementBBox.width);
            maxY = Math.max(maxY, elementBBox.y + elementBBox.height);
          }
        } catch (e) {
          // 忽略无法获取bbox的元素
        }
      });

      // 方法3: 获取客户端边界框
      const clientRect = svgElement.getBoundingClientRect();
      console.log('SVG clientRect:', clientRect);

      // 使用最大的尺寸
      const width = Math.max(
        maxX - minX,
        bbox.width,
        clientRect.width,
        parseInt(svgElement.getAttribute('width') || '0'),
        200, // 最小宽度
      );

      const height = Math.max(
        maxY - minY,
        bbox.height,
        clientRect.height,
        parseInt(svgElement.getAttribute('height') || '0'),
        150, // 最小高度
      );

      return {
        width: Math.ceil(width),
        height: Math.ceil(height),
        x: Math.floor(minX),
        y: Math.floor(minY),
      };
    } catch (error) {
      console.error('Failed to get SVG bounds:', error);
      // 降级方案
      return {
        width: 800,
        height: 600,
        x: 0,
        y: 0,
      };
    }
  }

  /**
   * 准备SVG数据用于导出
   */
  private static prepareSvgForExport(
    svgElement: SVGElement,
    bounds: { width: number; height: number; x: number; y: number },
  ): string {
    // 克隆SVG
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;

    // 移除变换
    clonedSvg.style.transform = 'none';

    // 设置明确的尺寸
    clonedSvg.setAttribute('width', bounds.width.toString());
    clonedSvg.setAttribute('height', bounds.height.toString());

    // 设置viewBox以包含所有内容
    const viewBox = `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`;
    clonedSvg.setAttribute('viewBox', viewBox);

    // 确保有正确的命名空间
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // 添加样式以确保正确渲染
    const style = document.createElement('style');
    style.textContent = `
      * { 
        font-family: Arial, sans-serif; 
        font-size: 14px;
      }
      .node text { font-size: 14px; }
      .edgeLabel text { font-size: 12px; }
      text { dominant-baseline: middle; }
    `;
    clonedSvg.insertBefore(style, clonedSvg.firstChild);

    return new XMLSerializer().serializeToString(clonedSvg);
  }

  /**
   * 将SVG渲染到Canvas
   */
  private static renderSvgToCanvas(
    svgData: string,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    bounds: { width: number; height: number },
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        console.log('Image loaded, size:', img.width, 'x', img.height);

        // 清除Canvas
        ctx.clearRect(0, 0, bounds.width, bounds.height);

        // 设置背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, bounds.width, bounds.height);

        // 绘制图像
        ctx.drawImage(img, 0, 0, bounds.width, bounds.height);

        // 转换为blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log('Canvas converted to blob successfully');
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          'image/png',
          0.95,
        );
      };

      img.onerror = (error) => {
        console.error('Image load error:', error);
        reject(new Error('Failed to load SVG as image'));
      };

      // 创建data URL
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        svgData,
      )}`;
      console.log('SVG data URL created, length:', dataUrl.length);

      img.src = dataUrl;
    });
  }

  /**
   * 超简单的PNG导出方案
   */
  static async exportPNGSimple(
    containerId: string,
    options: ExportOptions = {},
  ): Promise<void> {
    try {
      const container = document.getElementById(containerId);
      const svgElement = container?.querySelector('svg');

      if (!svgElement) {
        throw new Error('SVG not found');
      }

      const { filename = `mermaid-chart-${Date.now()}.png`, scale = 3 } =
        options;

      // 强制设置SVG尺寸
      const rect = svgElement.getBoundingClientRect();
      const width = Math.max(rect.width, 400);
      const height = Math.max(rect.height, 300);

      console.log('Export size:', width, 'x', height);

      // 创建一个新的SVG
      const newSvg = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg',
      );
      newSvg.setAttribute('width', (width * scale).toString());
      newSvg.setAttribute('height', (height * scale).toString());
      newSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      newSvg.innerHTML = svgElement.innerHTML;

      // 转换为字符串
      const svgString = new XMLSerializer().serializeToString(newSvg);

      // 创建Canvas并导出
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        canvas.width = width * scale;
        canvas.height = height * scale;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            this.downloadBlob(blob, filename);
            message.success('PNG 导出成功');
          }
        }, 'image/png');
      };

      img.src = `data:image/svg+xml;base64,${btoa(
        unescape(encodeURIComponent(svgString)),
      )}`;
    } catch (error) {
      console.error('PNG export failed:', error);
      message.error('PNG 导出失败');
    }
  }
}

export default MermaidExporter;
