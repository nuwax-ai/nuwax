# DesignViewer 查找替换规则用例文档

## 概述

本文档详细梳理了 `applyDesignChanges.ts` 中使用的 `smartReplaceInSource` 函数的查找替换规则和已支持的用例。该函数负责将 DesignViewer 中的样式和内容修改应用到源代码文件中。

> 📝 **文档说明**: 本文档整合了查找替换规则说明和详细测试用例，包含样式替换、内容替换、属性替换的完整规则，以及多行内容替换、模糊标签匹配、dangerouslySetInnerHTML 处理等关键场景的测试用例。

> 🔗 **相关文档**: 本文档是 [DesignViewer Design 模式开发指南](./DesignViewer-Design-Mode-Guide.md) 的补充文档，详细说明了变更应用到源代码的实现细节。

## 替换类型

`smartReplaceInSource` 支持三种替换类型：

1. **`style`** - 样式替换（className）
2. **`content`** - 内容替换（元素文本内容）
3. **`attribute`** - 属性替换（其他 HTML 属性）

## 样式替换 (style)

### 功能描述

替换元素的 `className` 属性值，支持多种格式和多行搜索。

### 替换策略

#### 1. 单行替换（优先级最高）

在当前行查找并替换 `className` 属性。

**支持的格式：**

```tsx
// 格式 1: className="..."
<div className="old-class">Content</div>
// 替换为: <div className="new-class">Content</div>

// 格式 2: className='...'
<div className='old-class'>Content</div>
// 替换为: <div className='new-class'>Content</div>

// 格式 3: className={...}
<div className={oldClass}>Content</div>
// 替换为: <div className="new-class">Content</div>
// 注意：表达式会被转换为字符串格式
```

#### 2. 多行搜索（最多 15 行）

如果当前行没有找到 `className`，会向后搜索最多 15 行。

**用例：多行属性**

```tsx
// 输入代码
<div
  id="container"
  className="old-class"
  onClick={handleClick}
>
  Content
</div>

// 替换请求
{
  "type": "style",
  "sourceInfo": {
    "lineNumber": 1,  // 指向 <div 行
    "columnNumber": 1
  },
  "newValue": "new-class"
}

// 预期输出
<div
  id="container"
  className="new-class"
  onClick={handleClick}
>
  Content
</div>
```

**搜索停止条件：**

- 遇到 `>`（标签结束）
- 遇到 `/>`（自闭合标签）
- 遇到 `</`（闭合标签）
- 搜索超过 15 行

#### 3. 自动插入 className

如果找不到 `className` 属性，会在标签名后自动插入。

**用例：缺少 className**

```tsx
// 输入代码
<div id="container">Content</div>

// 替换请求
{
  "type": "style",
  "sourceInfo": {
    "lineNumber": 1,
    "columnNumber": 1
  },
  "newValue": "new-class"
}

// 预期输出
<div id="container" className="new-class">Content</div>
```

### 已支持的用例

#### ✅ 用例 1: 单行 className 字符串替换

```tsx
// 输入
<div className="text-red-500 bg-blue-600">Hello</div>

// 替换: "text-red-500 bg-blue-600" → "text-green-500 bg-yellow-600"

// 输出
<div className="text-green-500 bg-yellow-600">Hello</div>
```

#### ✅ 用例 2: 单行 className 表达式替换

```tsx
// 输入
<div className={clsx("base", condition && "active")}>Hello</div>

// 替换: 表达式 → "text-red-500"

// 输出
<div className="text-red-500">Hello</div>
// 注意：表达式会被转换为字符串格式
```

#### ✅ 用例 3: 多行 className 替换

```tsx
// 输入
<div
  id="wrapper"
  className="old-class"
  data-testid="test"
>
  Content
</div>

// 替换请求: lineNumber=1 (指向 <div 行)

// 输出
<div
  id="wrapper"
  className="new-class"
  data-testid="test"
>
  Content
</div>
```

#### ✅ 用例 4: 自动插入 className

```tsx
// 输入
<button onClick={handleClick}>Click me</button>

// 替换请求: newValue="btn-primary"

// 输出
<button className="btn-primary" onClick={handleClick}>Click me</button>
```

### 限制和注意事项

1. **表达式转换**：`className={...}` 表达式会被转换为字符串格式，可能丢失动态逻辑
2. **搜索范围**：多行搜索限制在 15 行内
3. **属性顺序**：自动插入的 `className` 会放在标签名后，可能不符合代码风格

## 内容替换 (content)

### 功能描述

替换元素的文本内容，支持单行和多行替换，以及模糊标签匹配。

### 替换策略

#### 1. 单行精确匹配（优先级最高）

在当前行查找并替换原始内容。

**用例：单行内容替换**

```tsx
// 输入
<h1 className="title">Old Text</h1>

// 替换请求
{
  "type": "content",
  "sourceInfo": {
    "lineNumber": 1,
    "columnNumber": 1
  },
  "newValue": "New Text",
  "originalValue": "Old Text"
}

// 输出
<h1 className="title">New Text</h1>
```

#### 2. 多行精确匹配（最多 20 行）

如果当前行没有找到，会向后搜索最多 20 行。

**用例：多行内容搜索**

```tsx
// 输入
<div className="container">
  <h1>Old Text</h1>
  <p>Other content</p>
</div>

// 替换请求: lineNumber=1, originalValue="Old Text"

// 输出
<div className="container">
  <h1>New Text</h1>
  <p>Other content</p>
</div>
```

#### 3. 结构替换（模糊匹配）

如果精确匹配失败，使用 `columnNumber` 或 `tagName` 进行结构替换。

**策略 A: 基于 columnNumber**

```tsx
// 输入
<div className="wrapper">
  <h1 className="title">Old Content</h1>
</div>

// 替换请求
{
  "type": "content",
  "sourceInfo": {
    "lineNumber": 2,
    "columnNumber": 7,  // 指向 <h1 的位置
    "elementType": "h1"
  },
  "newValue": "New Content"
}

// 输出
<div className="wrapper">
  <h1 className="title">New Content</h1>
</div>
```

**策略 B: 基于 tagName 模糊搜索（最多 300 行）**

当 SourceMap 行号不准确时，使用标签名进行模糊搜索。

```tsx
// 输入
const Home = () => {
  // SourceMap 错误指向这里（lineNumber: 2）
  return (
    <div className="container">
      {/* ... 很多行 ... */}
      {/* 实际元素在第 15 行 */}
      <h1 className="title">Old Content</h1>
    </div>
  );
};

// 替换请求
{
  "type": "content",
  "sourceInfo": {
    "lineNumber": 2,  // SourceMap 不准确
    "tagName": "h1"   // 使用标签名进行模糊搜索
  },
  "newValue": "New Content"
}

// 预期行为
// 1. 从第 2 行开始向下搜索最多 300 行
// 2. 找到第一个 <h1 标签（第 15 行）
// 3. 替换内容

// 输出
const Home = () => {
  return (
    <div className="container">
      {/* ... 很多行 ... */}
      <h1 className="title">New Content</h1>
    </div>
  );
};
```

#### 4. 多行元素替换

支持替换跨越多行的元素内容。

**用例：多行内容替换**

```tsx
// 输入
<div className="wrapper">
  <h1 className="title">
    Line 1
    Line 2
    Line 3
  </h1>
  <p>Footer</p>
</div>

// 替换请求
{
  "type": "content",
  "sourceInfo": {
    "lineNumber": 2,
    "columnNumber": 7,
    "elementType": "h1"
  },
  "newValue": "Fixed Content",
  "originalValue": "Line 1\nLine 2\nLine 3"
}

// 输出
<div className="wrapper">
  <h1 className="title">Fixed Content</h1>
  <p>Footer</p>
</div>
```

**替换逻辑：**

1. 在第 2 行找到起始标签 `<h1...>`
2. 向下搜索找到闭合标签 `</h1>`（第 6 行）
3. 识别替换范围：第 2-6 行
4. 构建新内容：`<h1 className="title">Fixed Content</h1>`
5. 使用 `lines.splice(2, 5, newLine)` 替换多行为单行

#### 5. dangerouslySetInnerHTML 处理

自动移除 `dangerouslySetInnerHTML` 属性并转换为普通子元素。

**用例：dangerouslySetInnerHTML 转换**

```tsx
// 输入
<div
  className="container"
  dangerouslySetInnerHTML={{ __html: 'Old Content' }}
/>

// 替换请求: newValue="New Content"

// 输出
<div className="container">New Content</div>
```

**处理逻辑：**

1. 检测到 `dangerouslySetInnerHTML` 属性
2. 移除该属性
3. 将自闭合标签转换为普通标签
4. 插入新内容作为子元素

#### 6. 自闭合标签处理

将自闭合标签转换为普通标签并添加内容。

**用例：自闭合标签转换**

```tsx
// 输入
<div className="container" />

// 替换请求: newValue="New Content"

// 输出
<div className="container">New Content</div>
```

### 已支持的用例

#### ✅ 用例 1: 单行内容精确替换

```tsx
// 输入
<p>Old Text</p>

// 替换: "Old Text" → "New Text"

// 输出
<p>New Text</p>
```

#### ✅ 用例 2: 多行内容精确替换

```tsx
// 输入
<div>
  <h1>Old Text</h1>
</div>

// 替换请求: lineNumber=1, originalValue="Old Text"

// 输出
<div>
  <h1>New Text</h1>
</div>
```

#### ✅ 用例 3: 跨行内容替换

```tsx
// 输入
<h1 className="title">
  Line 1
  Line 2
  Line 3
</h1>

// 替换请求: originalValue="Line 1\nLine 2\nLine 3"

// 输出
<h1 className="title">New Content</h1>
```

#### ✅ 用例 4: 模糊标签匹配

```tsx
// 输入（SourceMap 不准确）
const Component = () => {
  // lineNumber: 2 (错误)
  return (
    <div>
      {/* ... 很多行 ... */}
      <h1>Content</h1> {/* 实际在第 20 行 */}
    </div>
  );
};

// 替换请求: tagName="h1"

// 输出
const Component = () => {
  return (
    <div>
      {/* ... 很多行 ... */}
      <h1>New Content</h1>
    </div>
  );
};
```

#### ✅ 用例 5: dangerouslySetInnerHTML 转换

```tsx
// 输入
<div dangerouslySetInnerHTML={{ __html: 'Old' }} />

// 替换: newValue="New"

// 输出
<div>New</div>
```

#### ✅ 用例 6: 自闭合标签转换

```tsx
// 输入
<div className="container" />

// 替换: newValue="Content"

// 输出
<div className="container">Content</div>
```

### 限制和注意事项

1. **嵌套同名标签**：对于嵌套的同名标签（如 `<div><div></div></div>`），可能匹配到错误的闭合标签

   - **当前实现**：查找起始标签后的第一个 `</tag>`
   - **限制**：未追踪标签深度，可能被嵌套标签混淆
   - **适用场景**：对于叶子节点（如 `<h1>`, `<p>`）通常足够

2. **搜索范围限制**：

   - 精确匹配：最多 20 行
   - 模糊匹配：最多 300 行

3. **内容安全替换**：使用 `safeReplaceContentInLine` 函数，避免替换标签内的内容

## 属性替换 (attribute)

### 功能描述

替换元素的 HTML 属性值（非 className）。

### 替换策略

**单行属性替换**

在当前行查找并替换指定属性。

**支持的格式：**

```tsx
// 格式: attributeName="value"
<div id="old-id">Content</div>
// 替换为: <div id="new-id">Content</div>
```

### 已支持的用例

#### ✅ 用例 1: 单行属性替换

```tsx
// 输入
<div id="container" className="wrapper">Content</div>

// 替换请求
{
  "type": "attribute",
  "sourceInfo": {
    "lineNumber": 1,
    "columnNumber": 1
  },
  "attributeName": "id",
  "newValue": "new-container"
}

// 输出
<div id="new-container" className="wrapper">Content</div>
```

### 限制和注意事项

1. **仅支持单行**：属性替换仅在目标行处理，不支持多行搜索
2. **格式限制**：仅支持 `attributeName="value"` 格式，不支持表达式
3. **匹配失败**：如果找不到属性，会返回原行并输出警告

## 批量替换处理

### 排序策略

`applyDesignChanges` 函数会按位置从后往前排序所有变更，防止索引偏移。

```typescript
const sortedChanges = [...changes].sort((a, b) => {
  if (a.sourceInfo.lineNumber !== b.sourceInfo.lineNumber) {
    return b.sourceNumber - a.sourceInfo.lineNumber; // 行号倒序
  }
  return b.sourceInfo.columnNumber - a.sourceInfo.columnNumber; // 列号倒序
});
```

### 用例：批量替换

```tsx
// 输入
<div className="old-1">
  <h1 className="old-2">Old Text</h1>
  <p className="old-3">Other</p>
</div>

// 批量替换请求
[
  {
    "type": "style",
    "sourceInfo": { "lineNumber": 1, "columnNumber": 1 },
    "newValue": "new-1"
  },
  {
    "type": "style",
    "sourceInfo": { "lineNumber": 2, "columnNumber": 3 },
    "newValue": "new-2"
  },
  {
    "type": "style",
    "sourceInfo": { "lineNumber": 3, "columnNumber": 3 },
    "newValue": "new-3"
  }
]

// 处理顺序（从后往前）
// 1. 第 3 行: old-3 → new-3
// 2. 第 2 行: old-2 → new-2
// 3. 第 1 行: old-1 → new-1

// 输出
<div className="new-1">
  <h1 className="new-2">Old Text</h1>
  <p className="new-3">Other</p>
</div>
```

## 错误处理

### 错误类型

1. **行号超出范围**

   ```typescript
   if (targetLine >= lines.length) {
     throw new Error(`Line ${options.lineNumber} exceeds file length`);
   }
   ```

2. **替换失败**

   - 样式替换：输出警告，返回原内容
   - 内容替换：输出警告，返回原内容
   - 属性替换：输出警告，返回原行

3. **批量替换中的错误**
   ```typescript
   try {
     updatedContent = await smartReplaceInSource(updatedContent, {...});
   } catch (error) {
     console.error('[DesignViewer] Apply change failed:', error, change);
     // 继续处理其他修改，避免整个保存失败
   }
   ```

### 错误恢复策略

- **单个替换失败**：记录错误日志，继续处理其他替换
- **批量替换**：即使部分替换失败，也会尝试完成其他替换
- **返回原内容**：替换失败时返回原始内容，避免破坏文件

## 已知问题和限制

### 1. 嵌套同名标签问题

**问题描述：**

对于嵌套的同名标签，可能匹配到错误的闭合标签。

```tsx
// 输入
<div className="outer">
  <div className="inner">Content</div>
</div>

// 如果替换内部 div 的内容，可能匹配到外部 div 的闭合标签
```

**当前实现：**

- 查找起始标签后的第一个 `</tag>`
- 未追踪标签深度

**建议：**

- 对于叶子节点（如 `<h1>`, `<p>`）通常足够
- 对于容器元素，建议使用更精确的定位方式

### 2. 表达式转换问题

**问题描述：**

`className={...}` 表达式会被转换为字符串格式，可能丢失动态逻辑。

```tsx
// 输入
<div className={clsx("base", condition && "active")} />

// 替换后
<div className="new-class" />
// 丢失了条件逻辑
```

**建议：**

- 仅替换静态 className
- 避免替换包含表达式的 className

### 3. 多行替换的性能问题

**问题描述：**

对于非常大的文件，多行搜索（特别是 300 行的模糊匹配）可能影响性能。

**当前实现：**

- 精确匹配：最多 20 行
- 模糊匹配：最多 300 行

**建议：**

- 优化搜索算法
- 考虑使用 AST 解析器进行更精确的定位

### 4. 属性顺序问题

**问题描述：**

自动插入的 `className` 会放在标签名后，可能不符合代码风格。

```tsx
// 输入
<div id="container" data-testid="test">Content</div>

// 自动插入 className 后
<div className="new-class" id="container" data-testid="test">Content</div>
// className 在 id 前面，可能不符合代码风格
```

**建议：**

- 遵循项目的代码风格规范
- 考虑使用 Prettier 等工具自动格式化

## 详细测试用例

### 内容替换多行场景

#### 问题背景

当源代码中的原始内容跨越多行时，内容替换需要支持多行范围替换。之前的实现仅支持单行替换，导致多行内容替换失败。

#### 用例 1: 多行内容替换（基础场景）

**输入代码:**

```tsx
function Home() {
  return (
    <div className="wrapper">
      {/* 目标元素 */}
      <h1 className="title">Line 1 Line 2 Line 3</h1>
      <p>Footer</p>
    </div>
  );
}
```

**替换请求:**

```json
{
  "type": "content",
  "sourceInfo": {
    "fileName": ".../Home.tsx",
    "lineNumber": 5,
    "columnNumber": 7,
    "elementType": "h1"
  },
  "newValue": "Fixed Content",
  "originalValue": "Line 1\nLine 2\nLine 3"
}
```

**预期输出:**

```tsx
function Home() {
  return (
    <div className="wrapper">
      {/* 目标元素 */}
      <h1 className="title">Fixed Content</h1>
      <p>Footer</p>
    </div>
  );
}
```

**替换逻辑验证:**

`smartReplaceInSource` 函数已更新为支持替换**多行范围**。

1. **检测**: `smartReplaceContentMultiLine` 在第 5 行找到起始标签 `<h1...>`。
2. **搜索**: 向下扫描以找到匹配的闭合标签 `</h1>`。
   - 在第 9 行找到。
3. **范围识别**: 待替换内容跨越第 5 行到第 9 行。
4. **构建**: 构建一个新的单行内容: `<h1 className='title'>Fixed Content</h1>`。
5. **替换**: 调用 `lines.splice(5, 5, newLine)` 将这 5 行替换为 1 行新代码。

#### 用例 2: 模糊标签匹配（行号不准确）

**场景**: SourceMap 提供的行号不准确（例如 SourceMap 指向第 5 行，但元素实际在第 16 行），需要通过 `tagName` 进行模糊搜索。

**输入代码:**

```tsx
const Home = () => {
  // Line 5 (SourceMap 错误指向这里)
  return (
    <div className="container">
      {/* ... 很多行 ... */}
      {/* 目标元素在第 16 行 */}
      <h1
        className="title"
        dangerouslySetInnerHTML={{ __html: 'Old Slogan' }}
      />
    </div>
  );
};
```

**替换请求:**

```json
{
  "type": "content",
  "sourceInfo": {
    "lineNumber": 5,
    "tagName": "h1"
  },
  "newValue": "New Slogan",
  "originalValue": "Old Slogan"
}
```

**预期行为:**

- 系统应在第 5 行附近（向下搜索最多 300 行）找到第一个 `<h1` 标签（即第 16 行）。
- 成功替换内容为 `New Slogan`。
- 自动移除 `dangerouslySetInnerHTML` 属性并转换为普通子元素。

**预期输出:**

```tsx
const Home = () => {
  return (
    <div className="container">
      {/* ... 很多行 ... */}
      <h1 className="title">New Slogan</h1>
    </div>
  );
};
```

#### 用例 3: dangerouslySetInnerHTML 属性处理

**场景**: 目标元素包含 `dangerouslySetInnerHTML` 属性，替换内容时应移除该属性并将其转为普通子元素。

**输入代码:**

```tsx
<div dangerouslySetInnerHTML={{ __html: 'foo' }} />
```

**替换请求:**

```json
{
  "type": "content",
  "sourceInfo": {
    "lineNumber": 1,
    "columnNumber": 1
  },
  "newValue": "bar"
}
```

**预期输出:**

```tsx
<div>bar</div>
```

**处理逻辑:**

1. 检测到 `dangerouslySetInnerHTML` 属性
2. 移除该属性（包括整个表达式）
3. 将自闭合标签转换为普通标签
4. 插入新内容作为子元素

### 覆盖的边缘情况

#### ✅ 自闭合标签

由现有逻辑处理，自动转换为普通标签并添加内容。

```tsx
// 输入
<div className="container" />

// 替换: newValue="Content"

// 输出
<div className="container">Content</div>
```

#### ✅ 多行属性

查找 `>` 的逻辑已处理此情况，可以正确识别标签结束位置。

```tsx
// 输入
<div
  id="container"
  className="wrapper"
  data-testid="test"
>
  Content
</div>

// 替换: className="new-wrapper"

// 输出
<div
  id="container"
  className="new-wrapper"
  data-testid="test"
>
  Content
</div>
```

#### ⚠️ 嵌套同名标签（已知限制）

**问题描述：**

简单的标签匹配可能会被嵌套的同类型标签混淆（例如 `<div><div></div></div>`）。目前的逻辑是查找起始标签后的第一个 `</tag>`。

**当前实现检查：**

目前**未**追踪深度。这是一个已知限制，但对于报告的 `h1` 情况（通常是叶子节点）已经足够。

**示例：**

```tsx
// 输入
<div className="outer">
  <div className="inner">Content</div>
</div>

// 如果替换内部 div 的内容，可能匹配到外部 div 的闭合标签
// 建议：对于容器元素，使用更精确的定位方式
```

### 测试用例建议

#### 样式替换测试

```typescript
describe('Style Replacement', () => {
  it('should replace single-line className string', () => {
    // 测试用例 1
  });

  it('should replace multi-line className', () => {
    // 测试用例 2
  });

  it('should insert className if not found', () => {
    // 测试用例 3
  });

  it('should handle className expression', () => {
    // 测试用例 4
  });
});
```

#### 内容替换测试

```typescript
describe('Content Replacement', () => {
  it('should replace single-line content', () => {
    // 测试用例 1
  });

  it('should replace multi-line content', () => {
    // 测试用例 2 - 多行内容替换
  });

  it('should handle fuzzy tag matching', () => {
    // 测试用例 3 - 模糊标签匹配
  });

  it('should convert dangerouslySetInnerHTML', () => {
    // 测试用例 4 - dangerouslySetInnerHTML 转换
  });

  it('should handle nested tags correctly', () => {
    // 测试用例 5（边界情况）- 嵌套同名标签
  });

  it('should handle self-closing tags', () => {
    // 测试用例 6 - 自闭合标签
  });
});
```

#### 批量替换测试

```typescript
describe('Batch Replacement', () => {
  it('should handle multiple replacements in correct order', () => {
    // 测试用例 1 - 从后往前排序
  });

  it('should continue on single replacement failure', () => {
    // 测试用例 2 - 错误恢复
  });
});
```

## 改进建议

### 1. 使用 AST 解析器

**当前方案：** 基于正则表达式和字符串匹配

**建议方案：** 使用 Babel 或 TypeScript 编译器 API 进行 AST 解析

**优势：**

- 更精确的元素定位
- 正确处理嵌套标签
- 保留代码格式和注释

### 2. 增强错误处理

**当前方案：** 输出警告，返回原内容

**建议方案：**

- 提供详细的错误信息
- 支持错误恢复策略
- 记录替换失败的原因

### 3. 性能优化

**当前方案：** 线性搜索，最多 300 行

**建议方案：**

- 使用索引加速搜索
- 限制搜索范围
- 缓存解析结果

### 4. 支持更多格式

**当前限制：**

- 属性替换仅支持字符串格式
- 不支持 JSX 表达式

**建议方案：**

- 支持更多属性格式
- 支持 JSX 表达式替换（需要 AST）

## 总结

`smartReplaceInSource` 函数提供了三种替换类型（style、content、attribute），支持单行和多行替换，以及模糊标签匹配。虽然存在一些限制（如嵌套标签、表达式转换），但对于大多数常见场景已经足够。

**关键要点：**

1. **样式替换**：支持多行搜索和自动插入
2. **内容替换**：支持多行替换和模糊匹配
3. **批量替换**：从后往前处理，避免索引偏移
4. **错误处理**：单个失败不影响其他替换

**使用建议：**

1. 优先使用精确匹配（提供准确的 `originalValue`）
2. 对于复杂场景，使用 `tagName` 进行模糊匹配
3. 避免替换包含表达式的 className
4. 对于嵌套标签，使用更精确的定位方式

---

**文档版本**：v1.0.0  
**最后更新**：2025-12-09  
**维护者**：DesignViewer 开发团队
