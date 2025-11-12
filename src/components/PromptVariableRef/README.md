# Prompt Variable Reference Component

一个功能强大的提示词变量引用组件，支持智能提示、自动补全和多种变量引用语法。

## ✨ 功能特性

- 🎯 **智能提示**：输入 `{{` 时自动弹出变量选择菜单
- 🌳 **树形结构**：支持嵌套变量和数组索引
- 🔍 **搜索过滤**：实时搜索变量，支持模糊匹配
- ⌨️ **键盘导航**：完整的键盘操作支持
- 🎨 **类型图标**：不同类型变量显示对应图标
- 🌙 **主题适配**：自动支持暗色主题
- 📱 **响应式**：移动端友好

## 📋 支持的语法

### 基础变量引用
```text
{{variable}}
```

### 对象属性访问
```text
{{variable.property}}
{{variable.nested.property}}
```

### 数组索引访问
```text
{{variable[0]}}
{{variable.items[2].name}}
```

### 复合表达式
```text
{{user.name}} 购买了 {{products[0].name}}，订单号：{{order.id}}
```

## 🚀 快速开始

### 基础使用

```tsx
import React, { useState } from 'react';
import PromptVariableRef from '@/components/PromptVariableRef';
import type { PromptVariable, VariableType } from '@/components/PromptVariableRef';

const MyComponent = () => {
  const [value, setValue] = useState('');
  
  const variables: PromptVariable[] = [
    {
      key: 'user',
      type: VariableType.Object,
      name: '用户信息',
      children: [
        {
          key: 'name',
          type: VariableType.String,
          name: '用户名'
        },
        {
          key: 'email',
          type: VariableType.String,
          name: '邮箱'
        }
      ]
    }
  ];

  return (
    <PromptVariableRef
      variables={variables}
      value={value}
      onChange={setValue}
      placeholder="输入提示词..."
    />
  );
};
```

### 高级配置

```tsx
<PromptVariableRef
  variables={variables}
  value={value}
  onChange={setValue}
  onVariableSelect={(variable, path) => {
    console.log('选择了变量:', variable, path);
  }}
  direction="bottomRight"
  readonly={false}
  disabled={false}
  style={{ width: '100%' }}
  className="custom-prompt-input"
/>
```

## 📖 API 参考

### PromptVariableRef Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variables` | `PromptVariable[]` | `[]` | 可用变量列表 |
| `value` | `string` | `''` | 输入框值 |
| `onChange` | `(value: string) => void` | - | 值变化回调 |
| `onVariableSelect` | `(variable: PromptVariable, path: string) => void` | - | 变量选择回调 |
| `placeholder` | `string` | `'输入提示词，使用 {{变量名}} 引用变量'` | 占位符文本 |
| `readonly` | `boolean` | `false` | 是否只读模式 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `direction` | `'topLeft' \| 'topRight' \| 'bottomLeft' \| 'bottomRight'` | `'bottomLeft'` | 弹窗方向 |
| `className` | `string` | `''` | 自定义样式类名 |
| `style` | `React.CSSProperties` | - | 自定义样式 |

### PromptVariable 接口

```tsx
interface PromptVariable {
  key: string;                    // 变量标识符
  type: VariableType;            // 变量类型
  name: string;                  // 变量显示名称
  description?: string;          // 变量描述
  children?: PromptVariable[];   // 子变量
  label?: string;               // 自定义显示标签
}
```

### VariableType 枚举

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

## 🎯 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `↑` / `↓` | 上下选择变量 |
| `Enter` | 确认选择变量 |
| `Esc` | 关闭变量选择菜单 |
| `{{` | 触发变量选择菜单 |

## 🎨 自定义样式

### CSS 变量

```css
.prompt-variable-ref {
  --primary-color: #1890ff;
  --text-color: #262626;
  --border-color: #d9d9d9;
  --background-color: #ffffff;
}
```

### 样式类名

```css
/* 主容器 */
.prompt-variable-ref {}

/* 输入框 */
.prompt-variable-input {}

/* 弹窗内容 */
.variable-popover-content {}

/* 搜索区域 */
.variable-search {}

/* 树形容器 */
.variable-tree-container {}

/* 变量节点 */
.variable-tree-node {}

/* 类型图标 */
.variable-type-icon {}

/* 变量标签 */
.variable-label {}

/* 变量描述 */
.variable-description {}

/* 弹窗底部 */
.variable-popover-footer {}
```

## 🔧 工具函数

### 解析器函数

```tsx
import { 
  parseVariableExpression,
  findAllVariableReferences,
  extractVariableName,
  isValidVariableReference 
} from '@/components/PromptVariableRef/utils/parser';

// 解析变量表达式
const parseData = parseVariableExpression({
  lineContent: 'Hello {{user.name}}!',
  lineOffset: 15
});

// 查找所有变量引用
const variables = findAllVariableReferences('Hello {{user}} and {{order.id}}!');

// 提取变量名
const varName = extractVariableName('{{user.name}}'); // 'user.name'

// 验证变量引用格式
const isValid = isValidVariableReference('{{user.name}}'); // true
```

### 树工具函数

```tsx
import { 
  buildVariableTree,
  filterVariableTree,
  generateVariableReference 
} from '@/components/PromptVariableRef/utils/treeUtils';

// 构建变量树
const tree = buildVariableTree(variables);

// 过滤变量树
const filtered = filterVariableTree(tree, 'user');

// 生成变量引用
const ref = generateVariableReference('user.name'); // '{{user.name}}'
```

## 📝 示例项目

查看 `example.tsx` 文件获取完整的使用示例。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License