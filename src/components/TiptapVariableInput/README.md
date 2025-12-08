# TiptapVariableInput 组件

基于 Tiptap 的富文本编辑器组件，支持变量插入、@ mentions、工具块和 Markdown 语法高亮。

## 功能特性

- ✅ **变量插入**：支持 `{{variable}}` 格式的变量插入和自动补全
- ✅ **可编辑变量**：支持在变量节点内部进行字符级编辑
- ✅ **@ Mentions**：支持 @ 符号触发用户/文件等提及功能
- ✅ **工具块**：支持 `{#ToolBlock ...#}` 格式的工具块插入
- ✅ **Raw 节点**：支持展示 HTML/XML 原始内容，防止被 ProseMirror 解析
- ✅ **Markdown 高亮**：支持 Markdown 语法高亮显示
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

## 基础使用

```tsx
import TiptapVariableInput from '@/components/TiptapVariableInput';
import type { PromptVariable } from '@/components/TiptapVariableInput';

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

## 使用示例

### 基础变量插入

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

- `{`：触发变量建议框
- `@`：触发 mentions 建议框（需要启用）
- `Enter`：选择当前高亮的建议项
- `Escape`：关闭建议框
- `ArrowUp/ArrowDown`：在建议列表中导航
- `Tab`：在变量和工具之间切换（如果有工具）

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
└── TiptapVariableInput.tsx # 主组件
```

## 注意事项

1. **变量格式**：变量必须使用 `{{key}}` 格式，key 支持字母、数字、点号、下划线和方括号（用于数组索引）
2. **HTML 转换**：组件会自动检测文本格式并转换为 HTML，无需手动处理
3. **光标位置**：组件会智能管理光标位置，避免在更新时跳动
4. **性能优化**：使用 `useRef` 和 `isEqual` 优化 props 引用稳定性，避免不必要的重渲染
5. **扩展顺序**：Tiptap 扩展的加载顺序很重要，不要随意调整

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

## 更新日志

### v1.1.0

- 新增 Raw 节点支持，用于展示 HTML/XML 原始内容
- 添加 Raw 节点相关工具函数

### v1.0.0

- 初始版本
- 支持变量插入和自动补全
- 支持 @ mentions
- 支持工具块
- 支持 Markdown 语法高亮

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
