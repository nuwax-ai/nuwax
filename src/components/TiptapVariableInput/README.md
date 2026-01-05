# TiptapVariableInput 组件

基于 Tiptap 的富文本编辑器组件，支持变量插入、@ mentions、工具块和 Markdown 语法高亮。

## 目录

- [功能特性](#功能特性)
- [安装依赖](#安装依赖)
- [集成指南](#集成指南)
- [快速参考](#快速参考)
- [快速开始](#快速开始)
- [API 文档](#api-文档)
- [实际使用场景](#实际使用场景)
- [使用示例](#使用示例)
- [最佳实践](#最佳实践)
- [变量模式说明](#变量模式说明)
- [文本格式](#文本格式)
- [键盘快捷键](#键盘快捷键)
- [样式定制](#样式定制)
- [工具函数](#工具函数)
- [目录结构](#目录结构)
- [注意事项](#注意事项)
- [常见问题](#常见问题)
- [更新日志](#更新日志)

## 功能特性

- ✅ **变量插入**：支持 `{{variable}}` 格式的变量插入和自动补全（[变量建议触发规则](./VARIABLE_SUGGESTION_RULES.md)）
- ✅ **可编辑变量**：支持在变量节点内部进行字符级编辑
- ✅ **@ Mentions**：支持 @ 符号触发用户/文件等提及功能
- ✅ **工具块**：支持 `{#ToolBlock ...#}` 格式的工具块插入
- ✅ **Raw 节点**：支持展示 HTML/XML 原始内容，防止被 ProseMirror 解析
- ✅ **XML 标签支持**：支持自定义 XML 标签的正确显示（[HTML/XML 处理规则](./HTML_XML_PROCESSING_RULES.md)）
- ✅ **Markdown 高亮**：支持 Markdown 语法高亮显示（自动保护 XML 标签中的下划线）
- ✅ **自动补全大括号**：智能补全 `{` 为 `{}`
- ✅ **光标管理**：智能管理光标位置，避免跳字问题
- ✅ **文本转换**：支持纯文本和 HTML 格式之间的自动转换

## 安装依赖

组件依赖以下包：

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/suggestion": "^2.x",
  "@tiptap/pm": "^2.x",
  "antd": "^5.x",
  "lodash": "^4.x"
}
```

### 安装步骤

```bash
# 使用 pnpm（推荐）
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/suggestion @tiptap/pm

# 或使用 npm
npm install @tiptap/react @tiptap/starter-kit @tiptap/suggestion @tiptap/pm

# 或使用 yarn
yarn add @tiptap/react @tiptap/starter-kit @tiptap/suggestion @tiptap/pm
```

注意：`antd` 和 `lodash` 通常已经在项目中安装，无需重复安装。

## 集成指南

### 在 UmiJS 项目中使用

组件已经配置好，可以直接导入使用：

```tsx
import TiptapVariableInput from '@/components/TiptapVariableInput';
import type {
  PromptVariable,
  VariableType,
} from '@/components/TiptapVariableInput';
```

### 在普通 React 项目中使用

1. 确保已安装所有依赖
2. 导入组件和类型：

```tsx
import TiptapVariableInput from './components/TiptapVariableInput';
import type {
  PromptVariable,
  VariableType,
} from './components/TiptapVariableInput';
```

3. 确保样式文件被正确加载：

```tsx
// 在入口文件中导入样式
import '@/components/TiptapVariableInput/styles.less';
// 或
import './components/TiptapVariableInput/styles.less';
```

### TypeScript 支持

组件完全支持 TypeScript，提供了完整的类型定义：

```tsx
import type {
  TiptapVariableInputProps,
  PromptVariable,
  VariableType,
  MentionItem,
  VariableSuggestionItem,
} from '@/components/TiptapVariableInput';
```

## 快速参考

### 最常用的使用方式

```tsx
import TiptapVariableInput from '@/components/TiptapVariableInput';
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';

// 1. 使用纯文本格式存储（推荐）
const [textValue, setTextValue] = useState('Hello {{user.name}}');

// 2. 在 onChange 中转换为纯文本
<TiptapVariableInput
  value={textValue}
  onChange={(html) => {
    const text = extractTextFromHTML(html);
    setTextValue(text);
  }}
  variables={variables}
/>;
```

### 核心 Props

| Prop | 类型 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `value` | `string` | 编辑器内容（支持纯文本或 HTML） | - |
| `onChange` | `(html: string) => void` | 内容变化回调 | - |
| `variables` | `PromptVariable[]` | 可用变量列表 | `[]` |
| `getEditor` | `(editor: Editor) => void` | 获取编辑器实例 | - |

### 常用工具函数

```tsx
// 从 HTML 提取纯文本（最常用）
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';
const text = extractTextFromHTML(html);
```

### 变量建议功能

组件支持智能变量建议，输入 `{` 即可触发变量建议框。关于变量建议的详细触发规则、替换行为和使用场景，请参考 [变量建议触发和替换规则文档](./VARIABLE_SUGGESTION_RULES.md)。

## 快速开始

### 基础使用

```tsx
import TiptapVariableInput from '@/components/TiptapVariableInput';
import type {
  PromptVariable,
  VariableType,
} from '@/components/TiptapVariableInput';
import { useState } from 'react';

const variables: PromptVariable[] = [
  {
    key: 'user.name',
    type: VariableType.String,
    name: '用户名',
    description: '当前登录用户的名称',
  },
  {
    key: 'user.email',
    type: VariableType.String,
    name: '用户邮箱',
    description: '当前登录用户的邮箱地址',
  },
];

function MyComponent() {
  const [value, setValue] = useState('');

  return (
    <TiptapVariableInput
      value={value}
      onChange={setValue}
      variables={variables}
      placeholder="输入 { 开始插入变量"
    />
  );
}
```

### 使用纯文本格式（推荐）

组件支持纯文本格式的输入和输出，会自动转换为 HTML 格式进行编辑，输出时可以通过工具函数提取纯文本：

```tsx
import TiptapVariableInput from '@/components/TiptapVariableInput';
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';
import { useState } from 'react';

function MyComponent() {
  // 使用纯文本格式存储
  const [textValue, setTextValue] = useState('Hello {{user.name}}');

  const handleChange = (html: string) => {
    // 从 HTML 中提取纯文本格式
    const text = extractTextFromHTML(html);
    setTextValue(text);
  };

  return (
    <TiptapVariableInput
      value={textValue}
      onChange={handleChange}
      variables={variables}
    />
  );
}
```

## API 文档

### Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | - | 受控值，编辑器的 HTML 内容 |
| `onChange` | `(value: string) => void` | - | 值变化回调，返回 HTML 格式内容 |
| `variables` | `PromptVariable[]` | `[]` | 可用变量列表 |
| `skills` | `any[]` | `[]` | 技能列表（用于工具块） |
| `mentions` | `MentionItem[]` | `[]` | @ mentions 数据列表 |
| `placeholder` | `string` | `'输入 @ 或 { 开始使用'` | 占位符文本 |
| `readonly` | `boolean` | `false` | 是否只读模式 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `className` | `string` | - | 自定义样式类名 |
| `style` | `React.CSSProperties` | - | 自定义样式 |
| `disableMentions` | `boolean` | `true` | 是否禁用 @ mentions 建议 |
| `enableMarkdown` | `boolean` | `false` | 是否启用 Markdown 快捷语法 |
| `enableEditableVariables` | `boolean` | `true` | 是否启用可编辑变量节点 |
| `variableMode` | `'node' \| 'mark' \| 'text'` | `'text'` | 变量实现模式 |
| `onVariableSelect` | `(variable: PromptVariable, path: string) => void` | - | 变量选择回调 |
| `getEditor` | `(editor: Editor) => void` | - | 获取编辑器实例的回调 |

### 变量类型

```tsx
enum VariableType {
  String = 'string',
  Integer = 'integer',
  Boolean = 'boolean',
  Number = 'number',
  Object = 'object',
  Array = 'array',
  ArrayString = 'array_string',
  ArrayInteger = 'array_integer',
  ArrayBoolean = 'array_boolean',
  ArrayNumber = 'array_number',
  ArrayObject = 'array_object',
}
```

### 变量数据结构

```tsx
interface PromptVariable {
  key: string; // 变量标识符，如 'user.name'
  type: VariableType; // 变量类型
  name: string; // 变量显示名称
  description?: string; // 变量描述
  children?: PromptVariable[]; // 子变量（用于嵌套对象）
  label?: string; // 自定义显示标签
  example?: any; // 变量数据示例
  systemVariable?: boolean; // 是否是系统变量
}
```

### Mentions 数据结构

```tsx
interface MentionItem {
  id: string; // 唯一标识符
  label: string; // 显示标签
  type?: 'user' | 'file' | 'datasource' | 'custom';
  data?: any; // 附加数据
}
```

## 实际使用场景

### 场景 1: 智能体系统提示词编辑

在智能体配置页面中，用于编辑系统提示词和用户提示词：

```tsx
import TiptapVariableInput from '@/components/TiptapVariableInput';
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';
import { useRef } from 'react';

function SystemTipsWord({
  valueSystem,
  valueUser,
  onChangeSystem,
  onChangeUser,
  variables,
  skills,
}) {
  const editorSystemRef = useRef<any>(null);
  const editorUserRef = useRef<any>(null);

  return (
    <>
      {/* 系统提示词编辑器 */}
      <TiptapVariableInput
        value={valueSystem}
        onChange={(html) => onChangeSystem(extractTextFromHTML(html))}
        placeholder="输入系统提示词，对大模型进行角色塑造"
        getEditor={(editor) => {
          editorSystemRef.current = editor;
        }}
        style={{ height: '100%', border: 'none' }}
        variables={variables}
        skills={skills}
      />

      {/* 用户提示词编辑器 */}
      <TiptapVariableInput
        value={valueUser}
        onChange={(html) => onChangeUser(extractTextFromHTML(html))}
        placeholder="输入用户提示词，预置指令、问题或请求"
        getEditor={(editor) => {
          editorUserRef.current = editor;
        }}
        style={{ height: '100%', border: 'none' }}
        variables={variables}
        skills={skills}
      />
    </>
  );
}
```

**关键点**：

- 使用 `extractTextFromHTML` 将 HTML 格式转换为纯文本格式存储
- 通过 `getEditor` 获取编辑器实例，用于程序化插入文本
- 支持变量和工具块（skills）的自动补全

### 场景 2: 工作流节点配置

在工作流编辑器中，用于配置节点的输入输出参数：

```tsx
function WorkflowNodeConfig({ form, variables }) {
  return (
    <Form.Item name="prompt" label="提示词">
      <TiptapVariableInput
        value={form.getFieldValue('prompt')}
        onChange={(html) => {
          const text = extractTextFromHTML(html);
          form.setFieldsValue({ prompt: text });
        }}
        variables={variables}
        placeholder="输入提示词，使用 { 插入变量"
      />
    </Form.Item>
  );
}
```

### 场景 3: 程序化插入文本

通过编辑器实例在光标位置插入文本：

```tsx
function MyComponent() {
  const [editor, setEditor] = useState<any>(null);
  const [value, setValue] = useState('');

  const insertText = (text: string) => {
    if (editor?.commands?.insertContent) {
      // 使用 Tiptap 命令插入内容
      editor.commands.insertContent(text);
    } else {
      // 备用方案：追加到末尾
      setValue((prev) => (prev ? `${prev}\n${text}` : text));
    }
  };

  return (
    <>
      <Button onClick={() => insertText('{{user.name}}')}>
        插入用户名变量
      </Button>
      <TiptapVariableInput
        value={value}
        onChange={setValue}
        getEditor={setEditor}
        variables={variables}
      />
    </>
  );
}
```

## 使用示例

### 基础变量插入

输入 `{` 即可触发变量建议框，选择变量后会自动插入 `{{variable.key}}` 格式的变量。

```tsx
const variables = [
  {
    key: 'user.name',
    type: VariableType.String,
    name: '用户名',
  },
  {
    key: 'user.email',
    type: VariableType.String,
    name: '用户邮箱',
  },
];

<TiptapVariableInput value={value} onChange={setValue} variables={variables} />;
```

> 📖 **了解更多**：变量建议框的触发规则比较复杂，包括何时触发、何时不触发、以及替换行为等。详细说明请查看 [变量建议触发和替换规则文档](./VARIABLE_SUGGESTION_RULES.md)。

### 嵌套变量（对象结构）

```tsx
const variables = [
  {
    key: 'user',
    type: VariableType.Object,
    name: '用户信息',
    children: [
      {
        key: 'user.name',
        type: VariableType.String,
        name: '用户名',
      },
      {
        key: 'user.email',
        type: VariableType.String,
        name: '用户邮箱',
      },
      {
        key: 'user.profile',
        type: VariableType.Object,
        name: '用户资料',
        children: [
          {
            key: 'user.profile.avatar',
            type: VariableType.String,
            name: '头像URL',
          },
        ],
      },
    ],
  },
];
```

### 启用 @ Mentions

```tsx
const mentions = [
  { id: '1', label: '张三', type: 'user' },
  { id: '2', label: '李四', type: 'user' },
];

<TiptapVariableInput
  value={value}
  onChange={setValue}
  mentions={mentions}
  disableMentions={false}
/>;
```

### 只读模式

```tsx
<TiptapVariableInput value={value} onChange={setValue} readonly={true} />
```

### 禁用可编辑变量

```tsx
<TiptapVariableInput
  value={value}
  onChange={setValue}
  enableEditableVariables={false}
/>
```

### 变量选择回调

```tsx
<TiptapVariableInput
  value={value}
  onChange={setValue}
  variables={variables}
  onVariableSelect={(variable, path) => {
    console.log('选择的变量:', variable);
    console.log('变量路径:', path);
  }}
/>
```

### 获取编辑器实例

```tsx
const [editor, setEditor] = useState<Editor | null>(null);

<TiptapVariableInput value={value} onChange={setValue} getEditor={setEditor} />;

// 使用编辑器实例
useEffect(() => {
  if (editor) {
    // 执行编辑器操作
    editor.commands.focus();
  }
}, [editor]);
```

### 使用 Raw 节点展示 HTML/XML 原始内容

Raw 节点用于展示 HTML 或 XML 的原始内容，防止被 ProseMirror 解析。适用于需要展示代码、配置或文档结构等场景。

#### 通过编辑器 API 插入 Raw 节点

```tsx
import { RawNode } from '@/components/TiptapVariableInput';

// 获取编辑器实例
const [editor, setEditor] = useState<Editor | null>(null);

<TiptapVariableInput value={value} onChange={setValue} getEditor={setEditor} />;

// 插入 Raw 节点
useEffect(() => {
  if (editor) {
    const htmlContent = '<div><p>Hello World</p></div>';
    editor.commands.insertContent({
      type: 'raw',
      attrs: {
        content: htmlContent,
        type: 'html', // 或 'xml'
      },
    });
  }
}, [editor]);
```

#### 通过 HTML 格式使用 Raw 节点

```tsx
import { convertToRawNodeHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';

// 将 HTML/XML 内容转换为 Raw 节点的 HTML 格式
const htmlContent = '<div><p>Hello World</p></div>';
const rawNodeHTML = convertToRawNodeHTML(htmlContent, 'html');
// 输出: <pre data-raw="true" data-content="&lt;div&gt;&lt;p&gt;Hello World&lt;/p&gt;&lt;/div&gt;" data-type="html" class="raw-content">...</pre>

// 直接使用转换后的 HTML
const value = `<p>普通文本</p>${rawNodeHTML}<p>更多文本</p>`;
<TiptapVariableInput value={value} onChange={setValue} />;
```

#### 检测内容是否应该使用 Raw 节点

```tsx
import { shouldUseRawNode } from '@/components/TiptapVariableInput/utils/htmlUtils';

const content = '<html><body><p>完整文档</p></body></html>';
if (shouldUseRawNode(content)) {
  // 使用 Raw 节点展示
  const rawHTML = convertToRawNodeHTML(content, 'html');
}
```

#### 从 HTML 中提取 Raw 节点内容

```tsx
import { extractRawNodeContents } from '@/components/TiptapVariableInput/utils/htmlUtils';

const html =
  '<p>文本</p><pre data-raw="true" data-content="&lt;div&gt;内容&lt;/div&gt;"></pre>';
const rawContents = extractRawNodeContents(html);
// 输出: ['<div>内容</div>']
```

#### Raw 节点特性

- **原子节点**：Raw 节点是原子节点（`atom: true`），光标无法进入内部
- **原始展示**：内容以纯文本形式展示，不会被 ProseMirror 解析
- **样式支持**：使用代码字体和背景色，便于区分
- **类型标识**：支持 `html` 和 `xml` 两种类型标识
- **自动转义**：内容中的特殊字符会自动转义，确保正确显示

## 变量模式说明

### text 模式（默认）

- 变量以纯文本 `{{variable}}` 形式存储
- 通过 `VariableTextDecoration` 扩展自动应用样式
- 优点：无节点边界，光标移动自然，无跳字问题
- 缺点：无法直接编辑变量内容

> 📖 **相关文档**：关于变量建议框的触发规则和替换行为，请参考 [变量建议触发和替换规则](./VARIABLE_SUGGESTION_RULES.md)。

### node 模式

- 变量作为独立的节点存储
- 支持可编辑变量节点（`EditableVariableNode`）
- 优点：可以编辑变量内容，支持字符级编辑
- 缺点：可能存在光标跳字问题

### mark 模式

- 变量作为标记（Mark）应用在文本上
- 优点：保持文本连续性
- 缺点：实现复杂，可能存在兼容性问题

## 文本格式

### 输入格式

组件支持以下文本格式：

1. **纯文本**：普通文本内容
2. **变量**：`{{variable.key}}`
3. **工具块**：`{#ToolBlock id="xxx" type="xxx" name="xxx"#}内容{#/ToolBlock#}`
4. **Mentions**：`@username`（需要启用 mentions）

### 输出格式

- `onChange` 回调返回 HTML 格式的内容
- 可以通过 `extractTextFromHTML` 工具函数提取纯文本格式

```tsx
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';

const html = '<p>Hello {{user.name}}</p>';
const text = extractTextFromHTML(html);
// 输出: 'Hello {{user.name}}\n'
```

## 键盘快捷键

- `{`：触发变量建议框（详细触发规则请参考 [变量建议规则文档](./VARIABLE_SUGGESTION_RULES.md)）
- `@`：触发 mentions 建议框（需要启用）
- `Enter`：选择当前高亮的建议项
- `Escape`：关闭建议框
- `ArrowUp/ArrowDown`：在建议列表中导航
- `Tab`：在变量和工具之间切换（如果有工具）

> 💡 **提示**：变量建议框的触发规则比较复杂，包括何时触发、何时不触发、以及替换行为等。详细说明请查看 [变量建议触发和替换规则文档](./VARIABLE_SUGGESTION_RULES.md)。

## 样式定制

组件使用 Less 编写样式，可以通过以下方式定制：

1. **覆盖 CSS 变量**：组件使用 Ant Design 的主题系统
2. **自定义类名**：通过 `className` prop 添加自定义样式
3. **修改样式文件**：直接修改 `styles.less` 文件

### 主要样式类

- `.tiptap-variable-input`：组件根容器
- `.tiptap-editor-wrapper`：编辑器包装器
- `.variable-block-chip`：不可编辑变量节点
- `.variable-block-chip-editable`：可编辑变量节点
- `.variable-text-decoration`：文本模式变量装饰
- `.tool-block-chip`：工具块节点
- `.mention-node`：Mention 节点
- `.raw-content`：Raw 节点（HTML/XML 原始内容）

## 目录结构

```
TiptapVariableInput/
├── components/           # UI 组件
│   ├── MentionList.tsx  # Mentions 列表组件
│   └── VariableList.tsx # 变量列表组件
├── extensions/          # Tiptap 扩展
│   ├── AutoCompleteBraces.ts      # 自动补全大括号
│   ├── EditableVariableNode.ts    # 可编辑变量节点
│   ├── MarkdownHighlight.ts       # Markdown 语法高亮
│   ├── MentionNode.ts             # Mention 节点
│   ├── MentionSuggestion.tsx      # Mention 建议
│   ├── RawNode.ts                 # Raw 节点（HTML/XML 原始内容）
│   ├── ToolBlockNode.ts            # 工具块节点
│   ├── VariableCursorPlaceholder.ts # 变量光标占位符
│   ├── VariableNode.ts            # 变量节点
│   ├── VariableSuggestion.tsx      # 变量建议
│   └── VariableTextDecoration.ts   # 变量文本装饰
├── hooks/               # 自定义 Hooks
│   ├── useMentionItems.ts # Mentions 数据处理
│   └── useVariableTree.ts # 变量树构建
├── utils/               # 工具函数
│   ├── htmlUtils.ts      # HTML 转换工具
│   ├── suggestionUtils.ts # 建议工具
│   ├── treeHelpers.tsx   # 树结构辅助函数
│   ├── treeUtils.ts      # 树工具函数
│   └── variableTransform.ts # 变量转换
├── index.ts             # 组件导出
├── styles.less          # 样式文件
├── types.ts             # 类型定义
├── TiptapVariableInput.tsx # 主组件
├── README.md            # 组件使用文档
├── VARIABLE_SUGGESTION_RULES.md  # 变量建议触发规则
└── HTML_XML_PROCESSING_RULES.md  # HTML/XML 处理规则
```

## 最佳实践

### 1. 数据格式选择

**推荐使用纯文本格式存储**：

- 组件内部使用 HTML 格式进行编辑和渲染
- 存储时使用 `extractTextFromHTML` 提取纯文本格式
- 这样可以避免 HTML 序列化差异导致的问题

```tsx
// ✅ 推荐：使用纯文本格式存储
const [textValue, setTextValue] = useState('Hello {{user.name}}');

const handleChange = (html: string) => {
  const text = extractTextFromHTML(html);
  setTextValue(text);
};

// ❌ 不推荐：直接存储 HTML 格式
const [htmlValue, setHtmlValue] = useState('<p>Hello {{user.name}}</p>');
```

### 2. 变量数据准备

**使用稳定的变量引用**：

- 组件内部已经使用 `useRef` 和 `isEqual` 优化，但建议在父组件中也使用 `useMemo` 稳定引用
- 避免每次渲染都创建新的数组引用

```tsx
// ✅ 推荐：使用 useMemo 稳定引用
const variables = useMemo(
  () => [
    { key: 'user.name', type: VariableType.String, name: '用户名' },
    { key: 'user.email', type: VariableType.String, name: '用户邮箱' },
  ],
  [
    /* 依赖项 */
  ],
);

// ❌ 不推荐：每次渲染都创建新数组
const variables = [
  { key: 'user.name', type: VariableType.String, name: '用户名' },
];
```

### 3. 编辑器实例使用

**安全地使用编辑器实例**：

- 通过 `getEditor` 获取编辑器实例
- 使用前检查实例和方法是否存在
- 提供备用方案处理编辑器不可用的情况

```tsx
const insertText = (text: string, editorRef: React.MutableRefObject<any>) => {
  if (!editorRef.current) {
    // 备用方案：直接更新 value
    setValue((prev) => (prev ? `${prev}\n${text}` : text));
    return;
  }

  // 使用 Tiptap 命令
  if (editorRef.current?.commands?.insertContent) {
    editorRef.current.commands.insertContent(text);
  }
};
```

### 4. 变量模式选择

**根据需求选择合适的变量模式**：

- **text 模式（默认）**：适合大多数场景，光标移动自然，无跳字问题
- **node 模式**：需要编辑变量内容时使用，支持字符级编辑
- **mark 模式**：不推荐，实现复杂且可能存在兼容性问题

```tsx
// 默认 text 模式（推荐）
<TiptapVariableInput
  value={value}
  onChange={setValue}
  variableMode="text" // 默认值
/>

// 需要编辑变量内容时使用 node 模式
<TiptapVariableInput
  value={value}
  onChange={setValue}
  variableMode="node"
  enableEditableVariables={true}
/>
```

### 5. 性能优化

**避免不必要的重渲染**：

- 使用 `useMemo` 稳定 props 引用
- 使用 `useCallback` 稳定回调函数引用
- 避免在渲染函数中创建新对象

```tsx
// ✅ 推荐：使用 useCallback 稳定回调
const handleChange = useCallback((html: string) => {
  const text = extractTextFromHTML(html);
  setValue(text);
}, []);

const handleVariableSelect = useCallback((variable, path) => {
  console.log('选择的变量:', variable);
}, []);

// ❌ 不推荐：每次渲染都创建新函数
<TiptapVariableInput
  onChange={(html) => {
    const text = extractTextFromHTML(html);
    setValue(text);
  }}
/>;
```

### 6. 错误处理

**优雅处理边界情况**：

- 检查编辑器实例是否存在
- 处理空值和异常情况
- 提供用户友好的错误提示

```tsx
const insertText = (text: string) => {
  try {
    if (editor?.commands?.insertContent) {
      editor.commands.insertContent(text);
    } else {
      // 备用方案
      setValue((prev) => (prev ? `${prev}\n${text}` : text));
    }
  } catch (error) {
    console.error('插入文本失败:', error);
    message.error('插入文本失败，请重试');
  }
};
```

### 7. 理解变量建议触发规则

**了解变量建议框的行为**：

- 变量建议框的触发规则比较复杂，建议阅读 [变量建议触发和替换规则文档](./VARIABLE_SUGGESTION_RULES.md)
- 了解何时会触发、何时不会触发
- 理解变量替换的完整行为（特别是编辑已存在变量时的完整替换）

> 📖 **重要**：如果遇到变量建议框不按预期触发的情况，请先查看 [变量建议触发和替换规则文档](./VARIABLE_SUGGESTION_RULES.md) 中的详细说明和测试用例。

## 注意事项

1. **变量格式**：变量必须使用 `{{key}}` 格式，key 支持字母、数字、点号、下划线和方括号（用于数组索引）
2. **HTML 转换**：组件会自动检测文本格式并转换为 HTML，无需手动处理
3. **光标位置**：组件会智能管理光标位置，避免在更新时跳动
4. **性能优化**：使用 `useRef` 和 `isEqual` 优化 props 引用稳定性，避免不必要的重渲染
5. **扩展顺序**：Tiptap 扩展的加载顺序很重要，不要随意调整
6. **数据格式**：推荐使用纯文本格式存储，使用 `extractTextFromHTML` 进行转换
7. **编辑器实例**：使用编辑器实例前要检查是否存在，并提供备用方案
8. **变量建议触发**：变量建议框的触发规则有特定逻辑，不是所有情况下都会触发。详细规则请参考 [变量建议触发和替换规则文档](./VARIABLE_SUGGESTION_RULES.md)

## 常见问题

### Q: 变量插入后光标位置不正确？

A: 组件已经实现了光标位置恢复机制，如果仍有问题，可以尝试：

- 检查 `variableMode` 设置
- 确保没有手动操作编辑器实例导致冲突

### Q: 如何自定义变量样式？

A: 可以通过修改 `styles.less` 文件中的 `.variable-block-chip` 和 `.variable-block-chip-editable` 样式类。

### Q: 支持哪些浏览器？

A: 组件基于 Tiptap，支持所有现代浏览器（Chrome、Firefox、Safari、Edge）。

### Q: 如何禁用某些功能？

A: 通过相应的 props 控制：

- `disableMentions={true}`：禁用 @ mentions
- `enableMarkdown={false}`：禁用 Markdown 语法
- `enableEditableVariables={false}`：禁用可编辑变量

### Q: 如何从 HTML 格式转换为纯文本格式？

A: 使用 `extractTextFromHTML` 工具函数：

```tsx
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';

const html = '<p>Hello {{user.name}}</p>';
const text = extractTextFromHTML(html);
// 输出: 'Hello {{user.name}}\n'
```

### Q: 如何在光标位置插入文本？

A: 通过 `getEditor` 获取编辑器实例，然后使用 `insertContent` 命令：

```tsx
const [editor, setEditor] = useState<any>(null);

<TiptapVariableInput
  getEditor={setEditor}
  // ...
/>;

// 插入文本
editor?.commands?.insertContent('{{user.name}}');
```

### Q: 变量建议框什么时候会触发？

A: 变量建议框在以下情况会触发：

- 输入单个 `{` 时
- 输入 `{}` 时
- 在两个紧邻的变量之间（`{{xxx}}{|{{yy}}`）
- 在变量内部编辑时（`{{xx|x}}`）

详细规则和测试用例请参考 [VARIABLE_SUGGESTION_RULES.md](./VARIABLE_SUGGESTION_RULES.md)

### Q: 组件返回的是 HTML 格式，但我需要纯文本格式怎么办？

A: 使用 `extractTextFromHTML` 工具函数进行转换：

```tsx
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';

<TiptapVariableInput
  value={textValue}
  onChange={(html) => {
    const text = extractTextFromHTML(html);
    setTextValue(text); // 存储纯文本格式
  }}
/>;
```

### Q: 如何自定义变量和工具块的样式？

A: 可以通过以下方式自定义样式：

1. **修改样式文件**：直接修改 `styles.less` 文件中的样式类
2. **覆盖 CSS 变量**：使用 Ant Design 的主题系统
3. **自定义类名**：通过 `className` prop 添加自定义样式类

主要样式类：

- `.variable-block-chip`：不可编辑变量节点
- `.variable-block-chip-editable`：可编辑变量节点
- `.variable-text-decoration`：文本模式变量装饰
- `.tool-block-chip`：工具块节点

## 工具函数

组件提供了多个工具函数，方便进行格式转换和内容处理：

### HTML 工具函数

```tsx
import {
  extractTextFromHTML,
  convertTextToHTML,
  shouldConvertTextToHTML,
  convertToRawNodeHTML,
  shouldUseRawNode,
  extractRawNodeContents,
} from '@/components/TiptapVariableInput/utils/htmlUtils';
```

- `extractTextFromHTML(html: string)`: 从 HTML 中提取纯文本格式（包含变量和工具块）
- `convertTextToHTML(text: string, ...)`: 将纯文本转换为 HTML 格式
- `shouldConvertTextToHTML(text: string)`: 判断是否需要转换为 HTML
- `convertToRawNodeHTML(content: string, type: 'html' | 'xml')`: 将内容转换为 Raw 节点的 HTML
- `shouldUseRawNode(content: string)`: 判断是否应该使用 Raw 节点
- `extractRawNodeContents(html: string)`: 从 HTML 中提取所有 Raw 节点内容

### 使用示例

```tsx
// 提取纯文本
const html = '<p>Hello {{user.name}}</p>';
const text = extractTextFromHTML(html);
// 输出: 'Hello {{user.name}}\n'

// 转换为 HTML
const text = 'Hello {{user.name}}';
const html = convertTextToHTML(text, true, true, 'text');
// 输出: '<p>Hello {{user.name}}</p>'

// Raw 节点处理
const htmlContent = '<div><p>Hello</p></div>';
const rawHTML = convertToRawNodeHTML(htmlContent, 'html');
// 输出: <pre data-raw="true" data-content="..." data-type="html" class="raw-content">...</pre>
```

## 更新日志

### v1.1.0

- 新增 Raw 节点支持，用于展示 HTML/XML 原始内容
- 添加 Raw 节点相关工具函数
- 优化光标位置管理，避免滚动跳动
- 改进变量建议触发规则

### v1.0.0

- 初始版本
- 支持变量插入和自动补全
- 支持 @ mentions
- 支持工具块
- 支持 Markdown 语法高亮
- 支持可编辑变量节点
- 支持多种变量模式（text/node/mark）

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
