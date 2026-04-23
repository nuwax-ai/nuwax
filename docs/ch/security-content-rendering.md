<!--
面向贡献者的 SafeHtml / DOMPurify 内容渲染说明。
-->

# 安全内容渲染

## 目的

`SafeHtml` 为非 Markdown 渲染路径提供统一的 HTML 安全边界。凡是前端需要渲染“不是硬编码可信常量”的 HTML，都应优先走这个组件或它的 `sanitizeHtml` 辅助方法。

它基于 `dompurify`，默认做了比较保守的收口：

- 去掉 `<script>` 和事件处理属性
- 拦截 `javascript:` / `vbscript:` URL
- 默认禁止 `data:` URL，只对图片 `src` 放行图片 MIME
- 默认拦截 `iframe` 等高风险嵌入标签

补充说明：`dompurify` 已自带 TypeScript 类型，因此不需要额外安装 `@types/dompurify`。

## Profiles

### `strict`

适合短文本、标题、副标题、弹窗文案、管理端可配置但只需要少量内联格式的 HTML。

### `markdown-output`

适合已经生成好的富文本 HTML，例如段落、列表、标题、图片、表格、链接等。

### `svg`

只在确实需要渲染内联 SVG 片段时使用。这个 profile 应该保持少量使用，并且每次放开新标签或属性都要补针对性测试。

## 示例

```tsx
import SafeHtml from '@/components/base/SafeHtml';

<SafeHtml
  as="div"
  html={content}
  profile="markdown-output"
  allowedTags={['variable']}
  allowedAttributes={['data-key']}
/>;
```

## 如何选择

- 默认先用 `strict`
- 只有确实需要块级富文本时再切到 `markdown-output`
- `allowedTags` / `allowedAttributes` 只用于很窄的例外场景，并在 PR 里说明原因
- 新增用户内容 HTML 渲染入口时，不要绕过 `SafeHtml`

## 如何申请新 Profile 或例外

扩展 `SafeHtml` 时，请把范围压到最小，并同时提供：

- 具体是哪一个调用点需要新增能力
- 最小必要的标签 / 属性列表
- 恶意 payload 回归测试，以及新允许结构的正向测试
- PR inventory 里对该例外为何安全的简短说明

## 当前明确不动的范围

这次加固不会修改 `src/components/MarkdownRenderer/*`，因为那部分是维护者最近刚刚加固过的路径。导出工具、编辑器内部 DOM 辅助逻辑会单独审视，只有在信任边界清晰时才继续扩大改造范围。
