import { createBuildInPlugin } from 'ds-markdown/plugins';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

const ID_PREFIX__ = '__ds-markdown__';
const katexId = `${ID_PREFIX__}katex`;

const katexPlugin = createBuildInPlugin({
  remarkPlugin: [remarkMath],
  rehypePlugin: [
    rehypeKatex,
    {
      delimiters: [
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$$', right: '$$', display: false },
      ],
    },
  ],
  id: katexId,
  type: 'custom',
});

export default katexPlugin;
