import classNames from 'classnames';
// import 'highlight.js/styles/github.css';
import { isEqual } from 'lodash';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import styles from './index.less';

// 导入类型定义
import mermaid from './mermaid';
import { presetConfigs } from './presets';
import type { MarkdownRendererConfig, MarkdownRendererProps } from './types';

import { throttle } from 'lodash';
import MarkdownCustomProcess from '../MarkdownCustomProcess';
import CodeBlock from './CodeBlock';
import { LinkComponent, ParagraphComponent } from './MarkdownComponents';
import OptimizedImage from './OptimizedImage';
import { OptimizedList, OptimizedListItem } from './OptimizedList';

// 移除未使用的Token类型
// type Token = any;

const cx = classNames.bind(styles);
// function splitMarkdown(markdownContent: string, chunkCount: number) {
//   const lines = markdownContent.split('\n');
//   const chunkSize = Math.ceil(lines.length / chunkCount);
//   const chunks = [];

//   for (let i = 0; i < lines.length; i += chunkSize) {
//     chunks.push(lines.slice(i, i + chunkSize).join('\n'));
//   }

//   return chunks;
// }
/**
 * Markdown 渲染器组件
 * 使用 react-markdown 替代 markdown-it，提供更好的流式渲染支持
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(
  ({ id: requestId, content, className, mermaid, onCopy }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // 自定义组件配置
    const components: Components = useMemo(() => {
      return {
        code: ({ className, children, node, ...rest }: any) => {
          const { offset } = node?.position?.start;
          const codeKey = `${offset}-code`;
          return (
            <code
              key={codeKey}
              data-key={codeKey}
              className={className}
              {...rest}
            >
              {children}
            </code>
          );
        },
        pre: (props: any) => {
          // console.log('pre', props, args);
          const { children, node, ...rest } = props;
          // console.log('pre', children.props.children);
          const hasCode = children && children?.props?.node?.tagName === 'code';
          const { offset } = node?.position?.start;
          const preKey = `${offset}-pre`;
          if (!hasCode) {
            return (
              <pre key={preKey} data-key={preKey} {...props}>
                {children}
              </pre>
            );
          }

          const language =
            children.props.className?.replace('language-', '') || 'text';
          const codeContent = String(children.props.children).replace(
            /\n$/,
            '',
          );
          console.log('codeContent', codeContent, language);
          // const codeKey = getCodeKey(codeContent, language);
          // console.log('codeKey', codeKey, codeContent, language);
          return (
            <CodeBlock
              key={preKey}
              dataKey={preKey}
              className={children?.props?.className}
              requestId={requestId}
              onCopy={onCopy}
              mermaid={mermaid}
              {...rest}
            >
              {children}
            </CodeBlock>
          );
        },
        img: ({ src, alt, title, node }: any) => {
          if (!src) return null;
          const { offset } = node?.position?.start;
          // const imageKey = getImageKey(src);
          const imageKey = `${offset}-img`;
          return (
            <OptimizedImage
              key={imageKey}
              dataKey={imageKey}
              containerClassNames={styles['markdown-image-container']}
              src={src}
              alt={alt}
              title={title}
              // imageKey={imageKey}
            />
          );
        },
        p: ({ children, node }: any) => {
          const { offset } = node?.position?.start;
          const paragraphKey = `${offset}-p`;
          return (
            <ParagraphComponent key={paragraphKey} dataKey={paragraphKey}>
              {children}
            </ParagraphComponent>
          );
        },
        a: ({ href, children, node }: any) => {
          const { offset } = node?.position?.start;
          const linkKey = `${offset}-a`;
          return (
            <LinkComponent key={linkKey} dataKey={linkKey} href={href}>
              {children}
            </LinkComponent>
          );
        },
        // 优化的列表组件 - 使用计数器避免循环引用
        ul: ({ children, node }: any) => {
          // const listKey = getListKey(children, listKeyCounter.current++);
          // console.log('ul', listKey);
          const { offset } = node?.position?.start;
          const listKey = `${offset}-ul`;
          return (
            <OptimizedList key={listKey} dataKey={listKey} ordered={false}>
              {children}
            </OptimizedList>
          );
        },
        ol: ({ children, node }: any) => {
          // const listKey = getListKey(children, listKeyCounter.current++);
          // console.log('ol', listKey);
          const { offset } = node?.position?.start;
          const listKey = `${offset}-ol`;
          return (
            <OptimizedList key={listKey} dataKey={listKey} ordered={true}>
              {children}
            </OptimizedList>
          );
        },
        'markdown-custom-process': ({
          children,
          node,
          type,
          status,
          executeid,
          name,
        }: any) => {
          const { offset } = node?.position?.start;
          const processKey = `${offset}-process`;
          return (
            <MarkdownCustomProcess
              key={processKey}
              dataKey={processKey}
              type={type}
              status={status}
              executeId={executeid}
              name={decodeURIComponent(name || '')}
            >
              {children}
            </MarkdownCustomProcess>
          );
        },
        li: ({ children, node }: any) => {
          // 为列表项生成稳定的key
          // const content = String(children).slice(0, 100);
          // const itemKey = getListItemKey(content, listItemKeyCounter.current++);
          const { offset } = node?.position?.start;
          const itemKey = `${offset}-li`;
          return (
            <OptimizedListItem key={itemKey} dataKey={itemKey}>
              {children}
            </OptimizedListItem>
          );
        },
        // 支持表格样式
        table: ({ children, node }: any) => {
          const { offset } = node?.position?.start;
          const listKey = `${offset}-list`;
          return (
            <div
              key={listKey}
              data-key={listKey}
              className={styles['table-wrapper']}
            >
              <table className={styles['markdown-table']}>{children}</table>
            </div>
          );
        },
        // 支持引用样式
        blockquote: ({ children, node }: any) => {
          const { offset } = node?.position?.start;
          const blockquoteKey = `${offset}-blockquote`;
          return (
            <blockquote
              key={blockquoteKey}
              data-key={blockquoteKey}
              className={styles['markdown-blockquote']}
            >
              {children}
            </blockquote>
          );
        },
      };
    }, [requestId, onCopy, mermaid]);

    // 插件配置
    const remarkPlugins = useMemo(
      () => [
        remarkGfm, // GitHub Flavored Markdown
        remarkMath, // 数学公式支持
        // remarkMermaidPlugin, // mermaid 支持
      ],
      [],
    );

    const rehypePlugins = useMemo(
      () => [
        rehypeKatex, // KaTeX 数学公式渲染
        rehypeRaw, // 支持原始 HTML
        rehypeStringify,
      ],
      [],
    );
    // // 使用节流减少更新频率
    // const throttledUpdate = useMemo(
    //   () =>
    //     throttle(
    //       (_content: string) => {
    //         setMarkdownContent(_content);
    //       },
    //       2000,
    //       {
    //         leading: true,
    //         trailing: true,
    //       },
    //     ),
    //   [],
    // );
    // useEffect(() => {
    //   // 模拟流式数据
    //   throttledUpdate(content || '');
    //   return () => {
    //     // clearInterval(timer);
    //     throttledUpdate.cancel();
    //   };
    // }, [throttledUpdate, content]);
    // console.log('MarkdownRenderer', content);
    return (
      <div
        ref={containerRef}
        key={`${requestId}`}
        id={`${requestId}`}
        data-key={`${requestId}`}
        className={cx(styles['markdown-container'], className)}
      >
        <ReactMarkdown
          key={`${requestId}-markdown`}
          components={components}
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          className={styles['react-markdown']}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      isEqual(prevProps.config, nextProps.config) &&
      prevProps.className === nextProps.className
    );
  },
);

/**
 * 创建自定义配置的 Markdown 渲染器
 */
export const createMarkdownRenderer = (
  defaultConfig: MarkdownRendererConfig,
) => {
  // 直接调用 mermaid() 获取组件，不使用 useMemo
  const MermaidCode = mermaid();

  return memo<
    Omit<MarkdownRendererProps, 'config'> & {
      config?: Partial<MarkdownRendererConfig>;
    }
  >(({ config = {}, content, ...props }) => {
    const mergedConfig = useMemo(
      () => ({
        ...defaultConfig,
        ...config,
        plugins: [...(defaultConfig.plugins || []), ...(config.plugins || [])],
        customRules: { ...defaultConfig.customRules, ...config.customRules },
        globalFunctions: {
          ...defaultConfig.globalFunctions,
          ...config.globalFunctions,
        },
        cssClasses: { ...defaultConfig.cssClasses, ...config.cssClasses },
      }),
      [config],
    );
    const [markdownContent, setMarkdownContent] = useState('');
    // 使用节流减少更新频率
    const throttledUpdate = useMemo(
      () =>
        throttle(
          (_content: string) => {
            setMarkdownContent(_content);
          },
          2000,
          {
            leading: true,
            trailing: true,
          },
        ),
      [],
    );
    useEffect(() => {
      // 模拟流式数据
      throttledUpdate(content || '');
      return () => {
        // clearInterval(timer);
        throttledUpdate.cancel();
      };
    }, [throttledUpdate, content]);

    return (
      <MarkdownRenderer
        {...props}
        content={markdownContent}
        config={mergedConfig}
        mermaid={MermaidCode} // 直接传递组件
      />
    );
  });
};

/**
 * 预设的聊天场景 Markdown 渲染器
 */
export const ChatMarkdownRenderer = createMarkdownRenderer(
  presetConfigs.chat(),
);

/**
 * 预设的标准 Markdown 渲染器
 */
export const StandardMarkdownRenderer = createMarkdownRenderer(
  presetConfigs.standard(),
);

/**
 * 预设的基础 Markdown 渲染器
 */
export const BasicMarkdownRenderer = createMarkdownRenderer(
  presetConfigs.basic(),
);

/**
 * 预设的完整功能 Markdown 渲染器
 */
export const FullMarkdownRenderer = createMarkdownRenderer(
  presetConfigs.full(),
);

export default MarkdownRenderer;

// 导出相关类型和工具
export { globalFunctionManager } from './globalFunctions';
// export { allPlugins, presetConfigs } from './presets';
// export { createDefaultRenderRules } from './renderRules';
export type {
  MarkdownRendererConfig,
  MarkdownRendererProps,
  PluginConfig,
} from './types';
