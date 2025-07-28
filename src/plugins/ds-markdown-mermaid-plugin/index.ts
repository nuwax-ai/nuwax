import { MermaidBlock, rehypeMermaid } from 'ds-markdown-mermaid-plugin';
import { createBuildInPlugin } from 'ds-markdown/plugins';

const ID_PREFIX__ = '__ds-markdown__';
const mermaidId = `${ID_PREFIX__}mermaid`;

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
