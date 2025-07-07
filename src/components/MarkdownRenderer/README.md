# MarkdownRenderer 组件

一个功能强大、可配置的 Markdown 渲染器组件，支持多种插件和自定义渲染规则。

## 特性

- 🔧 **可配置插件** - 支持灵活的插件配置系统
- 🎨 **自定义渲染规则** - 可以覆盖或扩展默认的渲染规则
- 🚀 **预设配置** - 提供多种预设配置（基础、标准、完整、聊天）
- 🎯 **全局函数管理** - 统一管理代码复制、图片放大等全局功能
- 💎 **TypeScript 支持** - 完整的类型定义
- 🎪 **样式隔离** - 使用 CSS Modules 避免样式冲突

## 快速开始

### 基础使用

```tsx
import MarkdownRenderer from '@/components/MarkdownRenderer';

function MyComponent() {
  const markdownContent = `
# 标题
这是一个段落。

\`\`\`javascript
console.log('Hello World');
\`\`\`
  `;

  return <MarkdownRenderer content={markdownContent} />;
}
```

### 使用预设配置

```tsx
import {
  ChatMarkdownRenderer,
  StandardMarkdownRenderer,
  BasicMarkdownRenderer,
  FullMarkdownRenderer
} from '@/components/MarkdownRenderer';

// 聊天场景专用（包含所有插件）
<ChatMarkdownRenderer content={content} />

// 标准配置（包含 KaTeX 和表格插件）
<StandardMarkdownRenderer content={content} />

// 基础配置（仅基本功能）
<BasicMarkdownRenderer content={content} />

// 完整配置（包含所有插件）
<FullMarkdownRenderer content={content} />
```

## 配置选项

### MarkdownRendererConfig

```tsx
interface MarkdownRendererConfig {
  // markdown-it 基础配置
  markdownItOptions?: MarkdownItOptions;

  // 插件配置列表
  plugins?: PluginConfig[];

  // 自定义渲染规则
  customRules?: {
    [key: string]: (
      tokens: any[],
      idx: number,
      options?: any,
      env?: any,
      self?: any,
    ) => string;
  };

  // 全局函数配置
  globalFunctions?: {
    handleClipboard?: boolean;
    showImageInModal?: boolean;
    toggleCodeCollapse?: boolean;
  };

  // CSS 类名配置
  cssClasses?: {
    codeBlockWrapper?: string;
    codeHeader?: string;
    extBox?: string;
    copyImg?: string;
    customTable?: string;
    imageOverlay?: string;
  };
}
```

## 自定义配置示例

### 1. 自定义插件配置

```tsx
import MarkdownRenderer, { allPlugins } from '@/components/MarkdownRenderer';

const customConfig = {
  plugins: [
    allPlugins.katex, // 数学公式
    allPlugins.multimdTable, // 表格
    // 添加自定义插件
    {
      name: 'my-plugin',
      plugin: myCustomPlugin,
      options: {
        /* 插件选项 */
      },
    },
  ],
};

<MarkdownRenderer content={content} config={customConfig} />;
```

### 2. 自定义渲染规则

```tsx
const customConfig = {
  customRules: {
    // 自定义代码块渲染
    fence: (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const content = token.content;
      return `<div class="my-code-block">${content}</div>`;
    },

    // 自定义图片渲染
    image: (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const src = token.attrGet('src');
      return `<img src="${src}" class="my-image" />`;
    },
  },
};

<MarkdownRenderer content={content} config={customConfig} />;
```

### 3. 创建自定义渲染器

```tsx
import {
  createMarkdownRenderer,
  presetConfigs,
} from '@/components/MarkdownRenderer';

// 基于标准配置创建自定义渲染器
const MyMarkdownRenderer = createMarkdownRenderer({
  ...presetConfigs.standard(),
  customRules: {
    heading_open: (tokens, idx) => {
      const token = tokens[idx];
      const level = token.tag;
      return `<${level} class="my-heading">`;
    },
  },
});

// 使用自定义渲染器
<MyMarkdownRenderer content={content} />;
```

## 可用插件

### 内置插件

- **katex** - 数学公式渲染（支持 LaTeX 语法）
- **multimdTable** - 增强表格支持（多行、合并单元格等）
- **mermaid** - 图表和流程图渲染

### 插件配置示例

```tsx
import { allPlugins } from '@/components/MarkdownRenderer';

const config = {
  plugins: [
    // KaTeX 数学公式
    {
      ...allPlugins.katex,
      options: {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
      },
    },

    // 表格插件
    allPlugins.multimdTable,

    // Mermaid 图表
    {
      ...allPlugins.mermaid,
      options: {
        theme: 'dark',
        toolbar: {
          enabled: false,
        },
      },
    },
  ],
};
```

## 预设配置详情

### basic - 基础配置

- 仅包含基本的 markdown-it 功能
- 启用代码复制、图片放大等全局函数
- 适用于简单的文档渲染

### standard - 标准配置

- 包含 KaTeX 数学公式插件
- 包含增强表格插件
- 启用所有全局函数
- 适用于大多数场景

### full - 完整配置

- 包含所有可用插件
- 启用所有功能
- 适用于功能需求完整的场景

### chat - 聊天配置

- 针对聊天场景优化
- 包含所有插件
- 特殊的样式和交互优化

## 全局函数

组件提供以下全局函数：

### handleClipboard

点击代码块的复制按钮时调用，复制代码内容到剪贴板。

### showImageInModal

点击图片时调用，以模态窗口显示放大的图片，支持鼠标滚轮缩放。

### toggleCodeCollapse

点击代码块的折叠按钮时调用，切换长代码块的展开/折叠状态。

## 样式自定义

### CSS 类名配置

```tsx
const config = {
  cssClasses: {
    codeBlockWrapper: 'my-code-wrapper',
    codeHeader: 'my-code-header',
    extBox: 'my-ext-box',
    copyImg: 'my-copy-img',
    customTable: 'my-table',
    imageOverlay: 'my-image-overlay',
  },
};
```

### 样式覆盖

可以通过全局样式或传入自定义 className 来覆盖默认样式：

```tsx
<MarkdownRenderer content={content} className="my-custom-markdown" />
```

```css
.my-custom-markdown {
  /* 自定义样式 */
}

.my-custom-markdown :global(.code-block-wrapper) {
  /* 覆盖代码块样式 */
}
```

## 性能优化

- 组件使用 `React.memo` 进行浅比较优化
- markdown-it 实例被缓存，避免重复创建
- 全局函数采用单例模式，避免重复注册
- 支持按需加载插件

## 最佳实践

1. **选择合适的预设配置** - 根据实际需求选择预设，避免加载不必要的插件
2. **自定义 CSS 类名** - 在需要特殊样式时使用 cssClasses 配置
3. **复用渲染器实例** - 对于相同配置的场景，使用 `createMarkdownRenderer` 创建复用实例
4. **合理使用全局函数** - 在不需要交互功能时可以禁用全局函数以提高性能

## 兼容性

- React 16.8+
- TypeScript 4.0+
- 现代浏览器（支持 ES6+）

## 类型定义

完整的类型定义可以在以下文件中找到：

- `types.ts` - 核心类型定义
- `presets.ts` - 预设配置类型
- `renderRules.ts` - 渲染规则类型
- `globalFunctions.ts` - 全局函数类型
