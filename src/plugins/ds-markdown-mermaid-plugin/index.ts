import { MermaidBlock, rehypeMermaid } from 'ds-markdown-mermaid-plugin';
import { createBuildInPlugin, mermaidId } from 'ds-markdown/plugins';

// 移除 useMemo，直接定义配置对象
const mermaidConfig = {
  theme: 'default', // 主题：default, neutral, dark, forest
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
  },
  suppressErrorRendering: false,
};

const mermaidPlugin = createBuildInPlugin({
  id: mermaidId,
  rehypePlugin: [rehypeMermaid, { mermaidConfig }],
  components: {
    mermaidblock: MermaidBlock,
  },
});

export default mermaidPlugin;
export { mermaidConfig };
