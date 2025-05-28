# SmartVariableInput 组件功能说明

## 🎯 核心功能

### 1. 智能变量输入

- **自动触发**：输入 `{` 或 `{{` 时自动显示变量选择器
- **手动触发**：通过 ref 方法 `showPopover()` 手动显示选择器
- **智能插入**：自动清理未完成的输入，插入完整的变量格式

### 2. 树形变量选择

- **完整树结构**：支持多层嵌套的变量结构
- **父子节点选择**：父节点和叶子节点都可以被选择
- **路径构建**：自动构建完整的变量访问路径

### 3. 键盘导航

- **上下键**：`↑` `↓` 键选择树节点
- **回车确认**：`Enter` 键确认选择当前节点
- **ESC 关闭**：`Esc` 键关闭选择器
- **自动滚动**：选中节点自动滚动到可视区域

### 4. 智能路径构建

- **对象属性**：`user.name` → `{{user.name}}`
- **数组元素**：`products.name` → `{{products[0].name}}`
- **嵌套结构**：`order.items.name` → `{{order.items[0].name}}`
- **可配置**：支持自定义路径分隔符、数组索引等

### 5. 位置智能检测

- **左右对齐**：根据屏幕边界自动选择左对齐或右对齐
- **边界保护**：防止弹窗超出屏幕边界
- **光标跟随**：弹窗位置跟随光标位置

## 🔧 API 接口

### Props

```typescript
interface SmartVariableInputProps {
  variables: TreeNodeData[]; // 变量树数据
  placeholder?: string; // 占位符文本
  pathOptions?: PathBuildOptions; // 路径构建选项
}
```

### Ref 方法

```typescript
interface SmartVariableInputRef {
  showPopover: () => void; // 显示变量选择器
  hidePopover: () => void; // 隐藏选择器
  insertVariable: (variable: string) => void; // 插入变量
  getContent: () => string; // 获取内容
  setContent: (content: string) => void; // 设置内容
}
```

### 路径构建选项

```typescript
interface PathBuildOptions {
  arrayIndexPlaceholder?: string; // 数组索引占位符，默认 '0'
  pathSeparator?: string; // 路径分隔符，默认 '.'
  wrapWithBraces?: boolean; // 是否包装大括号，默认 true
  includeArrayBrackets?: boolean; // 是否包含数组括号，默认 true
}
```

## 📊 数据结构

### 变量树节点

```typescript
interface TreeNodeData {
  key: string; // 唯一标识
  title: string; // 显示名称
  value?: any; // 节点值
  children?: TreeNodeData[]; // 子节点
  isArray?: boolean; // 是否为数组类型
  path?: string[]; // 节点路径
}
```

## 🎨 样式定制

### CSS 类名

- `.smart-variable-input` - 主容器
- `.smart-variable-input .editor` - 编辑器
- `.smart-variable-input .placeholder` - 占位符
- `.smart-variable-input .popover` - 弹窗
- `.smart-variable-input .variable-highlight` - 变量高亮

### 主题变量

组件使用全局主题变量，支持主题切换：

- `@xagi-primary-color` - 主色调
- `@xagi-border-color-base` - 边框颜色
- `@xagi-font-size` - 字体大小
- `@xagi-padding-sm` - 内边距

## 🚀 使用示例

### 基础用法

```tsx
import SmartVariableInput from '@/components/SmartVariableInput';

const variables = [
  {
    key: 'user',
    title: '用户信息',
    children: [
      { key: 'user.name', title: '姓名', value: 'string' },
      { key: 'user.age', title: '年龄', value: 'number' },
    ],
  },
];

<SmartVariableInput
  variables={variables}
  placeholder="请输入内容，使用 { 触发变量选择"
/>;
```

### 高级配置

```tsx
const pathOptions = {
  arrayIndexPlaceholder: 'index',
  pathSeparator: '.',
  wrapWithBraces: true,
  includeArrayBrackets: true,
};

<SmartVariableInput
  variables={variables}
  pathOptions={pathOptions}
  ref={inputRef}
/>;
```

### Ref 方法调用

```tsx
const inputRef = useRef<SmartVariableInputRef>(null);

// 手动显示选择器
const handleShowSelector = () => {
  inputRef.current?.showPopover();
};

// 获取内容
const handleGetContent = () => {
  const content = inputRef.current?.getContent();
  console.log(content);
};
```

## 🔍 技术特性

### 性能优化

- **useMemo 缓存**：变量数据和扁平节点列表缓存
- **事件防抖**：输入事件防抖处理
- **懒加载**：按需渲染树节点

### 类型安全

- **完整类型定义**：所有接口都有 TypeScript 类型
- **类型推导**：支持变量类型自动推导
- **运行时检查**：关键操作有运行时类型检查

### 可访问性

- **键盘导航**：完整的键盘操作支持
- **焦点管理**：合理的焦点流转
- **屏幕阅读器**：支持屏幕阅读器访问

### 兼容性

- **React 18+**：支持最新 React 特性
- **现代浏览器**：支持主流现代浏览器
- **移动端**：响应式设计，支持移动端操作
