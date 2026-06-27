/* eslint-disable react-hooks/rules-of-hooks */
import { dict } from '@/services/i18nRuntime';
import classNames from 'classnames';
import { CodeBlockActions, useThemeState } from 'ds-markdown';
import { createBuildInPlugin } from 'ds-markdown/plugins';
import rehypeRaw from 'rehype-raw';
import MarkdownCustomProcess from '../MarkdownCustomProcess';
import MarkdownCustomProcessGroup from '../MarkdownCustomProcessGroup';
import styles from './index.less';
import OptimizedImage from './OptimizedImage';
import TaskResult from './TaskResult';
import { extractTableToMarkdown } from './utils';
const cx = classNames.bind(styles);

// 用插件机制传递自定义components
export default (conversationId: string | number = '') => {
  return createBuildInPlugin({
    rehypePlugin: [rehypeRaw],
    components: {
      style: () => null, // 禁用 style 标签渲染，防止样式污染
      script: () => null, // 禁用 script 标签，增强安全性
      html: ({ children }: any) => <>{children}</>, // 处理可能存在的 html 标签包裹
      // 确保使用一致的组件名称格式
      'markdown-custom-process': (props: any) => {
        const node = props.node;
        const properties = node?.properties || {};

        // 终极安全提取：同时兼容 props 根级和 node.properties 下的驼峰及全小写命名
        const actualExecuteId =
          props.executeid ||
          props.executeId ||
          properties.executeid ||
          properties.executeId;
        const actualType = props.type || properties.type;
        const actualStatus = props.status || properties.status;
        const actualName = props.name || properties.name;

        const {
          end: { offset: endOffset },
          start: { offset: startOffset },
        } = node?.position || {};
        const processKey = `${startOffset}-${endOffset}-process`;

        return (
          <MarkdownCustomProcess
            conversationId={conversationId}
            key={processKey}
            dataKey={processKey}
            type={actualType}
            status={actualStatus}
            executeId={actualExecuteId}
            name={(() => {
              try {
                return decodeURIComponent(actualName || '');
              } catch {
                // Handle malformed URI sequences gracefully
                return actualName || '';
              }
            })()}
          />
        );
      },
      'markdown-custom-process-group': ({ children }: any) => {
        return (
          <MarkdownCustomProcessGroup>{children}</MarkdownCustomProcessGroup>
        );
      },
      table: ({ children, node }: any) => {
        const { theme, codeBlock: { headerActions = false } = {} } =
          useThemeState();
        const {
          end: { offset: endOffset },
          start: { offset: startOffset },
        } = node?.position || {};
        const listKey = `${startOffset}-${endOffset}-list`;

        // 通过表格反向提取内容并转为 markdown 文档文本格式
        const tableMDContent = extractTableToMarkdown(children);

        return (
          <div key={listKey} data-key={listKey} style={{ display: 'block' }}>
            <div className={styles['table-wrapper']}>
              <div className={`md-code-block md-code-block-${theme}`}>
                {headerActions && (
                  <div className="md-code-block-banner-wrap">
                    <div className="md-code-block-banner md-code-block-banner-lite">
                      <>
                        <div className="md-code-block-language">
                          {dict(
                            'PC.Components.MarkdownRenderer.tableCodeBlock',
                          )}
                        </div>
                        <CodeBlockActions
                          language="markdown"
                          codeContent={tableMDContent}
                        />
                      </>
                    </div>
                  </div>
                )}
                <div className="md-code-block-content scrollbar">
                  <table className={cx(styles['markdown-table'])}>
                    {children}
                  </table>
                </div>
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
      // 支持自定义 task-result 标签
      'task-result': ({ children, node }: any) => {
        return (
          <TaskResult node={node} conversationId={conversationId}>
            {children}
          </TaskResult>
        );
      },
      // 支持自定义 agent-info 标签
      'agent-info': ({ children, ...props }: any) => {
        const node = props.node;
        const properties = node?.properties || {};
        const name = props.name || properties.name || '';
        const icon = props.icon || properties.icon || '';
        const hasIcon = icon && icon !== 'null';
        return (
          <>
            <div className={cx(styles['agent-info-container'])}>
              {hasIcon && (
                <img
                  className={cx(styles['agent-info-icon'])}
                  src={icon}
                  alt=""
                />
              )}
              {name && (
                <span className={cx(styles['agent-info-name'])}>{name}</span>
              )}
            </div>
            {children}
          </>
        );
      },
      p: ({ children }: any) => {
        return <div className={styles['markdown-paragraph']}>{children}</div>;
      },
    },
    id: Symbol('custom-plugin'),
    type: 'custom',
  });
};
