import { ProcessingInfo } from '@/types/interfaces/conversationInfo';
import MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';

function parseAttributesString(str: string): Record<string, any> {
  // 1. 去除字符串两边的引号（如果存在）
  const trimmedStr = str.replace(/^'|'$/g, '');

  // 2. 按空格分割成键值对数组
  const pairs = trimmedStr.split(/\s+/);

  // 3. 遍历键值对，构建对象
  const result: Record<string, any> = {};
  pairs.forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) {
      // 去除值的引号，并解码 URL 编码（如 name 的值）
      let processedValue = value.replace(/^"|"$/g, ''); // 去除双引号
      processedValue = processedValue.replace(/^'|'$/g, ''); // 去除单引号

      // 如果是 name 字段，尝试解码 URL 编码
      if (key === 'name') {
        try {
          processedValue = decodeURIComponent(processedValue);
        } catch (e) {
          // 如果解码失败，保持原样
          console.warn('Failed to decode URL component:', processedValue);
        }
      }

      result[key] = processedValue;
    }
  });

  return result;
}

class GenCustomPlugin {
  name: string;

  constructor(md: MarkdownIt, name: string) {
    this.name = name;
    this.use(md);
  }

  /**
   * 应用插件 - 支持动态组件名
   */
  private use(md: MarkdownIt) {
    const name = this.name;

    md.use(container, name, {
      validate: function (params: string) {
        // 只验证开始标签行，不包含容器内容
        return params.trim().startsWith(name);
      },
      render: function (tokens: any[], idx: number) {
        const token = tokens[idx];

        if (token.nesting === 1) {
          const params = token.info.trim().slice(name.length).trim();
          // 解析参数 - 重新实现更健壮的属性解析
          const args: Record<string, any> = {};
          const parsedArgs = parseAttributesString(params);
          Object.assign(args, parsedArgs);

          // 移除 component 参数，避免传递给组件
          delete args.component;

          // 设置 meta 信息供 React 渲染器使用
          token.meta = {
            component: name,
            props: args,
          };
        }
        // 返回空字符串，因为我们会在 React 中处理渲染
        return '\n';
      },
    });
  }
}
/**
 * 生成 markdown 块
 */
const getBlockWrapper = (
  blockName: string,
  data: Record<string, any>,
): string => {
  const attrs = Object.entries(data)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  return `\n\n::: ${blockName} ${attrs} \n\n:::\n`;
};

const getBlockName = (): string => {
  return `markdown-custom-process`;
};

const getCustomBlock = (
  beforeText: string,
  { type, name, executeId, status }: ProcessingInfo,
): string => {
  // 如果 type 或 id 不存在，则返回空字符串
  if (!type || !executeId) {
    return '';
  }
  const hasBlock = beforeText.includes(`executeId="${executeId}"`);
  if (hasBlock) {
    // 如果存在，则不追加
    return beforeText;
  } else {
    const blockName = getBlockName();

    const blockContent = getBlockWrapper(blockName, {
      type,
      status,
      executeId,
      name: encodeURIComponent(name || ''),
    });
    return `${beforeText}${blockContent}`;
  }
};

export { getBlockName, getBlockWrapper, getCustomBlock };
export default GenCustomPlugin;
