import { BulbOutlined, DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
// import 'highlight.js/styles/github.css';
import { dict } from '@/services/i18nRuntime';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import styles from './index.less';

// 导入类型定义
import type { MarkdownRendererProps } from '@/types/interfaces/markdownRender';

import { MessageStatusEnum } from '@/types/enums/common';
import DsMarkdown, { ConfigProvider, MarkdownCMD } from 'ds-markdown'; // 新增：引入ds-markdown
import 'ds-markdown/katex.css';
import { katexPlugin } from 'ds-markdown/plugins'; // 新增：引入插件创建方法
import './ds-markdown.css';
import genCustomPlugin from './genCustomPlugin';
import { replaceMathBracket } from './utils';

// 延迟加载 mermaid 插件（mermaid 库 ~1.4MB），仅在实际需要时加载
let _mermaidPlugin: any = null;
let _mermaidConfig: any = null;
let _mermaidLoadPromise: Promise<void> | null = null;

const loadMermaidPlugin = async () => {
  if (_mermaidPlugin) return;
  if (_mermaidLoadPromise) {
    await _mermaidLoadPromise;
    return;
  }
  _mermaidLoadPromise = import('@/plugins/ds-markdown-mermaid-plugin').then(
    (mod) => {
      _mermaidPlugin = mod.default;
      _mermaidConfig = mod.mermaidConfig;
    },
  );
  await _mermaidLoadPromise;
};

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
    conversationId = '',
    className,
    markdownRef,
    headerActions = true,
    disableTyping = true,
    theme = 'light',
    answer = '',
    thinking = '',
    status,
  }: MarkdownRendererProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasThinking = !!thinking && thinking.trim() !== '';
    const isThinkingFinished =
      status === MessageStatusEnum.Complete ||
      (!!answer && answer.trim() !== '');

    const containerRef = useRef<HTMLDivElement>(null);
    const [mermaidLoaded, setMermaidLoaded] = useState(!!_mermaidPlugin);

    // 首次渲染时异步加载 mermaid 插件
    useEffect(() => {
      let cancelled = false;
      if (!_mermaidPlugin) {
        loadMermaidPlugin().then(() => {
          if (!cancelled) setMermaidLoaded(true);
        });
      }
      return () => {
        cancelled = true;
      };
    }, []);

    const plugins = useMemo(() => {
      const basePlugins = [katexPlugin, genCustomPlugin(conversationId)];
      if (_mermaidPlugin) {
        basePlugins.unshift(_mermaidPlugin);
      }
      return basePlugins;
    }, [conversationId, mermaidLoaded]);

    // 使用延迟加载的 mermaidConfig
    const mermaidProvider = useMemo(
      () => _mermaidConfig || { theme: 'default' },
      [mermaidLoaded],
    );

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
          <div
            className={cx(styles['markdown-cmd-container'], {
              [styles['thinking-collapsed']]: !isExpanded,
            })}
          >
            {hasThinking && (
              <div
                className={styles['thinking-header']}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <BulbOutlined className={styles['thinking-icon']} />
                <span className={styles['thinking-title']}>
                  {!isThinkingFinished
                    ? dict('PC.Components.MarkdownRenderer.thinking')
                    : dict('PC.Components.MarkdownRenderer.thought')}
                </span>
                <DownOutlined
                  className={cx(styles['expand-icon'], {
                    [styles['is-expanded']]: isExpanded,
                  })}
                />
              </div>
            )}
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
          </div>
        </ConfigProvider>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.thinking === nextProps.thinking &&
      prevProps.answer === nextProps.answer &&
      prevProps.status === nextProps.status
    );
  },
);

const PureMarkdownRenderer = memo(
  ({
    id: requestId = '',
    className = '',
    children,
    theme = 'light',
    disableTyping = false,
    interval = 30,
    timerType = 'requestAnimationFrame',
    conversationId = '',
  }: {
    id: string;
    theme?: 'light' | 'dark';
    className?: string;
    children: string;
    disableTyping?: boolean;
    interval?: number;
    timerType?: 'requestAnimationFrame' | 'setTimeout';
    conversationId?: string | number;
  }) => {
    const plugins = useMemo(
      () => [katexPlugin, genCustomPlugin(conversationId)],
      [],
    );
    return (
      <div
        key={`${requestId}`}
        id={`${requestId}`}
        data-key={`${requestId}`}
        className={cx(styles['markdown-container'], className)}
      >
        <ConfigProvider>
          <DsMarkdown
            interval={interval}
            timerType={timerType}
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
