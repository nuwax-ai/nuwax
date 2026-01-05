/* eslint-disable react-hooks/rules-of-hooks */
import classNames from 'classnames';
import { CodeBlockActions, useThemeState } from 'ds-markdown';
import { createBuildInPlugin } from 'ds-markdown/plugins';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import MarkdownCustomProcess from '../MarkdownCustomProcess';
import styles from './index.less';
import OptimizedImage from './OptimizedImage';
import TaskResult from './TaskResult';
import { extractTableToMarkdown } from './utils';
const cx = classNames.bind(styles);

// 用插件机制传递自定义components
export default (conversationId: string | number = '') => {
  return createBuildInPlugin({
    rehypePlugin: [rehypeRaw, rehypeStringify],
    components: {
      // 确保使用一致的组件名称格式
      'markdown-custom-process': ({
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
            conversationId={conversationId}
            key={processKey}
            dataKey={processKey}
            type={type}
            status={status}
            executeId={executeid}
            name={(() => {
              try {
                return decodeURIComponent(name || '');
              } catch {
                // Handle malformed URI sequences gracefully
                return name || '';
              }
            })()}
          />
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
                        <div className="md-code-block-language">表格</div>
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
    },
    id: Symbol('custom-plugin'),
    type: 'custom',
  });
};
