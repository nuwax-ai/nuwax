# Variable Inference Input Component

一个功能强大的变量智能推断输入组件，支持智能提示、自动补全和多种变量引用语法。

## 📋 目录

- [功能特性](#-功能特性)
- [支持语法](#-支持语法)
- [快速开始](#-快速开始)
- [API 参考](#-api-参考)
- [键盘快捷键](#-键盘快捷键)
- [自定义样式](#-自定义样式)
- [工具函数](#-工具函数)
- [问题修复记录](#-问题修复记录)
- [变更日志](./CHANGELOG.md)
- [示例项目](#-示例项目)
- [贡献](#-贡献)
- [许可证](#-许可证)

## ✨ 功能特性

- 🎯 **智能提示**：输入 `{{` 时自动弹出变量选择菜单
- 🌳 **树形结构**：支持嵌套变量和数组索引
- 🔍 **搜索过滤**：实时搜索变量，支持模糊匹配
- ⌨️ **键盘导航**：完整的键盘操作支持
- 🎨 **类型图标**：不同类型变量显示对应图标
- 🌙 **主题适配**：自动支持暗色主题
- 📱 **响应式**：移动端友好
- 🔧 **滚动适配**：修复输入框滚动时下拉框定位问题
- 🎯 **智能定位**：自动根据光标位置和视口空间动态计算最佳显示方向
- ⚡ **一次性删除**：智能识别高亮区块，一键删除整个变量引用

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

## ✨ 特色功能

### ⚡ 一次性删除高亮区块

当您在输入框中输入变量引用（如 `{{user.name}}`）后，这些变量引用会被高亮显示为可识别的区块。

**使用方式**：

1. 将光标放在高亮区块内的任意位置
2. 按退格键（Backspace）或删除键（Delete）
3. 整个高亮区块将被一次性删除

**视觉标识**：

- 高亮区块显示 ⚡ 图标
- Hover 时显示“← 一次删除”提示
- 带有边框和背景色突出显示

**示例体验**：

```text
原文本：“用户信息：{{user.name}} 邮箱：{{user.email}}”
                         ↑ 将光标放在这里
按退格键 → 一次性删除整个 {{user.name}} 区块
结果：“用户信息： 邮箱：{{user.email}}”
         ↑ 光标正确移动到删除位置
```

**智能保护**：

- 光标在高亮区块外时，保持原有逐字符删除行为
- 不会影响正常的文本编辑体验
- 完全向下兼容

## 🚀 快速开始

### 基础使用

```tsx
import React, { useState } from 'react';
import VariableInferenceInput from '@/components/VariableInferenceInput';
import type {
  PromptVariable,
  VariableType,
} from '@/components/VariableInferenceInput';

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
          name: '用户名',
        },
        {
          key: 'email',
          type: VariableType.String,
          name: '邮箱',
        },
      ],
    },
  ];

  return (
    <VariableInferenceInput
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
<VariableInferenceInput
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

### VariableInferenceInput Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `variables` | `PromptVariable[]` | `[]` | 可用变量列表 |
| `value` | `string` | `''` | 输入框值 |
| `onChange` | `(value: string) => void` | - | 值变化回调 |
| `onVariableSelect` | `(variable: PromptVariable, path: string) => void` | - | 变量选择回调 |
| `placeholder` | `string` | `'输入提示词，使用 {{变量名}} 引用变量'` | 占位符文本 |
| `readonly` | `boolean` | `false` | 是否只读模式 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `className` | `string` | `''` | 自定义样式类名 |
| `style` | `React.CSSProperties` | - | 自定义样式 |
| `direction` | `'topLeft' \| 'topRight' \| 'bottomLeft' \| 'bottomRight'` | `'bottomLeft'` | 弹窗方向（已废弃，使用智能动态定位） |

### PromptVariable 接口

```tsx
interface PromptVariable {
  key: string; // 变量标识符
  type: VariableType; // 变量类型
  name: string; // 变量显示名称
  description?: string; // 变量描述
  children?: PromptVariable[]; // 子变量
  label?: string; // 自定义显示标签
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

| 快捷键    | 功能             |
| --------- | ---------------- |
| `↑` / `↓` | 上下选择变量     |
| `Enter`   | 确认选择变量     |
| `Esc`     | 关闭变量选择菜单 |
| `{{`      | 触发变量选择菜单 |

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
.prompt-variable-ref {
}

/* 输入框 */
.prompt-variable-input {
}

/* 弹窗内容 */
.variable-popover-content {
}

/* 搜索区域 */
.variable-search {
}

/* 树形容器 */
.variable-tree-container {
}

/* 变量节点 */
.variable-tree-node {
}

/* 类型图标 */
.variable-type-icon {
}

/* 变量标签 */
.variable-label {
}

/* 变量描述 */
.variable-description {
}

/* 弹窗底部 */
.variable-popover-footer {
}
```

## 🔧 工具函数

### 解析器函数

```tsx
import {
  parseVariableExpression,
  findAllVariableReferences,
  extractVariableName,
  isValidVariableReference,
} from '@/components/VariableInferenceInput/utils/parser';

// 解析变量表达式
const parseData = parseVariableExpression({
  lineContent: 'Hello {{user.name}}!',
  lineOffset: 15,
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
  generateVariableReference,
} from '@/components/VariableInferenceInput/utils/treeUtils';

// 构建变量树
const tree = buildVariableTree(variables);

// 过滤变量树
const filtered = filterVariableTree(tree, 'user');

// 生成变量引用
const ref = generateVariableReference('user.name'); // '{{user.name}}'
```

## 🛠️ 问题修复记录

### v1.1.1 - 滚动条定位修复

**问题描述**：当输入框出现滚动条后，变量引用下拉框定位错误，不跟随光标位置。

**根本原因**：

- 光标位置计算时没有考虑输入框的 `scrollLeft` 和 `scrollTop` 偏移
- 当文本框滚动时，光标实际显示位置会偏移，但下拉框位置计算没有减去滚动偏移量

**修复方案**：

1. 在计算光标位置时减去输入框的滚动偏移
2. 监听输入框滚动事件，实时更新下拉框位置
3. 优化光标位置的计算逻辑，确保在不同滚动状态下都能正确定位

**代码变更**：

```tsx
// 修复前
const cursorX = rect.left + currentCol * charWidth;
const cursorY = rect.top + currentLine * lineHeight + lineHeight;

// 修复后
const scrollLeft = textarea.scrollLeft || 0;
const scrollTop = textarea.scrollTop || 0;
const cursorX = rect.left + currentCol * charWidth - scrollLeft;
const cursorY = rect.top + currentLine * lineHeight + lineHeight - scrollTop;
```

**测试场景**：

- ✅ 输入框水平滚动时，下拉框位置正确
- ✅ 输入框垂直滚动时，下拉框位置正确
- ✅ 同时水平和垂直滚动时，下拉框位置正确
- ✅ 输入长文本自动换行时的定位
- ✅ 键盘导航在不同滚动位置时的工作正常

**兼容性**：

- 向下兼容，不影响现有功能
- 在所有现代浏览器中测试通过
- 保持与 React 18 和 TypeScript 的兼容性

## 📝 示例项目

查看 `example.tsx` 文件获取完整的使用示例。

## 📄 变更日志

详细的变更记录请查看 [CHANGELOG.md](./CHANGELOG.md)

### 最新版本 v1.3.0 主要变更

⚡ **一次性删除高亮区块功能**：现在支持智能识别高亮变量引用区块，一键删除整个 {{变量名}}

🎨 **增强视觉效果**：高亮区块现在显示闪电图标和 hover 提示，更直观的用户体验

🔧 **智能删除逻辑**：光标在高亮区块内时退格键/删除键一次性删除整个区块，光标在外时保持正常删除行为

🎯 **光标定位优化**：修复了选择变量后光标定位问题，确保光标正确移动到 }} 后面

🎨 **高亮样式简化**：简化了高亮区块样式，只保留背景色，更简洁美观

```tsx
// 升级前 (v1.1.x)
<VariableInferenceInput
  variables={variables}
  value={value}
  onChange={setValue}
  direction="bottomRight"  // 需要手动指定方向
/>

// 升级后 (v1.2.x)
<VariableInferenceInput
  variables={variables}
  value={value}
  onChange={setValue}
  // 自动智能定位，无需指定方向
/>
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

在提交 PR 时，请确保：

- 更新 CHANGELOG
- 添加或更新相关测试
- 保持代码风格一致
- 更新相关文档

## 📄 许可证

MIT License
