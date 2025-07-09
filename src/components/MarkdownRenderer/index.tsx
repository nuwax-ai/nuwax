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
import { globalFunctionManager } from './globalFunctions';
import { presetConfigs } from './presets';
import { createDefaultRenderRules } from './renderRules';
import type { MarkdownRendererConfig, MarkdownRendererProps } from './types';

import GenCustomPlugin, { getBlockName } from '@/plugins/markdown-it-custom';
import { findClassElement } from '@/utils/common';
import MarkdownCustomProcess from '../MarkdownCustomProcess';

import MarkdownCodeToolbar from '../MarkdownCodeToolbar';
import styles from './index.less';
import { applyListParagraphRenderer } from './listParagraphRenderer';
import rewriteToken, {
  TokenRenderGroup,
  TokenRenderType,
} from './rewriteToken';

// 使用 any 类型来避免类型冲突
type Token = any;

const cx = classNames.bind(styles);

// 防抖函数 - 已移除未使用的函数

const handleCustomTokenRender = (
  token: Token,
  index: number,
): React.ReactNode => {
  if (token.meta?.component) {
    const { props, component } = token.meta;
    if (component) {
      const Component = MarkdownCustomProcess;
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

/**
 * 将tokens渲染为React节点
 * @param tokens markdown tokens
 * @param md markdown-it实例
 * @returns React节点数组
 */
export const renderTokens = (
  tokens: Token[],
  md: markdownIt,
): React.ReactNode[] => {
  const result: React.ReactNode[] = [];

  // 先调用一次render，让token的meta.component生效
  md.renderer.render(tokens, md.options, {});

  const tokenGroups: TokenRenderGroup[] = [];
  let currentGroup: TokenRenderGroup | null = null;

  // 遍历所有tokens，按类型分组
  tokens.forEach((token, index) => {
    const isCustomToken = token.meta?.component;
    const tokenType =
      isCustomToken === TokenRenderType.Image
        ? TokenRenderType.Image
        : isCustomToken
        ? TokenRenderType.Custom
        : TokenRenderType.Standard;

    // 如果当前组为空或类型不同，创建新组
    if (!currentGroup || currentGroup.type !== tokenType) {
      currentGroup = {
        type: tokenType,
        tokens: [token],
        startIndex: index,
      };
      tokenGroups.push(currentGroup);
    } else {
      // 类型相同，添加到当前组
      currentGroup.tokens.push(token);
    }
  });

  // 按组渲染，保持原始顺序
  tokenGroups.forEach((group, groupIndex) => {
    if (group.type === TokenRenderType.Custom) {
      // 自定义组件：逐个渲染
      group.tokens.forEach((token, tokenIndex) => {
        const component = handleCustomTokenRender(
          token,
          group.startIndex + tokenIndex,
        );
        if (component) {
          result.push(component);
        }
      });
    } else if (group.type === TokenRenderType.Image) {
      // 图片：合并渲染
      const mergedHtml = md.renderer.render(group.tokens, md.options, {});
      if (mergedHtml) {
        result.push(
          <div
            dangerouslySetInnerHTML={{ __html: mergedHtml }}
            key={`image-group-${group.startIndex}-${groupIndex}`}
          />,
        );
      }
    } else {
      // 标准token：合并渲染
      if (group.tokens.length > 0) {
        const mergedHtml = md.renderer.render(group.tokens, md.options, {});
        if (mergedHtml) {
          result.push(
            <div
              dangerouslySetInnerHTML={{ __html: mergedHtml }}
              key={`standard-group-${group.startIndex}-${groupIndex}`}
            />,
          );
        }
      }
    }
  });

  return result;
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

      new GenCustomPlugin(mdInstance, getBlockName());

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
        const target = e.target as HTMLElement;
        const theImage = findClassElement(target, 'markdownItImageClickable');
        const clickableImageSrc =
          theImage?.dataset?.src || (theImage as HTMLImageElement)?.src || '';
        if (clickableImageSrc) {
          window.showImageInModal(clickableImageSrc);
          return;
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

    useEffect(() => {
      // 解析 markdown 内容
      const tokens = content ? md.parse(content, {}) : [];

      const newTokens = rewriteToken(tokens, requestId);
      setMdTokens(newTokens);
    }, [content, md, requestId]);

    useEffect(() => {
      const result = renderTokens(mdTokens, md);
      setRenderResult(result);
    }, [md, mdTokens]);

    useEffect(() => {
      setToolbarTokens(mdTokens.filter((token) => token.meta?.toolbar));
    }, [mdTokens]);

    const CodeToolbar = useMemo(() => {
      if (!toolbarTokens.length) return null;
      return toolbarTokens.map((token) => {
        const meta = token.meta || {};
        if (!meta?.requestId || !meta?.id) return null;
        const uuid = `${meta.requestId}-${meta.id}`;
        const content = token.content;
        const language = token.info?.trim().split(/\s+/g)[0] || 'text';

        // 这里检查 已经上是不是有这个containerId 做为 id有就是获取位置信息，没有就创建一个
        return (
          <div key={uuid}>
            <MarkdownCodeToolbar
              title={language}
              language={language}
              containerId={meta.requestId}
              content={content}
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
        {CodeToolbar}
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
