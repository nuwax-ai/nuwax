import Mermaid from 'mermaid';
import React, { memo, useCallback, useEffect, useState } from 'react';
import OptimizedImage from './OptimizedImage';
import { MermaidOptions, MermaidProps } from './types';

// 渲染中的默认HTML
const RenderingHtml: React.FC<{ id: string }> = ({ id }) => {
  return (
    <div className="mermaid-wrapper code-block-wrapper" id={id}>
      <div className="mermaid-container">
        <div className="alert alert-danger">渲染中...</div>
      </div>
    </div>
  );
};

/**
 * Mermaid 渲染 React 组件
 * @param {MermaidOptions} options - Mermaid 配置选项
 * @returns {Function} - 返回一个用于渲染 Mermaid 图表的 React 组件
 */
export default function mermaid(
  options: MermaidOptions = {},
): React.FC<MermaidProps> {
  // 初始化Mermaid配置，默认使用'securityLevel: loose'
  Mermaid.initialize(Object.assign({ securityLevel: 'loose' }, options));

  // 保存原始fence渲染器的引用
  let cacheImageHTML = '';
  const MermaidRenderer: React.FC<MermaidProps> = memo(
    ({ value, requestId, id }) => {
      const [isComplete, setIsComplete] = useState(false);
      const [renderValue, setRenderValue] = useState('');
      // 生成唯一的图表ID
      const chartId: string = `${requestId}-${id}`;
      const validMermaidChart = useCallback(async (_value: string) => {
        if (_value) {
          try {
            const result: any = await Mermaid.mermaidAPI.parse(_value);
            console.log('mermaidAPI.parse', result, _value);
            if (result) {
              setRenderValue(_value);
              return setIsComplete(true);
            }
          } catch (error) {
            console.error('mermaidAPI.parse error', error);
          }
        }
      }, []);

      useEffect(() => {
        validMermaidChart(value);
      }, [value, validMermaidChart]);

      useEffect(() => {
        console.log('useEffect mount', id, value);
        return () => {
          console.log('useEffect unmount', id, value);
          setIsComplete(false);
          setRenderValue('');
        };
      }, []);

      // 如果没有isComplete，说明正在渲染中
      if (!isComplete || !renderValue) {
        // TODO 这里有一定概率渲染失败，因为有可能没有下一行token, 需要优化
        return <RenderingHtml id={chartId} />;
      }

      // 初始化用于存储渲染后SVG的HTML字符串
      let imageHTML = '';
      // 初始化图片属性对象（如style、src等）
      const styles: Record<string, string> = {};

      // 创建一个临时的DOM元素用于Mermaid渲染
      const element = document.createElement('div');
      // 将临时元素添加到body，便于Mermaid API进行渲染
      document.body.appendChild(element);

      try {
        const containerId = 'mermaid-container';

        // 使用Mermaid API渲染图表（使用类型断言避免类型错误）
        Mermaid.mermaidAPI.render(
          containerId,
          renderValue,
          (html: string) => {
            // 提取max-width/height属性设置到img标签
            const svg = document.getElementById(containerId);
            if (svg !== null) {
              const { maxWidth, maxHeight } = svg.style;
              Object.entries({
                'max-width': maxWidth,
                'max-height': maxHeight,
              }).forEach(([key, _value]) => {
                if (_value) {
                  styles[key] = _value;
                }
              });
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
        return <RenderingHtml id={chartId} />;
      } finally {
        // 清理临时元素
        element.remove();
        cacheImageHTML = '';
      }

      // 设置图片数据源
      const imgSrc = `data:image/svg+xml,${encodeURIComponent(imageHTML)}`;
      console.log('imgSrc', imgSrc);
      console.log('styles', styles);

      // 编码源代码用于工具栏
      // 编码Mermaid源代码，便于后续功能（如工具栏、复制等）
      // const encodedSourceCode = encodeURIComponent(value);

      /**
       * 由于OptimizedImage未定义，这里临时用img标签替代。
       * 如果后续有OptimizedImage组件，请替换为对应组件。
       *
       * 参数说明：
       * - className: 图片样式类，便于自定义样式和点击事件
       * - src: SVG图片的data URI
       * - style: 动态样式字符串，需转换为对象（此处暂未启用）
       * - alt: 图片描述，提升无障碍体验
       */
      return (
        <OptimizedImage
          src={imgSrc}
          containerClassNames="mermaid-container-img"
          // 如需动态样式，可将styleStr解析为对象后传入style属性
          styles={styles}
          alt="mermaid graph"
        />
      );
    },
    (prevProps, nextProps) => {
      return prevProps.value === nextProps.value;
    },
  );
  /**
   * 自定义渲染器，处理mermaid图表
   * @returns 渲染后的React节点
   */
  return MermaidRenderer;
}
