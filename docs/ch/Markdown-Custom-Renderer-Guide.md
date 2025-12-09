# Chat Markdown 自定义渲染元素（组件）实现指南

## 📋 目录

- [概述](#概述)
- [核心架构](#核心架构)
- [快速开始：生成 Markdown 并插入自定义标签](#快速开始生成-markdown-并插入自定义标签)
- [实现步骤：创建自定义渲染组件](#实现步骤创建自定义渲染组件)
- [现有示例](#现有示例)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 概述

本项目使用 `ds-markdown` 作为 Markdown 渲染引擎，通过插件机制实现自定义元素的渲染。当需要在 Markdown 中渲染自定义组件时（如执行过程、工具调用、计划等），可以通过创建插件来扩展渲染能力。

### 核心优势

- ✅ **插件化设计**：通过插件机制扩展，不影响核心渲染逻辑
- ✅ **类型安全**：支持 TypeScript 类型定义
- ✅ **灵活扩展**：可以自定义任意 HTML 标签或自定义标签的渲染
- ✅ **性能优化**：支持流式渲染和增量更新
- ✅ **主题支持**：支持明暗主题切换

## 核心架构

### 技术栈

- **渲染引擎**：`ds-markdown`
- **插件系统**：`ds-markdown/plugins` 的 `createBuildInPlugin`
- **HTML 处理**：`rehype-raw`、`rehype-stringify`
- **React**：用于自定义组件实现

### 架构图

```
┌─────────────────────────────────────────┐
│         MarkdownRenderer                 │
│  (src/components/MarkdownRenderer)      │
└──────────────┬──────────────────────────┘
               │
               │ 注册插件
               ▼
┌─────────────────────────────────────────┐
│         Plugin System                    │
│  - mermaidPlugin                        │
│  - katexPlugin                          │
│  - genCustomPlugin()                    │
│  - genAppDevPlugin()                    │
└──────────────┬──────────────────────────┘
               │
               │ 定义 components
               ▼
┌─────────────────────────────────────────┐
│    Custom Components Mapping             │
│  {                                       │
│    'custom-tag': CustomComponent,       │
│    'table': CustomTable,                │
│    'img': OptimizedImage,                │
│    ...                                   │
│  }                                       │
└─────────────────────────────────────────┘
```

## 快速开始：生成 Markdown 并插入自定义标签

在实际开发中，我们通常需要在代码中动态生成包含自定义标签的 Markdown 字符串。本节介绍如何在前端和后端生成这些标签。

### 方式一：使用工具函数（推荐）

#### 1. 创建工具函数

创建一个工具函数文件，用于生成自定义标签的 Markdown 块。

**文件位置**：`src/utils/markdownProcess.ts` 或项目特定目录

```typescript
/**
 * 生成自定义标签的 Markdown 块
 * @param tagName - 自定义标签名（如 'your-custom-tag'）
 * @param attributes - 标签属性对象
 * @returns Markdown 字符串
 */
export const generateCustomTagBlock = (
  tagName: string,
  attributes: Record<string, any>,
): string => {
  // 将属性对象转换为 HTML 属性字符串
  const attrs = Object.entries(attributes)
    .map(([key, value]) => {
      // 如果值是对象或数组，需要 JSON 序列化并 URL 编码
      if (typeof value === 'object' && value !== null) {
        const encoded = encodeURIComponent(JSON.stringify(value));
        return `${key}="${encoded}"`;
      }
      // 字符串值需要 URL 编码（如果包含特殊字符）
      if (typeof value === 'string' && /[<>&"']/.test(value)) {
        return `${key}="${encodeURIComponent(value)}"`;
      }
      // 普通值直接使用
      return `${key}="${value}"`;
    })
    .join(' ');

  // 使用 div 包裹，避免 DOM 嵌套验证错误
  // 自定义组件通常包含块级元素，不能放在 p 标签内
  return `\n\n<div><${tagName} ${attrs}></${tagName}></div>\n\n`;
};

/**
 * 生成包含复杂数据的自定义标签块
 * @param tagName - 自定义标签名
 * @param simpleAttrs - 简单属性（字符串、数字等）
 * @param dataAttr - 复杂数据对象（会被序列化和编码）
 * @returns Markdown 字符串
 */
export const generateCustomTagWithData = (
  tagName: string,
  simpleAttrs: Record<string, string | number> = {},
  dataAttr: Record<string, any> = {},
): string => {
  const allAttrs: Record<string, any> = { ...simpleAttrs };

  // 如果有复杂数据，序列化到 data 属性
  if (Object.keys(dataAttr).length > 0) {
    allAttrs.data = encodeURIComponent(JSON.stringify(dataAttr));
  }

  return generateCustomTagBlock(tagName, allAttrs);
};
```

#### 2. 使用工具函数生成 Markdown

```typescript
import {
  generateCustomTagBlock,
  generateCustomTagWithData,
} from '@/utils/markdownProcess';

// 示例 1：生成简单的自定义标签
let markdown = '这是一段普通文本。';
markdown += generateCustomTagBlock('your-custom-tag', {
  customProp: '示例属性',
  status: 'active',
  id: '123',
});

// 示例 2：生成包含复杂数据的标签
const planData = {
  planId: 'plan-123',
  entries: [
    { status: 'completed', content: '任务1' },
    { status: 'in_progress', content: '任务2' },
  ],
};

markdown += generateCustomTagWithData(
  'appdev-plan',
  {}, // 简单属性为空
  planData, // 复杂数据
);

// 示例 3：混合使用
markdown += generateCustomTagBlock('markdown-custom-process', {
  type: 'Page',
  status: 'EXECUTING',
  executeid: 'exec-123',
  name: encodeURIComponent('页面预览'), // 手动编码中文
});
```

### 方式二：直接字符串拼接

如果只是偶尔使用，也可以直接拼接字符串：

```typescript
// 准备数据
const data = {
  planId: 'plan-123',
  entries: [{ status: 'completed', content: '任务1' }],
};

// 序列化和编码
const encodedData = encodeURIComponent(JSON.stringify(data));

// 拼接 Markdown
const markdown = `这是一段文本。

<div><appdev-plan data="${encodedData}"></appdev-plan>

继续其他内容...`;
```

### 方式三：使用模板函数（针对特定标签）

对于常用的自定义标签，可以创建专门的模板函数：

```typescript
/**
 * 生成 Plan 标记
 * @param markdownText - 现有的 Markdown 文本
 * @param planData - Plan 数据
 * @returns 插入 Plan 标记后的 Markdown
 */
export const insertPlanBlock = (
  markdownText: string,
  planData: { planId: string; entries: PlanEntry[] },
): string => {
  const data = JSON.stringify(planData);
  const block = `\n\n<div><appdev-plan data="${encodeURIComponent(
    data,
  )}"></appdev-plan></div>\n\n`;
  return `${markdownText}${block}`;
};

/**
 * 生成 Tool Call 标记
 * @param markdownText - 现有的 Markdown 文本
 * @param toolCallId - Tool Call ID
 * @param toolCallData - Tool Call 数据
 * @returns 插入 Tool Call 标记后的 Markdown
 */
export const insertToolCallBlock = (
  markdownText: string,
  toolCallId: string,
  toolCallData: ToolCallInfo,
): string => {
  const data = JSON.stringify(toolCallData);
  const block = `\n\n<div><appdev-toolcall toolcallid="${toolCallId}" type="tool_call" data="${encodeURIComponent(
    data,
  )}"></appdev-toolcall></div>\n\n`;
  return `${markdownText}${block}`;
};

// 使用示例
let markdown = '开始执行计划...';
markdown = insertPlanBlock(markdown, {
  planId: 'plan-123',
  entries: [
    { status: 'pending', content: '任务1' },
    { status: 'in_progress', content: '任务2' },
  ],
});
```

### 数据编码规则

#### 1. 简单属性（字符串、数字）

- **普通字符串**：直接使用，无需编码

  ```typescript
  type = 'Page'; // ✅ 正确
  status = 'EXECUTING'; // ✅ 正确
  ```

- **包含特殊字符的字符串**：需要 URL 编码
  ```typescript
  name = '页面预览'; // 如果包含中文或特殊字符，建议编码
  name = "${encodeURIComponent('页面预览')}"; // ✅ 推荐
  ```

#### 2. 复杂数据（对象、数组）

必须进行 JSON 序列化 + URL 编码：

```typescript
// ❌ 错误：直接使用对象
data = { planData };

// ✅ 正确：序列化并编码
data = '${encodeURIComponent(JSON.stringify(planData))}';
```

**完整示例**：

```typescript
const planData = {
  planId: 'plan-123',
  entries: [{ status: 'completed', content: '任务1' }],
};

// 步骤 1：JSON 序列化
const jsonString = JSON.stringify(planData);
// 结果: '{"planId":"plan-123","entries":[{"status":"completed","content":"任务1"}]}'

// 步骤 2：URL 编码
const encoded = encodeURIComponent(jsonString);
// 结果: '%7B%22planId%22%3A%22plan-123%22%2C%22entries%22%3A%5B%7B%22status%22%3A%22completed%22%2C%22content%22%3A%22%E4%BB%BB%E5%8A%A11%22%7D%5D%7D'

// 步骤 3：插入到 Markdown
const block = `<div><appdev-plan data="${encoded}"></appdev-plan></div>`;
```

### 实际使用场景

#### 场景 1：SSE 流式消息处理

```typescript
// 在 SSE 消息处理中插入自定义标签
const handleSSEMessage = (message: any) => {
  let markdown = currentMarkdown;

  if (message.type === 'plan') {
    markdown = insertPlanBlock(markdown, {
      planId: message.planId,
      entries: message.entries,
    });
  } else if (message.type === 'tool_call') {
    markdown = insertToolCallBlock(markdown, message.toolCallId, {
      toolCallId: message.toolCallId,
      title: message.title,
      kind: message.kind,
      status: message.status,
      content: message.content,
    });
  } else {
    // 普通文本消息
    markdown += message.text;
  }

  updateMarkdown(markdown);
};
```

#### 场景 2：后端 API 生成

```python
# Python 后端示例
import json
from urllib.parse import quote

def generate_custom_tag_block(tag_name, attributes):
    """生成自定义标签的 Markdown 块"""
    attrs = []
    for key, value in attributes.items():
        if isinstance(value, (dict, list)):
            # 复杂数据：JSON 序列化 + URL 编码
            encoded = quote(json.dumps(value, ensure_ascii=False))
            attrs.append(f'{key}="{encoded}"')
        else:
            # 简单属性：直接使用或编码
            attrs.append(f'{key}="{value}"')

    attrs_str = ' '.join(attrs)
    return f'\n\n<div><{tag_name} {attrs_str}></{tag_name}></div>\n\n'

# 使用示例
plan_data = {
    'planId': 'plan-123',
    'entries': [
        {'status': 'completed', 'content': '任务1'}
    ]
}

markdown = '开始执行计划...'
markdown += generate_custom_tag_block('appdev-plan', {'data': plan_data})
```

#### 场景 3：检查标签是否已存在

```typescript
/**
 * 检查 Markdown 中是否已包含指定 ID 的标签
 * @param markdownText - Markdown 文本
 * @param tagName - 标签名
 * @param idAttribute - ID 属性名（如 'executeid', 'toolcallid'）
 * @param idValue - ID 值
 * @returns 是否已存在
 */
export const hasCustomTag = (
  markdownText: string,
  tagName: string,
  idAttribute: string,
  idValue: string,
): boolean => {
  const pattern = new RegExp(
    `<${tagName}[^>]*${idAttribute}="${idValue.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&',
    )}"`,
    'i',
  );
  return pattern.test(markdownText);
};

/**
 * 只在不存在时插入标签
 */
export const insertPlanBlockIfNotExists = (
  markdownText: string,
  planData: { planId: string; entries: PlanEntry[] },
): string => {
  if (hasCustomTag(markdownText, 'appdev-plan', 'data', planData.planId)) {
    return markdownText; // 已存在，不重复插入
  }
  return insertPlanBlock(markdownText, planData);
};
```

### 注意事项

1. **使用 div 包裹**：自定义组件通常包含块级元素，必须用 `<div>` 包裹，不能用 `<p>` 标签

   ```typescript
   // ✅ 正确
   `<div><your-tag></your-tag></div>`// ❌ 错误（会导致 DOM 嵌套验证错误）
   `<p><your-tag></your-tag></p>`;
   ```

2. **添加换行**：在标签前后添加换行，确保 Markdown 解析正确

   ```typescript
   // ✅ 正确
   `\n\n<div><your-tag></your-tag></div>\n\n`// ❌ 可能有问题
   `<div><your-tag></your-tag></div>`;
   ```

3. **属性值转义**：属性值中的引号需要转义

   ```typescript
   // 如果属性值包含引号，需要转义
   const value = 'He said "Hello"';
   const escaped = value.replace(/"/g, '&quot;');
   // 或者使用单引号包裹
   const attr = `title='${value}'`;
   ```

4. **避免重复插入**：在流式渲染中，注意检查标签是否已存在，避免重复插入

5. **数据大小限制**：URL 编码后的数据会变大，注意控制数据大小，避免 URL 过长

## 实现步骤：创建自定义渲染组件

如果你需要创建新的自定义渲染组件，请按照以下步骤操作。

### 第一步：创建插件生成函数

创建一个插件生成函数，通常命名为 `genCustomPlugin.tsx` 或 `gen[功能名]Plugin.tsx`。

**文件位置**：`src/components/MarkdownRenderer/genCustomPlugin.tsx` 或项目特定目录

```typescript
import { createBuildInPlugin } from 'ds-markdown/plugins';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import YourCustomComponent from '../YourCustomComponent';

/**
 * 自定义插件生成函数
 * 用于在 Markdown 中渲染自定义组件
 */
export default () => {
  return createBuildInPlugin({
    // 1. 配置 rehype 插件（用于处理 HTML）
    rehypePlugin: [rehypeRaw, rehypeStringify],

    // 2. 定义自定义组件映射
    components: {
      // 方式一：自定义标签（推荐用于业务组件）
      'your-custom-tag': ({ node, ...props }: any) => {
        // 从 node.position 生成唯一 key（用于 React key）
        const {
          end: { offset: endOffset },
          start: { offset: startOffset },
        } = node?.position || {};
        const componentKey = `${startOffset}-${endOffset}-custom`;

        // 从 props 中获取属性
        const customProp = props.customProp || props['customProp'];
        const data = props.data || props['data'];

        // 解析 URL 编码的数据（如果需要）
        let parsedData = null;
        if (data) {
          try {
            parsedData = JSON.parse(decodeURIComponent(data));
          } catch (error) {
            console.error('数据解析失败:', error);
          }
        }

        // 返回自定义组件
        return (
          <YourCustomComponent
            key={componentKey}
            dataKey={componentKey}
            customProp={customProp}
            data={parsedData}
          />
        );
      },

      // 方式二：覆盖标准 HTML 标签（用于增强标准元素）
      table: ({ children, node }: any) => {
        const {
          end: { offset: endOffset },
          start: { offset: startOffset },
        } = node?.position || {};
        const tableKey = `${startOffset}-${endOffset}-table`;

        return (
          <div key={tableKey} data-key={tableKey}>
            {/* 自定义表格渲染逻辑 */}
            <table className="custom-table">{children}</table>
          </div>
        );
      },
    },

    // 3. 插件标识（可选）
    id: Symbol('your-custom-plugin'),
    type: 'custom',
  });
};
```

### 第二步：创建自定义组件

创建你的自定义 React 组件，用于实际渲染。

**文件位置**：`src/components/YourCustomComponent/index.tsx`

```typescript
import React, { memo } from 'react';
import styles from './index.less';

interface YourCustomComponentProps {
  dataKey: string;
  customProp?: string;
  data?: any;
}

/**
 * 自定义组件
 * @param props - 组件属性
 */
const YourCustomComponent: React.FC<YourCustomComponentProps> = ({
  dataKey,
  customProp,
  data,
}) => {
  return (
    <div className={styles['your-custom-component']} data-key={dataKey}>
      <div className={styles.header}>
        <h3>{customProp || '默认标题'}</h3>
      </div>
      <div className={styles.content}>
        {/* 渲染内容 */}
        {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      </div>
    </div>
  );
};

// 使用 memo 优化性能
export default memo(YourCustomComponent, (prevProps, nextProps) => {
  return (
    prevProps.dataKey === nextProps.dataKey &&
    prevProps.customProp === nextProps.customProp
  );
});
```

### 第三步：注册插件

在 `MarkdownRenderer` 组件中注册你的插件。

**文件位置**：`src/components/MarkdownRenderer/index.tsx`

```typescript
import genCustomPlugin from './genCustomPlugin';
import genYourPlugin from './genYourPlugin'; // 导入你的插件

const MarkdownRenderer: React.FC<MarkdownRendererProps> = (
  {
    // ... props
  },
) => {
  // 在 plugins 数组中添加你的插件
  const plugins = useMemo(
    () => [
      mermaidPlugin,
      katexPlugin,
      genCustomPlugin(),
      genYourPlugin(), // 添加你的插件
    ],
    [],
  );

  return (
    <ConfigProvider mermaidConfig={mermaidProvider}>
      <MarkdownCMD
        ref={markdownRef}
        plugins={plugins} // 传递插件数组
        // ... 其他配置
      />
    </ConfigProvider>
  );
};
```

### 第四步：在 Markdown 中使用

在 Markdown 内容中使用你的自定义标签。

```markdown
# 示例

这是一个普通段落。

<!-- 使用自定义标签 -->
<div><your-custom-tag customProp="示例属性" data="%7B%22key%22%3A%22value%22%7D"></your-custom-tag></div>

<!-- 或者使用自闭合标签 -->
<div><your-custom-tag customProp="示例" data="%7B%22key%22%3A%22value%22%7D" /></div>

继续其他内容...
```

**注意**：如果 `data` 属性包含 JSON 数据，需要进行 URL 编码：

- 原始数据：`{"key":"value"}`
- URL 编码后：`%7B%22key%22%3A%22value%22%7D`

## 现有示例

### 示例 1：自定义处理组件（MarkdownCustomProcess）

**插件定义**：`src/components/MarkdownRenderer/genCustomPlugin.tsx`

```typescript
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
      key={processKey}
      dataKey={processKey}
      type={type}
      status={status}
      executeId={executeid}
      name={decodeURIComponent(name || '')}
    />
  );
},
```

**使用方式**：

```markdown
<div><markdown-custom-process 
  type="Page" 
  status="EXECUTING" 
  executeid="exec-123" 
  name="页面预览" 
/></div>
```

### 示例 2：表格自定义渲染

**插件定义**：`src/components/MarkdownRenderer/genCustomPlugin.tsx`

```typescript
table: ({ children, node }: any) => {
  const { theme, codeBlock: { headerActions = false } = {} } = useThemeState();
  const {
    end: { offset: endOffset },
    start: { offset: startOffset },
  } = node?.position || {};
  const listKey = `${startOffset}-${endOffset}-list`;

  // 提取表格内容为 Markdown 格式
  const tableMDContent = extractTableToMarkdown(children);

  return (
    <div key={listKey} data-key={listKey} style={{ display: 'block' }}>
      <div className={styles['table-wrapper']}>
        <div className={`md-code-block md-code-block-${theme}`}>
          {headerActions && (
            <div className="md-code-block-banner-wrap">
              <div className="md-code-block-banner md-code-block-banner-lite">
                <div className="md-code-block-language">表格</div>
                <CodeBlockActions
                  language="markdown"
                  codeContent={tableMDContent}
                />
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
```

### 示例 3：图片优化组件

**插件定义**：`src/components/MarkdownRenderer/genCustomPlugin.tsx`

```typescript
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
```

### 示例 4：AppDev 专用插件（Plan 和 Tool Call）

**插件定义**：`src/pages/AppDev/components/ChatArea/genAppDevPlugin.tsx`

```typescript
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

        const type = props.type || props['type'] || 'tool_call';
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
```

**使用方式**：

```markdown
<div><appdev-plan data="%7B%22planId%22%3A%22plan-123%22%2C%22entries%22%3A%5B%7B%22status%22%3A%22completed%22%2C%22content%22%3A%22任务1%22%7D%5D%7D"></appdev-plan></div>

<div><appdev-toolcall type="tool_call" data="%7B%22toolCallId%22%3A%22tool-123%22%2C%22title%22%3A%22读取文件%22%7D"></appdev-toolcall></div>
```

## 最佳实践

### 1. 组件 Key 生成

**推荐方式**：使用 `node.position` 生成唯一 key

```typescript
const {
  end: { offset: endOffset },
  start: { offset: startOffset },
} = node?.position || {};
const componentKey = `${startOffset}-${endOffset}-${componentType}`;
```

**原因**：

- 确保每个组件实例都有唯一的 key
- 基于内容位置，稳定且可预测
- 支持流式渲染时的正确更新

### 2. 属性获取

**推荐方式**：同时支持两种属性访问方式

```typescript
// 方式一：直接属性访问
const prop1 = props.prop1;

// 方式二：字符串键访问（用于 HTML 属性）
const prop2 = props.prop2 || props['prop2'];
```

**原因**：

- HTML 属性可能以字符串键形式传递
- 提供降级方案，提高兼容性

### 3. 数据解析

**推荐方式**：使用 try-catch 包裹数据解析逻辑

```typescript
let parsedData = null;
if (data) {
  try {
    parsedData = JSON.parse(decodeURIComponent(data || '{}'));
  } catch (error) {
    console.error('数据解析失败:', error);
    // 返回错误提示组件
    return (
      <div style={{ color: 'red' }}>
        数据解析失败: {(error as Error).message}
      </div>
    );
  }
}
```

**原因**：

- 防止解析错误导致整个渲染失败
- 提供友好的错误提示

### 4. 组件性能优化

**推荐方式**：使用 `React.memo` 优化组件

```typescript
export default memo(YourComponent, (prevProps, nextProps) => {
  return (
    prevProps.dataKey === nextProps.dataKey &&
    prevProps.importantProp === nextProps.importantProp
  );
});
```

**原因**：

- 减少不必要的重新渲染
- 提升流式渲染性能

### 5. 插件组织

**推荐方式**：按功能模块组织插件

```
src/
├── components/
│   └── MarkdownRenderer/
│       ├── genCustomPlugin.tsx      # 通用自定义插件
│       └── genTablePlugin.tsx       # 表格专用插件（可选）
├── pages/
│   └── AppDev/
│       └── components/
│           └── ChatArea/
│               └── genAppDevPlugin.tsx  # AppDev 专用插件
```

**原因**：

- 保持代码组织清晰
- 便于维护和扩展
- 避免插件文件过大

### 6. 类型定义

**推荐方式**：为插件 props 定义类型

```typescript
interface CustomTagProps {
  node: any;
  customProp?: string;
  data?: string;
  [key: string]: any; // 支持其他属性
}

'your-custom-tag': ({ node, ...props }: CustomTagProps) => {
  // ...
}
```

**原因**：

- 提供类型安全
- 改善开发体验
- 便于代码维护

## 常见问题

### Q1: 自定义标签不渲染怎么办？

**A**: 检查以下几点：

1. **插件是否注册**：确认插件已添加到 `plugins` 数组
2. **标签名是否匹配**：HTML 标签名是大小写不敏感的，但建议使用小写和连字符
3. **rehype 插件配置**：确保 `rehypeRaw` 已配置，否则自定义标签会被过滤
4. **控制台错误**：检查浏览器控制台是否有错误信息

### Q2: 如何传递复杂数据？

**A**: 使用 URL 编码的 JSON 字符串：

```typescript
// 原始数据
const data = { key: 'value', nested: { prop: 123 } };

// 编码后作为属性传递
const encoded = encodeURIComponent(JSON.stringify(data));

// 在 Markdown 中使用
// <your-tag data="%7B%22key%22%3A%22value%22%7D" />
```

### Q3: 如何覆盖标准 HTML 标签？

**A**: 直接在 `components` 中定义标准标签名：

```typescript
components: {
  'table': ({ children, node }) => {
    // 自定义表格渲染
  },
  'img': ({ src, alt, node }) => {
    // 自定义图片渲染
  },
}
```

### Q4: 如何在组件中使用主题？

**A**: 使用 `useThemeState` Hook：

```typescript
import { useThemeState } from 'ds-markdown';

const YourComponent = () => {
  const { theme } = useThemeState();

  return (
    <div className={theme === 'dark' ? 'dark-theme' : 'light-theme'}>
      {/* ... */}
    </div>
  );
};
```

### Q5: 插件会影响性能吗？

**A**: 合理使用不会影响性能：

1. **使用 memo 优化组件**：避免不必要的重新渲染
2. **合理使用 useMemo**：缓存计算结果
3. **避免在插件中执行重操作**：将复杂逻辑移到组件内部
4. **控制插件数量**：避免注册过多插件

### Q6: 如何调试插件？

**A**: 使用以下方法：

1. **添加 console.log**：在插件函数中打印 props 和 node
2. **React DevTools**：检查组件树和 props
3. **浏览器控制台**：查看错误信息
4. **断点调试**：在插件函数中设置断点

```typescript
'your-tag': ({ node, ...props }: any) => {
  console.log('Plugin Debug:', { node, props });
  // ...
}
```

### Q7: 如何在流式渲染中避免重复插入标签？

**A**: 使用检查函数：

```typescript
// 检查标签是否已存在
if (!hasCustomTag(markdown, 'appdev-plan', 'data', planData.planId)) {
  markdown = insertPlanBlock(markdown, planData);
}
```

## 总结

通过本指南，你可以：

1. ✅ 理解 Markdown 自定义渲染的架构和原理
2. ✅ **快速上手**：学会如何在代码中生成包含自定义标签的 Markdown
3. ✅ **深入实现**：创建自己的自定义渲染插件和组件
4. ✅ 遵循最佳实践，编写高质量的代码
5. ✅ 解决常见问题，快速定位和修复错误

## 参考资源

- [ds-markdown 文档](https://github.com/onshinpei/ds-markdown)
- [React 官方文档](https://react.dev)
- [rehype 插件文档](https://github.com/rehypejs/rehype)

---

**维护者**：开发团队

如有问题或建议，请联系开发团队或提交 Issue。
