# SmartVariableInput 智能变量输入组件

一个支持智能变量选择和完整路径构建的 React 输入组件，基于 Ant Design Tree 组件实现。

## 功能特性

- 🌳 **树形变量选择**：支持多层嵌套的变量结构
- 🔧 **智能路径构建**：自动构建完整的变量访问路径
- 📝 **自动触发**：输入 `{` 或 `{{` 自动显示变量选择器
- ⚙️ **高度可配置**：支持自定义路径分隔符、数组索引等
- 🎯 **类型安全**：完整的 TypeScript 类型支持
- 📱 **响应式设计**：适配不同屏幕尺寸

## 安装依赖

```bash
npm install antd react
# 或
pnpm add antd react
```

## 基本使用

```tsx
import React, { useRef } from 'react';
import SmartVariableInput, {
  SmartVariableInputRef,
} from './SmartVariableInput';

const MyComponent = () => {
  const inputRef = useRef<SmartVariableInputRef>(null);

  const variables = [
    {
      key: 'user',
      title: 'user',
      children: [
        { key: 'user.name', title: 'name' },
        { key: 'user.email', title: 'email' },
      ],
    },
    {
      key: 'products',
      title: 'products',
      isArray: true, // 标识为数组类型
      children: [
        { key: 'products.name', title: 'name' },
        { key: 'products.price', title: 'price' },
      ],
    },
  ];

  return (
    <SmartVariableInput
      ref={inputRef}
      variables={variables}
      placeholder="输入 { 来触发变量选择..."
    />
  );
};
```

## API 参考

### SmartVariableInput Props

| 属性        | 类型               | 默认值            | 说明         |
| ----------- | ------------------ | ----------------- | ------------ |
| variables   | `TreeNodeData[]`   | `[]`              | 变量树数据   |
| placeholder | `string`           | `'请输入内容...'` | 输入框占位符 |
| pathOptions | `PathBuildOptions` | `{}`              | 路径构建选项 |

### TreeNodeData 接口

```tsx
interface TreeNodeData {
  key: string; // 节点唯一标识
  title: string; // 节点显示名称
  children?: TreeNodeData[]; // 子节点
  parentKey?: string; // 父节点key
  isArray?: boolean; // 是否为数组类型
  dataType?: 'string' | 'number' | 'boolean' | 'object' | 'array'; // 数据类型
  description?: string; // 节点描述
}
```

### PathBuildOptions 接口

```tsx
interface PathBuildOptions {
  arrayIndexPlaceholder?: string; // 数组索引占位符，默认为 '0'
  pathSeparator?: string; // 路径分隔符，默认为 '.'
  wrapWithBraces?: boolean; // 是否用双大括号包装，默认为 true
  includeArrayBrackets?: boolean; // 是否包含数组括号，默认为 true
}
```

### SmartVariableInputRef 方法

| 方法           | 参数               | 返回值   | 说明           |
| -------------- | ------------------ | -------- | -------------- |
| showPopover    | -                  | `void`   | 显示变量选择器 |
| hidePopover    | -                  | `void`   | 隐藏变量选择器 |
| insertVariable | `variable: string` | `void`   | 插入变量       |
| getContent     | -                  | `string` | 获取输入内容   |
| setContent     | `content: string`  | `void`   | 设置输入内容   |

## 路径构建规则

### 对象属性访问

```tsx
// 数据结构
{
  key: 'user',
  title: 'user',
  children: [
    { key: 'user.name', title: 'name' }
  ]
}

// 生成路径：{{user.name}}
```

### 数组元素访问

```tsx
// 数据结构
{
  key: 'products',
  title: 'products',
  isArray: true,
  children: [
    { key: 'products.name', title: 'name' }
  ]
}

// 生成路径：{{products[0].name}}
```

### 嵌套结构

```tsx
// 数据结构
{
  key: 'order',
  title: 'order',
  children: [
    {
      key: 'order.items',
      title: 'items',
      isArray: true,
      children: [
        { key: 'order.items.name', title: 'name' }
      ]
    }
  ]
}

// 生成路径：{{order.items[0].name}}
```

## 高级用法

### 自定义路径选项

```tsx
const pathOptions = {
  arrayIndexPlaceholder: 'i', // 使用 'i' 作为数组索引
  pathSeparator: '->', // 使用 '->' 作为分隔符
  wrapWithBraces: false, // 不使用双大括号包装
  includeArrayBrackets: false, // 不包含数组括号
};

<SmartVariableInput variables={variables} pathOptions={pathOptions} />;

// 生成路径：user->name (而不是 {{user.name}})
```

### 编程式控制

```tsx
const inputRef = useRef<SmartVariableInputRef>(null);

// 显示变量选择器
const handleShowVariables = () => {
  inputRef.current?.showPopover();
};

// 插入预定义变量
const handleInsertUser = () => {
  inputRef.current?.insertVariable('user.name');
};

// 获取当前内容
const handleGetContent = () => {
  const content = inputRef.current?.getContent();
  console.log('当前内容:', content);
};

// 设置内容
const handleSetContent = () => {
  inputRef.current?.setContent('Hello {{user.name}}!');
};
```

### 数据类型和描述

```tsx
const variables = [
  {
    key: 'user',
    title: 'user',
    dataType: 'object',
    description: '用户信息对象',
    children: [
      {
        key: 'user.name',
        title: 'name',
        dataType: 'string',
        description: '用户姓名',
      },
      {
        key: 'user.age',
        title: 'age',
        dataType: 'number',
        description: '用户年龄',
      },
    ],
  },
];
```

## 工具函数

组件还提供了一些实用的工具函数：

```tsx
import {
  buildAdvancedVariablePath,
  validateVariablePath,
  extractVariableName,
  formatTreeData,
} from './utils';

// 构建变量路径
const path = buildAdvancedVariablePath(node, treeData, options);

// 验证路径格式
const isValid = validateVariablePath('{{user.name}}');

// 提取变量名
const varName = extractVariableName('{{user.name}}'); // 返回: 'user.name'

// 格式化树数据
const formatted = formatTreeData(rawData);
```

## 样式自定义

组件使用了 `index.less` 文件来定义样式，你可以通过覆盖 CSS 类来自定义外观：

```less
.smart-variable-input {
  .editor {
    border: 1px solid #d9d9d9;
    border-radius: 6px;

    &:focus {
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  .popover {
    background: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08);
  }
}
```

## 注意事项

1. **叶子节点限制**：只有叶子节点（没有子节点的节点）才能被选择插入
2. **键值唯一性**：确保所有节点的 `key` 值在整个树中是唯一的
3. **数组标识**：需要在数组类型的节点上设置 `isArray: true`
4. **性能考虑**：对于大型树结构，建议使用虚拟滚动或分页加载

## 示例项目

查看 `demo.tsx` 文件获取完整的使用示例，包括：

- 基本用法演示
- 路径选项配置
- 编程式 API 调用
- 复杂数据结构处理

## 更新日志

### v1.0.0

- 初始版本发布
- 支持基本的变量选择和路径构建
- 提供完整的 TypeScript 类型支持
- 包含详细的文档和示例
