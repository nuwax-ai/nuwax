import { createBuildInPlugin } from 'ds-markdown/plugins';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import classNames from 'classnames';
import styles from '@/components/MarkdownRenderer/index.less';
import AppDevProcessGroup from './components/AppDevProcessGroup';
import PlanProcess from './components/PlanProcess';
import ToolCallProcess from './components/ToolCallProcess';

const cx = classNames.bind(styles);

/**
 * AppDev 专用自定义插件
 * 用于在 Markdown 中渲染 Plan 和 Tool Call 组件
 */
export default () => {
  return createBuildInPlugin({
    rehypePlugin: [rehypeRaw, rehypeStringify],
    components: {
      'appdev-process-group': ({ children, ...props }: any) => {
        const count = parseInt(props.count || '0', 10);
        return (
          <AppDevProcessGroup count={count}>{children}</AppDevProcessGroup>
        );
      },

      'appdev-plan': ({ node, ...props }: any) => {
        const {
          end: { offset: endOffset },
          start: { offset: startOffset },
        } = node?.position || {};
        const processKey = `${startOffset}-${endOffset}-plan`;

        // 尝试从 props 中获取 data 属性
        const data = props.data || props['data'];

        try {
          const decodedData = JSON.parse(decodeURIComponent(data || '{}'));
          return (
            <PlanProcess
              key={processKey}
              dataKey={processKey}
              planId={decodedData.planId}
              entries={decodedData.entries || []}
            />
          );
        } catch (error) {
          // console.error('❌ [genAppDevPlugin] Failed to parse plan data:', error, {
          //   data,
          //   props,
          // });
          return (
            <div style={{ color: 'red' }}>
              Plan parsing failed: {(error as Error).message}
            </div>
          );
        }
      },

      'appdev-toolcall': ({ node, ...props }: any) => {
        const {
          end: { offset: endOffset },
          start: { offset: startOffset },
        } = node?.position || {};
        const processKey = `${startOffset}-${endOffset}-toolcall`;

        // 尝试从 props 中获取属性
        // const toolcallid = props.toolcallid || props['toolcallid'];
        const type = props.type || props['type'] || 'tool_call'; // 默认为 tool_call
        const data = props.data || props['data'];

        try {
          const toolCallData = JSON.parse(decodeURIComponent(data || '{}'));
          return (
            <ToolCallProcess
              key={processKey}
              dataKey={processKey}
              type={type}
              {...toolCallData}
            />
          );
        } catch (error) {
          // console.error('❌ [genAppDevPlugin] Failed to parse tool call data:', error, {
          //   data,
          //   props,
          // });
          return (
            <div style={{ color: 'red' }}>
              ToolCall parsing failed: {(error as Error).message}
            </div>
          );
        }
      },
      // 支持自定义 agent-info 标签
      'agent-info': (props: any) => {
        const node = props.node;
        const properties = node?.properties || {};
        const name = props.name || properties.name || '';
        const icon = props.icon || properties.icon || '';
        return (
          <div className={cx(styles['agent-info-container'])}>
            {icon && <img className={cx(styles['agent-info-icon'])} src={icon} alt="" />}
            {name && <span className={cx(styles['agent-info-name'])}>{name}</span>}
          </div>
        );
      },
    },
    id: Symbol('appdev-plugin'),
    type: 'custom',
  });
};
