import Mermaid from 'mermaid';

// 定义接口类型
interface MarkdownItRenderer {
  rules: {
    fence?: (
      tokens: any[],
      idx: number,
      options: any,
      env: any,
      slf: any,
    ) => string;
  };
  renderAttrs: (data: { attrs: [string, string][] }) => string;
}

interface MarkdownItInstance {
  renderer: MarkdownItRenderer;
}

interface Token {
  info: string;
  content: string;
  meta: {
    requestId: any;
    nextId?: string;
    id?: string;
  };
}

interface MermaidOptions {
  securityLevel?: 'loose' | 'strict' | 'antiscript' | 'sandbox';
  [key: string]: any;
}

// 渲染中的默认HTML
const renderingHtml = (chartId: string) => {
  return `<div class="mermaid-wrapper code-block-wrapper" id="${chartId}">
      <div class="markdown-code-toolbar-container" 
        data-language="mermaid" 
        data-content=""
        data-container-id="${chartId}">
      </div>
    <div class="mermaid-container"><div class="alert alert-danger">渲染中...</div></div></div>`;
};

/**
 * Mermaid markdown-it插件
 * @param md - markdown-it实例
 * @param options - Mermaid配置选项
 */
export default function mermaid(
  md: MarkdownItInstance,
  options: MermaidOptions = {},
) {
  // 初始化Mermaid配置
  Mermaid.initialize(
    Object.assign({ securityLevel: 'loose' as const }, options),
  );

  /**
   * 获取语言名称
   * @param info - 代码块信息字符串
   * @returns 语言名称
   */
  function getLangName(info: string): string {
    return info.split(/\s+/g)[0];
  }

  // 保存原始fence渲染器的引用
  const defaultFenceRenderer = md.renderer.rules.fence;
  let cacheImageHTML = '';

  /**
   * 自定义fence渲染器，处理mermaid图表
   * @param tokens - token数组
   * @param idx - 当前token索引
   * @param options - 渲染选项
   * @param env - 环境变量
   * @param slf - 渲染器自身
   * @returns 渲染后的HTML字符串
   */
  function customFenceRenderer(
    tokens: Token[],
    idx: number,
    options: any,
    env: any,
    slf: MarkdownItRenderer,
  ): string {
    const token = tokens[idx];
    const info = token.info.trim();
    const langName = info ? getLangName(info) : '';

    // 如果不是mermaid语言，使用默认渲染器
    if (['mermaid', '{mermaid}'].indexOf(langName) === -1) {
      if (defaultFenceRenderer !== undefined) {
        return defaultFenceRenderer(tokens, idx, options, env, slf);
      }
      return '';
    }
    const meta = token.meta || {};
    // 生成唯一的图表ID
    const chartId = `${meta.requestId}-${meta.id}`;

    // 如果没有nextId，说明正在渲染中
    if (!meta.nextId) {
      // TODO 这里有一定概率渲染失败，因为有可能没有下一行token, 需要优化
      return renderingHtml(chartId);
    }

    let imageHTML = '';
    const imageAttrs: [string, string][] = [];

    // 创建临时DOM元素用于渲染
    const element = document.createElement('div');
    document.body.appendChild(element);

    try {
      const containerId = 'mermaid-container';

      // 使用Mermaid API渲染图表（使用类型断言避免类型错误）
      (Mermaid.mermaidAPI as any).render(
        containerId,
        token.content,
        (html: string) => {
          // 提取max-width/height属性设置到img标签
          const svg = document.getElementById(containerId);
          if (svg !== null) {
            const { maxWidth, maxHeight } = svg.style;
            let styleStr = '';
            Object.entries({
              'max-width': maxWidth,
              'max-height': maxHeight,
            }).forEach(([key, value]) => {
              if (value) {
                styleStr += `${key}:${value};`;
              }
            });
            imageAttrs.push(['style', styleStr]);
          }

          // 存储HTML
          imageHTML = html;
          cacheImageHTML = html;
        },
        element,
      );
    } catch (e) {
      // 渲染出错时使用缓存的HTML
      imageHTML = cacheImageHTML;
      console.warn('Mermaid渲染错误:', e);

      // 渲染中，不返回错误信息
      return renderingHtml(chartId);
    } finally {
      // 清理临时元素
      element.remove();
      cacheImageHTML = '';
    }

    // 设置图片数据源
    imageAttrs.push([
      'src',
      `data:image/svg+xml,${encodeURIComponent(imageHTML)}`,
    ]);

    // 编码源代码用于工具栏
    const encodedSourceCode = encodeURIComponent(token.content);
    return `<div class="mermaid-wrapper code-block-wrapper" id="${chartId}">
      <div class="markdown-code-toolbar-container" 
        data-language="mermaid" 
        data-content="${encodedSourceCode}"
        data-container-id="${chartId}">
      </div>
      <div class="mermaid-container">
        <img class="mermaid-container-img markdown-it__image_clickable" ${slf.renderAttrs(
          {
            attrs: imageAttrs,
          },
        )} />
      </div>
    </div>`;
  }

  // 替换默认的fence渲染器
  md.renderer.rules.fence = customFenceRenderer;
}
