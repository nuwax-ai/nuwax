/** 可信上游 CSS 的中性色适配；保留原值作为独立运行时的回退。 */
export function rewriteThemeColors(root) {
  const text = new Map([
    ...[
      '#000',
      '#000000',
      '#111',
      '#111111',
      '#111827',
      '#18181b',
      '#1f2329',
      '#262626',
      '#333',
      '#333333',
    ].map((c) => [c, 'text-primary']),
    ...[
      '#555',
      '#555555',
      '#666',
      '#666666',
      '#646a73',
      '#6b7280',
      '#71717a',
      '#8f959e',
      '#999',
      '#999999',
    ].map((c) => [c, 'text-secondary']),
    ...['#bbb', '#bbbbbb', '#bbbfc4', '#b0b6bf', '#9ca3af'].map((c) => [
      c,
      'text-disabled',
    ]),
    ['#fff', 'text-inverse'],
    ['#ffffff', 'text-inverse'],
  ]);
  const background = new Map([
    ...['#fff', '#ffffff', '#fcfcfc'].map((c) => [c, 'elevated-bg']),
    ...[
      '#fafafa',
      '#f7f8fa',
      '#f8f9fa',
      '#f9f9f9',
      '#f5f5f5',
      '#f3f4f6',
      '#f2f2f2',
      '#f2f3f5',
    ].map((c) => [c, 'surface-bg']),
    ...['#f1f2f3', '#eff0f1', '#eee', '#eeeeee', '#eceef1', '#e4e6ea'].map(
      (c) => [c, 'hover-bg'],
    ),
  ]);
  const blue = new Set(['#1677ff', '#1664ff', '#3370ff', '#337fff', '#3385ff']);
  root.walkDecls((declaration) => {
    if (
      !/^(?:color|background(?:-color)?|border(?:-[a-z-]+)?|outline(?:-[a-z-]+)?)$/.test(
        declaration.prop,
      )
    )
      return;
    if (/url\s*\(|["']/i.test(declaration.value)) return;
    // 编辑器内容、文档纸张和代码语法由各自渲染器管理，不做文字颜色替换。
    if (
      /ProseMirror|tiptap|univer|doc-paper|page-paper|hljs|\.token\b/.test(
        declaration.parent?.selector ?? '',
      )
    )
      return;
    const border = /^(border|outline)/.test(declaration.prop);
    const isBackground = declaration.prop.startsWith('background');
    declaration.value = declaration.value.replace(
      /#[a-f0-9]{3,8}\b/gi,
      (original) => {
        const color = original.toLowerCase();
        const token =
          border &&
          (text.has(color) ||
            background.has(color) ||
            ['#d9d9d9', '#d1d5db', '#e5e7eb', '#e4e6ea'].includes(color))
            ? 'border-default'
            : blue.has(color)
            ? 'primary'
            : (isBackground ? background : text).get(color);
        return token ? `var(--nuwax-${token}, ${original})` : original;
      },
    );
  });
}
