# 内容替换测试用例

## 问题描述

当源代码中的原始内容跨越多行时，内容替换失败。之前的实现仅支持单行替换。

## 复现用例 (多行源码)

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

## 逻辑验证 (第四轮优化)

`smartReplaceInSource` 函数已更新为支持替换**多行范围**。

1. **检测**: `smartReplaceContentMultiLine` 在第 5 行找到起始标签 `<h1...>`。
2. **搜索**: 向下扫描以找到匹配的闭合标签 `</h1>`。
   - 在第 9 行找到。
3. **范围识别**: 待替换内容跨越第 5 行到第 9 行。
4. **构建**: 构建一个新的单行内容: `<h1 className='title'>Fixed Content</h1>`。
5. **替换**: 调用 `lines.splice(5, 5, newLine)` 将这 5 行替换为 1 行新代码。

## 覆盖的边缘情况

- **自闭合标签**: 由现有逻辑处理。
- **多行属性**: 查找 `>` 的逻辑已处理此情况。
- **嵌套同名标签**: _限制_ - 简单的标签匹配可能会被嵌套的同类型标签混淆 (例如 `<div><div></div></div>`)。目前的逻辑是查找起始标签后的第一个 `</tag>`。
  - _当前实现检查_: 目前**未**追踪深度。这是一个已知限制，但对于报告的 `h1` 情况（通常是叶子节点）已经足够。

## 其他边缘情况测试用例

### 1. 模糊标签匹配 (行号不准确)

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

### 2. `dangerouslySetInnerHTML` 属性处理

**场景**: 目标元素包含 `dangerouslySetInnerHTML` 属性，替换内容时应移除该属性并将其转为普通子元素。

**输入代码:**

```tsx
<div dangerouslySetInnerHTML={{ __html: 'foo' }} />
```

**预期输出:**

```tsx
<div>bar</div>
```
