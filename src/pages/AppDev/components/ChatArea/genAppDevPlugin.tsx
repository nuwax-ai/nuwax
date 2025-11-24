import { createBuildInPlugin } from 'ds-markdown/plugins';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import PlanProcess from './components/PlanProcess';
import ToolCallProcess from './components/ToolCallProcess';

/**
 * AppDev 专用自定义插件
 * 用于在 Markdown 中渲染 Plan 和 Tool Call 组件
 */
export default () => {
  return createBuildInPlugin({
    rehypePlugin: [rehypeRaw, rehypeStringify],
    components: {
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
          // console.error('❌ [genAppDevPlugin] Plan 数据解析失败:', error, {
          //   data,
          //   props,
          // });
          return (
            <div style={{ color: 'red' }}>
              Plan 解析失败: {(error as Error).message}
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
          // console.error('❌ [genAppDevPlugin] ToolCall 数据解析失败:', error, {
          //   data,
          //   props,
          // });
          return (
            <div style={{ color: 'red' }}>
              ToolCall 解析失败: {(error as Error).message}
            </div>
          );
        }
      },
    },
    id: Symbol('appdev-plugin'),
    type: 'custom',
  });
};
