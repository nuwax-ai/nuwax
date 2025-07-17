import classNames from 'classnames';
// import 'highlight.js/styles/github.css';
import { isEqual } from 'lodash';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
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

import MarkdownCustomProcess from '../MarkdownCustomProcess';
import CodeBlock from './CodeBlock';
import { LinkComponent, ParagraphComponent } from './MarkdownComponents';
import OptimizedImage from './OptimizedImage';
import { OptimizedList, OptimizedListItem } from './OptimizedList';

// 移除未使用的Token类型
// type Token = any;

const cx = classNames.bind(styles);

/**
 * Markdown 渲染器组件
 * 使用 react-markdown 替代 markdown-it，提供更好的流式渲染支持
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(
  ({ id: requestId, content, className, mermaid, onCopy }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // 用于生成稳定的图片key
    const imageKeyCounter = useRef(0);
    const imageKeyMap = useRef<Map<string, string>>(new Map());

    // 用于生成稳定的代码块key
    const codeKeyCounter = useRef(0);
    const codeKeyMap = useRef<Map<string, string>>(new Map());

    // 用于生成稳定的列表key
    const listKeyCounter = useRef(0);
    const listKeyMap = useRef<Map<string, string>>(new Map());

    // 用于生成稳定的列表项key
    const listItemKeyCounter = useRef(0);
    const listItemKeyMap = useRef<Map<string, string>>(new Map());

    // 生成稳定的图片key
    const getImageKey = useCallback(
      (src: string) => {
        if (!imageKeyMap.current.has(src)) {
          imageKeyMap.current.set(
            src,
            `image-${requestId}-${imageKeyCounter.current++}`,
          );
        }
        return imageKeyMap.current.get(src)!;
      },
      [requestId],
    );

    // 生成稳定的代码块key
    const getCodeKey = useCallback(
      (content: string, language: string) => {
        const key = `${content.slice(0, 100)}-${language}`;
        if (!codeKeyMap.current.has(key)) {
          codeKeyMap.current.set(
            key,
            `code-${requestId}-${codeKeyCounter.current++}`,
          );
        }
        return codeKeyMap.current.get(key)!;
      },
      [requestId],
    );

    // 生成稳定的列表key - 修复循环引用问题
    const getListKey = useCallback(
      (children: any, index: number) => {
        // 使用计数器而不是序列化children
        const key = `list-${requestId}-${index}`;

        if (!listKeyMap.current.has(key)) {
          listKeyMap.current.set(key, key);
        }
        return listKeyMap.current.get(key)!;
      },
      [requestId],
    );

    // 生成稳定的列表项key
    const getListItemKey = useCallback(
      (content: string, index: number) => {
        const key = `li-${requestId}-${content
          .slice(0, 50)
          .replace(/[^a-zA-Z0-9]/g, '')}-${index}`;

        if (!listItemKeyMap.current.has(key)) {
          listItemKeyMap.current.set(key, key);
        }
        return listItemKeyMap.current.get(key)!;
      },
      [requestId],
    );

    // 自定义组件配置
    const components: Components = useMemo(
      () => ({
        code: ({ className, children, ...rest }: any) => {
          return (
            <code className={className} {...rest}>
              {children}
            </code>
          );
        },
        pre: (props: any) => {
          const { children, ...rest } = props;
          const hasCode = children && children?.props?.node?.tagName === 'code';

          console.log('pre', props, hasCode);
          if (!hasCode) {
            return <pre {...props}>{children}</pre>;
          }

          const language =
            children.props.className?.replace('language-', '') || 'text';
          const codeContent = String(children.props.children).replace(
            /\n$/,
            '',
          );
          const codeKey = getCodeKey(codeContent, language);
          console.log('codeKey', codeKey);
          return (
            <CodeBlock
              key={codeKey}
              className={children?.props?.className}
              requestId={requestId}
              onCopy={onCopy}
              codeKey={codeKey}
              mermaid={mermaid}
              {...rest}
            >
              {children}
            </CodeBlock>
          );
        },
        img: ({ src, alt, title }: any) => {
          if (!src) return null;

          // const imageKey = getImageKey(src);
          return (
            <OptimizedImage
              // key={imageKey}
              src={src}
              alt={alt}
              title={title}
              // imageKey={imageKey}
            />
          );
        },
        p: ({ children }: any) => (
          <ParagraphComponent>{children}</ParagraphComponent>
        ),
        a: ({ href, children }: any) => (
          <LinkComponent href={href}>{children}</LinkComponent>
        ),
        // 优化的列表组件 - 使用计数器避免循环引用
        ul: ({ children }: any) => {
          const listKey = getListKey(children, listKeyCounter.current++);
          console.log('ul', listKey);
          return <OptimizedList ordered={false}>{children}</OptimizedList>;
        },
        ol: ({ children }: any) => {
          const listKey = getListKey(children, listKeyCounter.current++);
          console.log('ol', listKey);
          return <OptimizedList ordered={true}>{children}</OptimizedList>;
        },
        'markdown-custom-process': ({ children, ...rest }: any) => {
          return (
            <MarkdownCustomProcess
              key={rest.executeid}
              type={rest.type}
              status={rest.status}
              executeId={rest.executeid}
              name={decodeURIComponent(rest.name || '')}
            >
              {children}
            </MarkdownCustomProcess>
          );
        },
        li: ({ children }: any) => {
          // 为列表项生成稳定的key
          const content = String(children).slice(0, 100);
          const itemKey = getListItemKey(content, listItemKeyCounter.current++);
          console.log('li', itemKey);
          return <OptimizedListItem>{children}</OptimizedListItem>;
        },
        // 支持表格样式
        table: ({ children }: any) => (
          <div className={styles['table-wrapper']}>
            <table className={styles['markdown-table']}>{children}</table>
          </div>
        ),
        // 支持引用样式
        blockquote: ({ children }: any) => (
          <blockquote className={styles['markdown-blockquote']}>
            {children}
          </blockquote>
        ),
      }),
      [
        requestId,
        onCopy,
        getImageKey,
        getCodeKey,
        getListKey,
        getListItemKey,
        mermaid,
      ],
    );

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

    // 处理自定义内容（如果有的话）
    const processedContent = useMemo(() => {
      if (!content) return '';

      // 这里可以添加自定义内容处理逻辑
      // 比如处理特殊的自定义组件标记
      return content;
    }, [content]);

    // 清理key映射
    useEffect(() => {
      return () => {
        imageKeyMap.current.clear();
        imageKeyCounter.current = 0;
        codeKeyMap.current.clear();
        codeKeyCounter.current = 0;
        listKeyMap.current.clear();
        listItemKeyMap.current.clear();
        listItemKeyCounter.current = 0;
        listKeyCounter.current = 0;
      };
    }, []);

    return (
      <div
        ref={containerRef}
        id={`${requestId}`}
        className={cx(styles['markdown-container'], className)}
      >
        <ReactMarkdown
          key={requestId}
          components={components}
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          className={styles['react-markdown']}
        >
          {processedContent}
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
  >(({ config = {}, ...props }) => {
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

    return (
      <MarkdownRenderer
        {...props}
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
