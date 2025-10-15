import classNames from 'classnames';
// import 'highlight.js/styles/github.css';
import React, { memo, useMemo, useRef } from 'react';

import styles from './index.less';

// 导入类型定义
import type { MarkdownRendererProps } from '@/types/interfaces/markdownRender';

import mermaidPlugin, {
  mermaidConfig,
} from '@/plugins/ds-markdown-mermaid-plugin';
import DsMarkdown, { ConfigProvider, MarkdownCMD } from 'ds-markdown'; // 新增：引入ds-markdown
import 'ds-markdown/katex.css';
import { katexPlugin } from 'ds-markdown/plugins'; // 新增：引入插件创建方法
import './ds-markdown.css';
import genCustomPlugin from './genCustomPlugin';
import { replaceMathBracket } from './utils';

const cx = classNames.bind(styles);
/**
 * Markdown 渲染器组件
 * 使用 ds-markdown 提供流式渲染支持
 *
 * 注意：此组件每次内容更新都会重新渲染整个 DOM 树
 * 如需增量渲染，请使用 IncrementalMarkdownRenderer 组件
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(
  ({
    id: requestId = '',
    className,
    markdownRef,
    headerActions = true,
    disableTyping = true,
    theme = 'light',
  }: MarkdownRendererProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const plugins = useMemo(
      () => [mermaidPlugin, katexPlugin, genCustomPlugin()],
      [],
    );
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
            codeBlock={{ headerActions }}
            theme={theme}
            math={{
              splitSymbol: 'bracket',
              replaceMathBracket,
            }}
            disableTyping={disableTyping}
          />
        </ConfigProvider>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.id === nextProps.id;
  },
);

const PureMarkdownRenderer = memo(
  ({
    id: requestId = '',
    className = '',
    children,
    theme = 'light',
    disableTyping = false,
  }: {
    id: string;
    theme?: 'light' | 'dark';
    className?: string;
    children: string;
    disableTyping?: boolean;
  }) => {
    const plugins = useMemo(() => [katexPlugin, genCustomPlugin()], []);
    return (
      <div
        key={`${requestId}`}
        id={`${requestId}`}
        data-key={`${requestId}`}
        className={cx(styles['markdown-container'], className)}
      >
        <ConfigProvider>
          <DsMarkdown
            interval={30}
            timerType="requestAnimationFrame"
            disableTyping={disableTyping}
            plugins={plugins}
            codeBlock={{ headerActions: false }}
            theme={theme}
            math={{
              splitSymbol: 'bracket',
              replaceMathBracket,
            }}
          >
            {children}
          </DsMarkdown>
        </ConfigProvider>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.theme === nextProps.theme &&
      prevProps.children === nextProps.children &&
      prevProps.disableTyping === nextProps.disableTyping
    );
  },
);

export { MarkdownRenderer, PureMarkdownRenderer };
export default MarkdownRenderer;
