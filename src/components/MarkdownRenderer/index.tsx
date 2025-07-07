import classNames from 'classnames';
import { isEqual } from 'lodash';
import markdownIt from 'markdown-it';
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Root } from 'react-dom/client';

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

import MarkdownCodeToolbar from '../MarkdownCodeToolbar';
import styles from './index.less';
import { applyListParagraphRenderer } from './listParagraphRenderer';

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

// 防抖函数 - 已移除未使用的函数

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
        toolbar: ['fence', 'thead_open'].includes(token.type),
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
    const [mdTokens, setMdTokens] = useState<Token[]>([]);
    const [toolbarTokens, setToolbarTokens] = useState<Token[]>([]);
    const [renderResult, setRenderResult] = useState<React.ReactNode[]>([]);

    // 缓存已初始化的工具栏容器ID和对应的React根节点
    const initializedToolbars = useRef<Map<string, Root>>(new Map());

    // 防抖定时器引用
    const debounceTimerRef = useRef<NodeJS.Timeout>();

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

      Object.entries(registerPluginList).forEach(([, value]) => {
        new GenCustomPlugin(mdInstance, getBlockName(value));
      });

      // 应用列表段落渲染规则
      applyListParagraphRenderer(mdInstance);

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

        // 清理所有React根节点
        initializedToolbars.current.forEach((root) => {
          try {
            root.unmount();
          } catch (error) {
            console.error('清理React根节点失败:', error);
          }
        });
        initializedToolbars.current.clear();

        // 清理防抖定时器
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, [config]);

    const handleClick = useCallback(
      (e: MouseEvent) => {
        console.log('handleClick:e', e);
        const target = e.target as HTMLElement;
        const theImage = findClassElement(
          target,
          'markdown-it__image_clickable',
        );
        const clickableImageSrc =
          theImage?.dataset?.src || (theImage as HTMLImageElement)?.src || '';
        if (clickableImageSrc) {
          window.showImageInModal(clickableImageSrc);
          return;
        }
        const copyElement = findClassElement(target, 'markdown-it__copy-btn');
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
        const newTokens = [];
        //TODO 后续 要考虑渲染顺序以及嵌套的问题
        while (i < tokens.length) {
          const token = tokens[i];
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

    useEffect(() => {
      // 解析 markdown 内容
      const tokens = content ? md.parse(content, {}) : [];
      const newTokens = rewriteTokens(tokens, requestId);
      console.log('newTokens', newTokens);
      setMdTokens(newTokens);
    }, [content, md, requestId]);

    useEffect(() => {
      const renderResult = renderTokens(mdTokens);
      setRenderResult(renderResult);
    }, [md, mdTokens]);

    useEffect(() => {
      setToolbarTokens(mdTokens.filter((token) => token.meta?.toolbar));
    }, [mdTokens]);

    const renderCodeToolbar = useCallback(() => {
      if (!toolbarTokens.length) return null;
      return toolbarTokens.map((token) => {
        const uuid = `${token.meta.requestId}-${token.meta.id}`;
        const content = token.content;
        const language = token.info?.trim().split(/\s+/g)[0] || 'text';

        // 这里检查 已经上是不是有这个containerId 做为 id有就是获取位置信息，没有就创建一个
        return (
          <div key={uuid}>
            <MarkdownCodeToolbar
              title={language}
              language={language}
              containerId={token.meta.requestId}
              content={content}
              className={
                token.type === 'thead_open' ? 'table-toolbar' : 'code-toolbar'
              }
              id={uuid}
              collapsible={true}
              defaultCollapsed={false}
              onCollapseChange={() => {}}
              onCopy={onCopy}
            />
          </div>
        );
      });
    }, [toolbarTokens, requestId, onCopy]);
    return (
      <div
        ref={containerRef}
        id={`${requestId}`}
        className={cx(styles['markdown-container'], className)}
      >
        {renderResult}
        {renderCodeToolbar()}
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
