import classNames from 'classnames';
import { isEqual } from 'lodash';
import markdownIt from 'markdown-it';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// 使用 any 类型来避免类型冲突
type Token = any;

import { globalFunctionManager } from './globalFunctions';
import { presetConfigs } from './presets';
import { createDefaultRenderRules } from './renderRules';
import type { MarkdownRendererConfig, MarkdownRendererProps } from './types';

import GenCustomPlugin, { getBlockName } from '@/plugins/markdown-it-custom';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { findClassElement } from '@/utils/common';
import MarkdownCustomProcess from '../MarkdownCustomProcess';
import MermaidToolbar from '../MermaidToolbar';

import styles from './index.less';

const cx = classNames.bind(styles);
const registerPluginList = {
  plugin: AgentComponentTypeEnum.Plugin,
  mcp: AgentComponentTypeEnum.MCP,
};

const componentMap: Record<string, React.FC<any>> = {
  [getBlockName(registerPluginList.plugin)]: MarkdownCustomProcess,
  [getBlockName(registerPluginList.mcp)]: MarkdownCustomProcess,
  // ...其他组件
};
const handleCustomTokenRender = (
  token: Token,
  index: number,
): React.ReactNode => {
  if (token.meta?.component) {
    const { props, component } = token.meta;
    if (component in componentMap) {
      const Component = componentMap[component as keyof typeof componentMap];
      return (
        <Component
          {...props}
          key={`process-${component}-${props.executeId || index}`}
        />
      );
    } else {
      return (
        <div
          className="custom-error"
          key={`process-${component}-${index}-error`}
        >
          Component &quot;{component}&quot; not found
        </div>
      );
    }
  }
  return null;
};
const rewriteTokens = (tokens: Token[], requestId: string) => {
  const newTokens = tokens.map((token, index) => {
    return {
      ...token,
      meta: {
        ...token.meta,
        requestId,
        id: `${token?.type}${token?.info ? '-' + token?.info : ''}-${index}`,
        isFirst: index === 0,
        isLast: index === tokens.length - 1,
      },
    };
  });
  newTokens.forEach((token, index) => {
    token.meta.prevId = newTokens[index - 1]?.meta?.id || '';
    token.meta.nextId = newTokens[index + 1]?.meta?.id || '';
  });
  return newTokens;
};

/**
 * Markdown 渲染器组件
 * 支持插件配置、自定义渲染规则、全局函数管理等
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(
  ({
    id: requestId,
    content,
    config = presetConfigs.chat(),
    className,
    onCopy,
  }) => {
    const mdRef = useRef<markdownIt | null>(null);
    const isInitialized = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 创建 markdown-it 实例
    const md = useMemo(() => {
      const {
        markdownItOptions = {
          html: true,
          xhtmlOut: true,
          breaks: true,
          linkify: true,
          typographer: true,
          quotes: '""\'\'',
        },
        plugins = [],
        customRules = {},
        cssClasses = {},
      } = config;

      // 创建 markdown-it 实例
      const mdInstance = markdownIt(markdownItOptions);

      // 应用默认渲染规则
      const defaultRules = createDefaultRenderRules(cssClasses);
      Object.entries(defaultRules).forEach(([ruleName, ruleFunction]) => {
        mdInstance.renderer.rules[ruleName] = ruleFunction;
      });

      // 应用自定义渲染规则（会覆盖默认规则）
      Object.entries(customRules).forEach(([ruleName, ruleFunction]) => {
        mdInstance.renderer.rules[ruleName] = ruleFunction;
      });
      Object.entries({ ...mdInstance.renderer.rules }).forEach(
        ([ruleName, ruleFunction]) => {
          console.log('renderTokens:ruleName', ruleName);
          // console.log('renderTokens:ruleFunction', ruleFunction);
          mdInstance.renderer.rules[ruleName] = (
            tokens: Token[],
            idx: number,
            options: any,
            env: any,
            self: any,
          ) => {
            // console.log('renderTokens:args', tokens, idx, options, env, self);
            return ruleFunction?.(tokens, idx, options, env, self) || '';
          };
        },
      );
      Object.entries(registerPluginList).forEach(([, value]) => {
        new GenCustomPlugin(mdInstance, getBlockName(value));
      });

      // 应用插件
      plugins.forEach(({ plugin, options = {}, async = false }) => {
        if (async) {
          mdInstance.use(plugin(mdInstance, options));
        } else {
          mdInstance.use(plugin, options);
        }
      });

      mdRef.current = mdInstance;
      return mdInstance;
    }, [config]);

    // 初始化全局函数和其他功能
    useEffect(() => {
      if (isInitialized.current) return;

      const { globalFunctions = {} } = config;

      // 注册全局函数
      globalFunctionManager.registerAllFunctions(globalFunctions);

      isInitialized.current = true;

      // 清理函数
      return () => {
        globalFunctionManager.registerAllFunctions({});
      };
    }, [config]);

    const handleClick = useCallback(
      (e: MouseEvent) => {
        console.log('handleClick:e', e);
        const target = e.target as HTMLElement;
        const clickableImageSrc =
          findClassElement(target, 'markdown-it__image_clickable')?.dataset
            ?.src || '';
        if (clickableImageSrc) {
          window.showImageInModal(clickableImageSrc);
          return;
        }
        const copyElement = findClassElement(target, 'markdown-copy-btn');
        if (copyElement) {
          window.handleClipboard(copyElement, onCopy);
        }
      },
      [onCopy],
    );

    // 处理复制回调
    useEffect(() => {
      const container = containerRef.current;
      if (container) {
        container.addEventListener('click', handleClick);
      }
      return () => {
        if (container) {
          container.removeEventListener('click', handleClick);
        }
      };
    }, [handleClick]);

    // 渲染 tokens 为 React 元素
    const renderTokens = useCallback(
      (tokens: Token[]): React.ReactNode[] => {
        const result: React.ReactNode[] = [];
        let i = 0;
        md.renderer.render(tokens, md.options, {}); //先调用一次，让token的meta.component生效
        // const allTokens = md.renderer.renderToken(tokens, 0, md.options); //先调用一次，让token的meta.component生效
        // console.log('renderTokens:tokens', tokens);
        // console.log('renderTokens:allNodes', allNodes);
        // console.log('renderTokens:allTokens', allTokens);
        const newTokens = [];
        while (i < tokens.length) {
          const token = tokens[i];
          // console.log('renderTokens:token', token);
          // 处理有 meta.component 的自定义容器
          const component = handleCustomTokenRender(token, i);
          if (component) {
            result.push(component);
            i++;
            continue;
          }
          newTokens.push(token);
          i++;
        }

        // 处理其他标准 token
        const singleResult = md.renderer.render(newTokens, md.options, {});
        if (singleResult) {
          result.push(
            <div
              dangerouslySetInnerHTML={{ __html: singleResult }}
              key={`process-${newTokens.length}-${i}`}
            />,
          );
        }
        return result;
      },
      [md],
    );

    // 解析 markdown 内容
    const tokens = content ? md.parse(content, {}) : [];
    const newTokens = rewriteTokens(tokens, requestId);
    const renderResult = renderTokens(newTokens);

    // 初始化Mermaid工具栏
    const initializeMermaidToolbars = useCallback(() => {
      const mermaidWrappers =
        containerRef.current?.querySelectorAll('.mermaid-wrapper');

      if (!mermaidWrappers?.length) return;

      mermaidWrappers.forEach((wrapper) => {
        const chartId = wrapper.getAttribute('id');
        const encodedSourceCode = wrapper.getAttribute('data-source-code');
        const toolbarContainer = wrapper.querySelector(
          '.mermaid-toolbar-container',
        );

        if (!chartId || !encodedSourceCode || !toolbarContainer) return;

        // 检查是否已经初始化过
        if (toolbarContainer.getAttribute('data-initialized') === 'true')
          return;

        try {
          const sourceCode = decodeURIComponent(encodedSourceCode);

          // 使用createRoot渲染React组件
          const root = createRoot(toolbarContainer);
          root.render(
            <MermaidToolbar
              chartId={chartId}
              sourceCode={sourceCode}
              visible={true}
              useOptimizedExport={true}
            />,
          );

          // 标记为已初始化
          toolbarContainer.setAttribute('data-initialized', 'true');
        } catch (error) {
          console.error('初始化Mermaid工具栏失败:', error);
        }
      });
    }, []);

    // 在内容变化后初始化工具栏
    useEffect(() => {
      // 延迟初始化，确保DOM已完全渲染
      const timer = setTimeout(() => {
        initializeMermaidToolbars();
      }, 100);

      return () => clearTimeout(timer);
    }, [content, initializeMermaidToolbars]);

    return (
      <div ref={containerRef} className={cx(styles.container, className)}>
        {renderResult}
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

    return <MarkdownRenderer {...props} config={mergedConfig} />;
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
export { allPlugins, presetConfigs } from './presets';
export { createDefaultRenderRules } from './renderRules';
export type {
  MarkdownRendererConfig,
  MarkdownRendererProps,
  PluginConfig,
} from './types';
