import classNames from 'classnames';
// import 'highlight.js/styles/github.css';
import React, { memo, useMemo, useRef } from 'react';

import styles from './index.less';

// 导入类型定义
import type { MarkdownRendererProps } from './types';

import mermaidPlugin, {
  mermaidConfig,
} from '@/plugins/ds-markdown-mermaid-plugin';
import {
  CodeBlockActions,
  ConfigProvider,
  MarkdownCMD,
  useThemeState,
} from 'ds-markdown'; // 新增：引入ds-markdown
import 'ds-markdown/katex.css';
import { createBuildInPlugin, katexPlugin } from 'ds-markdown/plugins'; // 新增：引入插件创建方法
import 'ds-markdown/style.css';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import MarkdownCustomProcess from '../MarkdownCustomProcess';
import OptimizedImage from './OptimizedImage';
import { extractTableToMarkdown, replaceMathBracket } from './utils';

const cx = classNames.bind(styles);
/**
 * Markdown 渲染器组件
 * 使用 react-markdown 替代 markdown-it，提供更好的流式渲染支持
 *
 * 注意：此组件每次内容更新都会重新渲染整个 DOM 树
 * 如需增量渲染，请使用 IncrementalMarkdownRenderer 组件
 */
const MarkdownRendererImpl: React.FC<MarkdownRendererProps> = ({
  id: requestId = '',
  // content = '',
  className,
  // mermaid,
  // answerType = 'answer', // 暂时未使用，注释掉避免 ESLint 警告
  // disableTyping = true, // 暂时未使用，注释掉避免 ESLint 警告
  // onCopy, // 暂时未使用，注释掉避免 ESLint 警告
  markdownRef, // 确保这个 ref 的类型是 MarkdownCMDRef
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dsMarkdownTheme = useThemeState();
  // 用插件机制传递自定义components
  const customPlugin = useMemo(
    () =>
      createBuildInPlugin({
        rehypePlugin: [rehypeRaw, rehypeStringify],
        components: {
          // 确保使用一致的组件名称格式
          'markdown-custom-process': ({
            result,
            node,
            type,
            status,
            executeid,
            name,
          }: any) => {
            const {
              end: { offset: endOffset },
              start: { offset: startOffset },
            } = node?.position || {};
            const processKey = `${startOffset}-${endOffset}-process`;
            return (
              <MarkdownCustomProcess
                key={processKey}
                dataKey={processKey}
                type={type}
                status={status}
                executeId={executeid}
                name={decodeURIComponent(name || '')}
              >
                {decodeURIComponent(result || '')}
              </MarkdownCustomProcess>
            );
          },
          table: ({ children, node }: any) => {
            const {
              end: { offset: endOffset },
              start: { offset: startOffset },
            } = node?.position || {};
            const listKey = `${startOffset}-${endOffset}-list`;

            // 通过表格反向提取内容并转为 markdown 文档文本格式
            const tableMDContent = extractTableToMarkdown(children);

            return (
              <div
                key={listKey}
                data-key={listKey}
                className={styles['table-wrapper']}
              >
                <div
                  className={`md-code-block md-code-block-${dsMarkdownTheme.theme}`}
                >
                  <div className="md-code-block-banner-wrap">
                    <div className="md-code-block-banner md-code-block-banner-lite">
                      <>
                        <div className="md-code-block-language">表格</div>
                        <CodeBlockActions
                          language="markdown"
                          codeContent={tableMDContent}
                        />
                      </>
                    </div>
                  </div>
                  <div className="md-code-block-content scrollbar">
                    <table className={cx(styles['markdown-table'])}>
                      {children}
                    </table>
                  </div>
                </div>
              </div>
            );
          },
          img: ({ src, alt, title, node }: any) => {
            if (!src) return null;
            const {
              end: { offset: endOffset },
              start: { offset: startOffset },
            } = node?.position || {};
            const imageKey = `${startOffset}-${endOffset}-img`;
            return (
              <OptimizedImage
                key={imageKey}
                dataKey={imageKey}
                containerClassNames={styles['markdown-image-container']}
                src={src}
                alt={alt}
                title={title}
              />
            );
          },
        },
        id: Symbol('custom-plugin'),
        type: 'custom',
      }),
    [dsMarkdownTheme.theme],
  );

  const plugins = useMemo(() => [mermaidPlugin, katexPlugin, customPlugin], []);

  // 使用导入的 mermaidConfig，而不是重新创建
  const mermaidProvider = useMemo(() => mermaidConfig, []);

  return (
    <div
      ref={containerRef}
      key={`${requestId}`}
      id={`${requestId}`}
      data-key={`${requestId}`}
      className={cx(styles['markdown-container'], className)}
    >
      <ConfigProvider mermaidConfig={mermaidProvider}>
        {/* 用ds-markdown替换react-markdown，传递自定义components插件 */}

        <MarkdownCMD
          ref={markdownRef}
          timerType="requestAnimationFrame"
          interval={30}
          plugins={plugins}
          disableTyping={true}
          math={{
            splitSymbol: 'bracket',
            replaceMathBracket,
          }}
          codeBlock={{
            headerActions: true, // 启用代码块头部操作按钮
          }}
        />
      </ConfigProvider>
    </div>
  );
};

const MarkdownRenderer = memo(MarkdownRendererImpl, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id;
});

export default MarkdownRenderer;

// 导出相关类型和工具
export type {
  MarkdownRendererConfig,
  MarkdownRendererProps,
  PluginConfig,
} from './types';
