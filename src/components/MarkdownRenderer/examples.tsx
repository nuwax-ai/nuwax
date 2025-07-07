import React from 'react';
import MarkdownRenderer, {
  BasicMarkdownRenderer,
  ChatMarkdownRenderer,
  FullMarkdownRenderer,
  StandardMarkdownRenderer,
  allPlugins,
  createMarkdownRenderer,
  presetConfigs,
} from './index';

/**
 * 基础使用示例
 */
export const BasicExample: React.FC = () => {
  const content = `
# 基础 Markdown 示例

这是一个段落。

## 代码块示例

\`\`\`javascript
function hello() {
  console.log('Hello World!');
}
\`\`\`

## 列表示例

- 项目 1
- 项目 2
- 项目 3

## 表格示例

| 名称 | 年龄 | 城市 |
|------|------|------|
| 张三 | 25   | 北京 |
| 李四 | 30   | 上海 |

## 数学公式示例

行内公式：$E = mc^2$

块级公式：
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$
  `;

  return (
    <div style={{ padding: '20px' }}>
      <h2>基础使用示例</h2>
      <MarkdownRenderer id="basic-example" content={content} />
    </div>
  );
};

/**
 * 预设配置示例
 */
export const PresetExample: React.FC = () => {
  const content = `
# 预设配置示例

## 数学公式
$\\alpha + \\beta = \\gamma$

## 代码高亮
\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
\`\`\`

## Mermaid 图表
\`\`\`mermaid
graph TD
    A[开始] --> B{是否满足条件}
    B -->|是| C[执行操作]
    B -->|否| D[结束]
    C --> D
\`\`\`
  `;

  return (
    <div style={{ padding: '20px' }}>
      <h2>预设配置示例</h2>

      <h3>基础配置（无插件）</h3>
      <BasicMarkdownRenderer id="basic-preset" content={content} />

      <h3>标准配置（KaTeX + 表格）</h3>
      <StandardMarkdownRenderer id="standard-preset" content={content} />

      <h3>聊天配置（所有插件）</h3>
      <ChatMarkdownRenderer id="chat-preset" content={content} />

      <h3>完整配置（所有插件）</h3>
      <FullMarkdownRenderer id="full-preset" content={content} />
    </div>
  );
};

/**
 * 自定义配置示例
 */
export const CustomConfigExample: React.FC = () => {
  const content = `
# 自定义配置示例

## 数学公式
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

## 表格
| 功能 | 支持 |
|------|------|
| KaTeX | ✅ |
| 表格 | ✅ |
| Mermaid | ❌ |
  `;

  // 自定义配置：只包含 KaTeX 和表格，不包含 Mermaid
  const customConfig = {
    plugins: [allPlugins.katex, allPlugins.multimdTable],
    globalFunctions: {
      handleClipboard: true,
      showImageInModal: true,
      toggleCodeCollapse: false, // 禁用代码折叠
    },
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>自定义配置示例</h2>
      <p>这个示例只启用了 KaTeX 和表格插件，禁用了代码折叠功能</p>
      <MarkdownRenderer
        id="custom-config"
        content={content}
        config={customConfig}
      />
    </div>
  );
};

/**
 * 自定义渲染规则示例
 */
export const CustomRulesExample: React.FC = () => {
  const content = `
# 自定义渲染规则示例

![示例图片](https://via.placeholder.com/300x200)

\`\`\`javascript
// 这个代码块会有自定义样式
console.log('Hello Custom Rules!');
\`\`\`
  `;

  const customConfig = {
    ...presetConfigs.standard(),
    customRules: {
      // 自定义图片渲染 - 添加特殊样式
      image: (tokens: any[], idx: number) => {
        const token = tokens[idx];
        const src = token.attrGet('src');
        const alt = token.attrGet('alt') || '';
        return `
          <div style="text-align: center; margin: 20px 0;">
            <img src="${src}" alt="${alt}" style="border: 3px solid #007acc; border-radius: 8px; max-width: 100%;" onclick="window.showImageInModal(this.src)" />
            <p style="margin-top: 8px; color: #666; font-size: 14px;">${alt}</p>
          </div>
        `;
      },

      // 自定义代码块渲染 - 添加特殊标题
      fence: (tokens: any[], idx: number) => {
        const token = tokens[idx];
        const lang = token.info?.trim() || '';
        const content = token.content;

        return `
          <div style="border: 2px solid #007acc; border-radius: 8px; margin: 16px 0; overflow: hidden;">
            <div style="background: #007acc; color: white; padding: 8px 12px; font-weight: bold;">
              🚀 ${lang.toUpperCase()} 代码
            </div>
            <pre style="margin: 0; padding: 16px; background: #f8f9fa;"><code>${content
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')}</code></pre>
          </div>
        `;
      },
    },
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>自定义渲染规则示例</h2>
      <p>这个示例自定义了图片和代码块的渲染样式</p>
      <MarkdownRenderer
        id="custom-rules"
        content={content}
        config={customConfig}
      />
    </div>
  );
};

/**
 * 创建自定义渲染器示例
 */
export const CustomRendererExample: React.FC = () => {
  const content = `
# 自定义渲染器示例

这是一个基于标准配置的自定义渲染器。

## 特殊标题
所有标题都会有特殊样式。

### 三级标题
包括三级标题。
  `;

  // 创建自定义渲染器
  const MyCustomRenderer = createMarkdownRenderer({
    ...presetConfigs.standard(),
    customRules: {
      heading_open: (tokens: any[], idx: number) => {
        const token = tokens[idx];
        const level = token.tag;
        const levelNum = level.slice(1); // 提取数字 (h1 -> 1)
        const colors = [
          '#e74c3c',
          '#3498db',
          '#2ecc71',
          '#f39c12',
          '#9b59b6',
          '#1abc9c',
        ];
        const color = colors[parseInt(levelNum) - 1] || '#333';

        return `<${level} style="color: ${color}; border-left: 4px solid ${color}; padding-left: 12px; margin: 24px 0 16px 0;">`;
      },
    },
  });

  return (
    <div style={{ padding: '20px' }}>
      <h2>创建自定义渲染器示例</h2>
      <p>这个渲染器基于标准配置，为所有标题添加了彩色边框</p>
      <MyCustomRenderer id="custom-renderer" content={content} />
    </div>
  );
};

/**
 * 完整示例组合
 */
export const AllExamples: React.FC = () => {
  return (
    <div>
      <BasicExample />
      <hr style={{ margin: '40px 0' }} />
      <PresetExample />
      <hr style={{ margin: '40px 0' }} />
      <CustomConfigExample />
      <hr style={{ margin: '40px 0' }} />
      <CustomRulesExample />
      <hr style={{ margin: '40px 0' }} />
      <CustomRendererExample />
    </div>
  );
};

export default AllExamples;
