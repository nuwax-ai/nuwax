# HTML/XML Processing and Protection Rules

## 概述 (Overview)

TiptapVariableInput 组件需要处理用户输入的各种 HTML/XML 格式的内容，特别是在智能体编辑器的系统提示中常用的 XML 标签。本文档描述了这些内容的处理规则。

---

## 一、HTML/XML 标签转义规则 (Tag Escaping Rules)

位置: `utils/htmlUtils.ts` - `escapeCustomHTMLTags` 函数

### ✅ 需要转义的标签（自定义 XML 标签）

这些标签会被转义为 HTML 实体（`<` → `&lt;`，`>` → `&gt;`），防止被浏览器解析：

| 类型         | 示例                      | 转义后                          |
| ------------ | ------------------------- | ------------------------------- |
| 大写字母开头 | `<OutputFormat>`          | `&lt;OutputFormat&gt;`          |
| 包含下划线   | `<task_result>`           | `&lt;task_result&gt;`           |
| 包含连字符   | `<task-result>`           | `&lt;task-result&gt;`           |
| 带属性的标签 | `<task_result xxx="yyy">` | `&lt;task_result xxx="yyy"&gt;` |
| 自闭合标签   | `<OutputFormat />`        | `&lt;OutputFormat /&gt;`        |
| 结束标签     | `</task_result>`          | `&lt;/task_result&gt;`          |

### ❌ 不转义的标签（标准 HTML 标签）

标准 HTML 标签会被保留，交给 Tiptap/浏览器正常解析：

- 文档结构: `html`, `head`, `body`, `title`, `meta`, `link`, `script`, `style`
- 文本内容: `p`, `br`, `span`, `div`, `strong`, `b`, `em`, `i`, `u`, `s`, `code`, `pre`
- 标题: `h1` ~ `h6`
- 列表: `ul`, `ol`, `li`, `dl`, `dt`, `dd`
- 链接和媒体: `a`, `img`, `audio`, `video`, `iframe`, `canvas`, `svg`
- 表格: `table`, `tr`, `td`, `th`, `thead`, `tbody`, `tfoot`
- 表单: `form`, `input`, `button`, `select`, `textarea`, `label`
- 语义化: `header`, `footer`, `main`, `nav`, `aside`, `section`, `article`

### 判断逻辑

```typescript
// 是否需要转义的判断规则
function isCustomXmlTag(tagName: string): boolean {
  // 1. 标准 HTML 标签 → 不转义
  if (isStandardTag(tagName)) return false;

  // 2. 大写字母开头 → 转义
  if (/^[A-Z]/.test(tagName)) return true;

  // 3. 包含下划线或连字符 → 转义
  if (tagName.includes('_') || tagName.includes('-')) return true;

  return false;
}
```

---

## 二、Markdown 高亮保护规则 (Markdown Highlight Protection)

位置: `utils/markdownUtils.ts` - `getProtectedRanges` 函数

### 受保护范围（不应用 Markdown 高亮）

以下内容会被标记为"受保护范围"，Markdown 语法高亮不会应用于这些区域：

| 类型 | 格式 | 说明 |
| --- | --- | --- |
| 变量引用 | `{{variableName}}` | 防止 `{{` 和 `}}` 被识别为其他语法 |
| 工具块 | `{#ToolBlock ...#}content{#/ToolBlock#}` | 完整保护工具块语法 |
| 完整 XML 标签对 | `<task_result>content</task_result>` | 防止标签名中的下划线被识别为斜体 |
| 单独 XML 标签 | `<task_result>`、`</task-result>` | 保护未配对的标签 |

### 问题场景

**问题**: `<task_result xxx="yyy">zzz</task_result>` 中的下划线会被误识别为 Markdown 斜体

```
原始输入: <task_result xxx="yyy">zzz</task_result>
错误显示: <task_result xxx="yyy">zzz</task_  ← 斜体样式
                     ↑________________↑ 被识别为 _text_
```

**解决**: 将整个 XML 标签（包括内容）标记为受保护范围，跳过 Markdown 高亮处理

### 保护的 XML 标签类型

| 特征           | 示例              | 是否保护  |
| -------------- | ----------------- | --------- |
| 大写字母开头   | `<OutputFormat>`  | ✅ 保护   |
| 包含下划线     | `<task_result>`   | ✅ 保护   |
| 包含连字符     | `<task-result>`   | ✅ 保护   |
| 纯小写标准标签 | `<div>`, `<span>` | ❌ 不保护 |

---

## 三、处理流程 (Processing Flow)

### 输入 → 显示流程

```
用户输入纯文本
    ↓
convertTextToHTML()
    ├── escapeEventTags()        # 转义事件标签
    ├── escapeCustomHTMLTags()   # 转义自定义 XML 标签
    └── escapeUnsupportedHTMLTags() # 转义不支持的 HTML 标签
    ↓
Tiptap 编辑器渲染
    ↓
MarkdownHighlight 扩展
    ├── getProtectedRanges()     # 计算受保护范围
    └── 对非保护范围应用 Markdown 高亮
    ↓
用户看到正确格式的内容
```

### 显示 → 输出流程

```
Tiptap HTML 内容
    ↓
extractTextFromHTML()
    ├── 转义不支持的 HTML 标签（保留原始格式）
    ├── 提取变量节点 → {{variableName}}
    ├── 提取工具块节点 → {#ToolBlock...#}
    └── 提取 Raw 节点
    ↓
纯文本输出（保留原始 XML 标签）
```

---

## 四、测试用例 (Test Cases)

### 标签转义测试

| 输入 | 预期输出（显示） | 说明 |
| --- | --- | --- |
| `<task_result>zzz</task_result>` | `<task_result>zzz</task_result>` | 完整显示，无斜体 |
| `<task-result>zzz</task-result>` | `<task-result>zzz</task-result>` | 连字符标签正常显示 |
| `<OutputFormat>content</OutputFormat>` | `<OutputFormat>content</OutputFormat>` | 大写标签正常显示 |
| `<task_result xxx="yyy">zzz</task_result>` | `<task_result xxx="yyy">zzz</task_result>` | 带属性的标签正常显示 |
| `<div>content</div>` | `content`（或正常 HTML） | 标准 HTML 标签不转义 |

### Markdown 保护测试

| 输入 | 是否有斜体高亮 | 说明 |
| --- | --- | --- |
| `<task_result>zzz</task_result>` | ❌ 无 | 受保护，下划线不被识别为斜体 |
| `_italic text_` | ✅ 有 | 正常 Markdown 斜体 |
| `{{variable_name}}` | ❌ 无 | 变量内的下划线不被识别为斜体 |
| `<OutputFormat>_text_</OutputFormat>` | ❌ 无 | 整个标签对受保护 |

---

## 五、相关文件 (Related Files)

| 文件                                    | 功能                    |
| --------------------------------------- | ----------------------- |
| `utils/htmlUtils.ts`                    | HTML/XML 转义和转换函数 |
| `utils/markdownUtils.ts`                | Markdown 受保护范围计算 |
| `extensions/MarkdownHighlight.ts`       | Markdown 语法高亮扩展   |
| `extensions/CustomHTMLTagProtection.ts` | 粘贴时的 XML 标签保护   |
| `extensions/HTMLTagProtection.ts`       | 不支持的 HTML 标签转义  |

---

## 六、相关文档导航 (Related Documentation)

- 📖 [README - 组件使用文档](./README.md)
- 📖 [变量建议触发规则](./VARIABLE_SUGGESTION_RULES.md)
