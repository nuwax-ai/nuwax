# VariableInput 组件

一个支持变量插入的富文本输入组件，允许用户在文本中插入预定义的变量，并以可视化方式展示。

## 功能特性

### 🎯 核心功能

- **变量插入**: 支持通过 `{{variable}}` 语法插入变量
- **智能提示**: 输入 `{` 字符时自动显示变量选择下拉树
- **变量过滤**: 支持实时搜索过滤变量选项
- **键盘导航**: 支持方向键、回车键、ESC 键操作
- **鼠标选择**: 支持鼠标点击选择变量
- **整块删除**: 变量块作为整体删除，不能部分编辑
- **高亮显示**: 插入的变量以黄色高亮背景显示

### 🔧 技术特性

- 基于 `contentEditable` 实现富文本编辑
- 集成 Ant Design Tree 组件
- 支持自定义树形数据结构
- 智能光标定位和选择
- 响应式下拉框定位

## 基本用法

### 基础示例

```tsx
import React, { useState } from 'react';
import VariableInput from '@/components/VariableInput';

const MyComponent = () => {
  const [content, setContent] = useState('');

  return (
    <VariableInput
      onChange={(value) => setContent(value)}
      style={{ width: '100%' }}
    />
  );
};
```

### 自定义变量数据

```tsx
import React from 'react';
import VariableInput from '@/components/VariableInput';
import type { DataNode } from 'antd/es/tree';

const customTreeData: DataNode[] = [
  {
    title: '用户信息',
    key: 'userinfo',
    children: [
      { title: '用户姓名', key: 'username' },
      { title: '用户邮箱', key: 'useremail' },
      { title: '用户年龄', key: 'userage' },
    ],
  },
  {
    title: '系统信息',
    key: 'systeminfo',
    children: [
      { title: '当前时间', key: 'currenttime' },
      { title: '系统版本', key: 'version' },
    ],
  },
];

const CustomVariableInput = () => {
  return (
    <VariableInput
      treeData={customTreeData}
      onChange={(value) => console.log('内容变化:', value)}
      style={{ width: 600 }}
    />
  );
};
```

## Props 接口

### VariableInputProps

| 属性名 | 类型 | 必需 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `style` | `React.CSSProperties` | 否 | - | 组件容器的自定义样式 |
| `treeData` | `DataNode[]` | 否 | `TREE_DATA` | 变量树的配置数据 |
| `onChange` | `(val: string) => void` | 否 | - | 内容变化回调函数 |

### DataNode 结构

```typescript
interface DataNode {
  title: string; // 节点显示标题
  key: string; // 节点唯一标识符
  children?: DataNode[]; // 子节点数组
}
```

## 使用说明

### 1. 变量插入操作

#### 方法一：键盘操作

1. 在编辑区域输入 `{` 字符
2. 系统自动显示变量选择下拉树
3. 使用 `↑` `↓` 方向键导航
4. 按 `Enter` 键确认选择
5. 按 `Esc` 键取消操作

#### 方法二：鼠标操作

1. 在编辑区域输入 `{` 字符
2. 下拉树显示后，用鼠标点击选择变量
3. 点击后变量自动插入到文本中

#### 方法三：搜索过滤

1. 输入 `{` 后，继续输入字母进行搜索
2. 下拉树会实时过滤匹配的变量
3. 选择匹配的变量插入

### 2. 变量块操作

#### 变量显示

- 插入的变量以黄色背景高亮显示：`{{变量名}}`
- 变量块不可编辑（contenteditable="false"）
- 变量块不可选中（user-select="none"）

#### 变量删除

- 将光标定位到变量块旁边
- 按 `Backspace` 或 `Delete` 键
- 系统会删除整个变量块而不是部分字符

### 3. 编辑区域功能

#### 支持的文本操作

- 常规文本输入和编辑
- 换行和段落分隔
- 复制粘贴操作
- 撤销重做操作（浏览器原生）

#### 不支持的操作

- 直接编辑变量块内容
- 选中变量块内的部分文字
- 对变量块应用富文本格式

## 默认变量数据

组件内置了以下默认变量数据：

```typescript
const TREE_DATA: DataNode[] = [
  {
    title: '用户信息',
    key: 'userinfo',
    children: [
      { title: '姓名', key: 'name' },
      { title: '邮箱', key: 'email' },
      { title: '手机号', key: 'phone' },
    ],
  },
  {
    title: '订单信息',
    key: 'orderinfo',
    children: [
      { title: '订单号', key: 'orderId' },
      { title: '金额', key: 'amount' },
      { title: '日期', key: 'date' },
    ],
  },
  {
    title: '地址',
    key: 'address',
    children: [
      { title: '城市', key: 'city' },
      { title: '区县', key: 'district' },
    ],
  },
];
```

## 实际应用场景

### 1. 表单模板编辑

```tsx
const EmailTemplate = () => {
  const [template, setTemplate] = useState('');

  const templateText = `尊敬的 {{name}} 用户，
    
您的订单 {{orderId}} 已经确认，金额为 {{amount}} 元。
预计送达日期：{{date}}

如有问题请联系：{{phone}}`;

  return (
    <div>
      <h3>邮件模板编辑</h3>
      <VariableInput onChange={setTemplate} treeData={emailTemplateTreeData} />
      <h4>预览效果:</h4>
      <div
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          whiteSpace: 'pre-wrap',
          backgroundColor: '#f5f5f5',
        }}
      >
        {template}
      </div>
    </div>
  );
};
```

### 2. 文档模板系统

```tsx
const DocumentTemplate = () => {
  const [content, setContent] = useState('');

  return (
    <VariableInput
      treeData={documentVariables}
      onChange={setContent}
      style={{ width: '100%', minHeight: '200px' }}
    />
  );
};
```

### 3. 代码生成模板

```tsx
const CodeTemplate = () => {
  const [codeTemplate, setCodeTemplate] = useState('');

  const codeVariables: DataNode[] = [
    {
      title: '变量',
      key: 'vars',
      children: [
        { title: '函数名', key: 'functionName' },
        { title: '参数列表', key: 'parameters' },
        { title: '返回值类型', key: 'returnType' },
      ],
    },
  ];

  return (
    <div>
      <h3>代码模板</h3>
      <VariableInput treeData={codeVariables} onChange={setCodeTemplate} />
      <pre>{codeTemplate}</pre>
    </div>
  );
};
```

## 样式自定义

### 变量块样式

变量块的样式通过内联样式定义，可以通过修改 `blockStyle` 对象来自定义：

```tsx
const customBlockStyle: CSSProperties = {
  display: 'inline-block',
  background: '#e6f7ff', // 自定义背景色
  border: '1px solid #1890ff', // 自定义边框
  borderRadius: '6px',
  padding: '2px 8px',
  margin: '0 2px',
  color: '#1890ff', // 自定义文字颜色
  fontWeight: 'bold', // 自定义字体粗细
  userSelect: 'none',
};
```

### 下拉框样式

下拉框的样式在渲染时通过 style 对象定义，可以根据需要调整：

```tsx
// 在组件中使用时覆盖样式
<VariableInput
  style={
    {
      '--dropdown-bg': '#ffffff',
      '--dropdown-shadow': '0 4px 12px rgba(0,0,0,0.15)',
    } as React.CSSProperties
  }
  // ...
/>
```

## 事件处理

### onChange 回调

`onChange` 回调在以下情况下触发：

- 用户输入文本
- 插入变量
- 删除变量块
- 粘贴内容

回调函数接收当前的纯文本内容（不包含 HTML 标签）：

```tsx
const handleContentChange = (value: string) => {
  console.log('当前内容:', value);
  // value 类似于："你好 {{name}}，欢迎使用我们的服务！"
};
```

### 内容解析

如果需要解析变量，可以这样处理：

```tsx
const parseVariables = (content: string) => {
  const matches = content.match(/\{\{(\w+)\}\}/g);
  if (matches) {
    const variables = matches.map((match) => match.replace(/[{}]/g, ''));
    console.log('提取的变量:', variables);
    return variables;
  }
  return [];
};
```

## 注意事项

### 1. 内容安全

- 组件会过滤掉危险内容
- 不支持直接插入 HTML 标签
- 变量块具有内容不可编辑属性

### 2. 性能考虑

- 大量变量数据时注意性能优化
- 可以考虑对树数据进行虚拟滚动
- 避免频繁的重新渲染

### 3. 浏览器兼容性

- 需要现代浏览器支持（Chrome 60+, Firefox 55+, Safari 12+）
- 依赖 Selection API 和 Range API
- contentEditable 在移动端可能有兼容性问题

### 4. 输入验证

- 变量名只能包含字母、数字和下划线
- 支持嵌套变量结构
- 自动处理光标位置避免变量块内部

## 故障排除

### 常见问题

**Q: 变量插入失败？** A: 检查变量名是否包含特殊字符，确保符合 `{变量名}` 格式。

**Q: 下拉框位置不正确？** A: 检查容器元素是否有定位属性，确保编辑器在可见区域内。

**Q: 键盘操作无响应？** A: 确保编辑器获得焦点，检查是否有其他事件处理器阻止了默认行为。

**Q: 变量块样式异常？** A: 检查 CSS 样式是否冲突，确保 `.var-block` 类名没有被覆盖。

### 调试技巧

```tsx
// 开启调试模式
const debugMode = true;

const handleInput = () => {
  if (debugMode && editorRef.current) {
    console.log('当前内容:', editorRef.current.innerText);
    console.log('选择状态:', window.getSelection()?.toString());
  }
  // ... 其他逻辑
};
```

## 版本信息

- **当前版本**: v1.0.0
- **依赖**: React 18+, Ant Design 5.x
- **兼容性**: 现代浏览器
- **维护状态**: 活跃维护

## 更新日志

### v1.0.0 (2024-11-18)

- 初始版本发布
- 实现基础变量插入功能
- 支持键盘和鼠标操作
- 集成 Ant Design Tree 组件
- 添加变量过滤和搜索功能

---

**作者**: Claude AI Assistant  
**最后更新**: 2024-11-18  
**联系方式**: 如有问题请联系开发团队
